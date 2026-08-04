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
    unlocked: progress.value >= progress.target || earned.has(key),
    issuedAt: earned.get(key),
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
      description: locale === "zh" ? "在 UTC 22:00–05:00 开始的会话中累计处理 100 万 Token。" : "Process one million tokens in sessions starting between 22:00 and 05:00 UTC.",
      mark: "OWL", tier: "special", image: "/achievements/night-owl.png", targetLabel: "1M",
      progressLabel: `${formatTokenCount(metrics.nightTokens)} / 1M · UTC NIGHT`,
    }),
    badge("dual-agent", metrics, earned, {
      title: locale === "zh" ? "双智能体驾驭者" : "Dual Agent Tamer",
      description: locale === "zh" ? "Codex 与 Claude Code 各累计处理 100 万 Token。" : "Process one million tokens with both Codex and Claude Code.",
      mark: "DUO", tier: "special", image: "/achievements/dual-agent.png", targetLabel: "DUAL 1M",
      progressLabel: `Codex ${formatTokenCount(metrics.codexTokens)} · Claude ${formatTokenCount(metrics.claudeTokens)}`,
    }),
    badge("streak-flame", metrics, earned, {
      title: locale === "zh" ? "七日火种" : "Seven-day Flame",
      description: locale === "zh" ? "连续 7 个 UTC 自然日保持 Token 活动。" : "Keep token activity alive for seven consecutive UTC calendar days.",
      mark: "7D", tier: "special", image: "/achievements/streak-flame.png", targetLabel: "7 DAYS",
      progressLabel: `${metrics.longestStreak} / 7 ${locale === "zh" ? "天" : "days"}`,
    }),
    badge("model-explorer", metrics, earned, {
      title: locale === "zh" ? "模型星图师" : "Model Cartographer",
      description: locale === "zh" ? "在正 Token 轨迹中点亮 5 个规范化模型。" : "Light up five normalized models with positive-token activity.",
      mark: "MAP", tier: "special", image: "/achievements/model-explorer.png", targetLabel: "5 MODELS",
      progressLabel: `${metrics.modelCount} / 5 ${locale === "zh" ? "个模型" : "models"}`,
    }),
    badge("cache-wizard", metrics, earned, {
      title: locale === "zh" ? "缓存炼金术士" : "Cache Alchemist",
      description: locale === "zh" ? "累计复用 5000 万缓存读取 Token，把效率炼成收藏。" : "Reuse fifty million cache-read tokens and turn efficiency into a collectible.",
      mark: "CACHE", tier: "special", image: "/achievements/cache-wizard.png", targetLabel: "50M CACHE",
      progressLabel: `${formatTokenCount(metrics.cacheTokens)} / 50M CACHE`,
    }),
    badge("weekend-builder", metrics, earned, {
      title: locale === "zh" ? "周末印记" : "Weekend Mark",
      description: locale === "zh" ? "在 5 个 UTC 周末日期留下活跃记录。" : "Leave an activity mark on five UTC weekend dates.",
      mark: "WEEKEND", tier: "special", image: "/achievements/weekend-builder.png", targetLabel: "5 DAYS",
      progressLabel: `${metrics.weekendDays} / 5 ${locale === "zh" ? "个周末活跃日" : "weekend days"}`,
    }),
    badge("deep-dive", metrics, earned, {
      title: locale === "zh" ? "单日深潜者" : "Daily Deep Diver",
      description: locale === "zh" ? "在单个 UTC 自然日内处理 1000 万 Token。" : "Process ten million tokens in a single UTC calendar day.",
      mark: "DIVE", tier: "special", image: "/achievements/deep-dive.png", targetLabel: "10M / DAY",
      progressLabel: `${formatTokenCount(metrics.maxDailyTokens)} / 10M`,
    }),
    badge("marathon-builder", metrics, earned, {
      title: locale === "zh" ? "创作马拉松" : "Creation Marathon",
      description: locale === "zh" ? "累计在 30 个 UTC 自然日留下 Token 活动。" : "Record token activity across thirty UTC calendar days.",
      mark: "30D", tier: "special", image: "/achievements/marathon-builder.png", targetLabel: "30 DAYS",
      progressLabel: `${metrics.activeDays} / 30 ${locale === "zh" ? "个活跃日" : "active days"}`,
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
      description: locale === "zh" ? "Codex、Claude Code 与 WorkBuddy 各累计处理 100 万 Token。" : "Process one million tokens with each of Codex, Claude Code, and WorkBuddy.",
      mark: "TRI", tier: "special", image: "/achievements/tri-agent-commander.png", targetLabel: "TRIPLE 1M",
      progressLabel: `Codex ${formatTokenCount(metrics.codexTokens)} · Claude ${formatTokenCount(metrics.claudeTokens)} · WorkBuddy ${formatTokenCount(metrics.workbuddyTokens)}`,
    }),
    badge("model-museum", metrics, earned, {
      title: locale === "zh" ? "模型博物馆" : "Model Museum",
      description: locale === "zh" ? "在正 Token 轨迹中收藏 10 个规范化模型。" : "Collect ten normalized models with positive-token activity.",
      mark: "MUSEUM", tier: "special", image: "/achievements/model-museum.png", targetLabel: "10 MODELS",
      progressLabel: `${metrics.modelCount} / 10 ${locale === "zh" ? "个模型" : "models"}`,
    }),
    badge("session-voyager", metrics, earned, {
      title: locale === "zh" ? "千帆过境" : "Session Voyager",
      description: locale === "zh" ? "完成 500 个不同的智能体会话。" : "Complete five hundred distinct agent sessions.",
      mark: "VOYAGE", tier: "special", image: "/achievements/session-voyager.png", targetLabel: "500 SESSIONS",
      progressLabel: `${metrics.sessionCount.toLocaleString("en-US")} / 500 ${locale === "zh" ? "个会话" : "sessions"}`,
    }),
    badge("output-forge", metrics, earned, {
      title: locale === "zh" ? "输出铸造师" : "Output Forge",
      description: locale === "zh" ? "累计铸造 1000 万输出 Token。" : "Forge ten million output tokens.",
      mark: "FORGE", tier: "special", image: "/achievements/output-forge.png", targetLabel: "10M OUTPUT",
      progressLabel: `${formatTokenCount(metrics.outputTokens)} / 10M OUTPUT`,
    }),
    badge("thirty-day-flame", metrics, earned, {
      title: locale === "zh" ? "三十日长燃" : "Thirty-day Flame",
      description: locale === "zh" ? "连续 30 个 UTC 自然日保持正 Token 活动。" : "Maintain positive-token activity for thirty consecutive UTC calendar days.",
      mark: "30X", tier: "special", image: "/achievements/thirty-day-flame.png", targetLabel: "30 DAY STREAK",
      progressLabel: `${metrics.longestStreak} / 30 ${locale === "zh" ? "天" : "days"}`,
    }),
    badge("twelve-week-serial", metrics, earned, {
      title: locale === "zh" ? "十二周连载" : "Twelve-week Serial",
      description: locale === "zh" ? "在 12 个不同的 UTC 自然周留下正 Token 活动。" : "Record positive-token activity in twelve distinct UTC calendar weeks.",
      mark: "12W", tier: "special", image: "/achievements/twelve-week-serial.png", targetLabel: "12 WEEKS",
      progressLabel: `${metrics.activeWeeks} / 12 ${locale === "zh" ? "周" : "weeks"}`,
    }),
    badge("hundred-day-expedition", metrics, earned, {
      title: locale === "zh" ? "百日远征" : "Hundred-day Expedition",
      description: locale === "zh" ? "累计跨越 100 个正 Token 活跃日。" : "Travel across one hundred positive-token active days.",
      mark: "100D", tier: "special", image: "/achievements/hundred-day-expedition.png", targetLabel: "100 DAYS",
      progressLabel: `${metrics.activeDays} / 100 ${locale === "zh" ? "个活跃日" : "active days"}`,
    }),
    badge("daily-supernova", metrics, earned, {
      title: locale === "zh" ? "单日超新星" : "Daily Supernova",
      description: locale === "zh" ? "在单个 UTC 自然日内处理 10 亿 Token。" : "Process one billion tokens in a single UTC calendar day.",
      mark: "NOVA", tier: "special", image: "/achievements/daily-supernova.png", targetLabel: "1B / DAY",
      progressLabel: `${formatTokenCount(metrics.maxDailyTokens)} / 1B`,
    }),
    badge("cache-mithril", metrics, earned, {
      title: locale === "zh" ? "缓存秘银" : "Cache Mithril",
      description: locale === "zh" ? "累计复用 10 亿缓存读取 Token。" : "Reuse one billion cache-read tokens.",
      mark: "MITHRIL", tier: "special", image: "/achievements/cache-mithril.png", targetLabel: "1B CACHE",
      progressLabel: `${formatTokenCount(metrics.cacheTokens)} / 1B CACHE`,
    }),
    badge("cache-legend", metrics, earned, {
      title: locale === "zh" ? "缓存传奇" : "Cache Legend",
      description: locale === "zh" ? "累计复用 100 亿缓存读取 Token，完成缓存收藏终章。" : "Reuse ten billion cache-read tokens and complete the cache collection.",
      mark: "LEGEND", tier: "special", image: "/achievements/cache-legend.png", targetLabel: "10B CACHE",
      progressLabel: `${formatTokenCount(metrics.cacheTokens)} / 10B CACHE`,
    }),
  ];
}
