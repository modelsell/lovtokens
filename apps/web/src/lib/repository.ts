import type { CertificateRecord, LeaderboardEntry, PublicProfile } from "./data";
import { getD1 } from "./runtime";

const rangeStart = (period: string) => {
  const now = new Date();
  if (period === "today") return now.toISOString().slice(0, 10);
  if (period === "7d") return new Date(now.getTime() - 6 * 86_400_000).toISOString().slice(0, 10);
  if (period === "30d") return new Date(now.getTime() - 29 * 86_400_000).toISOString().slice(0, 10);
  if (period === "month") return `${now.toISOString().slice(0, 7)}-01`;
  return "0000-01-01";
};

export async function getLeaderboard(period = "month", source = "all", limit = 100): Promise<LeaderboardEntry[]> {
  const db = await getD1();
  if (!db) return [];
  try {
  const snapshot = await db.prepare(`SELECT ls.rank,p.handle,p.display_name,p.avatar_url,p.is_anonymous,p.show_exact_tokens,p.show_avatar,ls.processed_tokens,ls.active_days,ls.percentile,ls.codex_tokens,ls.claude_tokens,'collector-checked' trust_level,ls.generated_at FROM leaderboard_snapshots ls JOIN profiles p ON p.user_id=ls.user_id WHERE ls.period=?1 AND ls.source=?2 AND p.is_public=1 AND p.show_rank=1 ORDER BY ls.rank LIMIT ?3`).bind(period, source, limit).all<Record<string, unknown>>();
  const latestVisibleProfile = await db.prepare("SELECT MAX(updated_at) updated_at FROM profiles WHERE is_public=1 AND show_rank=1").first<{ updated_at: number | null }>();
  const snapshotGeneratedAt = Number(snapshot.results[0]?.generated_at || 0);
  if (snapshot.results.length && snapshotGeneratedAt >= Number(latestVisibleProfile?.updated_at || 0)) return snapshot.results.map((row) => ({ rank: Number(row.rank), handle: String(row.handle), displayName: Boolean(row.is_anonymous) ? `Anonymous · ${String(row.handle).slice(-4).toUpperCase()}` : String(row.display_name), avatarUrl: row.avatar_url ? String(row.avatar_url) : null, isAnonymous: Boolean(row.is_anonymous), processedTokens: Number(row.processed_tokens), activeDays: Number(row.active_days), percentile: Number(row.percentile), codexTokens: Number(row.codex_tokens), claudeTokens: Number(row.claude_tokens), trustLevel: String(row.trust_level), showExactTokens: Boolean(row.show_exact_tokens), showAvatar: Boolean(row.show_avatar) }));
  const sourceFilter = source === "all" ? "" : "AND ud.source = ?3";
  const query = `
    WITH totals AS (
      SELECT ud.user_id,
        SUM(ud.input_tokens_total + ud.output_tokens_total) AS processed_tokens,
        COUNT(DISTINCT ud.utc_date) AS active_days,
        SUM(CASE WHEN ud.source = 'codex' THEN ud.input_tokens_total + ud.output_tokens_total ELSE 0 END) AS codex_tokens,
        SUM(CASE WHEN ud.source = 'claude-code' THEN ud.input_tokens_total + ud.output_tokens_total ELSE 0 END) AS claude_tokens,
        MIN(ud.trust_level) AS trust_level
      FROM usage_daily ud
      JOIN profiles p ON p.user_id = ud.user_id
      WHERE ud.quarantined = 0 AND ud.trust_level != 'imported' AND p.is_public = 1 AND p.show_rank = 1 AND ud.utc_date >= ?1 ${sourceFilter}
      GROUP BY ud.user_id
    )
    SELECT p.handle, p.display_name, p.avatar_url, p.is_anonymous, p.show_exact_tokens, p.show_avatar,
      t.processed_tokens, t.active_days, t.codex_tokens, t.claude_tokens, t.trust_level
    FROM totals t JOIN profiles p ON p.user_id = t.user_id
    ORDER BY t.processed_tokens DESC, t.active_days DESC, p.created_at ASC LIMIT ?2`;
  const statement = db.prepare(query);
  const bound = source === "all" ? statement.bind(rangeStart(period), limit) : statement.bind(rangeStart(period), limit, source);
  const result = await bound.all<Record<string, unknown>>();
  const total = result.results.length;
  return result.results.map((row, index) => ({
    rank: index + 1,
    handle: String(row.handle),
    displayName: Boolean(row.is_anonymous) ? `Anonymous · ${String(row.handle).slice(-4).toUpperCase()}` : String(row.display_name),
    avatarUrl: row.avatar_url ? String(row.avatar_url) : null,
    isAnonymous: Boolean(row.is_anonymous),
    processedTokens: Number(row.processed_tokens),
    activeDays: Number(row.active_days),
    percentile: total > 1 ? Math.max(0.1, ((index + 1) / total) * 100) : 1,
    codexTokens: Number(row.codex_tokens),
    claudeTokens: Number(row.claude_tokens),
    trustLevel: String(row.trust_level),
    showExactTokens: Boolean(row.show_exact_tokens),
    showAvatar: Boolean(row.show_avatar),
  }));
  } catch (error) {
    if (String(error).includes("no such table")) return [];
    throw error;
  }
}

