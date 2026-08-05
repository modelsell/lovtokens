import { ArrowUpRight, Award } from "lucide-react";
import Image from "next/image";
import { earnedBehaviorAchievements } from "@/lib/achievement-catalog";
import type { PublicAchievement } from "@/lib/data";
import { formatTokenCount } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { LocaleLink } from "./locale-link";

const milestoneNames = {
  "100000000": { zh: "青铜起点", en: "Bronze Origin", mark: "I" },
  "1000000000": { zh: "翡翠进阶", en: "Jade Momentum", mark: "II" },
  "10000000000": { zh: "蓝宝石信标", en: "Sapphire Signal", mark: "III" },
  "50000000000": { zh: "紫晶轨道", en: "Amethyst Orbit", mark: "IV" },
  "100000000000": { zh: "鎏金传奇", en: "Gilded Legend", mark: "V" },
} as const;

export function PublicAchievementShelf({ achievements, locale }: { achievements: PublicAchievement[]; locale: Locale }) {
  const behavior = new Map(earnedBehaviorAchievements(
    achievements.filter((item) => item.kind === "behavior").map((item) => ({ key: item.key, earnedAt: item.earnedAt })),
    locale,
  ).map((item) => [item.key, item]));
  const cards = achievements.flatMap((item) => {
    if (item.kind === "behavior") {
      const badge = behavior.get(item.key);
      return badge ? [{ item, title: badge.title, subtitle: badge.targetLabel || badge.mark, mark: badge.mark, image: badge.image }] : [];
    }
    if (item.kind === "monthly") return [{
      item,
      title: locale === "zh" ? `${item.period} 月度徽章` : `${item.period} Monthly Badge`,
      subtitle: formatTokenCount(item.processedTokens || 0),
      mark: item.period?.slice(5, 7) || "M",
      image: undefined,
    }];
    const detail = milestoneNames[String(item.period) as keyof typeof milestoneNames];
    return [{
      item,
      title: detail ? detail[locale === "zh" ? "zh" : "en"] : (locale === "zh" ? "Token 里程碑" : "Token Milestone"),
      subtitle: formatTokenCount(item.processedTokens || Number(item.period) || 0),
      mark: detail?.mark || "M",
      image: undefined,
    }];
  });

  if (!cards.length) return null;
  return <section className="profile-achievements" id="achievements">
    <header className="profile-achievements-head">
      <div><span className="eyebrow">{locale === "zh" ? "公开收藏" : "PUBLIC COLLECTION"}</span><h2>{locale === "zh" ? "已获得成就徽章" : "Earned achievement badges"}</h2><p>{locale === "zh" ? "这些徽章由已同步的真实活动轨迹解锁。" : "Unlocked from verified, synced activity."}</p></div>
      <span><Award aria-hidden="true" size={18} /><strong>{cards.length}</strong>{locale === "zh" ? " 枚" : " earned"}</span>
    </header>
    <div className="profile-achievement-grid">
      {cards.map(({ item, title, subtitle, mark, image }) => {
        const content = <>
          <span className="profile-achievement-art">{image ? <Image alt="" height={640} sizes="128px" src={image} width={640} /> : <strong>{mark}</strong>}</span>
          <span className="profile-achievement-copy"><small>{subtitle}</small><strong>{title}</strong><time dateTime={new Date(item.earnedAt * 1000).toISOString()}>{new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", { dateStyle: "medium" }).format(new Date(item.earnedAt * 1000))}</time></span>
          {item.certificateId && <ArrowUpRight aria-hidden="true" className="profile-achievement-link-icon" size={15} />}
        </>;
        const className = "profile-achievement-item";
        const id = `achievement-${item.key}`;
        return item.certificateId
          ? <LocaleLink className={className} href={localePath(`/certificate/${encodeURIComponent(item.certificateId)}`, locale)} id={id} key={`${item.kind}-${item.key}`} locale={locale}>{content}</LocaleLink>
          : <article className={className} id={id} key={`${item.kind}-${item.key}`}>{content}</article>;
      })}
    </div>
  </section>;
}
