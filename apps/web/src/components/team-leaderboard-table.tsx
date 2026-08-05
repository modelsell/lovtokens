import { ChevronRight, Users } from "lucide-react";
import type { TeamLeaderboardEntry } from "@/lib/data";
import { formatPercent, formatTokenCount } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { localePath, t } from "@/lib/i18n";
import { LocaleLink } from "./locale-link";

export function TeamLeaderboardTable({ entries, locale = "en" }: { entries: TeamLeaderboardEntry[]; locale?: Locale }) {
  if (!entries.length) return <div className="empty-board"><span>000</span><h3>{t(locale, "No public team challenge has qualified yet.")}</h3><p>{t(locale, "Create a team, invite members, and make it public when you are ready to enter the team board.")}</p></div>;
  return <div className="team-leaderboard-table">
    <div className="team-leaderboard-head"><span>{t(locale, "Rank")}</span><span>{t(locale, "Team")}</span><span>{t(locale, "Members")}</span><span>{t(locale, "Active")}</span><span>{t(locale, "Processed")}</span></div>
    {entries.map((entry) => <LocaleLink className="team-leaderboard-row" href={localePath(`/teams/${entry.slug}`, locale)} key={entry.id} locale={locale}>
      <span className={`rank rank-${entry.rank}`}>{String(entry.rank).padStart(2, "0")}</span>
      <span className="team-cell"><span className="team-mark"><Users size={17} /></span><span><strong>{entry.name}</strong><small>{entry.description || `/${entry.slug}`}</small></span></span>
      <span className="team-count"><strong>{entry.memberCount}</strong><small>{t(locale, "members")}</small></span>
      <span className="team-count"><strong>{entry.activeMembers}</strong><small>{t(locale, "contributors")}</small></span>
      <span className="token-cell"><strong>{formatTokenCount(entry.processedTokens)}</strong><small>{formatPercent(entry.percentile, locale)}</small><ChevronRight size={15} /></span>
    </LocaleLink>)}
  </div>;
}
