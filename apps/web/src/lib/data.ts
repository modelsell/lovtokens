export type LeaderboardEntry = {
  rank: number;
  handle: string;
  displayName: string;
  avatarUrl: string | null;
  isAnonymous: boolean;
  processedTokens: number;
  activeDays: number;
  percentile: number;
  codexTokens: number;
  claudeTokens: number;
  workbuddyTokens: number;
  achievementCount: number;
  trustLevel: string;
  showExactTokens: boolean;
  showAvatar: boolean;
};

export type PublicProfile = LeaderboardEntry & {
  inputTokens: number;
  cacheTokens: number;
  outputTokens: number;
  requestCount: number;
  topModel: string | null;
  currentStreak: number;
  coverage: number;
  statsVersion: number;
  privacyVersion: number;
  showRank: boolean;
  showModels: boolean;
  showCost: boolean;
  today: string;
  history: Array<{ date: string; tokens: number }>;
  sources: Array<{ source: string; tokens: number }>;
  models: Array<{ model: string; tokens: number }>;
  achievements: PublicAchievement[];
};

export type PublicAchievement = {
  key: string;
  kind: "behavior" | "milestone" | "monthly";
  earnedAt: number;
  certificateId?: string;
  period?: string;
  processedTokens?: number;
};

export type CertificateRecord = {
  id: string;
  userId: string | null;
  handle: string;
  displayName: string;
  kind: string;
  period: string;
  processedTokens: number;
  rank: number | null;
  percentile: number | null;
  coverage: number;
  trustLevel: string;
  payloadHash: string;
  payloadJson: string;
  signature: string | null;
  status: string;
  issuedAt: number;
  indexable: boolean;
};
