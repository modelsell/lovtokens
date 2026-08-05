import { LockKeyhole, ShieldCheck, Users } from "lucide-react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { LocaleLink } from "@/components/locale-link";
import { TeamMemberTable } from "@/components/team-member-table";
import { formatTokenCount } from "@/lib/format";
import { localePath, t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getTeamDetail } from "@/lib/team-repository";
import { getViewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const team = await getTeamDetail(slug, null, "month");
  if (!team) return { title: "Private team challenge", robots: { index: false, follow: false } };
  return { title: `${team.name} team challenge`, description: team.description || "A public LovTokens team challenge.", robots: { index: true, follow: true } };
}

export default async function TeamPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ period?: string }> }) {
  const [locale, viewer, route, query] = await Promise.all([getLocale(), getViewer(), params, searchParams]);
  const period = ["today", "7d", "30d", "month", "all"].includes(query.period || "") ? query.period! : "month";
  const team = await getTeamDetail(route.slug, viewer?.user.id || null, period);
  if (!team) notFound();
  const periods = [["today", "Today"], ["7d", "7 days"], ["30d", "30 days"], ["month", "This month"], ["all", "All time"]] as const;
  return <><section className="team-detail-hero"><div className="shell"><span className="eyebrow">{team.isPublic ? t(locale, "PUBLIC TEAM CHALLENGE") : t(locale, "PRIVATE TEAM CHALLENGE")}</span><div className="team-detail-title"><div><h1>{team.name}</h1><p>{team.description || t(locale, "A shared LovTokens challenge.")}</p></div><span className="team-visibility-pill">{team.isPublic ? <ShieldCheck size={15} /> : <LockKeyhole size={15} />}{team.isPublic ? t(locale, "Public team") : t(locale, "Members only")}</span></div><div className="team-detail-stats"><div><small>{t(locale, "PROCESSED")}</small><strong>{formatTokenCount(team.processedTokens)}</strong></div><div><small>{t(locale, "MEMBERS")}</small><strong>{team.memberCount}</strong></div><div><small>{t(locale, "CONTRIBUTORS")}</small><strong>{team.activeMembers}</strong></div><div><small>{t(locale, "ACTIVE DAYS")}</small><strong>{team.activeDays}</strong></div></div></div></section><section className="shell team-detail-body"><div className="team-detail-toolbar"><div className="filters">{periods.map(([value, label]) => <LocaleLink className={`filter ${period === value ? "filter-active" : ""}`} href={`${localePath(`/teams/${team.slug}`, locale)}?period=${value}`} key={value} locale={locale}>{t(locale, label)}</LocaleLink>)}</div>{team.isMember ? <LocaleLink href={localePath("/dashboard/teams", locale)} locale={locale}>{t(locale, "Manage team")}</LocaleLink> : <LocaleLink href={localePath("/dashboard/teams", locale)} locale={locale}><Users size={14} />{t(locale, "Join a team")}</LocaleLink>}</div><TeamMemberTable members={team.members} locale={locale} /><p className="leaderboard-note"><span>{t(locale, "Member totals begin on each member's join date.")}</span><span>{team.isMember ? t(locale, "As a member, you can see exact challenge totals inside this team.") : t(locale, "Public profile privacy choices still apply to member rows.")}</span></p></section></>;
}
