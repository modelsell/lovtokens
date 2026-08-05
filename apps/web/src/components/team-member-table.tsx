import Image from "next/image";
import { Crown } from "lucide-react";
import type { TeamMemberEntry } from "@/lib/data";
import { formatTokenCount } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { localePath, t } from "@/lib/i18n";
import { LocaleLink } from "./locale-link";

export function TeamMemberTable({ members, locale }: { members: TeamMemberEntry[]; locale: Locale }) {
  return <div className="team-member-table">
    <div className="team-member-head"><span>{t(locale, "Rank")}</span><span>{t(locale, "Member")}</span><span>{t(locale, "Active")}</span><span>{t(locale, "Processed")}</span></div>
    {members.map((member) => {
      const identity = <><span className="avatar">{member.avatarUrl ? <Image alt="" fill sizes="40px" src={member.avatarUrl} /> : member.displayName.slice(0, 1).toUpperCase()}</span><span><strong>{member.displayName}{member.role === "owner" && <Crown aria-label={t(locale, "Team owner")} size={13} />}</strong><small>{member.handle ? `@${member.handle}` : t(locale, "Team-only identity")}</small></span></>;
      return <div className="team-member-row" key={member.userId}>
        <span className={`rank rank-${member.rank}`}>{String(member.rank).padStart(2, "0")}</span>
        {member.handle ? <LocaleLink className="builder-cell" href={localePath(`/u/${member.handle}`, locale)} locale={locale}>{identity}</LocaleLink> : <span className="builder-cell">{identity}</span>}
        <span className="team-count"><strong>{member.activeDays}</strong><small>{t(locale, "days")}</small></span>
        <span className="token-cell"><strong>{member.showExactTokens ? formatTokenCount(member.processedTokens) : t(locale, "Private")}</strong><small>{t(locale, "since joining")}</small></span>
      </div>;
    })}
  </div>;
}
