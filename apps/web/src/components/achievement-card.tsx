import { ArrowUpRight, Download } from "lucide-react";
import Image from "next/image";
import { formatTokenCount } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { LocaleLink } from "./locale-link";

export type AchievementCardData = {
  id: string;
  kind: string;
  period: string;
  processedTokens: number;
  rank: number | null;
  coverage: number;
  trustLevel: string;
  status: string;
  issuedAt: number;
};

function achievementCopy(achievement: AchievementCardData, locale: Locale) {
  const monthly = achievement.kind === "monthly";
  if (locale === "zh") return {
    title: monthly ? `${achievement.period} 月度成就` : `${formatTokenCount(achievement.processedTokens)} Token 里程碑`,
    type: monthly ? "月度成就" : "里程碑成就",
    download: "下载图片",
    proof: "查看证明",
  };
  return {
    title: monthly ? `${achievement.period} Monthly Achievement` : `${formatTokenCount(achievement.processedTokens)} Token Milestone`,
    type: monthly ? "Monthly achievement" : "Milestone achievement",
    download: "Download image",
    proof: "View proof",
  };
}

export function AchievementCard({ achievement, locale }: { achievement: AchievementCardData; locale: Locale }) {
  const copy = achievementCopy(achievement, locale);
  const encodedId = encodeURIComponent(achievement.id);
  const proofHref = localePath(`/certificate/${encodedId}`, locale);
  const imageUrl = `/certificate/${encodedId}/image?lang=${locale}`;
  const downloadUrl = `${imageUrl}&download=1`;

  return <article className="achievement-gallery-item">
    <LocaleLink ariaLabel={`${copy.proof}：${copy.title}`} className="achievement-image-link" href={proofHref} locale={locale}>
      <Image alt={copy.title} className="achievement-card-image" height={1350} src={imageUrl} unoptimized width={1080} />
    </LocaleLink>
    <footer className="achievement-gallery-meta">
      <span><strong>{copy.title}</strong><small>{copy.type} · 1080 × 1350 PNG</small></span>
      <span className="achievement-gallery-actions">
        <a download={`lovtokens-achievement-${achievement.id}.png`} href={downloadUrl}>{copy.download}<Download aria-hidden="true" size={14} /></a>
        <LocaleLink href={proofHref} locale={locale}>{copy.proof}<ArrowUpRight aria-hidden="true" size={14} /></LocaleLink>
      </span>
    </footer>
  </article>;
}
