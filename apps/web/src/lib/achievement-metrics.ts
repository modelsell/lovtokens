export type AchievementMetrics = {
  totalTokens: number;
  codexTokens: number;
  claudeTokens: number;
  workbuddyTokens: number;
  cacheTokens: number;
  outputTokens: number;
  modelCount: number;
  sessionCount: number;
  activeDays: number;
  activeWeeks: number;
  weekendDays: number;
  nightTokens: number;
  maxDailyTokens: number;
  longestStreak: number;
};

export const EMPTY_ACHIEVEMENT_METRICS: AchievementMetrics = {
  totalTokens: 0,
  codexTokens: 0,
  claudeTokens: 0,
  workbuddyTokens: 0,
  cacheTokens: 0,
  outputTokens: 0,
  modelCount: 0,
  sessionCount: 0,
  activeDays: 0,
  activeWeeks: 0,
  weekendDays: 0,
  nightTokens: 0,
  maxDailyTokens: 0,
  longestStreak: 0,
};

export type AchievementProgress = { target: number; value: number };

export const ACHIEVEMENT_TARGETS = {
  "night-owl": 500_000_000,
  "dual-agent": 50_000_000,
  "streak-flame": 14,
  "model-explorer": 6,
  "cache-wizard": 1_000_000_000,
  "weekend-builder": 12,
  "deep-dive": 250_000_000,
  "marathon-builder": 60,
  "tri-agent-commander": 10_000_000,
  "model-museum": 12,
  "session-voyager": 1_000,
  "output-forge": 50_000_000,
  "thirty-day-flame": 60,
  "twelve-week-serial": 24,
  "hundred-day-expedition": 180,
  "daily-supernova": 2_000_000_000,
  "cache-mithril": 3_000_000_000,
  "cache-legend": 50_000_000_000,
  "agent-trinity": 1_000_000_000,
  "model-constellation": 25,
  "session-odyssey": 5_000,
  "yearkeeper": 365,
  "output-star": 1_000_000_000,
  "night-sovereign": 10_000_000_000,
  "token-cosmos": 100_000_000_000,
} as const;

export function achievementProgress(metrics: AchievementMetrics): Record<string, AchievementProgress> {
  return {
    "night-owl": { value: metrics.nightTokens, target: ACHIEVEMENT_TARGETS["night-owl"] },
    "dual-agent": { value: Math.min(metrics.codexTokens, metrics.claudeTokens), target: ACHIEVEMENT_TARGETS["dual-agent"] },
    "streak-flame": { value: metrics.longestStreak, target: ACHIEVEMENT_TARGETS["streak-flame"] },
    "model-explorer": { value: metrics.modelCount, target: ACHIEVEMENT_TARGETS["model-explorer"] },
    "cache-wizard": { value: metrics.cacheTokens, target: ACHIEVEMENT_TARGETS["cache-wizard"] },
    "weekend-builder": { value: metrics.weekendDays, target: ACHIEVEMENT_TARGETS["weekend-builder"] },
    "deep-dive": { value: metrics.maxDailyTokens, target: ACHIEVEMENT_TARGETS["deep-dive"] },
    "marathon-builder": { value: metrics.activeDays, target: ACHIEVEMENT_TARGETS["marathon-builder"] },
    "tri-agent-commander": { value: Math.min(metrics.codexTokens, metrics.claudeTokens, metrics.workbuddyTokens), target: ACHIEVEMENT_TARGETS["tri-agent-commander"] },
    "model-museum": { value: metrics.modelCount, target: ACHIEVEMENT_TARGETS["model-museum"] },
    "session-voyager": { value: metrics.sessionCount, target: ACHIEVEMENT_TARGETS["session-voyager"] },
    "output-forge": { value: metrics.outputTokens, target: ACHIEVEMENT_TARGETS["output-forge"] },
    "thirty-day-flame": { value: metrics.longestStreak, target: ACHIEVEMENT_TARGETS["thirty-day-flame"] },
    "twelve-week-serial": { value: metrics.activeWeeks, target: ACHIEVEMENT_TARGETS["twelve-week-serial"] },
    "hundred-day-expedition": { value: metrics.activeDays, target: ACHIEVEMENT_TARGETS["hundred-day-expedition"] },
    "daily-supernova": { value: metrics.maxDailyTokens, target: ACHIEVEMENT_TARGETS["daily-supernova"] },
    "cache-mithril": { value: metrics.cacheTokens, target: ACHIEVEMENT_TARGETS["cache-mithril"] },
    "cache-legend": { value: metrics.cacheTokens, target: ACHIEVEMENT_TARGETS["cache-legend"] },
    "agent-trinity": { value: Math.min(metrics.codexTokens, metrics.claudeTokens, metrics.workbuddyTokens), target: ACHIEVEMENT_TARGETS["agent-trinity"] },
    "model-constellation": { value: metrics.modelCount, target: ACHIEVEMENT_TARGETS["model-constellation"] },
    "session-odyssey": { value: metrics.sessionCount, target: ACHIEVEMENT_TARGETS["session-odyssey"] },
    "yearkeeper": { value: metrics.activeDays, target: ACHIEVEMENT_TARGETS.yearkeeper },
    "output-star": { value: metrics.outputTokens, target: ACHIEVEMENT_TARGETS["output-star"] },
    "night-sovereign": { value: metrics.nightTokens, target: ACHIEVEMENT_TARGETS["night-sovereign"] },
    "token-cosmos": { value: metrics.totalTokens, target: ACHIEVEMENT_TARGETS["token-cosmos"] },
  };
}

