-- Local-only LovTokens development data.
-- Run through `pnpm db:seed:local`; the wrapper always passes Wrangler's --local flag.

PRAGMA foreign_keys = ON;

-- Only replace records owned by this seed. Existing local accounts and data remain intact.
DELETE FROM certificates WHERE user_id LIKE 'seed-user-%';
DELETE FROM user WHERE id LIKE 'seed-user-%';

WITH RECURSIVE numbers(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM numbers WHERE n < 30
)
INSERT INTO user (id, name, email, email_verified, image, created_at, updated_at)
SELECT
  printf('seed-user-%02d', n),
  CASE n
    WHEN 1 THEN '星河架构师'
    WHEN 2 THEN '代码旅人'
    WHEN 3 THEN '缓存炼金师'
    WHEN 4 THEN '深夜构建者'
    WHEN 5 THEN '模型收藏家'
    WHEN 6 THEN 'Prompt 航海家'
    WHEN 7 THEN '匿名开发者'
    WHEN 8 THEN '终端诗人'
    WHEN 9 THEN 'Bug 牧人'
    WHEN 10 THEN '隐私观察员'
    ELSE printf('测试用户 %02d', n)
  END,
  printf('seed%02d@lovtokens.local', n),
  CASE WHEN n % 6 = 0 THEN 0 ELSE 1 END,
  NULL,
  unixepoch('now') - (430 - n) * 86400,
  unixepoch('now') - n
FROM numbers;

WITH RECURSIVE numbers(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM numbers WHERE n < 30
)
INSERT INTO account (
  id, account_id, provider_id, user_id, password, created_at, updated_at
)
SELECT
  printf('seed-account-%02d', n),
  printf('seed-user-%02d', n),
  'credential',
  printf('seed-user-%02d', n),
  '__TEST_PASSWORD_HASH__',
  unixepoch('now') - (430 - n) * 86400,
  unixepoch('now') - n
FROM numbers;

WITH RECURSIVE numbers(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM numbers WHERE n < 30
)
INSERT INTO profiles (
  user_id, handle, display_name, statement, avatar_url, is_public, is_anonymous,
  show_exact_tokens, show_rank, show_avatar, show_models, show_cost,
  privacy_version, stats_version, created_at, updated_at
)
SELECT
  printf('seed-user-%02d', n),
  printf('test-pioneer-%02d', n),
  CASE n
    WHEN 1 THEN '星河架构师'
    WHEN 2 THEN '代码旅人'
    WHEN 3 THEN '缓存炼金师'
    WHEN 4 THEN '深夜构建者'
    WHEN 5 THEN '模型收藏家'
    WHEN 6 THEN 'Prompt 航海家'
    WHEN 7 THEN '匿名开发者'
    WHEN 8 THEN '终端诗人'
    WHEN 9 THEN 'Bug 牧人'
    WHEN 10 THEN '隐私观察员'
    ELSE printf('测试用户 %02d', n)
  END,
  CASE n
    WHEN 1 THEN '工具替我计算，判断仍然属于我。'
    WHEN 2 THEN '慢一点没关系，别停止把想法变成真的。'
    WHEN 3 THEN '能复用的上下文，才是被认真对待过的上下文。'
    WHEN 4 THEN '夜深之后，噪音变少，真正的问题才开始说话。'
    WHEN 5 THEN '模型会更新，好奇心不要过期。'
    WHEN 6 THEN '提示词不是咒语，是把模糊愿望说清楚的练习。'
    WHEN 7 THEN '作品可以被看见，身份不必被消费。'
    WHEN 8 THEN '终端很安静，所以每一次输出都算数。'
    WHEN 9 THEN '我不消灭 Bug，我只是让它们无处藏身。'
    ELSE ''
  END,
  NULL,
  CASE WHEN n % 10 = 0 THEN 0 ELSE 1 END,
  CASE WHEN n % 7 = 0 THEN 1 ELSE 0 END,
  CASE WHEN n % 8 = 0 THEN 0 ELSE 1 END,
  CASE WHEN n % 9 = 0 THEN 0 ELSE 1 END,
  CASE WHEN n % 6 = 0 THEN 0 ELSE 1 END,
  CASE WHEN n % 11 = 0 THEN 0 ELSE 1 END,
  CASE WHEN n % 5 = 0 THEN 1 ELSE 0 END,
  2,
  2,
  unixepoch('now') - (430 - n) * 86400,
  unixepoch('now') - n
FROM numbers;

