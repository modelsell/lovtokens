-- Apply before deploying code that uses the derived-data state tables.
-- Existing rows and signed certificates are untouched. Empty state causes one
-- initial evaluation/refresh. These tables can also remain after a code rollback.
CREATE TABLE certificate_processing_state (
  user_id TEXT PRIMARY KEY REFERENCES profiles(user_id) ON DELETE CASCADE,
  stats_version INTEGER NOT NULL,
  rules_version INTEGER NOT NULL,
  monthly_period TEXT NOT NULL
);

CREATE TABLE leaderboard_snapshot_state (
  period TEXT NOT NULL,
  source TEXT NOT NULL,
  data_revision TEXT NOT NULL,
  range_start TEXT NOT NULL,
  history_date TEXT NOT NULL,
  generated_at INTEGER NOT NULL,
  PRIMARY KEY(period, source)
);

-- Keep versions atomic with every changed usage row, including partial syncs,
-- corrections, quarantine changes and cascaded deletions. Merely updating a
-- timestamp/device does not invalidate derived data. No-op upserts skip writes.
CREATE TRIGGER usage_daily_version_insert AFTER INSERT ON usage_daily
BEGIN
  UPDATE profiles SET stats_version=stats_version+1,updated_at=CAST(strftime('%s','now') AS INTEGER) WHERE user_id=NEW.user_id;
END;
CREATE TRIGGER usage_daily_version_delete AFTER DELETE ON usage_daily
BEGIN
  UPDATE profiles SET stats_version=stats_version+1,updated_at=CAST(strftime('%s','now') AS INTEGER) WHERE user_id=OLD.user_id;
END;
CREATE TRIGGER usage_daily_version_update AFTER UPDATE ON usage_daily
WHEN NEW.user_id IS NOT OLD.user_id
  OR NEW.utc_date IS NOT OLD.utc_date
  OR NEW.source IS NOT OLD.source
  OR NEW.model IS NOT OLD.model
  OR NEW.session_fingerprint IS NOT OLD.session_fingerprint
  OR NEW.input_tokens_total IS NOT OLD.input_tokens_total
  OR NEW.fresh_input_tokens IS NOT OLD.fresh_input_tokens
  OR NEW.cache_read_tokens IS NOT OLD.cache_read_tokens
  OR NEW.cache_write_tokens IS NOT OLD.cache_write_tokens
  OR NEW.output_tokens_total IS NOT OLD.output_tokens_total
  OR NEW.reasoning_output_tokens IS NOT OLD.reasoning_output_tokens
  OR NEW.request_count IS NOT OLD.request_count
  OR NEW.first_event_at IS NOT OLD.first_event_at
  OR NEW.last_event_at IS NOT OLD.last_event_at
  OR NEW.parser_version IS NOT OLD.parser_version
  OR NEW.coverage IS NOT OLD.coverage
  OR NEW.trust_level IS NOT OLD.trust_level
  OR NEW.quarantined IS NOT OLD.quarantined
  OR NEW.anomaly_reason IS NOT OLD.anomaly_reason
BEGIN
  UPDATE profiles SET stats_version=stats_version+1,updated_at=CAST(strftime('%s','now') AS INTEGER) WHERE user_id IN (OLD.user_id,NEW.user_id);
END;

CREATE TRIGGER usage_hourly_version_insert AFTER INSERT ON usage_hourly
BEGIN
  UPDATE profiles SET stats_version=stats_version+1,updated_at=CAST(strftime('%s','now') AS INTEGER) WHERE user_id=NEW.user_id;
END;
CREATE TRIGGER usage_hourly_version_delete AFTER DELETE ON usage_hourly
BEGIN
  UPDATE profiles SET stats_version=stats_version+1,updated_at=CAST(strftime('%s','now') AS INTEGER) WHERE user_id=OLD.user_id;
END;
CREATE TRIGGER usage_hourly_version_update AFTER UPDATE ON usage_hourly
WHEN NEW.user_id IS NOT OLD.user_id
  OR NEW.utc_date IS NOT OLD.utc_date
  OR NEW.source IS NOT OLD.source
  OR NEW.model IS NOT OLD.model
  OR NEW.session_fingerprint IS NOT OLD.session_fingerprint
  OR NEW.input_tokens_total IS NOT OLD.input_tokens_total
  OR NEW.fresh_input_tokens IS NOT OLD.fresh_input_tokens
  OR NEW.cache_read_tokens IS NOT OLD.cache_read_tokens
  OR NEW.cache_write_tokens IS NOT OLD.cache_write_tokens
  OR NEW.output_tokens_total IS NOT OLD.output_tokens_total
  OR NEW.reasoning_output_tokens IS NOT OLD.reasoning_output_tokens
  OR NEW.request_count IS NOT OLD.request_count
  OR NEW.first_event_at IS NOT OLD.first_event_at
  OR NEW.last_event_at IS NOT OLD.last_event_at
  OR NEW.parser_version IS NOT OLD.parser_version
  OR NEW.coverage IS NOT OLD.coverage
  OR NEW.trust_level IS NOT OLD.trust_level
  OR NEW.quarantined IS NOT OLD.quarantined
  OR NEW.anomaly_reason IS NOT OLD.anomaly_reason
  OR NEW.utc_hour IS NOT OLD.utc_hour
BEGIN
  UPDATE profiles SET stats_version=stats_version+1,updated_at=CAST(strftime('%s','now') AS INTEGER) WHERE user_id IN (OLD.user_id,NEW.user_id);
END;
