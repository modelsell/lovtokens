import { getD1 } from "./runtime";
import { queryAchievementMetrics } from "./achievement-metrics";
export async function getPrivateSummary(userId: string) { const db = await getD1(); if (!db) return null; const profile = await db.prepare("SELECT * FROM profiles WHERE user_id=?1").bind(userId).first<Record<string, unknown>>(); if (!profile) return null; const [usage, devices] = await Promise.all([db.prepare(`SELECT COALESCE(SUM(input_tokens_total+output_tokens_total),0) total, COALESCE(SUM(CASE WHEN utc_date=date('now') THEN input_tokens_total+output_tokens_total ELSE 0 END),0) today, COALESCE(SUM(CASE WHEN utc_date>=date('now','start of month') THEN input_tokens_total+output_tokens_total ELSE 0 END),0) month, COALESCE(SUM(CASE WHEN source='codex' THEN input_tokens_total+output_tokens_total ELSE 0 END),0) codex_tokens, COALESCE(SUM(CASE WHEN source='claude-code' THEN input_tokens_total+output_tokens_total ELSE 0 END),0) claude_tokens, COALESCE(SUM(CASE WHEN source='workbuddy' THEN input_tokens_total+output_tokens_total ELSE 0 END),0) workbuddy_tokens, COUNT(DISTINCT utc_date) active_days FROM usage_daily WHERE user_id=?1 AND quarantined=0`).bind(userId).first<Record<string, unknown>>(), db.prepare("SELECT COUNT(*) active_devices,MAX(last_synced_at) last_synced_at FROM devices WHERE user_id=?1 AND status='active'").bind(userId).first<Record<string, unknown>>()]); return { profile, total: Number(usage?.total || 0), today: Number(usage?.today || 0), month: Number(usage?.month || 0), codexTokens: Number(usage?.codex_tokens || 0), claudeTokens: Number(usage?.claude_tokens || 0), workbuddyTokens: Number(usage?.workbuddy_tokens || 0), activeDays: Number(usage?.active_days || 0), activeDevices: Number(devices?.active_devices || 0), lastSyncedAt: devices?.last_synced_at ? Number(devices.last_synced_at) : null }; }

export async function getDashboardDetails(userId: string) {
  const db = await getD1(); if (!db) return null;
  const [daily, sources, models, deviceHealth, quarantined, rankHistory] = await Promise.all([
    db.prepare(`SELECT utc_date date,SUM(input_tokens_total+output_tokens_total) tokens FROM usage_daily WHERE user_id=?1 AND quarantined=0 GROUP BY utc_date ORDER BY utc_date`).bind(userId).all<{ date: string; tokens: number }>(),
    db.prepare(`SELECT source,SUM(input_tokens_total+output_tokens_total) tokens FROM usage_daily WHERE user_id=?1 AND quarantined=0 GROUP BY source ORDER BY tokens DESC`).bind(userId).all<{ source: string; tokens: number }>(),
    db.prepare(`SELECT model,SUM(input_tokens_total+output_tokens_total) tokens FROM usage_daily WHERE user_id=?1 AND quarantined=0 GROUP BY model ORDER BY tokens DESC LIMIT 5`).bind(userId).all<{ model: string; tokens: number }>(),
    db.prepare(`SELECT COUNT(*) total,SUM(CASE WHEN status='active' THEN 1 ELSE 0 END) active,MAX(last_synced_at) last_synced_at,unixepoch() now_unix,date('now') today FROM devices WHERE user_id=?1`).bind(userId).first<Record<string, unknown>>(),
    db.prepare("SELECT COUNT(*) count FROM usage_daily WHERE user_id=?1 AND quarantined=1").bind(userId).first<{ count: number }>(),
    db.prepare("SELECT snapshot_date date,rank,processed_tokens tokens FROM leaderboard_rank_history WHERE user_id=?1 AND period='month' AND source='all' ORDER BY snapshot_date DESC LIMIT 30").bind(userId).all<{ date: string; rank: number; tokens: number }>(),
  ]);
  return {
    daily: daily.results,
    sources: sources.results,
    models: models.results,
    rankHistory: rankHistory.results,
    deviceTotal: Number(deviceHealth?.total || 0),
    activeDevices: Number(deviceHealth?.active || 0),
    lastSyncedAt: deviceHealth?.last_synced_at ? Number(deviceHealth.last_synced_at) : null,
    nowUnix: Number(deviceHealth?.now_unix || 0),
    today: String(deviceHealth?.today || "1970-01-01"),
    quarantined: Number(quarantined?.count || 0),
  };
}

