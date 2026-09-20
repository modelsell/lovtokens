import { signPayload } from "./crypto";
import { ACHIEVEMENT_TARGETS, achievementProgress, queryAchievementMetrics } from "./achievement-metrics";
import { getD1, getRuntimeEnv } from "./runtime";

export const MILESTONE_THRESHOLDS = [100_000_000, 1_000_000_000, 10_000_000_000, 50_000_000_000, 100_000_000_000] as const;
// Bump when eligibility rules change so unchanged users are evaluated again.
export const ELIGIBILITY_RULE_VERSION = 2;
type Rank = { rank: number | null; percentile: number | null };
type Stats = { total: number; coverage: number | null; trust_level: string | null };
type ProcessingProfile = {
  stats_version: number; is_public: number; show_rank: number;
  processed_version: number | null; rules_version: number | null; monthly_period: string | null;
};

export async function issueEligibleCertificates(userId: string) {
  const db = await getD1();
  if (!db) return;
  const env = await getRuntimeEnv();
  await createCertificateIssuer(db, env.CERTIFICATE_PRIVATE_JWK)(userId);
}

/** One issuer per sync/cron invocation: never retain ranks across requests. */
export function createCertificateIssuer(db: D1Database, privateJwk?: string, current = new Date()) {
  const now = Math.floor(current.getTime() / 1000);
  const next = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), 1)).toISOString().slice(0, 10);
  const start = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - 1, 1)).toISOString().slice(0, 10);
  const period = start.slice(0, 7);
  const rankings = new Map<string, Promise<Map<string, Rank>>>();

  async function rankForRange(userId: string, profile: ProcessingProfile, from: string, end?: string): Promise<Rank> {
    if (!profile.is_public || !profile.show_rank) return { rank: null, percentile: null };
    const key = `${from}/${end || ""}`;
    let ranks = rankings.get(key);
    if (!ranks) {
      // Preserve certificate eligibility/tie rules, including imported usage. The
      // public leaderboard has different rules and cannot supply these ranks.
      const statement = db.prepare(`WITH totals AS (
        SELECT ud.user_id,SUM(input_tokens_total+output_tokens_total) total
        FROM usage_daily ud JOIN profiles p ON p.user_id=ud.user_id
        WHERE ud.utc_date>=?1 ${end ? "AND ud.utc_date<?2" : ""}
          AND ud.quarantined=0 AND p.is_public=1 AND p.show_rank=1 GROUP BY ud.user_id
      ) SELECT user_id,ROW_NUMBER() OVER (ORDER BY total DESC) rank,
        100.0*ROW_NUMBER() OVER (ORDER BY total DESC)/COUNT(*) OVER () percentile FROM totals`);
      ranks = (end ? statement.bind(from, end) : statement.bind(from)).all<Rank & { user_id: string }>()
        .then(({ results }) => new Map(results.map(({ user_id, ...rank }) => [user_id, rank])));
      rankings.set(key, ranks);
    }
    return (await ranks).get(userId) ?? { rank: null, percentile: null };
  }

  return async (userId: string) => {
    const profile = await db.prepare(`SELECT p.stats_version,p.is_public,p.show_rank,
      s.stats_version processed_version,s.rules_version,s.monthly_period
      FROM profiles p LEFT JOIN certificate_processing_state s ON s.user_id=p.user_id WHERE p.user_id=?1`)
      .bind(userId).first<ProcessingProfile>();
    if (!profile) return;
    const dataChanged = profile.stats_version !== profile.processed_version || profile.rules_version !== ELIGIBILITY_RULE_VERSION;
    if (!dataChanged && profile.monthly_period === period) return;

    // Include revoked certificates: the existing unique key also prevents reissue.
    const existing = await db.prepare("SELECT kind,period FROM certificates WHERE user_id=?1")
      .bind(userId).all<{ kind: string; period: string }>();
    const issued = new Set(existing.results.map((row) => `${row.kind}/${row.period}`));
    const thresholds = MILESTONE_THRESHOLDS.filter((value) => !issued.has(`milestone/${value}`));
    if (dataChanged && thresholds.length) {
      const stats = await db.prepare(`SELECT COALESCE(SUM(input_tokens_total+output_tokens_total),0) total,
        AVG(CASE WHEN coverage='complete' THEN 100.0 ELSE 75.0 END) coverage,MIN(trust_level) trust_level
        FROM usage_daily WHERE user_id=?1 AND quarantined=0`).bind(userId).first<Stats>();
      const eligible = thresholds.filter((value) => Number(stats?.total || 0) >= value);
      if (stats && eligible.length) {
        const rank = await rankForRange(userId, profile, "0000-01-01");
        for (const threshold of eligible) await issue(db, { userId, kind: "milestone", period: String(threshold), processedTokens: threshold, coverage: Number(stats.coverage || 0), trustLevel: stats.trust_level || "collector-checked", issuedAt: now, ...rank }, privateJwk);
      }
    }

    if (!issued.has(`monthly/${period}`)) {
      const monthly = await db.prepare(`SELECT COALESCE(SUM(input_tokens_total+output_tokens_total),0) total,
        AVG(CASE WHEN coverage='complete' THEN 100.0 ELSE 75.0 END) coverage,MIN(trust_level) trust_level
        FROM usage_daily WHERE user_id=?1 AND utc_date>=?2 AND utc_date<?3 AND quarantined=0`)
        .bind(userId, start, next).first<Stats>();
      if (monthly && Number(monthly.total) > 0) {
        const rank = await rankForRange(userId, profile, start, next);
        await issue(db, { userId, kind: "monthly", period, processedTokens: Number(monthly.total), coverage: Number(monthly.coverage || 0), trustLevel: monthly.trust_level || "collector-checked", issuedAt: now, ...rank }, privateJwk);
      }
    }
    if (dataChanged) await issueEligibleAchievements(db, userId, now);

    // Record the version read BEFORE computing. A concurrent sync remains dirty,
    // and failures before this point are retried by the next sync/cron invocation.
    await db.prepare(`INSERT INTO certificate_processing_state (user_id,stats_version,rules_version,monthly_period)
      VALUES (?1,?2,?3,?4) ON CONFLICT(user_id) DO UPDATE SET
      stats_version=excluded.stats_version,rules_version=excluded.rules_version,monthly_period=excluded.monthly_period`)
      .bind(userId, profile.stats_version, ELIGIBILITY_RULE_VERSION, period).run();
  };
}

