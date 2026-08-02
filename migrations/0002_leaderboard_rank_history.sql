CREATE TABLE IF NOT EXISTS leaderboard_rank_history (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  period TEXT NOT NULL,
  source TEXT NOT NULL,
  snapshot_date TEXT NOT NULL,
  rank INTEGER NOT NULL,
  processed_tokens INTEGER NOT NULL,
  generated_at INTEGER NOT NULL,
  UNIQUE(user_id, period, source, snapshot_date)
);

CREATE INDEX IF NOT EXISTS idx_rank_history_user_date ON leaderboard_rank_history(user_id, period, source, snapshot_date DESC);
