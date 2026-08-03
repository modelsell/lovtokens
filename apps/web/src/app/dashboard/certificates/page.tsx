import { headers } from "next/headers";
import { AchievementBadge, type AchievementBadgeData } from "@/components/achievement-badge";
import { getSession } from "@/lib/auth";
import { MILESTONE_THRESHOLDS } from "@/lib/certificates";
import { formatTokenCount } from "@/lib/format";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getAchievementMetrics, getCertificatesForUser, getPrivateSummary } from "@/lib/private-repository";

const milestoneDetails: Array<{ mark: string; tier: AchievementBadgeData["tier"]; zh: [string, string]; en: [string, string] }> = [
  { mark: "I", tier: "bronze" as const, zh: ["青铜起点", "完成第一个百万 Token，开启你的收藏序列。"], en: ["Bronze Origin", "Complete the first million tokens and begin your collection."] },
  { mark: "II", tier: "jade" as const, zh: ["翡翠进阶", "累计处理一千万 Token，进入稳定活跃阶段。"], en: ["Jade Momentum", "Process ten million tokens and enter sustained activity."] },
  { mark: "III", tier: "sapphire" as const, zh: ["蓝宝石信标", "累计处理一亿 Token，建立清晰的长期使用轨迹。"], en: ["Sapphire Signal", "Process one hundred million tokens and establish a long-term signal."] },
  { mark: "IV", tier: "amethyst" as const, zh: ["紫晶轨道", "累计处理十亿 Token，进入十亿级使用轨道。"], en: ["Amethyst Orbit", "Process one billion tokens and enter the billion-token orbit."] },
  { mark: "V", tier: "gold" as const, zh: ["鎏金传奇", "累计处理百亿 Token，完成最高等级里程碑。"], en: ["Gilded Legend", "Process ten billion tokens and complete the highest milestone."] },
];

