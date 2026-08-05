import { JsonLd } from "@/components/json-ld";
import { LocaleLink } from "@/components/locale-link";
import { PageHero } from "@/components/page-hero";
import { TeamLeaderboardTable } from "@/components/team-leaderboard-table";
import { localePath, t } from "@/lib/i18n";
import { getLocale, localizedMetadata } from "@/lib/i18n-server";
import { siteUrl } from "@/lib/runtime";
import { getTeamLeaderboard } from "@/lib/team-repository";

export const generateMetadata = () => localizedMetadata({ path: "/teams", title: "Team Token Challenges", zhTitle: "团队 Token 挑战榜", description: "Public team rankings built from privacy-preserving LovTokens aggregate usage.", zhDescription: "基于 LovTokens 隐私安全汇总数据的公开团队排行榜。" });
export const revalidate = 600;

export default async function TeamsPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const locale = await getLocale();
  const { period = "month" } = await searchParams;
  const validPeriod = ["today", "7d", "30d", "month", "all"].includes(period) ? period : "month";
  const entries = await getTeamLeaderboard(validPeriod, "all", 100);
  const periods = [["today", "Today"], ["7d", "7 days"], ["30d", "30 days"], ["month", "This month"], ["all", "All time"]] as const;
  return <><PageHero eyebrow={t(locale, "Team challenges · UTC")} title={t(locale, "Build together. Rank as one.")} description={t(locale, "Every member starts contributing on the day they join. Private teams stay invisible; public teams compete on aggregate processed tokens.")} /><section className="shell"><div className="leaderboard-mode-nav"><LocaleLink href={localePath("/leaderboard", locale)} locale={locale}>{t(locale, "Individual ranking")}</LocaleLink><LocaleLink className="filter-active" href={localePath("/teams", locale)} locale={locale}>{t(locale, "Team ranking")}</LocaleLink><LocaleLink className="leaderboard-mode-cta" href={localePath("/dashboard/teams", locale)} locale={locale}>{t(locale, "Start or join a team")}</LocaleLink></div><div className="filter-bar"><div className="filters">{periods.map(([value, label]) => <LocaleLink className={`filter ${validPeriod === value ? "filter-active" : ""}`} href={`${localePath("/teams", locale)}?period=${value}`} key={value} locale={locale}>{t(locale, label)}</LocaleLink>)}</div></div><TeamLeaderboardTable entries={entries} locale={locale} /><p className="leaderboard-note"><span>{t(locale, "Team totals count eligible member usage from each member's join date.")}</span><span>{t(locale, "Private teams never enter this board.")}</span></p></section><JsonLd data={{ "@context": "https://schema.org", "@type": "ItemList", name: `${validPeriod} team token leaderboard`, numberOfItems: entries.length, itemListElement: entries.map((entry) => ({ "@type": "ListItem", position: entry.rank, url: `${siteUrl()}/teams/${entry.slug}`, name: entry.name })) }} /></>;
}