export async function getLeaderboardPosition(userId: string, period = "month") {
  const db = await getD1(); if (!db) return null;
  const row = await db.prepare(`WITH totals AS (
    SELECT ud.user_id,SUM(ud.input_tokens_total+ud.output_tokens_total) tokens,COUNT(DISTINCT ud.utc_date) active_days,MIN(p.created_at) profile_created
    FROM usage_daily ud JOIN profiles p ON p.user_id=ud.user_id
    WHERE ud.quarantined=0 AND ud.trust_level!='imported' AND p.is_public=1 AND p.show_rank=1 AND ud.utc_date>=?1 GROUP BY ud.user_id
  ), ranked AS (SELECT user_id,RANK() OVER (ORDER BY tokens DESC,active_days DESC,profile_created ASC) rank FROM totals)
  SELECT rank,(SELECT COUNT(*) FROM ranked) total FROM ranked WHERE user_id=?2`).bind(rangeStart(period), userId).first<{ rank: number; total: number }>();
  return row ? { rank: Number(row.rank), total: Number(row.total), percentile: Number(row.total) > 1 ? (Number(row.rank) / Number(row.total)) * 100 : 1 } : null;
}

export async function getShareProfile(handle: string, period: "month" | "all") {
  const profile = await getPublicProfile(handle); if (!profile || period === "all") return profile;
  const db = await getD1(); if (!db) return null;
  const row = await db.prepare(`SELECT COALESCE(SUM(input_tokens_total+output_tokens_total),0) processed_tokens,COUNT(DISTINCT utc_date) active_days,COALESCE(SUM(CASE WHEN source='codex' THEN input_tokens_total+output_tokens_total ELSE 0 END),0) codex_tokens,COALESCE(SUM(CASE WHEN source='claude-code' THEN input_tokens_total+output_tokens_total ELSE 0 END),0) claude_tokens FROM usage_daily ud JOIN profiles p ON p.user_id=ud.user_id WHERE p.handle=?1 AND ud.utc_date>=date('now','start of month') AND ud.quarantined=0 AND ud.trust_level!='imported'`).bind(handle).first<Record<string, unknown>>();
  const board = await getLeaderboard("month", "all", 10_000); const rank = board.find((item) => item.handle === handle);
  return { ...profile, processedTokens: Number(row?.processed_tokens || 0), activeDays: Number(row?.active_days || 0), codexTokens: Number(row?.codex_tokens || 0), claudeTokens: Number(row?.claude_tokens || 0), rank: rank?.rank || 0, percentile: rank?.percentile || 100 };
}

