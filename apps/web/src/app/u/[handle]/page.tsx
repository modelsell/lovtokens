import type { Metadata } from "next";
import Image from "next/image";
import { BadgeCheck } from "lucide-react";
import { notFound } from "next/navigation";
import { ActivityBreakdown } from "@/components/activity-breakdown";
import { JsonLd } from "@/components/json-ld";
import { ShareThemeGallery } from "@/components/share-theme-gallery";
import { LocaleLink } from "@/components/locale-link";
import { UsageHeatmap } from "@/components/usage-heatmap";
import { achievementFor, formatPercent, formatTokenCount, sourceLabel } from "@/lib/format";
import { getPublicProfile } from "@/lib/repository";
import { siteUrl } from "@/lib/runtime";
import { languageAlternates, localePath } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

export const revalidate = 600;
export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const locale = await getLocale(); const { handle } = await params; const p = await getPublicProfile(handle);
  if (!p) return { title: locale === "zh" ? "私密或不存在的档案" : "Private or missing profile", robots: { index: false, follow: false } };
  const publicTotal = p.showExactTokens ? formatTokenCount(p.processedTokens) : locale === "zh" ? "私密总量" : "a private total";
  return { title: locale === "zh" ? `${p.displayName} 的 AI Token 档案` : `${p.displayName}'s AI Token Portfolio`, description: locale === "zh" ? `${p.displayName} 在 Codex 与 Claude Code 中已处理 ${publicTotal}。` : `${p.displayName} has processed ${publicTotal} across Codex and Claude Code.`, alternates: languageAlternates(`/u/${p.handle}`, locale), openGraph: { images: [`/share/${p.handle}/profile.png?theme=obsidian`] } };
}