WITH RECURSIVE numbers(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM numbers WHERE n < 30
)
INSERT INTO devices (
  id, user_id, name, token_hash, status, last_synced_at, created_at, revoked_at
)
SELECT
  printf('seed-device-%02d-main', n),
  printf('seed-user-%02d', n),
  CASE n % 4
    WHEN 0 THEN 'MacBook Pro · Codex'
    WHEN 1 THEN 'Mac Studio · WorkBuddy'
    WHEN 2 THEN 'Linux Workstation · Claude Code'
    ELSE 'MacBook Air · Mixed Agents'
  END,
  printf('seed-token-hash-%02d-main', n),
  CASE WHEN n % 13 = 0 THEN 'revoked' ELSE 'active' END,
  unixepoch('now') - n * 900,
  unixepoch('now') - (400 - n) * 86400,
  CASE WHEN n % 13 = 0 THEN unixepoch('now') - n * 600 ELSE NULL END
FROM numbers;

WITH RECURSIVE numbers(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM numbers WHERE n < 5
)
INSERT INTO devices (
  id, user_id, name, token_hash, status, last_synced_at, created_at, revoked_at
)
SELECT
  printf('seed-device-%02d-secondary', n),
  printf('seed-user-%02d', n),
  'Secondary test machine',
  printf('seed-token-hash-%02d-secondary', n),
  CASE WHEN n = 5 THEN 'revoked' ELSE 'active' END,
  unixepoch('now') - n * 3600,
  unixepoch('now') - 120 * 86400,
  CASE WHEN n = 5 THEN unixepoch('now') - 7 * 86400 ELSE NULL END
FROM numbers;

WITH RECURSIVE
users(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM users WHERE n < 30
),
days(d) AS (
  SELECT 0
  UNION ALL
  SELECT d + 1 FROM days WHERE d < 365
),
slots(s) AS (
  SELECT 0
  UNION ALL
  SELECT s + 1 FROM slots WHERE s < 14
),
activity AS (
  SELECT
    n,
    d,
    s,
    date('now', printf('-%d days', d)) AS utc_date,
    CASE (d + n + s) % 3
      WHEN 0 THEN 'codex'
      WHEN 1 THEN 'claude-code'
      ELSE 'workbuddy'
    END AS source,
    CASE (d * 15 + s + n) % 25
      WHEN 0 THEN 'gpt-5.4'
      WHEN 1 THEN 'gpt-5.3-codex'
      WHEN 2 THEN 'gpt-5.2'
      WHEN 3 THEN 'gpt-5.1-codex-max'
      WHEN 4 THEN 'o3'
      WHEN 5 THEN 'o4-mini'
      WHEN 6 THEN 'claude-opus-4.6'
      WHEN 7 THEN 'claude-sonnet-4.6'
      WHEN 8 THEN 'claude-haiku-4.5'
      WHEN 9 THEN 'gemini-3.1-pro'
      WHEN 10 THEN 'gemini-3-flash'
      WHEN 11 THEN 'deepseek-v3.2'
      WHEN 12 THEN 'qwen3.5-plus'
      WHEN 13 THEN 'kimi-k2.5'
      WHEN 14 THEN 'glm-5'
      WHEN 15 THEN 'minimax-m2.5'
      WHEN 16 THEN 'grok-4.1'
      WHEN 17 THEN 'mistral-large-3'
      WHEN 18 THEN 'llama-4-maverick'
      WHEN 19 THEN 'codex-mini'
      WHEN 20 THEN 'workbuddy-auto'
      WHEN 21 THEN 'gemini-2.5-pro'
      WHEN 22 THEN 'qwen3-coder'
      WHEN 23 THEN 'claude-code-auto'
      ELSE 'gpt-4.1'
    END AS model,
    CASE
      WHEN n = 1 AND d = 0 THEN 166666667
      WHEN n = 1 THEN 26666667
      ELSE (31 - n) * 1200000 + (d % 7) * 50000
    END AS total_tokens
  FROM users
  JOIN days ON d < CASE WHEN n = 1 THEN 366 ELSE 30 + (31 - n) * 8 END
  JOIN slots ON s < CASE WHEN n = 1 THEN 15 ELSE 1 END
)
INSERT INTO usage_daily (
  id, user_id, device_id, utc_date, source, model, session_fingerprint,
  input_tokens_total, fresh_input_tokens, cache_read_tokens, cache_write_tokens,
  output_tokens_total, reasoning_output_tokens, request_count, first_event_at,
  last_event_at, parser_version, coverage, trust_level, quarantined,
  anomaly_reason, created_at, updated_at
)
SELECT
  printf('seed-usage-%02d-%03d-%02d', n, d, s),
  printf('seed-user-%02d', n),
  printf('seed-device-%02d-main', n),
  utc_date,
  source,
  model,
  printf('seed-session-%02d-%03d-%02d', n, d, s),
  CAST(total_tokens * 0.80 AS INTEGER),
  CAST(total_tokens * 0.35 AS INTEGER),
  CAST(total_tokens * 0.35 AS INTEGER),
  CAST(total_tokens * 0.10 AS INTEGER),
  total_tokens - CAST(total_tokens * 0.80 AS INTEGER),
  CAST(total_tokens * 0.04 AS INTEGER),
  8 + ((n + d + s) % 48),
  utc_date || CASE WHEN (n + d + s) % 4 = 0 THEN 'T23:15:00.000Z' ELSE 'T09:15:00.000Z' END,
  utc_date || CASE WHEN (n + d + s) % 4 = 0 THEN 'T23:55:00.000Z' ELSE 'T10:05:00.000Z' END,
  'seed-v2',
  CASE WHEN (n + d) % 11 = 0 THEN 'partial' ELSE 'complete' END,
  'collector-checked',
  CASE WHEN d = 13 AND n % 6 = 0 THEN 1 ELSE 0 END,
  CASE WHEN d = 13 AND n % 6 = 0 THEN 'seeded anomaly for quarantine UI testing' ELSE NULL END,
  unixepoch('now') - d * 86400,
  unixepoch('now') - d * 86400
