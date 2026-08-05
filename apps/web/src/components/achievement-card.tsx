"use client";

import { ArrowUpRight, Download } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import type { AchievementCardStyle } from "./certificate-image";
import type { Locale } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { milestoneClubForTokens, milestoneClubText } from "@/lib/milestone-clubs";
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
  const clubTitle = milestoneClubText(milestoneClubForTokens(achievement.processedTokens), locale).title;
  if (locale === "zh") return {
    title: monthly ? `${achievement.period} 月度成就` : clubTitle,
    type: monthly ? "月度成就" : "Token 俱乐部成就",
    download: "下载图片",
    proof: "查看证明",
  };
  return {
    title: monthly ? `${achievement.period} Monthly Achievement` : clubTitle,
    type: monthly ? "Monthly achievement" : "Token Club achievement",
    download: "Download image",
    proof: "View proof",
  };
}

export function AchievementCard({ achievement, locale }: { achievement: AchievementCardData; locale: Locale }) {
  const [cardStyle, setCardStyle] = useState<AchievementCardStyle>("collector");
  const copy = achievementCopy(achievement, locale);
  const encodedId = encodeURIComponent(achievement.id);
  const proofHref = localePath(`/certificate/${encodedId}`, locale);
  const imageUrl = `/certificate/${encodedId}/image?lang=${locale}&style=${cardStyle}`;
  const downloadUrl = `${imageUrl}&download=1`;
  const styleName = cardStyle === "collector" ? (locale === "zh" ? "金属典藏" : "Metal Collector") : (locale === "zh" ? "档案典藏" : "Archive Edition");

  return <article className="achievement-gallery-item">
    <LocaleLink ariaLabel={`${copy.proof}：${copy.title}`} className="achievement-image-link" href={proofHref} locale={locale}>
      <Image alt={`${copy.title} · ${styleName}`} className="achievement-card-image" height={1350} src={imageUrl} unoptimized width={1080} />
    </LocaleLink>
    <div aria-label={locale === "zh" ? "成就卡片样式" : "Achievement card style"} className="achievement-style-switch" role="group">
      <button aria-pressed={cardStyle === "collector"} onClick={() => setCardStyle("collector")} type="button">{locale === "zh" ? "金属典藏" : "Metal Collector"}</button>
      <button aria-pressed={cardStyle === "archive"} onClick={() => setCardStyle("archive")} type="button">{locale === "zh" ? "档案典藏" : "Archive Edition"}</button>
    </div>
    <footer className="achievement-gallery-meta">
      <span><strong>{copy.title}</strong><small>{styleName} · {copy.type} · 1080 × 1350 PNG</small></span>
      <span className="achievement-gallery-actions">
        <a download={`lovtokens-achievement-${achievement.id}-${cardStyle}.png`} href={downloadUrl}>{copy.download}<Download aria-hidden="true" size={14} /></a>
        <LocaleLink href={proofHref} locale={locale}>{copy.proof}<ArrowUpRight aria-hidden="true" size={14} /></LocaleLink>
      </span>
    </footer>
  </article>;
}
