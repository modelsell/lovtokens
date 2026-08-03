import { getD1, getRuntimeEnv } from "@/lib/runtime";
import { issueEligibleCertificates } from "@/lib/certificates";
const periods = { today: "date('now')", "7d": "date('now','-6 days')", "30d": "date('now','-29 days')", month: "date('now','start of month')", all: "'0000-01-01'" } as const;
export async function POST(request: Request) {
  const env = await getRuntimeEnv(); if (!env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) return new Response(null, { status: 401 });
  const db = await getD1(); if (!db) return new Response(null, { status: 503 }); const now = Math.floor(Date.now() / 1000);
  for (const [period, start] of Object.entries(periods)) for (const source of ["all", "codex", "claude-code", "workbuddy"]) {
    const filter = source === "all" ? "" : `AND ud.source='${source}'`;
    await db.batch([db.prepare("DELETE FROM leaderboard_snapshots WHERE period=?1 AND source=?2").bind(period, source), db.prepare(`INSERT INTO leaderboard_snapshots (id,period,source,user_id,rank,processed_tokens,codex_tokens,claude_tokens,workbuddy_tokens,active_days,percentile,generated_at)
      SELECT lower(hex(randomblob(16))),?1,?2,user_id,ROW_NUMBER() OVER (ORDER BY total DESC,active_days DESC,first_reached ASC),total,codex,claude,workbuddy,active_days,100.0*ROW_NUMBER() OVER (ORDER BY total DESC,active_days DESC,first_reached ASC)/COUNT(*) OVER (),?3 FROM (
        SELECT ud.user_id,SUM(input_tokens_total+output_tokens_total) total,SUM(CASE WHEN ud.source='codex' THEN input_tokens_total+output_tokens_total ELSE 0 END) codex,SUM(CASE WHEN ud.source='claude-code' THEN input_tokens_total+output_tokens_total ELSE 0 END) claude,SUM(CASE WHEN ud.source='workbuddy' THEN input_tokens_total+output_tokens_total ELSE 0 END) workbuddy,COUNT(DISTINCT utc_date) active_days,MIN(last_event_at) first_reached FROM usage_daily ud JOIN profiles p ON p.user_id=ud.user_id WHERE ud.utc_date>=${start} ${filter} AND ud.quarantined=0 AND p.is_public=1 AND p.show_rank=1 AND ud.trust_level!='imported' GROUP BY ud.user_id
      ) ranked`).bind(period, source, now)]);
    await db.prepare(`INSERT INTO leaderboard_rank_history (id,user_id,period,source,snapshot_date,rank,processed_tokens,generated_at)
      SELECT lower(hex(randomblob(16))),user_id,period,source,date('now'),rank,processed_tokens,generated_at FROM leaderboard_snapshots WHERE period=?1 AND source=?2
      ON CONFLICT(user_id,period,source,snapshot_date) DO UPDATE SET rank=excluded.rank,processed_tokens=excluded.processed_tokens,generated_at=excluded.generated_at`).bind(period, source).run();
  }
  const users = await db.prepare("SELECT DISTINCT user_id FROM usage_daily WHERE quarantined=0").all<{ user_id: string }>();
  for (const user of users.results) await issueEligibleCertificates(user.user_id);
  return Response.json({ ok: true, generatedAt: now });
}
