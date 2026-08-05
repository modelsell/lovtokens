import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, BadgeCheck, Trophy } from "lucide-react";
import { notFound } from "next/navigation";
import { ActivityBreakdown } from "@/components/activity-breakdown";
import { JsonLd } from "@/components/json-ld";
import { LocaleLink } from "@/components/locale-link";
import { PublicAchievementShelf } from "@/components/public-achievement-shelf";
import { SharePosterButton } from "@/components/share-poster-button";
import { ShareLandingTracker } from "@/components/share-landing-tracker";
import { UsageHeatmap } from "@/components/usage-heatmap";
import { formatPercent, formatTokenCount, sourceLabel } from "@/lib/format";
import { getPublicProfile } from "@/lib/repository";
import { earnedBehaviorAchievements } from "@/lib/achievement-catalog";
import { siteUrl } from "@/lib/runtime";
import { languageAlternates, localePath } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getViewer } from "@/lib/viewer";
import { shareThemes, type ShareTheme } from "@/lib/share-preview";

export const revalidate = 600;
export async function generateMetadata({ params, searchParams }: { params: Promise<{ handle: string }>; searchParams: Promise<{ achievement?: string; share_card?: string; share_theme?: string }> }): Promise<Metadata> {
  const locale = await getLocale(); const { handle } = await params; const [p, query] = await Promise.all([getPublicProfile(handle), searchParams]);
  if (!p) return { title: locale === "zh" ? "私密或不存在的档案" : "Private or missing profile", robots: { index: false, follow: false } };
  const sharedBadge = query.achievement ? earnedBehaviorAchievements(p.achievements.filter((item) => item.kind === "behavior").map((item) => ({ key: item.key, earnedAt: item.earnedAt })), locale).find((item) => item.key === query.achievement) : null;
  const shareCard = query.share_card === "month" ? "month" : "profile";
  const shareTheme = shareThemes.includes(query.share_theme as ShareTheme) ? query.share_theme as ShareTheme : "obsidian";
  const publicTotal = p.showExactTokens ? formatTokenCount(p.processedTokens) : locale === "zh" ? "私密总量" : "a private total";
  const title = sharedBadge
    ? (locale === "zh" ? `${p.displayName} 解锁了「${sharedBadge.title}」` : `${p.displayName} unlocked “${sharedBadge.title}”`)
    : shareCard === "month"
      ? (locale === "zh" ? `${p.displayName} 的本月 AI 编程战报` : `${p.displayName}'s Monthly AI Coding Recap`)
      : (locale === "zh" ? `${p.displayName} 的 AI Token 档案` : `${p.displayName}'s AI Token Portfolio`);
  const description = sharedBadge?.description || (shareCard === "month"
    ? (locale === "zh" ? `查看 ${p.displayName} 本月的 AI 编程 Token 活动。` : `See ${p.displayName}'s AI coding token activity this month.`)
    : (locale === "zh" ? `${p.displayName} 在 Codex、Claude Code 与 WorkBuddy 中已处理 ${publicTotal}。` : `${p.displayName} has processed ${publicTotal} across Codex, Claude Code, and WorkBuddy.`));
  const image = sharedBadge?.image || (shareCard === "month" ? `/share/${p.handle}/month-social.png?theme=${shareTheme}` : `/share/${p.handle}/social.png?theme=${shareTheme}`);
  const imageSize = sharedBadge ? { width: 640, height: 640 } : { width: 1200, height: 630 };
  const publicUrl = sharedBadge ? `/u/${p.handle}?achievement=${encodeURIComponent(sharedBadge.key)}#achievement-${encodeURIComponent(sharedBadge.key)}` : `/u/${p.handle}?share_card=${shareCard}&share_theme=${shareTheme}`;
  return { title, description, alternates: languageAlternates(`/u/${p.handle}`, locale), openGraph: { title, description, url: publicUrl, type: "website", images: [{ url: image, ...imageSize, type: "image/png", alt: title }] }, twitter: { card: "summary_large_image", title, description, images: [image] } };
}

