import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, EyeOff, Share2, Trophy } from "lucide-react";
import { ActivityBreakdown } from "@/components/activity-breakdown";
import { CommandCopy } from "@/components/command-copy";
import { LocaleLink } from "@/components/locale-link";
import { UsageHeatmap } from "@/components/usage-heatmap";
import { formatRelativeTime, formatTokenCount, sourceLabel } from "@/lib/format";
import { localePath, t, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getAchievementsForUser, getCertificatesForUser, getDashboardDetails, getSharePerformance } from "@/lib/private-repository";
import { getLeaderboardPosition } from "@/lib/repository";
import { getViewer } from "@/lib/viewer";

export default async function DashboardPage() {
  const [locale, viewer] = await Promise.all([getLocale(), getViewer()]);
  if (!viewer) return null;
  const [details, rank, sharePerformance, achievements, certificates] = await Promise.all([
    getDashboardDetails(viewer.user.id),
    viewer.profile?.isPublic && viewer.profile.showRank ? getLeaderboardPosition(viewer.user.id, "month") : Promise.resolve(null),
    getSharePerformance(viewer.user.id),
    getAchievementsForUser(viewer.user.id),
    getCertificatesForUser(viewer.user.id),
  ]);
  const link = (path: string) => localePath(path, locale);
  const previousRank = details?.rankHistory.find((item) => item.date !== details.today)?.rank;
  const rankChange = rank && previousRank ? Number(previousRank) - rank.rank : 0;
  const latestAchievementAt = Math.max(0, ...achievements.map((row) => Number(row.earned_at || 0)), ...certificates.map((row) => Number(row.issued_at || 0)));
  const recentlyEarned = latestAchievementAt > 0 && (details?.nowUnix || 0) - latestAchievementAt < 7 * 86_400;
  const recentlySynced = Boolean(details?.lastSyncedAt && (details.nowUnix - details.lastSyncedAt) < 86_400);
  const shareReason = rankChange > 0 ? "rank" : recentlyEarned ? "achievement" : recentlySynced ? "sync" : null;

  return <>
    <div className="dashboard-title"><div><span className="eyebrow">{t(locale, "Personal center")}</span><h1>{t(locale, "Your token portfolio.")}</h1></div><span className="visibility-pill" data-public={viewer.profile?.isPublic || undefined}>{viewer.profile?.isPublic ? <CheckCircle2 size={14} /> : <EyeOff size={14} />}{viewer.profile?.isPublic ? t(locale, "Public profile") : t(locale, "Private profile")}</span></div>
    {viewer.stats.total === 0 ? <div className="setup-panel"><h2>{t(locale, "Connect your first device")}</h2><p>{t(locale, "The account is ready. Run this command where your Codex or Claude Code logs live.")}</p><CommandCopy /></div> : <>
      <SyncHealth locale={locale} details={details} isPublic={Boolean(viewer.profile?.isPublic)} />
      {viewer.profile?.isPublic && shareReason && <div className="dashboard-share-opportunity"><span><Share2 size={20} /><span><strong>{shareReason === "rank" ? (locale === "zh" ? `排名上升 ${rankChange} 位` : `Rank improved by ${rankChange}`) : shareReason === "achievement" ? (locale === "zh" ? "新的成就已经解锁" : "A new achievement is unlocked") : (locale === "zh" ? "最新用量已经同步" : "Your latest usage is synced")}</strong><small>{locale === "zh" ? "生成最新战报，让公开档案继续传播。" : "Generate the latest recap and keep your public profile moving."}</small></span></span><LocaleLink href={`${link(`/u/${viewer.profile.handle}`)}?share=1&reason=${shareReason}#share`} locale={locale}>{locale === "zh" ? "分享这次更新" : "Share this update"}<ArrowRight size={15} /></LocaleLink></div>}
      <div className="dashboard-stat-grid"><div><small>{t(locale, "ALL TIME")}</small><strong>{formatTokenCount(viewer.stats.total)}</strong></div><div><small>{t(locale, "THIS MONTH")}</small><strong>{formatTokenCount(viewer.stats.month)}</strong></div><div><small>{t(locale, "TODAY")}</small><strong>{formatTokenCount(viewer.stats.today)}</strong></div><div><small>{t(locale, "MONTHLY RANK")}</small><strong>{rank ? `#${rank.rank}` : "—"}</strong>{rankChange !== 0 && <span className="rank-change" data-up={rankChange > 0 || undefined}>{rankChange > 0 ? `↑ ${rankChange}` : `↓ ${Math.abs(rankChange)}`} {t(locale, "since previous snapshot")}</span>}</div></div>
      <section className="dashboard-grid">
        <article className="panel dashboard-trend"><UsageHeatmap daily={details?.daily || []} locale={locale} today={details?.today || "1970-01-01"} /></article>
        <article className="panel"><div className="panel-head"><h2>{t(locale, "Agent breakdown")}</h2></div><ActivityBreakdown rows={(details?.sources || []).map((row) => ({ label: sourceLabel(row.source), tokens: Number(row.tokens) }))} /></article>
        <article className="panel"><div className="panel-head"><h2>{t(locale, "Top models")}</h2></div><ActivityBreakdown rows={(details?.models || []).map((row) => ({ label: row.model, tokens: Number(row.tokens) }))} /></article>
        <article className="panel dashboard-actions"><div className="panel-head"><h2>{t(locale, "Quick actions")}</h2></div><LocaleLink href={link("/settings/privacy")} locale={locale}>{t(locale, "Privacy and leaderboard")}<ArrowRight size={15} /></LocaleLink><LocaleLink href={link("/settings/devices")} locale={locale}>{t(locale, "Device management")}<ArrowRight size={15} /></LocaleLink>{viewer.profile?.isPublic && <LocaleLink href={link(`/u/${viewer.profile.handle}`)} locale={locale}>{t(locale, "View public profile")}<ArrowRight size={15} /></LocaleLink>}</article>
        <article className="panel share-performance"><div className="panel-head"><h2>{locale === "zh" ? "分享传播 · 近 30 天" : "Share reach · 30 days"}</h2><span>{locale === "zh" ? "仅聚合计数" : "Aggregate counts only"}</span></div><div><span><strong>{sharePerformance.intents}</strong><small>{locale === "zh" ? "分享意向" : "Share intents"}</small></span><span><strong>{sharePerformance.landings}</strong><small>{locale === "zh" ? "到达档案" : "Profile landings"}</small></span><span><strong>{sharePerformance.ctaClicks}</strong><small>{locale === "zh" ? "开始了解" : "CTA clicks"}</small></span><span><strong>{sharePerformance.signups}</strong><small>{locale === "zh" ? "完成注册" : "Signups"}</small></span></div></article>
      </section>
    </>}
  </>;
}

