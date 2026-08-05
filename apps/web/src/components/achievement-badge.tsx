import { ArrowUpRight, Check, Download, LockKeyhole } from "lucide-react";
import Image from "next/image";
import { formatTokenCount } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { LocaleLink } from "./locale-link";
import { AchievementShareButton } from "./achievement-share-button";
import { CertificateShareButton } from "./certificate-share-button";

export type AchievementBadgeData = {
  key: string;
  title: string;
  description: string;
  mark: string;
  tier: "bronze" | "jade" | "sapphire" | "amethyst" | "gold" | "monthly" | "special" | "legendary";
  tokens: number;
  target: number;
  unlocked: boolean;
  image?: string;
  variant?: "club";
  targetLabel?: string;
  progressLabel?: string;
  proofPending?: boolean;
  certificateId?: string;
  issuedAt?: number;
};

export type AchievementShareProfile = { displayName: string; handle: string; isPublic: boolean };

export function AchievementBadge({ achievement, locale, siteOrigin, shareProfile }: { achievement: AchievementBadgeData; locale: Locale; siteOrigin: string; shareProfile?: AchievementShareProfile }) {
  const progress = Math.min(100, Math.max(0, (achievement.tokens / Math.max(1, achievement.target)) * 100));
  const issued = achievement.issuedAt ? new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", { day: "numeric", month: "short", year: "numeric" }).format(new Date(achievement.issuedAt * 1000)) : null;
  const proofHref = achievement.certificateId ? localePath(`/certificate/${encodeURIComponent(achievement.certificateId)}`, locale) : null;
  const imageBase = achievement.certificateId ? `/certificate/${encodeURIComponent(achievement.certificateId)}/image?lang=${locale}` : null;

  return <article className="achievement-badge-card" data-art={achievement.image ? true : undefined} data-locked={!achievement.unlocked || undefined} data-tier={achievement.tier} data-variant={achievement.variant}>
    <div className="achievement-badge-visual">
      <span aria-hidden="true" className="achievement-badge-mark">{achievement.variant === "club" ? "TOKEN CLUB" : achievement.mark}</span>
      {achievement.image ? <Image alt={achievement.title} className="achievement-badge-art" height={640} sizes="(max-width: 720px) 84vw, (max-width: 1100px) 42vw, 25vw" src={achievement.image} width={640} /> : achievement.variant === "club" ? <div className="achievement-badge-club">
        <span>{locale === "zh" ? "认证收藏成员" : "VERIFIED MEMBER"}</span>
        <strong>{achievement.mark}</strong>
        <b>{locale === "zh" ? "TOKEN 俱乐部" : "TOKEN CLUB"}</b>
        <i aria-hidden="true" />
        <small>LOVTOKENS · PROOF SERIES</small>
      </div> : <><div aria-hidden="true" className="achievement-badge-rays" /><div className="achievement-badge-medal">
        <span className="achievement-badge-series">LOVTOKENS</span>
        <strong>{achievement.mark}</strong>
        <b>{achievement.targetLabel || formatTokenCount(achievement.target)}</b>
        <small>TOKEN MILESTONE</small>
      </div></>}
      <span className="achievement-badge-status">{achievement.unlocked ? <Check aria-hidden="true" size={15} /> : <LockKeyhole aria-hidden="true" size={15} />}</span>
    </div>
    <div className="achievement-badge-copy">
      <div className="achievement-badge-meta">
        <span>{achievement.unlocked ? (locale === "zh" ? "已解锁" : "Unlocked") : (locale === "zh" ? "尚未解锁" : "Locked")}</span>
        <b>{achievement.targetLabel || formatTokenCount(achievement.target)}</b>
      </div>
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
      <CertificateShareButton canPublishPreview compact id={achievement.certificateId!} locale={locale} processedTokens={achievement.target} siteOrigin={siteOrigin} title={achievement.title} />
    </footer>}
    {!proofHref && achievement.unlocked && achievement.image && shareProfile && <footer className="achievement-badge-actions achievement-badge-share-only">
      <AchievementShareButton achievementKey={achievement.key} badgeImage={achievement.image} description={achievement.description} earnedAt={achievement.issuedAt} locale={locale} mark={achievement.mark} profile={shareProfile} siteOrigin={siteOrigin} targetLabel={achievement.targetLabel || formatTokenCount(achievement.target)} title={achievement.title} />
    </footer>}
  </article>;
}
