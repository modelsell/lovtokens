import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, EyeOff, Trophy } from "lucide-react";
import { ActivityBreakdown } from "@/components/activity-breakdown";
import { CommandCopy } from "@/components/command-copy";
import { LocaleLink } from "@/components/locale-link";
import { UsageHeatmap } from "@/components/usage-heatmap";
import { formatRelativeTime, formatTokenCount, sourceLabel } from "@/lib/format";
import { localePath, t, type Locale } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getDashboardDetails } from "@/lib/private-repository";
import { getLeaderboardPosition } from "@/lib/repository";
import { getViewer } from "@/lib/viewer";

export default async function DashboardPage() {
  const [locale, viewer] = await Promise.all([getLocale(), getViewer()]);
  if (!viewer) return null;
  const [details, rank] = await Promise.all([
    getDashboardDetails(viewer.user.id),
    viewer.profile?.isPublic && viewer.profile.showRank ? getLeaderboardPosition(viewer.user.id, "month") : Promise.resolve(null),
  ]);
  const link = (path: string) => localePath(path, locale);
  const previousRank = details?.rankHistory.find((item) => item.date !== details.today)?.rank;
  const rankChange = rank && previousRank ? Number(previousRank) - rank.rank : 0;

  return <>
    <div className="dashboard-title"><div><span className="eyebrow">{t(locale, "Personal center")}</span><h1>{t(locale, "Your token portfolio.")}</h1></div><span className="visibility-pill" data-public={viewer.profile?.isPublic || undefined}>{viewer.profile?.isPublic ? <CheckCircle2 size={14} /> : <EyeOff size={14} />}{viewer.profile?.isPublic ? t(locale, "Public profile") : t(locale, "Private profile")}</span></div>
    {viewer.stats.total === 0 ? <div className="setup-panel"><h2>{t(locale, "Connect your first device")}</h2><p>{t(locale, "The account is ready. Run this command where your Codex or Claude Code logs live.")}</p><CommandCopy /></div> : <>
      <div className="dashboard-stat-grid"><div><small>{t(locale, "ALL TIME")}</small><strong>{formatTokenCount(viewer.stats.total)}</strong></div><div><small>{t(locale, "THIS MONTH")}</small><strong>{formatTokenCount(viewer.stats.month)}</strong></div><div><small>{t(locale, "TODAY")}</small><strong>{formatTokenCount(viewer.stats.today)}</strong></div><div><small>{t(locale, "MONTHLY RANK")}</small><strong>{rank ? `#${rank.rank}` : "—"}</strong>{rankChange !== 0 && <span className="rank-change" data-up={rankChange > 0 || undefined}>{rankChange > 0 ? `↑ ${rankChange}` : `↓ ${Math.abs(rankChange)}`} {t(locale, "since previous snapshot")}</span>}</div></div>
      <SyncHealth locale={locale} details={details} isPublic={Boolean(viewer.profile?.isPublic)} />
      <section className="dashboard-grid">
        <article className="panel dashboard-trend"><UsageHeatmap daily={details?.daily || []} locale={locale} today={details?.today || "1970-01-01"} /></article>
        <article className="panel"><div className="panel-head"><h2>{t(locale, "Agent breakdown")}</h2></div><ActivityBreakdown rows={(details?.sources || []).map((row) => ({ label: sourceLabel(row.source), tokens: Number(row.tokens) }))} /></article>
        <article className="panel"><div className="panel-head"><h2>{t(locale, "Top models")}</h2></div><ActivityBreakdown rows={(details?.models || []).map((row) => ({ label: row.model, tokens: Number(row.tokens) }))} /></article>
        <article className="panel dashboard-actions"><div className="panel-head"><h2>{t(locale, "Quick actions")}</h2></div><LocaleLink href={link("/settings/privacy")} locale={locale}>{t(locale, "Privacy and leaderboard")}<ArrowRight size={15} /></LocaleLink><LocaleLink href={link("/settings/devices")} locale={locale}>{t(locale, "Device management")}<ArrowRight size={15} /></LocaleLink><LocaleLink href={link("/dashboard/share")} locale={locale}>{t(locale, "Share studio")}<ArrowRight size={15} /></LocaleLink>{viewer.profile?.isPublic && <LocaleLink href={link(`/u/${viewer.profile.handle}`)} locale={locale}>{t(locale, "View public profile")}<ArrowRight size={15} /></LocaleLink>}</article>
      </section>
    </>}
  </>;
}

function SyncHealth({ locale, details, isPublic }: { locale: Locale; details: Awaited<ReturnType<typeof getDashboardDetails>>; isPublic: boolean }) {
  const stale = !details?.lastSyncedAt || (details.nowUnix - details.lastSyncedAt) > 86_400;
  return <div className="health-grid"><div data-warning={stale || undefined}>{stale ? <Clock3 size={18} /> : <CheckCircle2 size={18} />}<span><strong>{stale ? t(locale, "Sync needs attention") : t(locale, "Sync is healthy")}</strong><small>{t(locale, "Last sync")}: {formatRelativeTime(details?.lastSyncedAt || null, locale)}</small></span></div><div data-warning={Boolean(details?.quarantined) || undefined}>{details?.quarantined ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}<span><strong>{details?.quarantined ? `${details.quarantined} ${t(locale, "quarantined buckets")}` : t(locale, "No quarantined data")}</strong><small>{details?.activeDevices || 0} / {details?.deviceTotal || 0} {t(locale, "active devices")}</small></span></div><div data-warning={!isPublic || undefined}>{isPublic ? <Trophy size={18} /> : <EyeOff size={18} />}<span><strong>{isPublic ? t(locale, "Leaderboard enabled") : t(locale, "Profile remains private")}</strong><small>{isPublic ? t(locale, "Your measured usage can be ranked.") : t(locale, "Publish only when you are ready.")}</small></span></div></div>;
}
