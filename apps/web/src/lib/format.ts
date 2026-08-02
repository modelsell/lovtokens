export { formatTokenCount } from "@lovtokens/token-schema";
import type { Locale } from "./i18n";

export function formatPercent(value: number, locale: Locale = "en") {
  const number = value < 1 ? value.toFixed(1) : Math.round(value);
  return locale === "zh" ? `前 ${number}%` : `Top ${number}%`;
}

export function sourceLabel(source: string) {
  return source === "claude-code" ? "Claude Code" : source === "codex" ? "Codex" : "All agents";
}

export function formatRelativeTime(unixSeconds: number | null, locale: Locale = "en") {
  if (!unixSeconds) return locale === "zh" ? "从未同步" : "Never synced";
  const seconds = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
  if (seconds < 60) return locale === "zh" ? "刚刚" : "Just now";
  if (seconds < 3600) { const value = Math.floor(seconds / 60); return locale === "zh" ? `${value} 分钟前` : `${value}m ago`; }
  if (seconds < 86_400) { const value = Math.floor(seconds / 3600); return locale === "zh" ? `${value} 小时前` : `${value}h ago`; }
  const value = Math.floor(seconds / 86_400);
  return locale === "zh" ? `${value} 天前` : `${value}d ago`;
}

export function achievementFor(tokens: number, activeDays: number, codex: number, claude: number, locale: Locale = "en") {
  if (tokens >= 10_000_000_000) return locale === "zh" ? "百亿 Token 传奇" : "10B Token Legend";
  if (tokens >= 1_000_000_000) return locale === "zh" ? "十亿 Token 俱乐部" : "Billion Token Club";
  if (tokens >= 100_000_000) return locale === "zh" ? "一亿 Token 高阶用户" : "100M Power User";
  if (codex > 0 && claude > 0 && Math.min(codex, claude) / tokens >= 0.2) return locale === "zh" ? "均衡使用者" : "Balanced Operator";
  if (activeDays >= 30) return locale === "zh" ? "连续 30 天开发者" : "30 Day Builder";
  if (tokens >= 10_000_000) return locale === "zh" ? "千万 Token 俱乐部" : "10M Token Club";
  return locale === "zh" ? "新锐开发者" : "Rising Builder";
}