export async function queryAchievementMetrics(db: D1Database, userId: string): Promise<AchievementMetrics> {
  const positiveUsage = "quarantined=0 AND input_tokens_total+output_tokens_total>0";
  const [aggregate, daily] = await Promise.all([
    db.prepare(`SELECT
      COALESCE(SUM(input_tokens_total+output_tokens_total),0) total_tokens,
      COALESCE(SUM(CASE WHEN source='codex' THEN input_tokens_total+output_tokens_total ELSE 0 END),0) codex_tokens,
      COALESCE(SUM(CASE WHEN source='claude-code' THEN input_tokens_total+output_tokens_total ELSE 0 END),0) claude_tokens,
      COALESCE(SUM(CASE WHEN source='workbuddy' THEN input_tokens_total+output_tokens_total ELSE 0 END),0) workbuddy_tokens,
      COALESCE(SUM(cache_read_tokens),0) cache_tokens,
      COALESCE(SUM(output_tokens_total),0) output_tokens,
      COUNT(DISTINCT lower(trim(model))) model_count,
      COUNT(DISTINCT session_fingerprint) session_count,
      COUNT(DISTINCT utc_date) active_days,
      COUNT(DISTINCT strftime('%Y-%W',utc_date)) active_weeks,
      COUNT(DISTINCT CASE WHEN strftime('%w',utc_date) IN ('0','6') THEN utc_date END) weekend_days,
      COALESCE(SUM(CASE WHEN CAST(strftime('%H',first_event_at) AS INTEGER)>=22 OR CAST(strftime('%H',first_event_at) AS INTEGER)<5 THEN input_tokens_total+output_tokens_total ELSE 0 END),0) night_tokens
      FROM usage_daily WHERE user_id=?1 AND ${positiveUsage}`).bind(userId).first<Record<string, unknown>>(),
    db.prepare(`SELECT utc_date date,SUM(input_tokens_total+output_tokens_total) tokens FROM usage_daily WHERE user_id=?1 AND ${positiveUsage} GROUP BY utc_date ORDER BY utc_date`).bind(userId).all<{ date: string; tokens: number }>(),
  ]);

  const dates = daily.results.map((row) => row.date);
  let longestStreak = 0;
  let streak = 0;
  let previous = Number.NaN;
  for (const date of dates) {
    const current = Date.parse(`${date}T00:00:00.000Z`);
    streak = current - previous === 86_400_000 ? streak + 1 : 1;
    longestStreak = Math.max(longestStreak, streak);
    previous = current;
  }

  return {
    totalTokens: Number(aggregate?.total_tokens || 0),
    codexTokens: Number(aggregate?.codex_tokens || 0),
    claudeTokens: Number(aggregate?.claude_tokens || 0),
    workbuddyTokens: Number(aggregate?.workbuddy_tokens || 0),
    cacheTokens: Number(aggregate?.cache_tokens || 0),
    outputTokens: Number(aggregate?.output_tokens || 0),
    modelCount: Number(aggregate?.model_count || 0),
    sessionCount: Number(aggregate?.session_count || 0),
    activeDays: Number(aggregate?.active_days || 0),
    activeWeeks: Number(aggregate?.active_weeks || 0),
    weekendDays: Number(aggregate?.weekend_days || 0),
    nightTokens: Number(aggregate?.night_tokens || 0),
    maxDailyTokens: Math.max(0, ...daily.results.map((row) => Number(row.tokens))),
    longestStreak,
  };
}
