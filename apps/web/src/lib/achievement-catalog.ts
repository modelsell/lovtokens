import type { AchievementBadgeData } from "@/components/achievement-badge";
import { achievementProgress, EMPTY_ACHIEVEMENT_METRICS, type AchievementMetrics } from "./achievement-metrics";
import { formatTokenCount } from "./format";
import type { Locale } from "./i18n";

type EarnedAchievements = Map<string, number>;

function badge(
  key: string,
  metrics: AchievementMetrics,
  earned: EarnedAchievements,
  detail: Omit<AchievementBadgeData, "key" | "tokens" | "target" | "unlocked" | "issuedAt">,
): AchievementBadgeData {
  const progress = achievementProgress(metrics)[key]!;
  return {
    ...detail,
    key,
    tokens: progress.value,
    target: progress.target,
    unlocked: progress.value >= progress.target,
    issuedAt: progress.value >= progress.target ? earned.get(key) : undefined,
  };
}

export function explorationAchievements(
  input: AchievementMetrics | null,
  locale: Locale,
  earned: EarnedAchievements = new Map(),
): AchievementBadgeData[] {
  const metrics = input || EMPTY_ACHIEVEMENT_METRICS;
  return [
    badge("night-owl", metrics, earned, {
      title: locale === "zh" ? "UTC 夜航者" : "UTC Night Voyager",
      description: locale === "zh" ? "在 UTC 22:00–05:00 开始的会话中累计处理 5 亿 Token。" : "Process five hundred million tokens in sessions starting between 22:00 and 05:00 UTC.",
      mark: "OWL", tier: "special", image: "/achievements/night-owl.png", targetLabel: "500M",
      progressLabel: `${formatTokenCount(metrics.nightTokens)} / 500M · UTC NIGHT`,
    }),
    badge("dual-agent", metrics, earned, {
      title: locale === "zh" ? "双智能体驾驭者" : "Dual Agent Tamer",
      description: locale === "zh" ? "Codex 与 Claude Code 各累计处理 5000 万 Token。" : "Process fifty million tokens with both Codex and Claude Code.",
      mark: "DUO", tier: "special", image: "/achievements/dual-agent.png", targetLabel: "DUAL 50M",
      progressLabel: `Codex ${formatTokenCount(metrics.codexTokens)} · Claude ${formatTokenCount(metrics.claudeTokens)}`,
    }),
    badge("streak-flame", metrics, earned, {
      title: locale === "zh" ? "双周火种" : "Fortnight Flame",
      description: locale === "zh" ? "连续 14 个 UTC 自然日保持 Token 活动。" : "Keep token activity alive for fourteen consecutive UTC calendar days.",
      mark: "14D", tier: "special", image: "/achievements/streak-flame.png", targetLabel: "14 DAYS",
      progressLabel: `${metrics.longestStreak} / 14 ${locale === "zh" ? "天" : "days"}`,
    }),
    badge("model-explorer", metrics, earned, {
      title: locale === "zh" ? "模型星图师" : "Model Cartographer",
      description: locale === "zh" ? "在正 Token 轨迹中点亮 6 个规范化模型。" : "Light up six normalized models with positive-token activity.",
      mark: "MAP", tier: "special", image: "/achievements/model-explorer.png", targetLabel: "6 MODELS",
      progressLabel: `${metrics.modelCount} / 6 ${locale === "zh" ? "个模型" : "models"}`,
    }),
    badge("cache-wizard", metrics, earned, {
      title: locale === "zh" ? "缓存炼金术士" : "Cache Alchemist",
      description: locale === "zh" ? "累计复用 10 亿缓存读取 Token，把效率炼成收藏。" : "Reuse one billion cache-read tokens and turn efficiency into a collectible.",
      mark: "CACHE", tier: "special", image: "/achievements/cache-wizard.png", targetLabel: "1B CACHE",
      progressLabel: `${formatTokenCount(metrics.cacheTokens)} / 1B CACHE`,
    }),
    badge("weekend-builder", metrics, earned, {
      title: locale === "zh" ? "周末印记" : "Weekend Mark",
      description: locale === "zh" ? "在 12 个 UTC 周末日期留下活跃记录。" : "Leave an activity mark on twelve UTC weekend dates.",
      mark: "WEEKEND", tier: "special", image: "/achievements/weekend-builder.png", targetLabel: "12 DAYS",
      progressLabel: `${metrics.weekendDays} / 12 ${locale === "zh" ? "个周末活跃日" : "weekend days"}`,
    }),
    badge("deep-dive", metrics, earned, {
      title: locale === "zh" ? "单日深潜者" : "Daily Deep Diver",
      description: locale === "zh" ? "在单个 UTC 自然日内处理 2.5 亿 Token。" : "Process two hundred fifty million tokens in a single UTC calendar day.",
      mark: "DIVE", tier: "special", image: "/achievements/deep-dive.png", targetLabel: "250M / DAY",
      progressLabel: `${formatTokenCount(metrics.maxDailyTokens)} / 250M`,
    }),
    badge("marathon-builder", metrics, earned, {
      title: locale === "zh" ? "创作马拉松" : "Creation Marathon",
      description: locale === "zh" ? "累计在 60 个 UTC 自然日留下 Token 活动。" : "Record token activity across sixty UTC calendar days.",
      mark: "60D", tier: "special", image: "/achievements/marathon-builder.png", targetLabel: "60 DAYS",
      progressLabel: `${metrics.activeDays} / 60 ${locale === "zh" ? "个活跃日" : "active days"}`,
    }),
  ];
}