export async function getCodingAnalytics(userId: string) {
  const db = await getD1();
  if (!db) return null;
  const [daily, hourly, clock] = await Promise.all([
    db.prepare(`SELECT utc_date date,source,model,
      SUM(input_tokens_total) input_tokens,SUM(fresh_input_tokens) fresh_tokens,
      SUM(cache_read_tokens) cache_read_tokens,SUM(cache_write_tokens) cache_write_tokens,
      SUM(output_tokens_total) output_tokens,SUM(reasoning_output_tokens) reasoning_tokens,
      SUM(request_count) requests
      FROM usage_daily WHERE user_id=?1 AND quarantined=0 AND utc_date>=date('now','-89 days')
      GROUP BY utc_date,source,model ORDER BY utc_date,source,model`).bind(userId).all<Record<string, unknown>>(),
    db.prepare(`SELECT utc_date date,utc_hour hour,source,model,
      SUM(input_tokens_total) input_tokens,SUM(fresh_input_tokens) fresh_tokens,
      SUM(cache_read_tokens) cache_read_tokens,SUM(cache_write_tokens) cache_write_tokens,
      SUM(output_tokens_total) output_tokens,SUM(reasoning_output_tokens) reasoning_tokens,
      SUM(request_count) requests
      FROM usage_hourly WHERE user_id=?1 AND quarantined=0 AND utc_date>=date('now','-89 days')
      GROUP BY utc_date,utc_hour,source,model ORDER BY utc_date,utc_hour,source,model`).bind(userId).all<Record<string, unknown>>(),
    db.prepare("SELECT date('now') today").first<{ today: string }>(),
  ]);
  return {
    daily: daily.results.map(normalizeAnalyticsRow),
    hourly: hourly.results.map((row) => ({ ...normalizeAnalyticsRow(row), hour: Number(row.hour) })),
    today: clock?.today || "1970-01-01",
  };
}

function normalizeAnalyticsRow(row: Record<string, unknown>) {
  return {
    date: String(row.date),
    source: String(row.source),
    model: String(row.model),
    inputTokens: Number(row.input_tokens || 0),
    freshTokens: Number(row.fresh_tokens || 0),
    cacheReadTokens: Number(row.cache_read_tokens || 0),
    cacheWriteTokens: Number(row.cache_write_tokens || 0),
    outputTokens: Number(row.output_tokens || 0),
    reasoningTokens: Number(row.reasoning_tokens || 0),
    requests: Number(row.requests || 0),
  };
}
export async function getDevices(userId: string) { const db = await getD1(); if (!db) return []; const r = await db.prepare("SELECT id,name,status,last_synced_at,created_at FROM devices WHERE user_id=?1 ORDER BY created_at DESC").bind(userId).all<Record<string, unknown>>(); return r.results; }
export async function getCertificatesForUser(userId: string) { const db = await getD1(); if (!db) return []; const r = await db.prepare("SELECT id,kind,period,processed_tokens,rank,percentile,coverage,trust_level,status,issued_at FROM certificates WHERE user_id=?1 ORDER BY issued_at DESC").bind(userId).all<Record<string, unknown>>(); return r.results; }
export async function getAchievementsForUser(userId: string) { const db = await getD1(); if (!db) return []; const r = await db.prepare("SELECT achievement_key,earned_at,metadata_json FROM achievements WHERE user_id=?1 ORDER BY earned_at").bind(userId).all<Record<string, unknown>>(); return r.results; }

export async function getSharePerformance(userId: string) {
  const db = await getD1();
  if (!db) return { intents: 0, landings: 0, ctaClicks: 0, signups: 0 };
  const row = await db.prepare(`SELECT
    COALESCE(SUM(CASE WHEN event='target_click' THEN event_count ELSE 0 END),0) intents,
    COALESCE(SUM(CASE WHEN event='landing' THEN event_count ELSE 0 END),0) landings,
    COALESCE(SUM(CASE WHEN event='cta_click' THEN event_count ELSE 0 END),0) cta_clicks,
    COALESCE(SUM(CASE WHEN event='signup' THEN event_count ELSE 0 END),0) signups
    FROM share_events_daily WHERE user_id=?1 AND utc_date>=date('now','-29 days')`).bind(userId).first<Record<string, unknown>>();
  return { intents: Number(row?.intents || 0), landings: Number(row?.landings || 0), ctaClicks: Number(row?.cta_clicks || 0), signups: Number(row?.signups || 0) };
}

export async function getAchievementMetrics(userId: string) {
  const db = await getD1();
  if (!db) return null;
  return queryAchievementMetrics(db, userId);
}

export async function getAccountSecurityInfo(userId: string, currentSessionId: string) {
  const db = await getD1(); if (!db) return { providers: [], sessions: [], socialAccounts: [] };
  const [accounts, sessions, socialAccounts] = await Promise.all([
    db.prepare("SELECT DISTINCT provider_id provider FROM account WHERE user_id=?1 ORDER BY provider_id").bind(userId).all<{ provider: string }>(),
    db.prepare("SELECT id,created_at,updated_at,expires_at,ip_address,user_agent FROM session WHERE user_id=?1 ORDER BY updated_at DESC").bind(userId).all<Record<string, unknown>>(),
    db.prepare("SELECT provider,provider_username,updated_at FROM social_connections WHERE user_id=?1 ORDER BY provider").bind(userId).all<{ provider: string; provider_username: string | null; updated_at: number }>(),
  ]);
  return {
    providers: accounts.results.map((row) => row.provider),
    sessions: sessions.results.map((row) => ({ id: String(row.id), createdAt: Number(row.created_at), updatedAt: Number(row.updated_at), expiresAt: Number(row.expires_at), ipAddress: row.ip_address ? String(row.ip_address) : null, userAgent: row.user_agent ? String(row.user_agent) : null, current: String(row.id) === currentSessionId })),
    socialAccounts: socialAccounts.results.map((row) => ({ provider: row.provider, username: row.provider_username, updatedAt: Number(row.updated_at) })),
  };
}