function SyncHealth({ locale, details, isPublic }: { locale: Locale; details: Awaited<ReturnType<typeof getDashboardDetails>>; isPublic: boolean }) {
  const stale = !details?.lastSyncedAt || (details.nowUnix - details.lastSyncedAt) > 86_400;
  return <div className="health-grid"><div data-warning={stale || undefined}>{stale ? <Clock3 size={18} /> : <CheckCircle2 size={18} />}<span><strong>{stale ? t(locale, "Sync needs attention") : t(locale, "Sync is healthy")}</strong><small>{t(locale, "Last sync")}: {formatRelativeTime(details?.lastSyncedAt || null, locale)}</small></span></div><div data-warning={Boolean(details?.quarantined) || undefined}>{details?.quarantined ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}<span><strong>{details?.quarantined ? `${details.quarantined} ${t(locale, "quarantined buckets")}` : t(locale, "No quarantined data")}</strong><small>{details?.activeDevices || 0} / {details?.deviceTotal || 0} {t(locale, "active devices")}</small></span></div><div data-warning={!isPublic || undefined}>{isPublic ? <Trophy size={18} /> : <EyeOff size={18} />}<span><strong>{isPublic ? t(locale, "Leaderboard enabled") : t(locale, "Profile remains private")}</strong><small>{isPublic ? t(locale, "Your measured usage can be ranked.") : t(locale, "Publish only when you are ready.")}</small></span></div></div>;
}