export function advancedAchievements(
  input: AchievementMetrics | null,
  locale: Locale,
  earned: EarnedAchievements = new Map(),
): AchievementBadgeData[] {
  const metrics = input || EMPTY_ACHIEVEMENT_METRICS;
  return [
    badge("tri-agent-commander", metrics, earned, {
      title: locale === "zh" ? "三栖指挥官" : "Tri-Agent Commander",
      description: locale === "zh" ? "Codex、Claude Code 与 WorkBuddy 各累计处理 1000 万 Token。" : "Process ten million tokens with each of Codex, Claude Code, and WorkBuddy.",
      mark: "TRI", tier: "special", image: "/achievements/tri-agent-commander.png", targetLabel: "TRIPLE 10M",
      progressLabel: `Codex ${formatTokenCount(metrics.codexTokens)} · Claude ${formatTokenCount(metrics.claudeTokens)} · WorkBuddy ${formatTokenCount(metrics.workbuddyTokens)}`,
    }),
    badge("model-museum", metrics, earned, {
      title: locale === "zh" ? "模型博物馆" : "Model Museum",
      description: locale === "zh" ? "在正 Token 轨迹中收藏 12 个规范化模型。" : "Collect twelve normalized models with positive-token activity.",
      mark: "MUSEUM", tier: "special", image: "/achievements/model-museum.png", targetLabel: "12 MODELS",
      progressLabel: `${metrics.modelCount} / 12 ${locale === "zh" ? "个模型" : "models"}`,
    }),
    badge("session-voyager", metrics, earned, {
      title: locale === "zh" ? "千帆过境" : "Session Voyager",
      description: locale === "zh" ? "完成 1000 个不同的智能体会话。" : "Complete one thousand distinct agent sessions.",
      mark: "VOYAGE", tier: "special", image: "/achievements/session-voyager.png", targetLabel: "1K SESSIONS",
      progressLabel: `${metrics.sessionCount.toLocaleString("en-US")} / 1,000 ${locale === "zh" ? "个会话" : "sessions"}`,
    }),
    badge("output-forge", metrics, earned, {
      title: locale === "zh" ? "输出铸造师" : "Output Forge",
      description: locale === "zh" ? "累计铸造 5000 万输出 Token。" : "Forge fifty million output tokens.",
      mark: "FORGE", tier: "special", image: "/achievements/output-forge.png", targetLabel: "50M OUTPUT",
      progressLabel: `${formatTokenCount(metrics.outputTokens)} / 50M OUTPUT`,
    }),
    badge("thirty-day-flame", metrics, earned, {
      title: locale === "zh" ? "六十日长燃" : "Sixty-day Flame",
      description: locale === "zh" ? "连续 60 个 UTC 自然日保持正 Token 活动。" : "Maintain positive-token activity for sixty consecutive UTC calendar days.",
      mark: "60X", tier: "special", image: "/achievements/thirty-day-flame.png", targetLabel: "60 DAY STREAK",
      progressLabel: `${metrics.longestStreak} / 60 ${locale === "zh" ? "天" : "days"}`,
    }),
    badge("twelve-week-serial", metrics, earned, {
      title: locale === "zh" ? "二十四周连载" : "Twenty-four-week Serial",
      description: locale === "zh" ? "在 24 个不同的 UTC 自然周留下正 Token 活动。" : "Record positive-token activity in twenty-four distinct UTC calendar weeks.",
      mark: "24W", tier: "special", image: "/achievements/twelve-week-serial.png", targetLabel: "24 WEEKS",
      progressLabel: `${metrics.activeWeeks} / 24 ${locale === "zh" ? "周" : "weeks"}`,
    }),
    badge("hundred-day-expedition", metrics, earned, {
      title: locale === "zh" ? "半载远征" : "Half-year Expedition",
      description: locale === "zh" ? "累计跨越 180 个正 Token 活跃日。" : "Travel across one hundred eighty positive-token active days.",
      mark: "180D", tier: "special", image: "/achievements/hundred-day-expedition.png", targetLabel: "180 DAYS",
      progressLabel: `${metrics.activeDays} / 180 ${locale === "zh" ? "个活跃日" : "active days"}`,
    }),
    badge("daily-supernova", metrics, earned, {
      title: locale === "zh" ? "单日超新星" : "Daily Supernova",
      description: locale === "zh" ? "在单个 UTC 自然日内处理 20 亿 Token。" : "Process two billion tokens in a single UTC calendar day.",
      mark: "NOVA", tier: "special", image: "/achievements/daily-supernova.png", targetLabel: "2B / DAY",
      progressLabel: `${formatTokenCount(metrics.maxDailyTokens)} / 2B`,
    }),
    badge("cache-mithril", metrics, earned, {
      title: locale === "zh" ? "缓存秘银" : "Cache Mithril",
      description: locale === "zh" ? "累计复用 30 亿缓存读取 Token。" : "Reuse three billion cache-read tokens.",
      mark: "MITHRIL", tier: "special", image: "/achievements/cache-mithril.png", targetLabel: "3B CACHE",
      progressLabel: `${formatTokenCount(metrics.cacheTokens)} / 3B CACHE`,
    }),
    badge("cache-legend", metrics, earned, {
      title: locale === "zh" ? "缓存传奇" : "Cache Legend",
      description: locale === "zh" ? "累计复用 500 亿缓存读取 Token，完成缓存收藏终章。" : "Reuse fifty billion cache-read tokens and complete the cache collection.",
      mark: "LEGEND", tier: "special", image: "/achievements/cache-legend.png", targetLabel: "50B CACHE",
      progressLabel: `${formatTokenCount(metrics.cacheTokens)} / 50B CACHE`,
    }),
  ];
}