async function issueEligibleAchievements(db: D1Database, userId: string, earnedAt: number) {
  const existing = await db.prepare("SELECT achievement_key FROM achievements WHERE user_id=?1").bind(userId).all<{ achievement_key: string }>();
  const earned = new Set(existing.results.map((row) => row.achievement_key));
  if (Object.keys(ACHIEVEMENT_TARGETS).every((key) => earned.has(key))) return;
  const progress = achievementProgress(await queryAchievementMetrics(db, userId));
  const eligible = Object.entries(progress).filter(([key, value]) => value.value >= value.target && !earned.has(key));
  if (!eligible.length) return;
  await db.batch(eligible.map(([key, value]) => db.prepare("INSERT OR IGNORE INTO achievements (id,user_id,achievement_key,earned_at,metadata_json) VALUES (?1,?2,?3,?4,?5)")
    .bind(crypto.randomUUID(), userId, key, earnedAt, JSON.stringify({ ruleVersion: ELIGIBILITY_RULE_VERSION, value: value.value, target: value.target }))));
}

type CertificatePayload = { userId: string; kind: string; period: string; processedTokens: number; coverage: number; trustLevel: string; issuedAt: number; rank: number | null; percentile: number | null };
async function issue(db: D1Database, data: CertificatePayload, privateJwk?: string) {
  const publicPayload = { schemaVersion: 1, kind: data.kind, period: data.period, processedTokens: data.processedTokens, rank: data.rank, percentile: data.percentile, coverage: data.coverage, trustLevel: data.trustLevel, issuedAt: data.issuedAt };
  const json = JSON.stringify(publicPayload); const signed = await signPayload(json, privateJwk); const id = crypto.randomUUID();
  await db.prepare("INSERT OR IGNORE INTO certificates (id,user_id,kind,period,processed_tokens,rank,percentile,coverage,trust_level,payload_json,payload_hash,signature,status,issued_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,'active',?13)").bind(id, data.userId, data.kind, data.period, data.processedTokens, data.rank, data.percentile, data.coverage, data.trustLevel, json, signed.hash, signed.signature, data.issuedAt).run();
}
