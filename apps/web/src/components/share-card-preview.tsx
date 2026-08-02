import { achievementFor, formatTokenCount } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { siteName } from "@/lib/i18n";

type PreviewProps = {
  displayName?: string;
  handle?: string;
  tokens?: number;
  rank?: number;
  percentile?: number;
  codexTokens?: number;
  claudeTokens?: number;
  activeDays?: number;
  theme?: "obsidian" | "terminal" | "ivory" | "aurora";
  sample?: boolean;
  showExactTokens?: boolean;
  locale?: Locale;
};

export function ShareCardPreview({
  displayName = "YOUR NAME", handle = "your-handle", tokens = 1_284_000_000, rank = 42,
  percentile = 3.8, codexTokens = 873_000_000, claudeTokens = 411_000_000, activeDays = 27,
  theme = "obsidian", sample = false, showExactTokens = true, locale = "en",
}: PreviewProps) {
  const codexPercent = Math.round((codexTokens / Math.max(tokens, 1)) * 100);
  return (
    <article className={`share-card share-${theme}`}>
      <div className="share-grid" aria-hidden="true" />
      <div className="share-top"><strong>{siteName(locale)}/</strong><span>{sample ? (locale === "zh" ? "设计预览" : "DESIGN PREVIEW") : (locale === "zh" ? "已验证活动" : "VERIFIED ACTIVITY")}</span></div>
      <div className="share-person"><span>@{handle}</span><h3>{displayName}</h3></div>
      <div className="share-main"><small>{locale === "zh" ? "全部已处理 TOKEN" : "ALL-TIME TOKENS PROCESSED"}</small><strong>{showExactTokens ? formatTokenCount(tokens) : (locale === "zh" ? "私密" : "PRIVATE")}</strong><p>{showExactTokens ? (locale === "zh" ? "这是一段很长的上下文。" : "That is a lot of context.") : (locale === "zh" ? "用户已隐藏精确总量。" : "Exact total hidden by the user.")}</p></div>
      <div className="share-stats"><span><small>{locale === "zh" ? "全球排名" : "GLOBAL RANK"}</small><strong>#{rank}</strong></span><span><small>{locale === "zh" ? "百分位" : "PERCENTILE"}</small><strong>{locale === "zh" ? "前" : "TOP"} {percentile}%</strong></span><span><small>{locale === "zh" ? "活跃天数" : "ACTIVE DAYS"}</small><strong>{activeDays}</strong></span></div>
      <div className="share-mix"><div><i style={{ width: `${codexPercent}%` }} /><b style={{ width: `${100 - codexPercent}%` }} /></div><span>CODEX {codexPercent}%</span><span>CLAUDE {100 - codexPercent}%</span></div>
      <div className="share-foot"><strong>{achievementFor(tokens, activeDays, codexTokens, claudeTokens, locale)}</strong><span>{locale === "zh" ? "使用量不代表生产力" : "Usage is not a productivity score"} · lovtokens.dev</span></div>
    </article>
  );
}
