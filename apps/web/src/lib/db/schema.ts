import { integer, primaryKey, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
});

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});

export const profiles = sqliteTable("profiles", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  handle: text("handle").notNull().unique(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
  isAnonymous: integer("is_anonymous", { mode: "boolean" }).notNull().default(false),
  showExactTokens: integer("show_exact_tokens", { mode: "boolean" }).notNull().default(true),
  showRank: integer("show_rank", { mode: "boolean" }).notNull().default(true),
  showAvatar: integer("show_avatar", { mode: "boolean" }).notNull().default(true),
  showModels: integer("show_models", { mode: "boolean" }).notNull().default(true),
  showCost: integer("show_cost", { mode: "boolean" }).notNull().default(false),
  privacyVersion: integer("privacy_version").notNull().default(1),
  statsVersion: integer("stats_version").notNull().default(1),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

export const devices = sqliteTable("devices", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  status: text("status").notNull().default("active"),
  lastSyncedAt: integer("last_synced_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  revokedAt: integer("revoked_at", { mode: "timestamp" }),
});

export const usageDaily = sqliteTable("usage_daily", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  deviceId: text("device_id").notNull().references(() => devices.id, { onDelete: "cascade" }),
  utcDate: text("utc_date").notNull(),
  source: text("source").notNull(),
  model: text("model").notNull(),
  sessionFingerprint: text("session_fingerprint").notNull(),
  inputTokensTotal: integer("input_tokens_total").notNull(),
  freshInputTokens: integer("fresh_input_tokens").notNull(),
  cacheReadTokens: integer("cache_read_tokens").notNull(),
  cacheWriteTokens: integer("cache_write_tokens").notNull(),
  outputTokensTotal: integer("output_tokens_total").notNull(),
  reasoningOutputTokens: integer("reasoning_output_tokens").notNull(),
  requestCount: integer("request_count").notNull(),
  firstEventAt: text("first_event_at").notNull(),
  lastEventAt: text("last_event_at").notNull(),
  parserVersion: text("parser_version").notNull(),
  coverage: text("coverage").notNull(),
  trustLevel: text("trust_level").notNull().default("collector-checked"),
  quarantined: integer("quarantined", { mode: "boolean" }).notNull().default(false),
  anomalyReason: text("anomaly_reason"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
}, (table) => [
  uniqueIndex("usage_bucket_unique").on(table.userId, table.utcDate, table.source, table.model, table.sessionFingerprint),
]);

export const leaderboardSnapshots = sqliteTable("leaderboard_snapshots", {
  id: text("id").primaryKey(),
  period: text("period").notNull(),
  source: text("source").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  rank: integer("rank").notNull(),
  processedTokens: integer("processed_tokens").notNull(),
  codexTokens: integer("codex_tokens").notNull().default(0),
  claudeTokens: integer("claude_tokens").notNull().default(0),
  workbuddyTokens: integer("workbuddy_tokens").notNull().default(0),
  activeDays: integer("active_days").notNull(),
  percentile: real("percentile").notNull(),
  generatedAt: integer("generated_at", { mode: "timestamp" }).notNull(),
});

export const leaderboardRankHistory = sqliteTable("leaderboard_rank_history", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  period: text("period").notNull(),
  source: text("source").notNull(),
  snapshotDate: text("snapshot_date").notNull(),
  rank: integer("rank").notNull(),
  processedTokens: integer("processed_tokens").notNull(),
  generatedAt: integer("generated_at", { mode: "timestamp" }).notNull(),
}, (table) => [
  uniqueIndex("leaderboard_rank_history_unique").on(table.userId, table.period, table.source, table.snapshotDate),
]);

export const certificates = sqliteTable("certificates", {
  id: text("id").primaryKey(),
  userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
  kind: text("kind").notNull(),
  period: text("period").notNull(),
  processedTokens: integer("processed_tokens").notNull(),
  rank: integer("rank"),
  percentile: real("percentile"),
  coverage: real("coverage").notNull(),
  trustLevel: text("trust_level").notNull(),
  payloadJson: text("payload_json").notNull(),
  payloadHash: text("payload_hash").notNull(),
  signature: text("signature"),
  status: text("status").notNull().default("active"),
  issuedAt: integer("issued_at", { mode: "timestamp" }).notNull(),
  revokedAt: integer("revoked_at", { mode: "timestamp" }),
});

export const achievements = sqliteTable("achievements", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  achievementKey: text("achievement_key").notNull(),
  earnedAt: integer("earned_at", { mode: "timestamp" }).notNull(),
  metadataJson: text("metadata_json"),
}, (table) => [
  uniqueIndex("achievements_user_key_unique").on(table.userId, table.achievementKey),
]);

export const shareEventsDaily = sqliteTable("share_events_daily", {
  utcDate: text("utc_date").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  contentId: text("content_id").notNull(),
  contentKind: text("content_kind").notNull(),
  target: text("target").notNull(),
  event: text("event").notNull(),
  eventCount: integer("event_count").notNull().default(0),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [
  primaryKey({ columns: [table.utcDate, table.userId, table.contentId, table.contentKind, table.target, table.event] }),
]);

export const socialConnections = sqliteTable("social_connections", {
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  providerUserId: text("provider_user_id").notNull(),
  providerUsername: text("provider_username"),
  accessTokenEncrypted: text("access_token_encrypted").notNull(),
  refreshTokenEncrypted: text("refresh_token_encrypted"),
  tokenExpiresAt: integer("token_expires_at"),
  scope: text("scope").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.provider] }),
  uniqueIndex("social_connections_provider_user_idx").on(table.provider, table.providerUserId),
]);

export const socialOauthStates = sqliteTable("social_oauth_states", {
  stateHash: text("state_hash").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  codeVerifierEncrypted: text("code_verifier_encrypted").notNull(),
  returnTo: text("return_to").notNull(),
  expiresAt: integer("expires_at").notNull(),
  createdAt: integer("created_at").notNull(),
});

export const authSchema = { user, session, account, verification };
