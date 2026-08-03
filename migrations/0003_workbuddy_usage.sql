PRAGMA defer_foreign_keys = ON;

CREATE TABLE usage_daily_workbuddy (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  utc_date TEXT NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('codex', 'claude-code', 'workbuddy')),
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

INSERT INTO usage_daily_workbuddy (
  id,user_id,device_id,utc_date,source,model,session_fingerprint,
  input_tokens_total,fresh_input_tokens,cache_read_tokens,cache_write_tokens,
  output_tokens_total,reasoning_output_tokens,request_count,first_event_at,last_event_at,
  parser_version,coverage,trust_level,quarantined,anomaly_reason,created_at,updated_at
)
SELECT
  id,user_id,device_id,utc_date,source,model,session_fingerprint,
  input_tokens_total,fresh_input_tokens,cache_read_tokens,cache_write_tokens,
  output_tokens_total,reasoning_output_tokens,request_count,first_event_at,last_event_at,
  parser_version,coverage,trust_level,quarantined,anomaly_reason,created_at,updated_at
FROM usage_daily;

DROP TABLE usage_daily;
ALTER TABLE usage_daily_workbuddy RENAME TO usage_daily;

CREATE INDEX idx_usage_user_date ON usage_daily(user_id, utc_date);
CREATE INDEX idx_usage_rank_date_source ON usage_daily(quarantined, utc_date, source, user_id);
CREATE INDEX idx_usage_session ON usage_daily(session_fingerprint, source);

ALTER TABLE leaderboard_snapshots ADD COLUMN workbuddy_tokens INTEGER NOT NULL DEFAULT 0;
