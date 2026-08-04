CREATE TABLE share_events_daily (
  utc_date TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  content_id TEXT NOT NULL,
  content_kind TEXT NOT NULL,
  target TEXT NOT NULL,
  event TEXT NOT NULL,
  event_count INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL,
  PRIMARY KEY (utc_date, user_id, content_id, content_kind, target, event)
);

CREATE INDEX share_events_user_date_idx ON share_events_daily(user_id, utc_date);