export default async function ProfilePage({ params, searchParams }: { params: Promise<{ handle: string }>; searchParams: Promise<{ share?: string; achievement?: string }> }) {
  const locale = await getLocale();
  const { handle } = await params; const [p, viewer, query] = await Promise.all([getPublicProfile(handle), getViewer(), searchParams]); if (!p) notFound();
  const isOwner = viewer?.profile?.handle === p.handle;
  const displayTotal = p.showExactTokens ? formatTokenCount(p.processedTokens) : locale === "zh" ? "总量私密" : "Private total";
  const agentMix = p.sources.map((row) => `${sourceLabel(row.source)} ${Math.round((row.tokens / Math.max(1, p.processedTokens)) * 100)}%`).join(" · ");
  return <>
    <section className="profile-hero shell"><div className="profile-identity-row"><div className="profile-id"><div className="profile-avatar">{p.showAvatar && p.avatarUrl && !p.isAnonymous ? <Image alt="" fill sizes="88px" src={p.avatarUrl} /> : p.displayName.slice(0, 1)}</div><div><h1>{p.displayName}</h1><p>@{p.isAnonymous ? `anon-${p.handle.slice(-4)}` : p.handle}</p><span className="verified-pill"><BadgeCheck size={12} /> {p.trustLevel.replaceAll("-", " ")}</span></div></div><SharePosterButton activeDays={p.activeDays} canPublishPreview={isOwner} displayName={p.displayName} handle={p.handle} initialOpen={query.share === "1"} locale={locale} processedTokens={p.processedTokens} rank={p.rank} showExactTokens={p.showExactTokens} showRank={p.showRank} siteOrigin={siteUrl()} /></div><div className="profile-metrics-band"><div className="profile-total"><small>{locale === "zh" ? "全部已处理 TOKEN" : "ALL-TIME TOKENS PROCESSED"}</small><strong>{displayTotal}</strong><p>{locale === "zh" ? "由受支持的本地编程智能体统计的汇总使用量。" : "Measured aggregate usage across supported local coding agents."}</p></div><div className="profile-stats"><div><small>{locale === "zh" ? "全球排名" : "GLOBAL RANK"}</small><strong>{p.showRank && p.rank ? `#${p.rank}` : locale === "zh" ? "已隐藏" : "Hidden"}</strong></div><div><small>{locale === "zh" ? "百分位" : "PERCENTILE"}</small><strong>{p.showRank ? formatPercent(p.percentile, locale) : locale === "zh" ? "已隐藏" : "Hidden"}</strong></div><div><small>{locale === "zh" ? "活跃天数" : "ACTIVE DAYS"}</small><strong>{p.activeDays}</strong></div><div><small>{locale === "zh" ? "覆盖率" : "COVERAGE"}</small><strong>{p.coverage.toFixed(0)}%</strong></div></div></div></section>
    <section className="shell profile-content">
      <article className="panel profile-activity">{p.showExactTokens ? <UsageHeatmap daily={p.history} locale={locale} today={p.today} /> : <><div className="panel-head"><h2>{locale === "zh" ? "Token 活动" : "Token activity"}</h2><span>UTC</span></div><p className="form-message">{locale === "zh" ? "每日精确值为私密数据。" : "Daily exact values are private."}</p></>}</article>
      <div className="profile-breakdown-grid">
        <article className="panel"><div className="panel-head"><h2>{locale === "zh" ? "Token 构成" : "Token anatomy"}</h2><span>{p.showModels ? p.topModel || (locale === "zh" ? "多种模型" : "Mixed models") : locale === "zh" ? "模型已隐藏" : "Models hidden"}</span></div>{p.showExactTokens ? <><div className="breakdown"><Breakdown label={locale === "zh" ? "新鲜输入" : "Fresh input"} value={p.inputTokens - p.cacheTokens} total={p.processedTokens} /><Breakdown label={locale === "zh" ? "缓存输入" : "Cached input"} value={p.cacheTokens} total={p.processedTokens} /><Breakdown label={locale === "zh" ? "输出" : "Output"} value={p.outputTokens} total={p.processedTokens} /></div><p style={{ color: "var(--muted)", fontSize: 12, marginTop: 24 }}>{agentMix} · {p.requestCount.toLocaleString()} {locale === "zh" ? "个已统计请求" : "measured requests"}</p></> : <p className="form-message">{locale === "zh" ? "精确 Token 字段为私密数据。" : "Exact token fields are private."}</p>}</article>
        <article className="panel"><div className="panel-head"><h2>{locale === "zh" ? "智能体分布" : "Agent breakdown"}</h2></div>{p.showExactTokens ? <ActivityBreakdown rows={p.sources.map((row) => ({ label: sourceLabel(row.source), tokens: row.tokens }))} /> : <p className="form-message">{locale === "zh" ? "智能体精确用量为私密数据。" : "Exact agent usage is private."}</p>}</article>
        <article className="panel"><div className="panel-head"><h2>{locale === "zh" ? "常用模型" : "Top models"}</h2></div>{p.showExactTokens && p.showModels ? <ActivityBreakdown rows={p.models.map((row) => ({ label: row.model, tokens: row.tokens }))} /> : <p className="form-message">{p.showModels ? (locale === "zh" ? "模型精确用量为私密数据。" : "Exact model usage is private.") : (locale === "zh" ? "模型已隐藏。" : "Models are hidden.")}</p>}</article>
      </div>
      <PublicAchievementShelf achievements={p.achievements} locale={locale} />
      {!isOwner && <LocaleLink className="profile-rank-cta" href={localePath("/", locale)} locale={locale}><span className="profile-rank-cta-icon"><Trophy size={34} /></span><span className="profile-rank-cta-copy"><small className="eyebrow">{locale === "zh" ? "你的使用量，也能被看见" : "MAKE YOUR USAGE VISIBLE"}</small><strong>{locale === "zh" ? "你也来加入排名。" : "Join the leaderboard."}</strong><span>{locale === "zh" ? "连接 Codex、Claude Code 或 WorkBuddy，只同步每日汇总用量，生成你的个人趋势与可选公开排名。" : "Connect Codex, Claude Code, or WorkBuddy, sync daily aggregates only, and build your own trends and optional public rank."}</span></span><span className="profile-rank-cta-action">{locale === "zh" ? "前往首页开始统计" : "Start from the homepage"}<ArrowRight size={18} /></span></LocaleLink>}
    </section>
    <JsonLd data={{ "@context": "https://schema.org", "@type": "ProfilePage", url: `${siteUrl()}/u/${p.handle}`, mainEntity: { "@type": "Person", name: p.displayName, identifier: p.isAnonymous ? undefined : p.handle }, description: "A public, user-controlled AI coding token activity profile." }} />
    <ShareLandingTracker contentId={p.handle} contentKind={query.achievement ? "achievement" : "profile"} conversionSelector=".profile-rank-cta" />
  </>;
}
function Breakdown({ label, value, total }: { label: string; value: number; total: number }) { return <div className="breakdown-row"><strong>{label}</strong><span><i style={{ width: `${Math.max(0, value) / Math.max(1, total) * 100}%` }} /></span><small>{formatTokenCount(Math.max(0, value))}</small></div>; }
