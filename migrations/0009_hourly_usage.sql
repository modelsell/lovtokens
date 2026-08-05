CREATE TABLE IF NOT EXISTS usage_hourly (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  utc_date TEXT NOT NULL,
  utc_hour INTEGER NOT NULL CHECK(utc_hour BETWEEN 0 AND 23),
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
  UNIQUE(user_id, utc_date, utc_hour, source, model, session_fingerprint)
);

CREATE INDEX IF NOT EXISTS idx_hourly_usage_user_date ON usage_hourly(user_id, utc_date, utc_hour);
CREATE INDEX IF NOT EXISTS idx_hourly_usage_device_date ON usage_hourly(device_id, utc_date);
