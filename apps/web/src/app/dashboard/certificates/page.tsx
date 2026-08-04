import { headers } from "next/headers";
import { AchievementBadge, type AchievementBadgeData } from "@/components/achievement-badge";
import { advancedAchievements, explorationAchievements } from "@/lib/achievement-catalog";
import { getSession } from "@/lib/auth";
import { MILESTONE_THRESHOLDS } from "@/lib/certificates";
import { formatTokenCount } from "@/lib/format";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getAchievementMetrics, getAchievementsForUser, getCertificatesForUser, getPrivateSummary } from "@/lib/private-repository";

const milestoneDetails: Array<{ mark: string; tier: AchievementBadgeData["tier"]; zh: [string, string]; en: [string, string] }> = [
  { mark: "I", tier: "bronze", zh: ["青铜起点", "完成第一个百万 Token，开启你的收藏序列。"], en: ["Bronze Origin", "Complete the first million tokens and begin your collection."] },
  { mark: "II", tier: "jade", zh: ["翡翠进阶", "累计处理一千万 Token，进入稳定活跃阶段。"], en: ["Jade Momentum", "Process ten million tokens and enter sustained activity."] },
  { mark: "III", tier: "sapphire", zh: ["蓝宝石信标", "累计处理一亿 Token，建立清晰的长期使用轨迹。"], en: ["Sapphire Signal", "Process one hundred million tokens and establish a long-term signal."] },
  { mark: "IV", tier: "amethyst", zh: ["紫晶轨道", "累计处理十亿 Token，进入十亿级使用轨道。"], en: ["Amethyst Orbit", "Process one billion tokens and enter the billion-token orbit."] },
  { mark: "V", tier: "gold", zh: ["鎏金传奇", "累计处理百亿 Token，完成最高等级里程碑。"], en: ["Gilded Legend", "Process ten billion tokens and complete the highest milestone."] },
];

export default async function CertificatesDashboard() {
  const locale = await getLocale();
  const session = await getSession(await headers());
  const [rows, summary, metrics, achievementRows] = session?.user
    ? await Promise.all([
      getCertificatesForUser(session.user.id),
      getPrivateSummary(session.user.id),
      getAchievementMetrics(session.user.id),
      getAchievementsForUser(session.user.id),
    ])
    : [[], null, null, []];
  const certificates = rows as Array<Record<string, unknown>>;
  const earned = new Map(achievementRows.map((row) => [String(row.achievement_key), Number(row.earned_at)]));
  const total = Number(summary?.total || 0);
  const milestoneCertificates = new Map(certificates.filter((row) => String(row.kind) === "milestone").map((row) => [Number(row.period), row]));
  const milestones: AchievementBadgeData[] = MILESTONE_THRESHOLDS.map((target, index) => {
    const certificate = milestoneCertificates.get(target);
    const detail = milestoneDetails[index]!;
    const copy = locale === "zh" ? detail.zh : detail.en;
    return {
      key: `milestone-${target}`,
      title: copy[0],
      description: copy[1],
      mark: detail.mark,
      tier: detail.tier,
      tokens: total,
      target,
      unlocked: total >= target,
      proofPending: total >= target && !certificate,
      certificateId: certificate ? String(certificate.id) : undefined,
      issuedAt: certificate ? Number(certificate.issued_at) : undefined,
    };
  });
  const exploration = explorationAchievements(metrics, locale, earned);
  const advanced = advancedAchievements(metrics, locale, earned);
  const monthly: AchievementBadgeData[] = certificates.filter((row) => String(row.kind) === "monthly").map((row) => ({
    key: String(row.id),
    title: locale === "zh" ? `${String(row.period)} 月度徽章` : `${String(row.period)} Monthly Badge`,
    description: locale === "zh" ? `该自然月累计处理 ${formatTokenCount(Number(row.processed_tokens))} Token。` : `${formatTokenCount(Number(row.processed_tokens))} tokens processed during this calendar month.`,
    mark: String(row.period).slice(5, 7),
    tier: "monthly",
    tokens: Number(row.processed_tokens),
    target: Number(row.processed_tokens),
    unlocked: true,
    certificateId: String(row.id),
    issuedAt: Number(row.issued_at),
  }));
  const allAchievements = [...exploration, ...advanced, ...milestones];
  const achievementCount = allAchievements.length + monthly.length;
  const unlockedCount = monthly.length + allAchievements.filter((achievement) => achievement.unlocked).length;

  return <>
    <div className="achievement-page-title achievement-badge-page-title">
      <div><h1>{t(locale, "Achievements.")}</h1><p>{locale === "zh" ? "记录你的使用习惯、探索方式与 Token 里程碑；未触达徽章会保留为灰色收藏位。" : "Record your habits, explorations, and token milestones; unreached badges remain as grayscale collection slots."}</p></div>
      <span><strong>{unlockedCount}</strong> / {achievementCount}<small>{locale === "zh" ? "徽章已解锁" : "badges unlocked"}</small></span>
    </div>
    <section className="achievement-badge-section">
      <header><span className="eyebrow">{locale === "zh" ? "探索与习惯" : "EXPLORATION & HABITS"}</span><h2>{locale === "zh" ? "藏在使用轨迹里的惊喜" : "Surprises hidden in your activity"}</h2><p>{locale === "zh" ? "从多智能体、模型探索到持续活动，每一枚都由正 Token 活动数据解锁。" : "From multi-agent mastery and model exploration to activity streaks, every badge unlocks from positive-token activity."}</p></header>
      <div className="achievement-badge-grid achievement-special-grid">{exploration.map((achievement) => <AchievementBadge achievement={achievement} key={achievement.key} locale={locale} />)}</div>
    </section>
    <section className="achievement-badge-section">
      <header><span className="eyebrow">{locale === "zh" ? "进阶收藏" : "ADVANCED COLLECTION"}</span><h2>{locale === "zh" ? "为长期探索者准备的稀有徽章" : "Rare badges for long-running explorers"}</h2><p>{locale === "zh" ? "跨智能体、模型、会话、活跃周期与缓存阶梯继续扩展收藏。" : "Expand the collection across agents, models, sessions, activity rhythms, and cache tiers."}</p></header>
      <div className="achievement-badge-grid achievement-special-grid">{advanced.map((achievement) => <AchievementBadge achievement={achievement} key={achievement.key} locale={locale} />)}</div>
    </section>
    <section className="achievement-badge-section achievement-milestone-section">
      <header><span className="eyebrow">{locale === "zh" ? "里程碑系列" : "MILESTONE SERIES"}</span><h2>{locale === "zh" ? "带证明资料的 Token 收藏徽章" : "Token badges with proof records"}</h2><p>{locale === "zh" ? "达到累计 Token 门槛后生成独立编号、证明页面与可下载收藏卡。" : "Reach a lifetime token threshold to receive an independent ID, proof page, and downloadable collectible cards."}</p></header>
      <div className="achievement-badge-grid">{milestones.map((achievement) => <AchievementBadge achievement={achievement} key={achievement.key} locale={locale} />)}</div>
    </section>
    {monthly.length > 0 && <section className="achievement-badge-section achievement-monthly-section">
      <header><span className="eyebrow">{locale === "zh" ? "月度系列" : "MONTHLY SERIES"}</span><h2>{locale === "zh" ? "已获得的月度徽章" : "Earned monthly badges"}</h2></header>
      <div className="achievement-badge-grid">{monthly.map((achievement) => <AchievementBadge achievement={achievement} key={achievement.key} locale={locale} />)}</div>
    </section>}
  </>;
}
