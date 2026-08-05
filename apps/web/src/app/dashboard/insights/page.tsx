import { CodingAnalyticsDashboard } from "@/components/coding-analytics-dashboard";
import { CommandCopy } from "@/components/command-copy";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getCodingAnalytics } from "@/lib/private-repository";
import { getViewer } from "@/lib/viewer";

export default async function DataDashboardPage() {
  const [locale, viewer] = await Promise.all([getLocale(), getViewer()]);
  if (!viewer) return null;
  const analytics = viewer.stats.total > 0 ? await getCodingAnalytics(viewer.user.id) : null;

  return <div className="dashboard-insights-page">
    {viewer.stats.total === 0 ? <div className="setup-panel"><h2>{t(locale, "Connect your first device")}</h2><p>{t(locale, "The account is ready. Run this command where your Codex or Claude Code logs live.")}</p><CommandCopy /></div> : <CodingAnalyticsDashboard daily={analytics?.daily || []} hourly={analytics?.hourly || []} locale={locale} today={analytics?.today || "1970-01-01"} />}
  </div>;
}