export function legendaryAchievements(
  input: AchievementMetrics | null,
  locale: Locale,
  earned: EarnedAchievements = new Map(),
): AchievementBadgeData[] {
  const metrics = input || EMPTY_ACHIEVEMENT_METRICS;
  return [
    badge("agent-trinity", metrics, earned, {
      title: locale === "zh" ? "三相冠冕" : "Agent Trinity Crown",
      description: locale === "zh" ? "Codex、Claude Code 与 WorkBuddy 各累计处理 10 亿 Token。" : "Process one billion tokens with each of Codex, Claude Code, and WorkBuddy.",
      mark: "TRINITY", tier: "legendary", image: "/achievements/agent-trinity.png", targetLabel: "TRIPLE 1B",
      progressLabel: `Codex ${formatTokenCount(metrics.codexTokens)} · Claude ${formatTokenCount(metrics.claudeTokens)} · WorkBuddy ${formatTokenCount(metrics.workbuddyTokens)}`,
    }),
    badge("model-constellation", metrics, earned, {
      title: locale === "zh" ? "模型星穹" : "Model Constellation",
      description: locale === "zh" ? "在正 Token 轨迹中点亮 25 个规范化模型。" : "Light up twenty-five normalized models with positive-token activity.",
      mark: "25X", tier: "legendary", image: "/achievements/model-constellation.png", targetLabel: "25 MODELS",
      progressLabel: `${metrics.modelCount} / 25 ${locale === "zh" ? "个模型" : "models"}`,
    }),
    badge("session-odyssey", metrics, earned, {
      title: locale === "zh" ? "五千次远航" : "Five-thousand Odyssey",
      description: locale === "zh" ? "完成 5000 个不同的智能体会话。" : "Complete five thousand distinct agent sessions.",
      mark: "5K", tier: "legendary", image: "/achievements/session-odyssey.png", targetLabel: "5K SESSIONS",
      progressLabel: `${metrics.sessionCount.toLocaleString("en-US")} / 5,000 ${locale === "zh" ? "个会话" : "sessions"}`,
    }),
    badge("yearkeeper", metrics, earned, {
      title: locale === "zh" ? "星历守望者" : "Yearkeeper",
      description: locale === "zh" ? "累计在 365 个 UTC 自然日留下正 Token 活动。" : "Record positive-token activity across 365 UTC calendar days.",
      mark: "365D", tier: "legendary", image: "/achievements/yearkeeper.png", targetLabel: "365 DAYS",
      progressLabel: `${metrics.activeDays} / 365 ${locale === "zh" ? "个活跃日" : "active days"}`,
    }),
    badge("output-star", metrics, earned, {
      title: locale === "zh" ? "输出恒星" : "Output Star",
      description: locale === "zh" ? "累计铸造 10 亿输出 Token。" : "Forge one billion output tokens.",
      mark: "STAR", tier: "legendary", image: "/achievements/output-star.png", targetLabel: "1B OUTPUT",
      progressLabel: `${formatTokenCount(metrics.outputTokens)} / 1B OUTPUT`,
    }),
    badge("night-sovereign", metrics, earned, {
      title: locale === "zh" ? "永夜王冠" : "Night Sovereign",
      description: locale === "zh" ? "在 UTC 22:00–05:00 开始的会话中累计处理 100 亿 Token。" : "Process ten billion tokens in sessions starting between 22:00 and 05:00 UTC.",
      mark: "NIGHT", tier: "legendary", image: "/achievements/night-sovereign.png", targetLabel: "10B NIGHT",
      progressLabel: `${formatTokenCount(metrics.nightTokens)} / 10B · UTC NIGHT`,
    }),
    badge("token-cosmos", metrics, earned, {
      title: locale === "zh" ? "Token 宇宙" : "Token Cosmos",
      description: locale === "zh" ? "累计处理 1000 亿 Token，抵达收藏宇宙的终极边界。" : "Process one hundred billion tokens and reach the collection's ultimate frontier.",
      mark: "COSMOS", tier: "legendary", image: "/achievements/token-cosmos.png", targetLabel: "100B TOTAL",
      progressLabel: `${formatTokenCount(metrics.totalTokens)} / 100B TOTAL`,
    }),
  ];
}