export default async function CertificatesDashboard() {
  const locale = await getLocale();
  const session = await getSession(await headers());
  const [rows, summary, metrics] = session?.user ? await Promise.all([getCertificatesForUser(session.user.id), getPrivateSummary(session.user.id), getAchievementMetrics(session.user.id)]) : [[], null, null];
  const certificates = rows as Array<Record<string, unknown>>;
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
  const specialAchievements: AchievementBadgeData[] = [
    {
      key: "night-owl",
      title: locale === "zh" ? "夜猫子" : "Night Owl",
      description: locale === "zh" ? "在 UTC 22:00–05:00 开始的深夜会话中累计处理 100 万 Token。" : "Process one million tokens in late-night sessions starting between 22:00 and 05:00 UTC.",
      mark: "OWL",
      tier: "special",
      image: "/achievements/night-owl.jpg",
      tokens: metrics?.nightTokens || 0,
      target: 1_000_000,
      targetLabel: "1M",
      progressLabel: `${formatTokenCount(metrics?.nightTokens || 0)} / 1M · UTC NIGHT`,
      unlocked: (metrics?.nightTokens || 0) >= 1_000_000,
    },
    {
      key: "dual-agent",
      title: locale === "zh" ? "双智能体驾驭者" : "Dual Agent Tamer",
      description: locale === "zh" ? "Codex 与 Claude Code 各累计处理 100 万 Token。" : "Process one million tokens with both Codex and Claude Code.",
      mark: "DUO",
      tier: "special",
      image: "/achievements/dual-agent.jpg",
      tokens: Math.min(metrics?.codexTokens || 0, metrics?.claudeTokens || 0),
      target: 1_000_000,
      targetLabel: "DUAL 1M",
      progressLabel: `Codex ${formatTokenCount(metrics?.codexTokens || 0)} · Claude ${formatTokenCount(metrics?.claudeTokens || 0)}`,
      unlocked: Math.min(metrics?.codexTokens || 0, metrics?.claudeTokens || 0) >= 1_000_000,
    },
    {
      key: "streak-flame",
      title: locale === "zh" ? "七日火种" : "Seven-day Flame",
      description: locale === "zh" ? "连续 7 个 UTC 自然日保持 Token 活动。" : "Keep token activity alive for seven consecutive UTC calendar days.",
      mark: "7D",
      tier: "special",
      image: "/achievements/streak-flame.jpg",
      tokens: metrics?.longestStreak || 0,
      target: 7,
      targetLabel: "7 DAYS",
      progressLabel: `${metrics?.longestStreak || 0} / 7 ${locale === "zh" ? "天" : "days"}`,
      unlocked: (metrics?.longestStreak || 0) >= 7,
    },
    {
      key: "model-explorer",
      title: locale === "zh" ? "模型星图师" : "Model Cartographer",
      description: locale === "zh" ? "在创作轨迹中点亮 5 个不同模型。" : "Light up five distinct models across your creation history.",
      mark: "MAP",
      tier: "special",
      image: "/achievements/model-explorer.jpg",
      tokens: metrics?.modelCount || 0,
      target: 5,
      targetLabel: "5 MODELS",
      progressLabel: `${metrics?.modelCount || 0} / 5 ${locale === "zh" ? "个模型" : "models"}`,
      unlocked: (metrics?.modelCount || 0) >= 5,
    },
    {
      key: "cache-wizard",
      title: locale === "zh" ? "缓存炼金术士" : "Cache Alchemist",
      description: locale === "zh" ? "累计复用 5000 万缓存读取 Token，把效率炼成收藏。" : "Reuse fifty million cache-read tokens and turn efficiency into a collectible.",
      mark: "CACHE",
      tier: "special",
      image: "/achievements/cache-wizard.jpg",
      tokens: metrics?.cacheTokens || 0,
      target: 50_000_000,
      targetLabel: "50M CACHE",
      progressLabel: `${formatTokenCount(metrics?.cacheTokens || 0)} / 50M CACHE`,
      unlocked: (metrics?.cacheTokens || 0) >= 50_000_000,
    },
    {
      key: "weekend-builder",
      title: locale === "zh" ? "周末造物家" : "Weekend Maker",
      description: locale === "zh" ? "在 5 个 UTC 周末日期留下活跃记录。" : "Leave an activity mark on five UTC weekend dates.",
      mark: "WEEKEND",
      tier: "special",
      image: "/achievements/weekend-builder.jpg",
      tokens: metrics?.weekendDays || 0,
      target: 5,
      targetLabel: "5 DAYS",
      progressLabel: `${metrics?.weekendDays || 0} / 5 ${locale === "zh" ? "个周末活跃日" : "weekend days"}`,
      unlocked: (metrics?.weekendDays || 0) >= 5,
    },
    {
      key: "deep-dive",
      title: locale === "zh" ? "单日深潜者" : "Daily Deep Diver",
      description: locale === "zh" ? "在单个 UTC 自然日内处理 1000 万 Token。" : "Process ten million tokens in a single UTC calendar day.",
      mark: "DIVE",
      tier: "special",
      image: "/achievements/deep-dive.jpg",
      tokens: metrics?.maxDailyTokens || 0,
      target: 10_000_000,
      targetLabel: "10M / DAY",
      progressLabel: `${formatTokenCount(metrics?.maxDailyTokens || 0)} / 10M`,
      unlocked: (metrics?.maxDailyTokens || 0) >= 10_000_000,
    },
    {
      key: "marathon-builder",
      title: locale === "zh" ? "创作马拉松" : "Creation Marathon",
      description: locale === "zh" ? "累计在 30 个 UTC 自然日留下 Token 活动。" : "Record token activity across thirty UTC calendar days.",
      mark: "30D",
      tier: "special",
      image: "/achievements/marathon-builder.jpg",
      tokens: metrics?.activeDays || 0,
      target: 30,
      targetLabel: "30 DAYS",
      progressLabel: `${metrics?.activeDays || 0} / 30 ${locale === "zh" ? "个活跃日" : "active days"}`,
      unlocked: (metrics?.activeDays || 0) >= 30,
    },
  ];
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
  const achievementCount = milestones.length + specialAchievements.length + monthly.length;
  const unlockedCount = monthly.length + [...specialAchievements, ...milestones].filter((achievement) => achievement.unlocked).length;

  return <>
    <div className="achievement-page-title achievement-badge-page-title">
      <div><h1>{t(locale, "Achievements.")}</h1><p>{locale === "zh" ? "记录你的使用习惯、探索方式与 Token 里程碑；未触达徽章会保留为灰色收藏位。" : "Record your habits, explorations, and token milestones; unreached badges remain as grayscale collection slots."}</p></div>
      <span><strong>{unlockedCount}</strong> / {achievementCount}<small>{locale === "zh" ? "徽章已解锁" : "badges unlocked"}</small></span>
    </div>
    <section className="achievement-badge-section">
      <header><span className="eyebrow">{locale === "zh" ? "探索与习惯" : "EXPLORATION & HABITS"}</span><h2>{locale === "zh" ? "藏在使用轨迹里的惊喜" : "Surprises hidden in your activity"}</h2><p>{locale === "zh" ? "从夜猫子、双智能体到模型探索，每一枚都由真实活动数据解锁。" : "From Night Owl to dual-agent mastery and model exploration, every badge unlocks from real activity."}</p></header>
      <div className="achievement-badge-grid achievement-special-grid">{specialAchievements.map((achievement) => <AchievementBadge achievement={achievement} key={achievement.key} locale={locale} />)}</div>
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
