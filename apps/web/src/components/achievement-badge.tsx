import { ArrowUpRight, Check, Download, LockKeyhole } from "lucide-react";
import Image from "next/image";
import { formatTokenCount } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { LocaleLink } from "./locale-link";

export type AchievementBadgeData = {
  key: string;
  title: string;
  description: string;
  mark: string;
  tier: "bronze" | "jade" | "sapphire" | "amethyst" | "gold" | "monthly" | "special";
  tokens: number;
  target: number;
  unlocked: boolean;
  image?: string;
  targetLabel?: string;
  progressLabel?: string;
  proofPending?: boolean;
  certificateId?: string;
  issuedAt?: number;
};

export function AchievementBadge({ achievement, locale }: { achievement: AchievementBadgeData; locale: Locale }) {
  const progress = Math.min(100, Math.max(0, (achievement.tokens / Math.max(1, achievement.target)) * 100));
  const issued = achievement.issuedAt ? new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", { day: "numeric", month: "short", year: "numeric" }).format(new Date(achievement.issuedAt * 1000)) : null;
  const proofHref = achievement.certificateId ? localePath(`/certificate/${encodeURIComponent(achievement.certificateId)}`, locale) : null;
  const imageBase = achievement.certificateId ? `/certificate/${encodeURIComponent(achievement.certificateId)}/image?lang=${locale}` : null;

  return <article className="achievement-badge-card" data-art={achievement.image ? true : undefined} data-locked={!achievement.unlocked || undefined} data-tier={achievement.tier}>
    <div className="achievement-badge-visual">
      {achievement.image ? <Image alt="" className="achievement-badge-art" height={640} src={achievement.image} width={640} /> : <><div aria-hidden="true" className="achievement-badge-rays" /><div className="achievement-badge-medal">
        <span className="achievement-badge-series">LOVTOKENS</span>
        <strong>{achievement.mark}</strong>
        <b>{achievement.targetLabel || formatTokenCount(achievement.target)}</b>
        <small>TOKEN MILESTONE</small>
      </div></>}
      <span className="achievement-badge-status">{achievement.unlocked ? <Check aria-hidden="true" size={15} /> : <LockKeyhole aria-hidden="true" size={15} />}</span>
    </div>
    <div className="achievement-badge-copy">
      <span>{achievement.unlocked ? (locale === "zh" ? "已解锁" : "Unlocked") : (locale === "zh" ? "尚未解锁" : "Locked")}</span>
      <h2>{achievement.title}</h2>
      <p>{achievement.description}</p>
      {achievement.unlocked
        ? <small>{issued ? `${locale === "zh" ? "获得于" : "Earned"} ${issued}` : achievement.proofPending ? (locale === "zh" ? "已达成，证明生成中" : "Reached; proof pending") : (locale === "zh" ? "条件已完成" : "Completed")}</small>
        : <div className="achievement-badge-progress"><span><i style={{ width: `${progress}%` }} /></span><small>{achievement.progressLabel || `${formatTokenCount(achievement.tokens)} / ${formatTokenCount(achievement.target)}`} · {progress.toFixed(0)}%</small></div>}
    </div>
    {proofHref && imageBase && <footer className="achievement-badge-actions">
      <LocaleLink href={proofHref} locale={locale}>{locale === "zh" ? "查看证明" : "View proof"}<ArrowUpRight aria-hidden="true" size={13} /></LocaleLink>
      <a download href={`${imageBase}&style=collector&download=1`}>{locale === "zh" ? "金属卡" : "Metal card"}<Download aria-hidden="true" size={13} /></a>
      <a download href={`${imageBase}&style=archive&download=1`}>{locale === "zh" ? "档案卡" : "Archive card"}<Download aria-hidden="true" size={13} /></a>
    </footer>}
  </article>;
}