FROM activity;

INSERT INTO usage_hourly (
  id, user_id, device_id, utc_date, utc_hour, source, model, session_fingerprint,
  input_tokens_total, fresh_input_tokens, cache_read_tokens, cache_write_tokens,
  output_tokens_total, reasoning_output_tokens, request_count, first_event_at,
  last_event_at, parser_version, coverage, trust_level, quarantined,
  anomaly_reason, created_at, updated_at
)
SELECT
  'seed-hourly-' || id,
  user_id,
  device_id,
  utc_date,
  (request_count * 3 + length(model) + CAST(strftime('%w', utc_date) AS INTEGER)) % 24,
  source,
  model,
  session_fingerprint,
  input_tokens_total,
  fresh_input_tokens,
  cache_read_tokens,
  cache_write_tokens,
  output_tokens_total,
  reasoning_output_tokens,
  request_count,
  utc_date || 'T' || printf('%02d', (request_count * 3 + length(model) + CAST(strftime('%w', utc_date) AS INTEGER)) % 24) || ':05:00.000Z',
  utc_date || 'T' || printf('%02d', (request_count * 3 + length(model) + CAST(strftime('%w', utc_date) AS INTEGER)) % 24) || ':55:00.000Z',
  parser_version,
  coverage,
  trust_level,
  quarantined,
  anomaly_reason,
  created_at,
  updated_at
FROM usage_daily
WHERE user_id LIKE 'seed-user-%' AND utc_date >= date('now', '-89 days');

