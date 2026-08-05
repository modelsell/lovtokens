import { PenLine, Quote } from "lucide-react";
import type { Locale } from "@/lib/i18n";

export function ProfileStatement({ statement, isOwner, locale, settingsPath }: { statement: string; isOwner: boolean; locale: Locale; settingsPath: string }) {
  if (!statement && !isOwner) return null;
  return <aside className="profile-statement" data-empty={!statement || undefined}>
    <Quote aria-hidden="true" className="profile-statement-mark" size={34} strokeWidth={1.5} />
    <div>
      <span>{locale === "zh" ? "作者态度" : "BUILDER'S NOTE"}</span>
      {statement
        ? <blockquote>{statement}</blockquote>
        : <p>{locale === "zh" ? "给这份数据留下一句属于你的话。" : "Leave one line that makes these numbers yours."}</p>}
    </div>
    {isOwner && <a href={settingsPath}><PenLine aria-hidden="true" size={14} />{statement ? (locale === "zh" ? "编辑" : "Edit") : (locale === "zh" ? "写一句" : "Add yours")}</a>}
  </aside>;
}
