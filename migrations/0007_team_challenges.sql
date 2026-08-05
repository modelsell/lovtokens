CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  owner_user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  is_public INTEGER NOT NULL DEFAULT 0 CHECK(is_public IN (0, 1)),
  invite_code_hash TEXT NOT NULL UNIQUE,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(owner_user_id)
);

CREATE INDEX IF NOT EXISTS idx_teams_public_created ON teams(is_public, created_at DESC);

CREATE TABLE IF NOT EXISTS team_members (
  team_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK(role IN ('owner', 'member')),
  joined_at INTEGER NOT NULL,
  PRIMARY KEY(team_id, user_id),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_team_members_team_joined ON team_members(team_id, joined_at);

PRAGMA optimize;