WITH
period_sources(period, source, start_date) AS (
  VALUES
    ('today', 'all', date('now')),
    ('today', 'codex', date('now')),
    ('today', 'claude-code', date('now')),
    ('today', 'workbuddy', date('now')),
    ('7d', 'all', date('now', '-6 days')),
    ('7d', 'codex', date('now', '-6 days')),
    ('7d', 'claude-code', date('now', '-6 days')),
    ('7d', 'workbuddy', date('now', '-6 days')),
    ('30d', 'all', date('now', '-29 days')),
    ('30d', 'codex', date('now', '-29 days')),
    ('30d', 'claude-code', date('now', '-29 days')),
    ('30d', 'workbuddy', date('now', '-29 days')),
    ('month', 'all', date('now', 'start of month')),
    ('month', 'codex', date('now', 'start of month')),
    ('month', 'claude-code', date('now', 'start of month')),
    ('month', 'workbuddy', date('now', 'start of month')),
    ('all', 'all', '0000-01-01'),
    ('all', 'codex', '0000-01-01'),
    ('all', 'claude-code', '0000-01-01'),
    ('all', 'workbuddy', '0000-01-01')
),
totals AS (
  SELECT
    ps.period,
    ps.source AS snapshot_source,
    ud.user_id,
    SUM(ud.input_tokens_total + ud.output_tokens_total) AS processed_tokens,
    SUM(CASE WHEN ud.source = 'codex' THEN ud.input_tokens_total + ud.output_tokens_total ELSE 0 END) AS codex_tokens,
    SUM(CASE WHEN ud.source = 'claude-code' THEN ud.input_tokens_total + ud.output_tokens_total ELSE 0 END) AS claude_tokens,
    SUM(CASE WHEN ud.source = 'workbuddy' THEN ud.input_tokens_total + ud.output_tokens_total ELSE 0 END) AS workbuddy_tokens,
    COUNT(DISTINCT ud.utc_date) AS active_days,
    MIN(ud.last_event_at) AS first_reached
  FROM period_sources ps
  JOIN usage_daily ud
    ON ud.utc_date >= ps.start_date
   AND (ps.source = 'all' OR ud.source = ps.source)
  JOIN profiles p ON p.user_id = ud.user_id
  WHERE ud.user_id LIKE 'seed-user-%'
    AND ud.quarantined = 0
    AND ud.trust_level != 'imported'
    AND p.is_public = 1
    AND p.show_rank = 1
  GROUP BY ps.period, ps.source, ud.user_id
),
ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (
      PARTITION BY period, snapshot_source
      ORDER BY processed_tokens DESC, active_days DESC, first_reached ASC
    ) AS rank,
    COUNT(*) OVER (PARTITION BY period, snapshot_source) AS participant_count
  FROM totals
)
INSERT INTO leaderboard_snapshots (
  id, period, source, user_id, rank, processed_tokens, codex_tokens,
  claude_tokens, workbuddy_tokens, active_days, percentile, generated_at
)
SELECT
  'seed-snapshot-' || period || '-' || snapshot_source || '-' || user_id,
  period,
  snapshot_source,
  user_id,
  rank,
  processed_tokens,
  codex_tokens,
  claude_tokens,
  workbuddy_tokens,
  active_days,
  100.0 * rank / participant_count,
  unixepoch('now')
FROM ranked;

WITH RECURSIVE history_days(d) AS (
  SELECT 0
  UNION ALL
  SELECT d + 1 FROM history_days WHERE d < 29
),
current_month AS (
  SELECT *, (SELECT COUNT(*) FROM leaderboard_snapshots WHERE period = 'month' AND source = 'all') AS participant_count
  FROM leaderboard_snapshots
  WHERE period = 'month' AND source = 'all' AND user_id LIKE 'seed-user-%'
)
INSERT INTO leaderboard_rank_history (
  id, user_id, period, source, snapshot_date, rank, processed_tokens, generated_at
)
SELECT
  printf('seed-history-%s-%02d', user_id, d),
  user_id,
  'month',
  'all',
  date('now', printf('-%d days', d)),
  MAX(1, MIN(participant_count, rank + ((CAST(substr(user_id, -2) AS INTEGER) + d) % 3) - 1)),
  MAX(0, processed_tokens - CAST(processed_tokens * d / 35.0 AS INTEGER)),
  unixepoch('now') - d * 86400
FROM current_month
JOIN history_days;

WITH monthly AS (
  SELECT * FROM leaderboard_snapshots
  WHERE period = 'all' AND source = 'all' AND rank <= 12 AND user_id LIKE 'seed-user-%'
)
INSERT INTO certificates (
  id, user_id, kind, period, processed_tokens, rank, percentile, coverage,
  trust_level, payload_json, payload_hash, signature, status, issued_at, revoked_at
)
SELECT
  'seed-certificate-monthly-' || user_id,
  user_id,
  'monthly',
  strftime('%Y-%m', date('now', 'start of month', '-1 month')),
  processed_tokens,
  rank,
  percentile,
  98.5,
  'collector-checked',
  json_object(
    'schemaVersion', 1,
    'kind', 'monthly',
    'period', strftime('%Y-%m', date('now', 'start of month', '-1 month')),
    'processedTokens', processed_tokens,
    'rank', rank,
    'percentile', percentile,
    'coverage', 98.5,
    'trustLevel', 'collector-checked',
    'issuedAt', unixepoch('now') - 86400
  ),
  'seed-payload-hash-' || user_id,
  NULL,
  CASE WHEN rank = 10 THEN 'revoked' ELSE 'active' END,
  unixepoch('now') - 86400,
  CASE WHEN rank = 10 THEN unixepoch('now') - 3600 ELSE NULL END
FROM monthly;

