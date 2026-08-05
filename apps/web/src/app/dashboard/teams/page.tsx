import { TeamChallengeManager } from "@/components/team-challenge-manager";
import { localePath, t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getTeamForUser } from "@/lib/team-repository";
import { getViewer } from "@/lib/viewer";

export default async function DashboardTeamsPage({ searchParams }: { searchParams: Promise<{ invite?: string }> }) {
  const [locale, viewer, query] = await Promise.all([getLocale(), getViewer(), searchParams]);
  if (!viewer) return null;
  const team = await getTeamForUser(viewer.user.id);
  return <><div className="dashboard-title"><div><span className="eyebrow">{t(locale, "Team mode")}</span><h1>{t(locale, "Team challenge.")}</h1></div></div><p className="dashboard-intro">{t(locale, "Create a private challenge for your group or publish aggregate totals to compete on the team board.")}</p><TeamChallengeManager dashboardPath={localePath("/dashboard/teams", locale)} initialInvite={query.invite || ""} locale={locale} team={team} teamPath={localePath("/teams/__slug__", locale)} /></>;
}