export default async function ProfilePage({ params }: { params: Promise<{ handle: string }> }) {
  const locale = await getLocale();
  const { handle } = await params; const p = await getPublicProfile(handle); if (!p) notFound();
  const displayTotal = p.showExactTokens ? formatTokenCount(p.processedTokens) : locale === "zh" ? "总量私密" : "Private total";
  const codexShare = Math.round((p.codexTokens / Math.max(1, p.processedTokens)) * 100);
  return <>
    <section className="profile-hero shell"><div className="profile-id"><div className="profile-avatar">{p.showAvatar && p.avatarUrl && !p.isAnonymous ? <Image alt="" fill sizes="88px" src={p.avatarUrl} /> : p.displayName.slice(0, 1)}</div><div><h1>{p.displayName}</h1><p>@{p.isAnonymous ? `anon-${p.handle.slice(-4)}` : p.handle}</p><span className="verified-pill"><BadgeCheck size={12} /> {p.trustLevel.replaceAll("-", " ")}</span></div></div><div className="profile-total"><small>{locale === "zh" ? "全部已处理 TOKEN" : "ALL-TIME TOKENS PROCESSED"}</small><strong>{displayTotal}</strong><p>{locale === "zh" ? "由受支持的本地编程智能体统计的汇总使用量。" : "Measured aggregate usage across supported local coding agents."}</p></div><div className="profile-stats"><div><small>{locale === "zh" ? "全球排名" : "GLOBAL RANK"}</small><strong>{p.showRank && p.rank ? `#${p.rank}` : locale === "zh" ? "已隐藏" : "Hidden"}</strong></div><div><small>{locale === "zh" ? "百分位" : "PERCENTILE"}</small><strong>{p.showRank ? formatPercent(p.percentile, locale) : locale === "zh" ? "已隐藏" : "Hidden"}</strong></div><div><small>{locale === "zh" ? "活跃天数" : "ACTIVE DAYS"}</small><strong>{p.activeDays}</strong></div><div><small>{locale === "zh" ? "覆盖率" : "COVERAGE"}</small><strong>{p.coverage.toFixed(0)}%</strong></div></div></section>
    <section className="shell profile-content">
      <article className="panel profile-activity">{p.showExactTokens ? <UsageHeatmap daily={p.history} locale={locale} today={p.today} /> : <><div className="panel-head"><h2>{locale === "zh" ? "Token 活动" : "Token activity"}</h2><span>UTC</span></div><p className="form-message">{locale === "zh" ? "每日精确值为私密数据。" : "Daily exact values are private."}</p></>}</article>
      <div className="profile-breakdown-grid">
        <article className="panel"><div className="panel-head"><h2>{locale === "zh" ? "Token 构成" : "Token anatomy"}</h2><span>{p.showModels ? p.topModel || (locale === "zh" ? "多种模型" : "Mixed models") : locale === "zh" ? "模型已隐藏" : "Models hidden"}</span></div>{p.showExactTokens ? <><div className="breakdown"><Breakdown label={locale === "zh" ? "新鲜输入" : "Fresh input"} value={p.inputTokens - p.cacheTokens} total={p.processedTokens} /><Breakdown label={locale === "zh" ? "缓存输入" : "Cached input"} value={p.cacheTokens} total={p.processedTokens} /><Breakdown label={locale === "zh" ? "输出" : "Output"} value={p.outputTokens} total={p.processedTokens} /></div><p style={{ color: "var(--muted)", fontSize: 12, marginTop: 24 }}>{codexShare}% Codex · {100 - codexShare}% Claude Code · {p.requestCount.toLocaleString()} {locale === "zh" ? "个已统计请求" : "measured requests"}</p></> : <p className="form-message">{locale === "zh" ? "精确 Token 字段为私密数据。" : "Exact token fields are private."}</p>}</article>
        <article className="panel"><div className="panel-head"><h2>{locale === "zh" ? "智能体分布" : "Agent breakdown"}</h2></div>{p.showExactTokens ? <ActivityBreakdown rows={p.sources.map((row) => ({ label: sourceLabel(row.source), tokens: row.tokens }))} /> : <p className="form-message">{locale === "zh" ? "智能体精确用量为私密数据。" : "Exact agent usage is private."}</p>}</article>
        <article className="panel"><div className="panel-head"><h2>{locale === "zh" ? "常用模型" : "Top models"}</h2></div>{p.showExactTokens && p.showModels ? <ActivityBreakdown rows={p.models.map((row) => ({ label: row.model, tokens: row.tokens }))} /> : <p className="form-message">{p.showModels ? (locale === "zh" ? "模型精确用量为私密数据。" : "Exact model usage is private.") : (locale === "zh" ? "模型已隐藏。" : "Models are hidden.")}</p>}</article>
      </div>
      <article className="panel profile-share"><div className="panel-head"><h2>{locale === "zh" ? "分享此档案" : "Share this portfolio"}</h2><span>{achievementFor(p.processedTokens, p.activeDays, p.codexTokens, p.claudeTokens, locale)}</span></div><ShareThemeGallery activeDays={p.activeDays} claudeTokens={p.claudeTokens} codexTokens={p.codexTokens} displayName={p.displayName} handle={p.handle} history={p.history} locale={locale} models={p.models} percentile={p.percentile} rank={p.rank} showExactTokens={p.showExactTokens} showRank={p.showRank} sources={p.sources} tokens={p.processedTokens} /><div className="share-gallery-foot"><LocaleLink href={localePath("/methodology", locale)} locale={locale}>{locale === "zh" ? "了解统计方式" : "How this is measured"}</LocaleLink></div></article>
    </section>
    <JsonLd data={{ "@context": "https://schema.org", "@type": "ProfilePage", url: `${siteUrl()}/u/${p.handle}`, mainEntity: { "@type": "Person", name: p.displayName, identifier: p.isAnonymous ? undefined : p.handle }, description: "A public, user-controlled AI coding token activity profile." }} />
  </>;
}
function Breakdown({ label, value, total }: { label: string; value: number; total: number }) { return <div className="breakdown-row"><strong>{label}</strong><span><i style={{ width: `${Math.max(0, value) / Math.max(1, total) * 100}%` }} /></span><small>{formatTokenCount(Math.max(0, value))}</small></div>; }