WITH thresholds(value) AS (
  VALUES (100000000), (1000000000), (10000000000), (50000000000), (100000000000)
),
top_user AS (
  SELECT * FROM leaderboard_snapshots
  WHERE period = 'all' AND source = 'all' AND user_id = 'seed-user-01'
)
INSERT INTO certificates (
  id, user_id, kind, period, processed_tokens, rank, percentile, coverage,
  trust_level, payload_json, payload_hash, signature, status, issued_at, revoked_at
)
SELECT
  'seed-certificate-milestone-' || value,
  user_id,
  'milestone',
  CAST(value AS TEXT),
  value,
  rank,
  percentile,
  100,
  'collector-checked',
  json_object(
    'schemaVersion', 1,
    'kind', 'milestone',
    'period', CAST(value AS TEXT),
    'processedTokens', value,
    'rank', rank,
    'percentile', percentile,
    'coverage', 100,
    'trustLevel', 'collector-checked',
    'issuedAt', unixepoch('now') - value / 1000000
  ),
  'seed-milestone-hash-' || value,
  NULL,
  'active',
  unixepoch('now') - value / 1000000,
  NULL
FROM thresholds
JOIN top_user
WHERE top_user.processed_tokens >= value;

WITH achievement_keys(position, achievement_key) AS (
  VALUES
    (1, 'night-owl'),
    (2, 'dual-agent'),
    (3, 'streak-flame'),
    (4, 'model-explorer'),
    (5, 'cache-wizard'),
    (6, 'weekend-builder'),
    (7, 'deep-dive'),
    (8, 'marathon-builder'),
    (9, 'tri-agent-commander'),
    (10, 'model-museum'),
    (11, 'session-voyager'),
    (12, 'output-forge'),
    (13, 'thirty-day-flame'),
    (14, 'twelve-week-serial'),
    (15, 'hundred-day-expedition'),
    (16, 'daily-supernova'),
    (17, 'cache-mithril'),
    (18, 'cache-legend'),
    (19, 'agent-trinity'),
    (20, 'model-constellation'),
    (21, 'session-odyssey'),
    (22, 'yearkeeper'),
    (23, 'output-star'),
    (24, 'night-sovereign'),
    (25, 'token-cosmos')
),
achievement_users(user_id, max_position) AS (
  VALUES
    ('seed-user-01', 25),
    ('seed-user-02', 15),
    ('seed-user-03', 8),
    ('seed-user-04', 4)
)
INSERT INTO achievements (id, user_id, achievement_key, earned_at, metadata_json)
SELECT
  'seed-achievement-' || au.user_id || '-' || ak.achievement_key,
  au.user_id,
  ak.achievement_key,
  unixepoch('now') - ak.position * 86400,
  json_object('ruleVersion', 2, 'seeded', 1, 'position', ak.position)
FROM achievement_users au
JOIN achievement_keys ak ON ak.position <= au.max_position;

INSERT INTO teams (id, slug, name, description, owner_user_id, is_public, invite_code_hash, created_at, updated_at)
VALUES
  ('seed-team-01', 'nebula-builders', '星云构建者', '跨智能体协作挑战', 'seed-user-01', 1, 'seed-invite-hash-01', unixepoch('now') - 90 * 86400, unixepoch('now')),
  ('seed-team-02', 'terminal-runners', '终端远征队', '连续构建与活跃天数挑战', 'seed-user-07', 1, 'seed-invite-hash-02', unixepoch('now') - 75 * 86400, unixepoch('now')),
  ('seed-team-03', 'cache-alchemists', '缓存炼金术士', '一起探索更高效的 AI 编程', 'seed-user-13', 1, 'seed-invite-hash-03', unixepoch('now') - 60 * 86400, unixepoch('now')),
  ('seed-team-04', 'agent-collective', 'Agent 联盟', 'Codex、Claude Code 与 WorkBuddy 混合挑战', 'seed-user-19', 1, 'seed-invite-hash-04', unixepoch('now') - 45 * 86400, unixepoch('now')),
  ('seed-team-05', 'private-lab', '私密实验室', '仅成员可见的本地隐私测试团队', 'seed-user-25', 0, 'seed-invite-hash-05', unixepoch('now') - 30 * 86400, unixepoch('now'));

WITH RECURSIVE members(n) AS (
  SELECT 1
  UNION ALL
  SELECT n + 1 FROM members WHERE n < 30
)
INSERT INTO team_members (team_id, user_id, role, joined_at)
SELECT
  printf('seed-team-%02d', CAST((n - 1) / 6 AS INTEGER) + 1),
  printf('seed-user-%02d', n),
  CASE WHEN (n - 1) % 6 = 0 THEN 'owner' ELSE 'member' END,
  unixepoch('now') - (40 - ((n - 1) % 6) * 3) * 86400
FROM members;

PRAGMA optimize;
