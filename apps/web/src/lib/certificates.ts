import { signPayload } from "./crypto";
import { achievementProgress, queryAchievementMetrics } from "./achievement-metrics";
import { getD1, getRuntimeEnv } from "./runtime";

export const MILESTONE_THRESHOLDS = [100_000_000, 1_000_000_000, 10_000_000_000, 50_000_000_000, 100_000_000_000] as const;
export async function issueEligibleCertificates(userId: string) {
  const db = await getD1(); if (!db) return; const env = await getRuntimeEnv(); const now = Math.floor(Date.now() / 1000);
  const stats = await db.prepare(`SELECT p.handle,p.display_name,COALESCE(SUM(ud.input_tokens_total+ud.output_tokens_total),0) total,AVG(CASE WHEN ud.coverage='complete' THEN 100.0 ELSE 75.0 END) coverage,MIN(ud.trust_level) trust_level FROM profiles p LEFT JOIN usage_daily ud ON ud.user_id=p.user_id AND ud.quarantined=0 WHERE p.user_id=?1 GROUP BY p.user_id`).bind(userId).first<Record<string, unknown>>(); if (!stats) return;
  const lifetimeRank = await rankForRange(db, userId, "0000-01-01");
  for (const threshold of MILESTONE_THRESHOLDS) if (Number(stats.total) >= threshold) await issue(db, { userId, kind: "milestone", period: String(threshold), processedTokens: threshold, coverage: Number(stats.coverage || 0), trustLevel: String(stats.trust_level || "collector-checked"), displayName: String(stats.display_name), handle: String(stats.handle), issuedAt: now, ...lifetimeRank }, env.CERTIFICATE_PRIVATE_JWK);
  const current = new Date(); const previousEnd = new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth(), 0)); const period = previousEnd.toISOString().slice(0, 7); const start = `${period}-01`; const next = new Date(Date.UTC(previousEnd.getUTCFullYear(), previousEnd.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
  const monthly = await db.prepare("SELECT COALESCE(SUM(input_tokens_total+output_tokens_total),0) total,AVG(CASE WHEN coverage='complete' THEN 100.0 ELSE 75.0 END) coverage,MIN(trust_level) trust_level FROM usage_daily WHERE user_id=?1 AND utc_date>=?2 AND utc_date<?3 AND quarantined=0").bind(userId, start, next).first<Record<string, unknown>>();
  if (Number(monthly?.total || 0) > 0) { const monthlyRank = await rankForRange(db, userId, start, next); await issue(db, { userId, kind: "monthly", period, processedTokens: Number(monthly?.total), coverage: Number(monthly?.coverage || 0), trustLevel: String(monthly?.trust_level || "collector-checked"), displayName: String(stats.display_name), handle: String(stats.handle), issuedAt: now, ...monthlyRank }, env.CERTIFICATE_PRIVATE_JWK); }
  await issueEligibleAchievements(db, userId, now);
}

async function issueEligibleAchievements(db: D1Database, userId: string, earnedAt: number) {
  const progress = achievementProgress(await queryAchievementMetrics(db, userId));
  const existing = await db.prepare("SELECT achievement_key FROM achievements WHERE user_id=?1").bind(userId).all<{ achievement_key: string }>();
  const earned = new Set(existing.results.map((row) => row.achievement_key));
  const eligible = Object.entries(progress).filter(([key, value]) => value.value >= value.target && !earned.has(key));
  if (!eligible.length) return;
  await db.batch(eligible.map(([key, value]) => db.prepare("INSERT OR IGNORE INTO achievements (id,user_id,achievement_key,earned_at,metadata_json) VALUES (?1,?2,?3,?4,?5)")
    .bind(crypto.randomUUID(), userId, key, earnedAt, JSON.stringify({ ruleVersion: 2, value: value.value, target: value.target }))));
}

type CertificatePayload = { userId: string; kind: string; period: string; processedTokens: number; coverage: number; trustLevel: string; displayName: string; handle: string; issuedAt: number; rank: number | null; percentile: number | null };
async function issue(db: D1Database, data: CertificatePayload, privateJwk?: string) {
  const publicPayload = { schemaVersion: 1, kind: data.kind, period: data.period, processedTokens: data.processedTokens, rank: data.rank, percentile: data.percentile, coverage: data.coverage, trustLevel: data.trustLevel, issuedAt: data.issuedAt };
  const json = JSON.stringify(publicPayload); const signed = await signPayload(json, privateJwk); const id = crypto.randomUUID();
  await db.prepare("INSERT OR IGNORE INTO certificates (id,user_id,kind,period,processed_tokens,rank,percentile,coverage,trust_level,payload_json,payload_hash,signature,status,issued_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,'active',?13)").bind(id, data.userId, data.kind, data.period, data.processedTokens, data.rank, data.percentile, data.coverage, data.trustLevel, json, signed.hash, signed.signature, data.issuedAt).run();
}

async function rankForRange(db: D1Database, userId: string, start: string, end?: string) {
  const endFilter = end ? "AND ud.utc_date<?2" : "";
  const row = await db.prepare(`WITH totals AS (SELECT ud.user_id,SUM(input_tokens_total+output_tokens_total) total FROM usage_daily ud JOIN profiles p ON p.user_id=ud.user_id WHERE ud.utc_date>=?1 ${endFilter} AND ud.quarantined=0 AND p.is_public=1 AND p.show_rank=1 GROUP BY ud.user_id), ranked AS (SELECT user_id,ROW_NUMBER() OVER (ORDER BY total DESC) rank,100.0*ROW_NUMBER() OVER (ORDER BY total DESC)/COUNT(*) OVER () percentile FROM totals) SELECT rank,percentile FROM ranked WHERE user_id=?${end ? "3" : "2"}`).bind(...(end ? [start, end, userId] : [start, userId])).first<{ rank: number; percentile: number }>();
  return { rank: row?.rank ?? null, percentile: row?.percentile ?? null };
}
