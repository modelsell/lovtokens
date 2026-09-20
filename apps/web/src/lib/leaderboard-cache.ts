export const LEADERBOARD_PERIODS = ["today", "7d", "30d", "month", "all"] as const;
const SOURCES = ["all", "codex", "claude-code", "workbuddy"] as const;

// Membership is part of the revision, so hiding/deleting a user also invalidates
// ranks. Presentation-only privacy settings are read live from profiles.
export const LEADERBOARD_REVISION_SQL = `SELECT json_group_array(json_array(user_id,stats_version)) data_revision
  FROM (SELECT user_id,stats_version FROM profiles WHERE is_public=1 AND show_rank=1 ORDER BY user_id)`;
export type SnapshotState = {
  period: string; source: string; data_revision: string; range_start: string; history_date: string; generated_at: number;
};

export function rangeStart(period: string, now = new Date()) {
  if (period === "today") return now.toISOString().slice(0, 10);
  if (period === "7d") return new Date(now.getTime() - 6 * 86_400_000).toISOString().slice(0, 10);
  if (period === "30d") return new Date(now.getTime() - 29 * 86_400_000).toISOString().slice(0, 10);
  if (period === "month") return `${now.toISOString().slice(0, 7)}-01`;
  return "0000-01-01";
}

export function isSnapshotCurrent(state: Pick<SnapshotState, "data_revision" | "range_start"> | undefined, revision: string, start: string) {
  return state?.data_revision === revision && state.range_start === start;
}

export async function refreshLeaderboards(db: D1Database, current = new Date()) {
  const now = Math.floor(current.getTime() / 1000);
  const today = current.toISOString().slice(0, 10);
  const [revisionResult, stateResult] = await db.batch<Record<string, unknown>>([
    db.prepare(LEADERBOARD_REVISION_SQL), db.prepare("SELECT * FROM leaderboard_snapshot_state"),
  ]);
  const revision = revisionResult?.results[0]?.data_revision;
  if (typeof revision !== "string" || !stateResult) throw new Error("Missing leaderboard revision/state");
  const states = stateResult.results as SnapshotState[];
  let refreshed = 0;
  for (const period of LEADERBOARD_PERIODS) for (const source of SOURCES) {
    const start = rangeStart(period, current);
    const previous = states.find((row) => row.period === period && row.source === source);
    const rebuild = !isSnapshotCurrent(previous, revision, start);
    if (!rebuild && previous?.history_date === today) continue;
    const statements: D1PreparedStatement[] = [];
    if (rebuild) {
      const filter = source === "all" ? "" : "AND ud.source=?5";
      const insert = db.prepare(`INSERT INTO leaderboard_snapshots (id,period,source,user_id,rank,processed_tokens,codex_tokens,claude_tokens,workbuddy_tokens,active_days,percentile,generated_at)
        SELECT lower(hex(randomblob(16))),?1,?2,user_id,ROW_NUMBER() OVER (ORDER BY total DESC,active_days DESC,first_reached ASC),total,codex,claude,workbuddy,active_days,100.0*ROW_NUMBER() OVER (ORDER BY total DESC,active_days DESC,first_reached ASC)/COUNT(*) OVER (),?3 FROM (
          SELECT ud.user_id,SUM(input_tokens_total+output_tokens_total) total,SUM(CASE WHEN ud.source='codex' THEN input_tokens_total+output_tokens_total ELSE 0 END) codex,SUM(CASE WHEN ud.source='claude-code' THEN input_tokens_total+output_tokens_total ELSE 0 END) claude,SUM(CASE WHEN ud.source='workbuddy' THEN input_tokens_total+output_tokens_total ELSE 0 END) workbuddy,COUNT(DISTINCT utc_date) active_days,MIN(last_event_at) first_reached
          FROM usage_daily ud JOIN profiles p ON p.user_id=ud.user_id
          WHERE ud.utc_date>=?4 ${filter} AND ud.quarantined=0 AND p.is_public=1 AND p.show_rank=1 AND ud.trust_level!='imported' GROUP BY ud.user_id
        ) ranked`);
      statements.push(
        db.prepare("DELETE FROM leaderboard_snapshots WHERE period=?1 AND source=?2").bind(period, source),
        source === "all" ? insert.bind(period, source, now, start) : insert.bind(period, source, now, start, source),
      );
      refreshed++;
    }
    statements.push(
      db.prepare(`INSERT INTO leaderboard_rank_history (id,user_id,period,source,snapshot_date,rank,processed_tokens,generated_at)
        SELECT lower(hex(randomblob(16))),user_id,period,source,?3,rank,processed_tokens,generated_at FROM leaderboard_snapshots WHERE period=?1 AND source=?2
        ON CONFLICT(user_id,period,source,snapshot_date) DO UPDATE SET rank=excluded.rank,processed_tokens=excluded.processed_tokens,generated_at=excluded.generated_at`)
        .bind(period, source, today),
      db.prepare(`INSERT INTO leaderboard_snapshot_state (period,source,data_revision,range_start,history_date,generated_at)
        VALUES (?1,?2,?3,?4,?5,?6) ON CONFLICT(period,source) DO UPDATE SET
        data_revision=excluded.data_revision,range_start=excluded.range_start,history_date=excluded.history_date,generated_at=excluded.generated_at`)
        .bind(period, source, revision, start, today, rebuild ? now : previous!.generated_at),
    );
    // Publish rows, history and metadata atomically, including an empty board.
    // The revision captured BEFORE computing ensures concurrent changes remain dirty.
    await db.batch(statements);
  }
  return refreshed;
}
