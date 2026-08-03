import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { PageHero } from "@/components/page-hero";
import { getLeaderboard } from "@/lib/repository";
import { FilterBar } from "../page";
import { languageAlternates, t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

export const revalidate = 600;
export async function generateMetadata({ params }: { params: Promise<{ source: string }> }): Promise<Metadata> { const locale = await getLocale(); const { source } = await params; const label = source === "codex" ? "Codex" : source === "workbuddy" ? "WorkBuddy" : "Claude Code"; return { title: locale === "zh" ? `${label} Token 使用量排行榜` : `${label} Token Usage Leaderboard`, description: locale === "zh" ? `${label} 公开 Token 使用量排名。` : `Public ${label} token usage rankings.`, alternates: languageAlternates(`/leaderboard/${source}`, locale) }; }
export default async function ToolLeaderboard({ params, searchParams }: { params: Promise<{ source: string }>; searchParams: Promise<{ period?: string }> }) {
  const locale = await getLocale();
  const { source } = await params; if (!['codex', 'claude-code', 'workbuddy'].includes(source)) notFound();
  const { period = "month" } = await searchParams; const validPeriod = ["today", "7d", "30d", "month", "all"].includes(period) ? period : "month";
  const entries = await getLeaderboard(validPeriod, source, 100); const label = source === "codex" ? "Codex" : source === "workbuddy" ? "WorkBuddy" : "Claude Code";
  return <><PageHero eyebrow={`${label} · UTC`} title={`${label} ${t(locale, "token leaders.")}`} description={t(locale, "Public, aggregate agent usage measured by the open LovTokens collector. Imported data never enters this board.")} /><section className="shell"><FilterBar locale={locale} period={validPeriod} source={source} /><LeaderboardTable entries={entries} locale={locale} /></section></>;
}