export async function getPublicProfile(handle: string): Promise<PublicProfile | null> {
  const db = await getD1();
  if (!db) return null;
  const profile = await db.prepare(`
    SELECT p.*, SUM(ud.input_tokens_total + ud.output_tokens_total) AS processed_tokens,
      SUM(ud.input_tokens_total) AS input_tokens,
      SUM(ud.cache_read_tokens + ud.cache_write_tokens) AS cache_tokens,
      SUM(ud.output_tokens_total) AS output_tokens, SUM(ud.request_count) AS request_count,
      COUNT(DISTINCT ud.utc_date) AS active_days,
      SUM(CASE WHEN ud.source='codex' THEN ud.input_tokens_total+ud.output_tokens_total ELSE 0 END) AS codex_tokens,
      SUM(CASE WHEN ud.source='claude-code' THEN ud.input_tokens_total+ud.output_tokens_total ELSE 0 END) AS claude_tokens,
      AVG(CASE WHEN ud.coverage='complete' THEN 100.0 ELSE 75.0 END) AS coverage,
      MIN(ud.trust_level) AS trust_level, date('now') AS today
    FROM profiles p JOIN usage_daily ud ON ud.user_id=p.user_id AND ud.quarantined=0 AND ud.trust_level!='imported'
    WHERE p.handle=?1 AND p.is_public=1 GROUP BY p.user_id`).bind(handle).first<Record<string, unknown>>();
  if (!profile) return null;
  const [historyResult, sourceResult, modelResult, board] = await Promise.all([
    db.prepare(`SELECT utc_date AS date, SUM(input_tokens_total+output_tokens_total) AS tokens FROM usage_daily ud JOIN profiles p ON p.user_id=ud.user_id WHERE p.handle=?1 AND ud.quarantined=0 AND ud.trust_level!='imported' GROUP BY utc_date ORDER BY utc_date DESC LIMIT 366`).bind(handle).all<{ date: string; tokens: number }>(),
    db.prepare(`SELECT source, SUM(input_tokens_total+output_tokens_total) AS tokens FROM usage_daily ud JOIN profiles p ON p.user_id=ud.user_id WHERE p.handle=?1 AND ud.quarantined=0 AND ud.trust_level!='imported' GROUP BY source ORDER BY tokens DESC, source ASC`).bind(handle).all<{ source: string; tokens: number }>(),
    db.prepare(`SELECT model, SUM(input_tokens_total+output_tokens_total) AS tokens FROM usage_daily ud JOIN profiles p ON p.user_id=ud.user_id WHERE p.handle=?1 AND ud.quarantined=0 AND ud.trust_level!='imported' GROUP BY model ORDER BY tokens DESC, model ASC LIMIT 5`).bind(handle).all<{ model: string; tokens: number }>(),
    getLeaderboard("all", "all", 10_000),
  ]);
  const found = board.find((entry) => entry.handle === handle);
  const showExactTokens = Boolean(profile.show_exact_tokens);
  const showModels = Boolean(profile.show_models);
  const sources = sourceResult.results.map((row) => ({ source: row.source, tokens: Number(row.tokens) }));
  const models = modelResult.results.map((row) => ({ model: row.model, tokens: Number(row.tokens) }));
  return {
    rank: found?.rank ?? 0,
    handle: String(profile.handle),
    displayName: Boolean(profile.is_anonymous) ? `Anonymous · ${String(profile.handle).slice(-4).toUpperCase()}` : String(profile.display_name),
    avatarUrl: profile.avatar_url ? String(profile.avatar_url) : null,
    isAnonymous: Boolean(profile.is_anonymous),
    processedTokens: Number(profile.processed_tokens),
    activeDays: Number(profile.active_days),
    percentile: found?.percentile ?? 100,
    codexTokens: Number(profile.codex_tokens),
    claudeTokens: Number(profile.claude_tokens),
    trustLevel: String(profile.trust_level),
    showExactTokens,
    showAvatar: Boolean(profile.show_avatar),
    inputTokens: Number(profile.input_tokens),
    cacheTokens: Number(profile.cache_tokens),
    outputTokens: Number(profile.output_tokens),
    requestCount: Number(profile.request_count),
    topModel: showModels ? models[0]?.model ?? null : null,
    currentStreak: calculateStreak(historyResult.results.map((row) => row.date)),
    coverage: Number(profile.coverage),
    statsVersion: Number(profile.stats_version),
    privacyVersion: Number(profile.privacy_version),
    showRank: Boolean(profile.show_rank),
    showModels,
    showCost: Boolean(profile.show_cost),
    today: String(profile.today),
    history: showExactTokens ? historyResult.results.reverse().map((row) => ({ date: row.date, tokens: Number(row.tokens) })) : [],
    sources: showExactTokens ? sources : [],
    models: showExactTokens && showModels ? models : [],
  };
}

export async function getCertificate(id: string): Promise<CertificateRecord | null> {
  const db = await getD1();
  if (!db) return null;
  const row = await db.prepare(`SELECT c.*, p.handle, p.display_name, p.is_public, p.show_exact_tokens FROM certificates c LEFT JOIN profiles p ON p.user_id=c.user_id WHERE c.id=?1`).bind(id).first<Record<string, unknown>>();
  if (!row) return null;
  return {
    id: String(row.id), userId: row.user_id ? String(row.user_id) : null, handle: row.handle ? String(row.handle) : "revoked", displayName: row.status === "active" && row.display_name ? String(row.display_name) : "Identity withdrawn", kind: String(row.kind), period: String(row.period),
    processedTokens: Number(row.processed_tokens), rank: row.rank == null ? null : Number(row.rank), percentile: row.percentile == null ? null : Number(row.percentile),
    coverage: Number(row.coverage), trustLevel: String(row.trust_level), payloadHash: String(row.payload_hash), payloadJson: String(row.payload_json), signature: row.signature ? String(row.signature) : null,
    status: String(row.status), issuedAt: Number(row.issued_at), indexable: Boolean(row.is_public) && Boolean(row.show_exact_tokens),
  };
}

function calculateStreak(dates: string[]) {
  const set = new Set(dates);
  let cursor = new Date();
  if (!set.has(cursor.toISOString().slice(0, 10))) cursor = new Date(cursor.getTime() - 86_400_000);
  let streak = 0;
  while (set.has(cursor.toISOString().slice(0, 10))) { streak += 1; cursor = new Date(cursor.getTime() - 86_400_000); }
  return streak;
}
