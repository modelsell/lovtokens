import { headers } from "next/headers";
import { AchievementBadge, type AchievementBadgeData } from "@/components/achievement-badge";
import { advancedAchievements, explorationAchievements, legendaryAchievements } from "@/lib/achievement-catalog";
import { getSession } from "@/lib/auth";
import { MILESTONE_THRESHOLDS } from "@/lib/certificates";
import { formatTokenCount } from "@/lib/format";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { milestoneClubForTarget, milestoneClubText } from "@/lib/milestone-clubs";
import { getAchievementMetrics, getAchievementsForUser, getCertificatesForUser, getPrivateSummary } from "@/lib/private-repository";
import { siteUrl } from "@/lib/runtime";

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
  const profileRow = (summary?.profile || {}) as Record<string, unknown>;
  const shareProfile = {
    displayName: Boolean(profileRow.is_anonymous) ? `Anonymous · ${String(profileRow.handle || "").slice(-4).toUpperCase()}` : String(profileRow.display_name || session?.user.name || "LovTokens Builder"),
    handle: String(profileRow.handle || ""),
    isPublic: Boolean(profileRow.is_public),
  };
  const milestoneCertificates = new Map(certificates.filter((row) => String(row.kind) === "milestone").map((row) => [Number(row.period), row]));
  const milestones: AchievementBadgeData[] = MILESTONE_THRESHOLDS.map((target) => {
    const certificate = milestoneCertificates.get(target);
    const detail = milestoneClubForTarget(target);
    const copy = milestoneClubText(detail, locale);
    return {
      key: `milestone-${target}`,
      title: copy.title,
      description: copy.description,
      mark: detail.mark,
      tier: detail.tier,
      variant: "club",
      targetLabel: detail.mark,
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
  const legendary = legendaryAchievements(metrics, locale, earned);
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
  const allAchievements = [...exploration, ...advanced, ...legendary, ...milestones];
  const achievementCount = allAchievements.length + monthly.length;
  const unlockedCount = monthly.length + allAchievements.filter((achievement) => achievement.unlocked).length;

  return <>
    <div className="achievement-page-title achievement-badge-page-title">
      <div><h1>{t(locale, "Achievements.")}</h1><p>{locale === "zh" ? "记录你的使用习惯、探索方式与 Token 里程碑；未触达徽章会保留为灰色收藏位。" : "Record your habits, explorations, and token milestones; unreached badges remain as grayscale collection slots."}</p></div>
      <span><strong>{unlockedCount}</strong> / {achievementCount}<small>{locale === "zh" ? "徽章已解锁" : "badges unlocked"}</small></span>
    </div>
    <section className="achievement-badge-section">
      <header><span className="eyebrow">{locale === "zh" ? "探索与习惯" : "EXPLORATION & HABITS"}</span><h2>{locale === "zh" ? "藏在使用轨迹里的惊喜" : "Surprises hidden in your activity"}</h2><p>{locale === "zh" ? "从多智能体、模型探索到持续活动，每一枚都由正 Token 活动数据解锁。" : "From multi-agent mastery and model exploration to activity streaks, every badge unlocks from positive-token activity."}</p></header>
      <div className="achievement-badge-grid achievement-special-grid">{exploration.map((achievement) => <AchievementBadge achievement={achievement} key={achievement.key} locale={locale} shareProfile={shareProfile} siteOrigin={siteUrl()} />)}</div>
    </section>
    <section className="achievement-badge-section">
      <header><span className="eyebrow">{locale === "zh" ? "进阶收藏" : "ADVANCED COLLECTION"}</span><h2>{locale === "zh" ? "为长期探索者准备的稀有徽章" : "Rare badges for long-running explorers"}</h2><p>{locale === "zh" ? "跨智能体、模型、会话、活跃周期与缓存阶梯继续扩展收藏。" : "Expand the collection across agents, models, sessions, activity rhythms, and cache tiers."}</p></header>
      <div className="achievement-badge-grid achievement-special-grid">{advanced.map((achievement) => <AchievementBadge achievement={achievement} key={achievement.key} locale={locale} shareProfile={shareProfile} siteOrigin={siteUrl()} />)}</div>
    </section>
    <section className="achievement-badge-section achievement-legendary-section">
      <header><span className="eyebrow">{locale === "zh" ? "传奇收藏" : "LEGENDARY COLLECTION"}</span><h2>{locale === "zh" ? "值得长期追逐的终局徽章" : "Endgame badges worth a long pursuit"}</h2><p>{locale === "zh" ? "从三智能体十亿级驾驭到千亿 Token 宇宙，这组徽章为持续数月乃至一年的收藏旅程保留。" : "From billion-scale mastery across three agents to a hundred-billion-token cosmos, these badges reward pursuits lasting months or even years."}</p></header>
      <div className="achievement-badge-grid achievement-special-grid">{legendary.map((achievement) => <AchievementBadge achievement={achievement} key={achievement.key} locale={locale} shareProfile={shareProfile} siteOrigin={siteUrl()} />)}</div>
    </section>
    <section className="achievement-badge-section achievement-milestone-section">
      <header><span className="eyebrow">{locale === "zh" ? "Token 俱乐部系列" : "TOKEN CLUB SERIES"}</span><h2>{locale === "zh" ? "带证明资料的 Token 俱乐部徽章" : "Token Club badges with proof records"}</h2><p>{locale === "zh" ? "从一亿俱乐部到千亿俱乐部，每次晋级都会生成独立编号、可验证证明页面与专属收藏卡。" : "Advance from the 100 Million Club to the 100 Billion Club, with a unique ID, verifiable proof page, and collectible card at every tier."}</p></header>
      <div className="achievement-badge-grid">{milestones.map((achievement) => <AchievementBadge achievement={achievement} key={achievement.key} locale={locale} siteOrigin={siteUrl()} />)}</div>
    </section>
    {monthly.length > 0 && <section className="achievement-badge-section achievement-monthly-section">
      <header><span className="eyebrow">{locale === "zh" ? "月度系列" : "MONTHLY SERIES"}</span><h2>{locale === "zh" ? "已获得的月度徽章" : "Earned monthly badges"}</h2></header>
      <div className="achievement-badge-grid">{monthly.map((achievement) => <AchievementBadge achievement={achievement} key={achievement.key} locale={locale} siteOrigin={siteUrl()} />)}</div>
    </section>}
  </>;
}
