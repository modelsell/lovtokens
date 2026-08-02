PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS user (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  email_verified INTEGER NOT NULL DEFAULT 0,
  image TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS session (
  id TEXT PRIMARY KEY,
  expires_at INTEGER NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_session_user_id ON session(user_id);

CREATE TABLE IF NOT EXISTS account (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at INTEGER,
  refresh_token_expires_at INTEGER,
  scope TEXT,
  password TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_account_user_id ON account(user_id);

CREATE TABLE IF NOT EXISTS verification (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_verification_identifier ON verification(identifier);

CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
  handle TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  is_public INTEGER NOT NULL DEFAULT 0,
  is_anonymous INTEGER NOT NULL DEFAULT 0,
  show_exact_tokens INTEGER NOT NULL DEFAULT 1,
  show_rank INTEGER NOT NULL DEFAULT 1,
  show_avatar INTEGER NOT NULL DEFAULT 1,
  show_models INTEGER NOT NULL DEFAULT 1,
  show_cost INTEGER NOT NULL DEFAULT 0,
  privacy_version INTEGER NOT NULL DEFAULT 1,
  stats_version INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_public_handle ON profiles(is_public, handle);

CREATE TABLE IF NOT EXISTS devices (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active',
  last_synced_at INTEGER,
  created_at INTEGER NOT NULL,
  revoked_at INTEGER
);

CREATE INDEX IF NOT EXISTS idx_devices_user_status ON devices(user_id, status);

CREATE TABLE IF NOT EXISTS device_codes (
  code_hash TEXT PRIMARY KEY,
  user_code TEXT NOT NULL UNIQUE,
  device_name TEXT NOT NULL,
  user_id TEXT REFERENCES user(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  approved_at INTEGER,
  consumed_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_device_codes_expiry ON device_codes(expires_at);

CREATE TABLE IF NOT EXISTS usage_daily (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  utc_date TEXT NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('codex', 'claude-code')),
  model TEXT NOT NULL,
  session_fingerprint TEXT NOT NULL,
  input_tokens_total INTEGER NOT NULL,
  fresh_input_tokens INTEGER NOT NULL,
  cache_read_tokens INTEGER NOT NULL,
  cache_write_tokens INTEGER NOT NULL,
  output_tokens_total INTEGER NOT NULL,
  reasoning_output_tokens INTEGER NOT NULL,
  request_count INTEGER NOT NULL,
  first_event_at TEXT NOT NULL,
  last_event_at TEXT NOT NULL,
  parser_version TEXT NOT NULL,
  coverage TEXT NOT NULL CHECK(coverage IN ('complete', 'partial')),
  trust_level TEXT NOT NULL DEFAULT 'collector-checked',
  quarantined INTEGER NOT NULL DEFAULT 0,
  anomaly_reason TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(user_id, utc_date, source, model, session_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_usage_user_date ON usage_daily(user_id, utc_date);
CREATE INDEX IF NOT EXISTS idx_usage_rank_date_source ON usage_daily(quarantined, utc_date, source, user_id);
CREATE INDEX IF NOT EXISTS idx_usage_session ON usage_daily(session_fingerprint, source);

CREATE TABLE IF NOT EXISTS leaderboard_snapshots (
  id TEXT PRIMARY KEY,
  period TEXT NOT NULL,
  source TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  rank INTEGER NOT NULL,
  processed_tokens INTEGER NOT NULL,
  codex_tokens INTEGER NOT NULL DEFAULT 0,
  claude_tokens INTEGER NOT NULL DEFAULT 0,
  active_days INTEGER NOT NULL,
  percentile REAL NOT NULL,
  generated_at INTEGER NOT NULL,
  UNIQUE(period, source, user_id)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_period_source_rank ON leaderboard_snapshots(period, source, rank);

CREATE TABLE IF NOT EXISTS certificates (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES user(id) ON DELETE SET NULL,
  kind TEXT NOT NULL,
  period TEXT NOT NULL,
  processed_tokens INTEGER NOT NULL,
  rank INTEGER,
  percentile REAL,
  coverage REAL NOT NULL,
  trust_level TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  signature TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  issued_at INTEGER NOT NULL,
  revoked_at INTEGER,
  UNIQUE(user_id, kind, period)
);

CREATE INDEX IF NOT EXISTS idx_certificates_public ON certificates(status, issued_at);

CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  achievement_key TEXT NOT NULL,
  earned_at INTEGER NOT NULL,
  metadata_json TEXT,
  UNIQUE(user_id, achievement_key)
);

PRAGMA optimize;
