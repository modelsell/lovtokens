import type { Locale } from "./i18n";

export const MILESTONE_CLUBS = [
  {
    target: 100_000_000,
    mark: "100M",
    tier: "bronze",
    name: { zh: "一亿俱乐部", en: "100 Million Club" },
    description: {
      zh: "累计处理 1 亿 Token，成为一亿俱乐部认证成员，获得首枚带独立证明的收藏徽章。",
      en: "Process 100 million tokens to join the 100 Million Club and earn your first collectible badge with an independent proof record.",
    },
  },
  {
    target: 1_000_000_000,
    mark: "1B",
    tier: "jade",
    name: { zh: "十亿俱乐部", en: "Billion Club" },
    description: {
      zh: "累计处理 10 亿 Token，跻身十亿俱乐部，用可验证记录见证持续稳定的智能体协作。",
      en: "Process one billion tokens to enter the Billion Club, backed by a verifiable record of sustained agent collaboration.",
    },
  },
  {
    target: 10_000_000_000,
    mark: "10B",
    tier: "sapphire",
    name: { zh: "百亿俱乐部", en: "10 Billion Club" },
    description: {
      zh: "累计处理 100 亿 Token，晋级百亿俱乐部，以真实活动轨迹留下长期深度使用的证明。",
      en: "Process ten billion tokens to enter the 10 Billion Club and preserve proof of long-term, high-depth usage.",
    },
  },
  {
    target: 50_000_000_000,
    mark: "50B",
    tier: "amethyst",
    name: { zh: "五百亿俱乐部", en: "50 Billion Club" },
    description: {
      zh: "累计处理 500 亿 Token，进入五百亿俱乐部，抵达高强度创作者的稀有收藏等级。",
      en: "Process fifty billion tokens to reach the rare 50 Billion Club tier for high-intensity builders.",
    },
  },
  {
    target: 100_000_000_000,
    mark: "100B",
    tier: "gold",
    name: { zh: "千亿俱乐部", en: "100 Billion Club" },
    description: {
      zh: "累计处理 1000 亿 Token，登上千亿俱乐部，完成 Token 俱乐部收藏系列的最高认证。",
      en: "Process one hundred billion tokens to join the 100 Billion Club and complete the highest certification in the collection.",
    },
  },
] as const;

export type MilestoneClub = (typeof MILESTONE_CLUBS)[number];

export function milestoneClubForTarget(target: number): MilestoneClub {
  return MILESTONE_CLUBS.find((club) => club.target === target) || MILESTONE_CLUBS[0];
}

export function milestoneClubForTokens(tokens: number): MilestoneClub {
  return [...MILESTONE_CLUBS].reverse().find((club) => tokens >= club.target) || MILESTONE_CLUBS[0];
}

export function milestoneClubText(club: MilestoneClub, locale: Locale) {
  const language = locale === "zh" || locale === "zh-tw" ? "zh" : "en";
  return { title: club.name[language], description: club.description[language] };
}
