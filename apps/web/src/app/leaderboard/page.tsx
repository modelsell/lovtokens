import { JsonLd } from "@/components/json-ld";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { LocaleLink } from "@/components/locale-link";
import { PageHero } from "@/components/page-hero";
import { getLeaderboard } from "@/lib/repository";
import { siteUrl } from "@/lib/runtime";
import type { Locale } from "@/lib/i18n";
import { localePath, t } from "@/lib/i18n";
import { getLocale, localizedMetadata } from "@/lib/i18n-server";

export const generateMetadata = () => localizedMetadata({ path: "/leaderboard", title: "AI Token Usage Leaderboard", zhTitle: "AI Token 使用量排行榜", description: "Public Codex and Claude Code token usage rankings, measured from privacy-preserving local collectors.", zhDescription: "通过保护隐私的本地采集器统计的 Codex 与 Claude Code 公开 Token 使用量排名。" });
export const revalidate = 600;

export default async function LeaderboardPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const locale = await getLocale();
  const { period = "month" } = await searchParams;
  const validPeriod = ["today", "7d", "30d", "month", "all"].includes(period) ? period : "month";
  const entries = await getLeaderboard(validPeriod, "all", 100);
  return <><PageHero eyebrow={t(locale, "Usage leaderboard · UTC")} title={t(locale, "The public token board.")} description={t(locale, "Ranked by processed tokens: complete input plus output. Usage is not a measure of productivity, skill, or code quality.")} /><section className="shell"><FilterBar locale={locale} period={validPeriod} source="all" /><LeaderboardTable entries={entries} locale={locale} /></section><JsonLd data={{ "@context": "https://schema.org", "@type": "Dataset", name: `${validPeriod} AI coding token leaderboard`, url: `${siteUrl()}/leaderboard`, description: "Public aggregate token activity for Codex and Claude Code.", mainEntity: { "@type": "ItemList", numberOfItems: entries.length, itemListElement: entries.map((e) => ({ "@type": "ListItem", position: e.rank, url: `${siteUrl()}/u/${e.handle}`, name: e.displayName })) } }} /></>;
}

export function FilterBar({ period, source, locale = "en" }: { period: string; source: string; locale?: Locale }) {
  const path = source === "all" ? "/leaderboard" : `/leaderboard/${source}`;
  const periods = [["today", "Today"], ["7d", "7 days"], ["30d", "30 days"], ["month", "This month"], ["all", "All time"]] as const;
  return <div className="filter-bar"><div className="filters">{periods.map(([value, label]) => <LocaleLink className={`filter ${period === value ? "filter-active" : ""}`} href={`${localePath(path, locale)}?period=${value}`} key={value} locale={locale}>{t(locale, label)}</LocaleLink>)}</div><div className="filters"><LocaleLink className={`filter ${source === "all" ? "filter-active" : ""}`} href={`${localePath("/leaderboard", locale)}?period=${period}`} locale={locale}>{t(locale, "All")}</LocaleLink><LocaleLink className={`filter ${source === "codex" ? "filter-active" : ""}`} href={`${localePath("/leaderboard/codex", locale)}?period=${period}`} locale={locale}>Codex</LocaleLink><LocaleLink className={`filter ${source === "claude-code" ? "filter-active" : ""}`} href={`${localePath("/leaderboard/claude-code", locale)}?period=${period}`} locale={locale}>Claude Code</LocaleLink></div></div>;
}
