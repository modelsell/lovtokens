import { achievementFor, formatTokenCount, sourceLabel } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { siteName } from "@/lib/i18n";

export type ShareCardTheme = "obsidian" | "terminal" | "ivory" | "aurora";

export type ShareCardPreviewProps = {
  displayName?: string;
  handle?: string;
  tokens?: number;
  rank?: number;
  percentile?: number;
  codexTokens?: number;
  claudeTokens?: number;
  workbuddyTokens?: number;
  activeDays?: number;
  theme?: ShareCardTheme;
  sample?: boolean;
  showExactTokens?: boolean;
  showRank?: boolean;
  history?: Array<{ date: string; tokens: number }>;
  sources?: Array<{ source: string; tokens: number }>;
  models?: Array<{ model: string; tokens: number }>;
  locale?: Locale;
};

export function ShareCardPreview({
  displayName = "YOUR NAME", handle = "your-handle", tokens = 1_284_000_000, rank = 0,
  percentile = 100, codexTokens = 0, claudeTokens = 0, activeDays = 27,
  theme = "obsidian", sample = false, showExactTokens = true, showRank = true,
  history = [], sources = [], models = [], locale = "en",
}: ShareCardPreviewProps) {
  const activity = previewActivity(history);
  const maxSource = Math.max(1, ...sources.map((row) => row.tokens));
  const maxModel = Math.max(1, ...models.map((row) => row.tokens));
  return (
    <article className={`share-card share-${theme}`}>
      <div className="share-grid" aria-hidden="true" />
      <div className="share-top"><strong>{siteName(locale)}/</strong><span>{sample ? (locale === "zh" ? "设计预览" : "DESIGN PREVIEW") : (locale === "zh" ? "已验证活动" : "VERIFIED ACTIVITY")}</span></div>
      <div className="share-person"><span>@{handle}</span><h3>{displayName}</h3></div>
      <div className="share-main"><small>{locale === "zh" ? "全部已处理 TOKEN" : "ALL-TIME TOKENS PROCESSED"}</small><strong>{showExactTokens ? formatTokenCount(tokens) : (locale === "zh" ? "私密" : "PRIVATE")}</strong><p>{showExactTokens ? (locale === "zh" ? "这是一段很长的上下文。" : "That is a lot of context.") : (locale === "zh" ? "用户已隐藏精确总量。" : "Exact total hidden by the user.")}</p></div>
      <div aria-hidden="true" className="share-card-heatmap">{activity.map((level, index) => <i data-level={level} key={index} />)}</div>
      <div className="share-stats"><span><small>{locale === "zh" ? "全球排名" : "GLOBAL RANK"}</small><strong>{showRank && rank ? `#${rank}` : "—"}</strong></span><span><small>{locale === "zh" ? "百分位" : "PERCENTILE"}</small><strong>{showRank ? `${locale === "zh" ? "前" : "TOP"} ${percentile}%` : "—"}</strong></span><span><small>{locale === "zh" ? "活跃天数" : "ACTIVE DAYS"}</small><strong>{activeDays}</strong></span></div>
      <div className="share-card-distributions"><MiniDistribution empty={locale === "zh" ? "智能体私密" : "Agents private"} max={maxSource} rows={sources.slice(0, 3).map((row) => ({ label: sourceLabel(row.source), tokens: row.tokens }))} title={locale === "zh" ? "智能体分布" : "AGENT MIX"} /><MiniDistribution empty={locale === "zh" ? "模型私密" : "Models private"} max={maxModel} rows={models.slice(0, 3).map((row) => ({ label: row.model, tokens: row.tokens }))} title={locale === "zh" ? "模型分布" : "MODEL MIX"} /></div>
      <div className="share-foot"><strong>{achievementFor(tokens, activeDays, codexTokens, claudeTokens, locale)}</strong><span>{locale === "zh" ? "使用量不代表生产力" : "Usage is not a productivity score"} · lovtokens.dev</span></div>
    </article>
  );
}

function previewActivity(history: Array<{ date: string; tokens: number }>) {
  const recent = history.slice(-84);
  const max = Math.max(1, ...recent.map((row) => row.tokens));
  const levels = recent.map((row) => row.tokens <= 0 ? 0 : Math.max(1, Math.ceil((row.tokens / max) * 4)));
  return [...Array(Math.max(0, 84 - levels.length)).fill(0), ...levels];
}

function MiniDistribution({ empty, max, rows, title }: { empty: string; max: number; rows: Array<{ label: string; tokens: number }>; title: string }) {
  return <div><strong>{title}</strong>{rows.length ? rows.map((row) => <span key={row.label}><small>{row.label}</small><i><b style={{ width: `${(row.tokens / max) * 100}%` }} /></i></span>) : <small>{empty}</small>}</div>;
}
