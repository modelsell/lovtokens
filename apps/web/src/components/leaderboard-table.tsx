import Image from "next/image";
import { Award, BadgeCheck, ChevronRight } from "lucide-react";
import type { LeaderboardEntry } from "@/lib/data";
import { formatTokenCount, formatPercent } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { localePath, t } from "@/lib/i18n";
import { CommandCopy } from "./command-copy";
import { LocaleLink } from "./locale-link";

export function LeaderboardTable({ entries, compact = false, locale = "en" }: { entries: LeaderboardEntry[]; compact?: boolean; locale?: Locale }) {
  if (entries.length === 0) return <EmptyLeaderboard locale={locale} />;
  return (
    <div className="leaderboard-table" data-compact={compact || undefined}>
      <div className="leaderboard-head"><span>{t(locale, "Rank")}</span><span>{t(locale, "Builder")}</span><span>{t(locale, "Agent mix")}</span><span>{t(locale, "Active")}</span><span>{t(locale, "Processed")}</span></div>
      {entries.map((entry) => {
        const total = Math.max(1, entry.codexTokens + entry.claudeTokens + entry.workbuddyTokens);
        const codex = Math.round((entry.codexTokens / total) * 100);
        const claude = Math.round((entry.claudeTokens / total) * 100);
        const workbuddy = Math.max(0, 100 - codex - claude);
        return (
          <LocaleLink className="leaderboard-row" href={localePath(`/u/${entry.handle}`, locale)} key={entry.handle} locale={locale}>
            <span className={`rank rank-${entry.rank}`}>{String(entry.rank).padStart(2, "0")}</span>
            <span className="builder-cell">
              <span className="avatar">{entry.avatarUrl && entry.showAvatar && !entry.isAnonymous ? <Image alt="" fill sizes="40px" src={entry.avatarUrl} /> : entry.displayName.slice(0, 1).toUpperCase()}</span>
              <span><span className="builder-name-line"><strong>{entry.displayName}</strong><span aria-label={locale === "zh" ? `${entry.achievementCount} 枚成就` : `${entry.achievementCount} achievements`} className="builder-achievement-count"><Award aria-hidden="true" size={11} />{entry.achievementCount}</span></span><small>@{entry.isAnonymous ? `anon-${entry.handle.slice(-4)}` : entry.handle} <BadgeCheck size={12} /></small></span>
            </span>
            <span className="agent-mix"><i style={{ width: `${codex}%` }} /><b style={{ width: `${claude}%` }} /><em style={{ width: `${workbuddy}%` }} /><small>{codex}% Codex · {claude}% Claude · {workbuddy}% WorkBuddy</small></span>
            <span className="active-days"><strong>{entry.activeDays}</strong><small>{t(locale, "days")}</small></span>
            <span className="token-cell"><strong>{entry.showExactTokens ? formatTokenCount(entry.processedTokens) : t(locale, "Private")}</strong><small>{formatPercent(entry.percentile, locale)}</small><ChevronRight size={15} /></span>
          </LocaleLink>
        );
      })}
    </div>
  );
}

function EmptyLeaderboard({ locale }: { locale: Locale }) {
  return <div className="empty-board"><span>000</span><h3>{t(locale, "The board is waiting for its first real sync.")}</h3><p>{t(locale, "No generated users and no inflated demo totals. Connect the collector to claim the first position.")}</p><CommandCopy compact /></div>;
}
