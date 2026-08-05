import "server-only";
import type { TeamDetail, TeamLeaderboardEntry, TeamMemberEntry } from "./data";
import { getD1 } from "./runtime";

const periodStart = (period: string) => {
  const now = new Date();
  if (period === "today") return now.toISOString().slice(0, 10);
  if (period === "7d") return new Date(now.getTime() - 6 * 86_400_000).toISOString().slice(0, 10);
  if (period === "30d") return new Date(now.getTime() - 29 * 86_400_000).toISOString().slice(0, 10);
  if (period === "month") return `${now.toISOString().slice(0, 7)}-01`;
  return "0000-01-01";
};

const sourceCondition = (source: string) => source === "all" ? "" : "AND ud.source=?3";

export async function getTeamLeaderboard(period = "month", source = "all", limit = 100): Promise<TeamLeaderboardEntry[]> {
  const db = await getD1();
  if (!db) return [];
  try {
    const query = `WITH team_totals AS (
      SELECT t.id,t.slug,t.name,t.description,
        COUNT(DISTINCT tm.user_id) member_count,
        COUNT(DISTINCT CASE WHEN ud.user_id IS NOT NULL THEN tm.user_id END) active_members,
        COALESCE(SUM(ud.input_tokens_total+ud.output_tokens_total),0) processed_tokens,
        COUNT(DISTINCT ud.utc_date) active_days,
        COALESCE(SUM(CASE WHEN ud.source='codex' THEN ud.input_tokens_total+ud.output_tokens_total ELSE 0 END),0) codex_tokens,
        COALESCE(SUM(CASE WHEN ud.source='claude-code' THEN ud.input_tokens_total+ud.output_tokens_total ELSE 0 END),0) claude_tokens,
        COALESCE(SUM(CASE WHEN ud.source='workbuddy' THEN ud.input_tokens_total+ud.output_tokens_total ELSE 0 END),0) workbuddy_tokens,
        t.created_at
      FROM teams t JOIN team_members tm ON tm.team_id=t.id
      LEFT JOIN usage_daily ud ON ud.user_id=tm.user_id AND ud.quarantined=0 AND ud.trust_level!='imported'
        AND ud.utc_date>=?1 AND ud.utc_date>=date(tm.joined_at,'unixepoch') ${sourceCondition(source)}
      WHERE t.is_public=1 GROUP BY t.id
    ) SELECT * FROM team_totals WHERE processed_tokens>0
      ORDER BY processed_tokens DESC,active_members DESC,created_at ASC LIMIT ?2`;
    const statement = db.prepare(query);
    const result = source === "all"
      ? await statement.bind(periodStart(period), limit).all<Record<string, unknown>>()
      : await statement.bind(periodStart(period), limit, source).all<Record<string, unknown>>();
    const total = result.results.length;
    return result.results.map((row, index) => ({
      rank: index + 1,
      id: String(row.id),
      slug: String(row.slug),
      name: String(row.name),
      description: String(row.description || ""),
      memberCount: Number(row.member_count),
      activeMembers: Number(row.active_members),
      processedTokens: Number(row.processed_tokens),
      activeDays: Number(row.active_days),
      percentile: total > 1 ? Math.max(0.1, ((index + 1) / total) * 100) : 1,
      codexTokens: Number(row.codex_tokens),
      claudeTokens: Number(row.claude_tokens),
      workbuddyTokens: Number(row.workbuddy_tokens),
    }));
  } catch (error) {
    if (String(error).includes("no such table")) return [];
    throw error;
  }
}

export async function getTeamDetail(slug: string, viewerUserId: string | null, period = "month", source = "all"): Promise<TeamDetail | null> {
  const db = await getD1();
  if (!db) return null;
  try {
    const team = await db.prepare(`SELECT t.*,
      EXISTS(SELECT 1 FROM team_members tm WHERE tm.team_id=t.id AND tm.user_id=?2) is_member
      FROM teams t WHERE t.slug=?1`).bind(slug, viewerUserId).first<Record<string, unknown>>();
    if (!team || (!Boolean(team.is_public) && !Boolean(team.is_member))) return null;

    const query = `SELECT tm.user_id,tm.role,tm.joined_at,p.handle,p.display_name,p.avatar_url,p.is_public,p.is_anonymous,p.show_exact_tokens,p.show_avatar,
      COALESCE(SUM(ud.input_tokens_total+ud.output_tokens_total),0) processed_tokens,
      COUNT(DISTINCT ud.utc_date) active_days,
      COALESCE(SUM(CASE WHEN ud.source='codex' THEN ud.input_tokens_total+ud.output_tokens_total ELSE 0 END),0) codex_tokens,
      COALESCE(SUM(CASE WHEN ud.source='claude-code' THEN ud.input_tokens_total+ud.output_tokens_total ELSE 0 END),0) claude_tokens,
      COALESCE(SUM(CASE WHEN ud.source='workbuddy' THEN ud.input_tokens_total+ud.output_tokens_total ELSE 0 END),0) workbuddy_tokens
      FROM team_members tm JOIN profiles p ON p.user_id=tm.user_id
      LEFT JOIN usage_daily ud ON ud.user_id=tm.user_id AND ud.quarantined=0 AND ud.trust_level!='imported'
        AND ud.utc_date>=?1 AND ud.utc_date>=date(tm.joined_at,'unixepoch') ${sourceCondition(source)}
      WHERE tm.team_id=?2 GROUP BY tm.user_id
      ORDER BY processed_tokens DESC,active_days DESC,tm.joined_at ASC`;
    const statsQuery = `SELECT COUNT(DISTINCT ud.utc_date) active_days
      FROM team_members tm LEFT JOIN usage_daily ud ON ud.user_id=tm.user_id AND ud.quarantined=0 AND ud.trust_level!='imported'
        AND ud.utc_date>=?1 AND ud.utc_date>=date(tm.joined_at,'unixepoch') ${sourceCondition(source)}
      WHERE tm.team_id=?2`;
    const memberStatement = db.prepare(query);
    const statsStatement = db.prepare(statsQuery);
    const [result, stats] = source === "all"
      ? await Promise.all([
        memberStatement.bind(periodStart(period), team.id).all<Record<string, unknown>>(),
        statsStatement.bind(periodStart(period), team.id).first<{ active_days: number }>(),
      ])
      : await Promise.all([
        memberStatement.bind(periodStart(period), team.id, source).all<Record<string, unknown>>(),
        statsStatement.bind(periodStart(period), team.id, source).first<{ active_days: number }>(),
      ]);
    const isMember = Boolean(team.is_member);
    const members: TeamMemberEntry[] = result.results.map((row, index) => {
      const publicIdentity = Boolean(row.is_public) && !Boolean(row.is_anonymous);
      const showExactTokens = isMember || (Boolean(row.is_public) && Boolean(row.show_exact_tokens));
      return {
        rank: index + 1,
        userId: String(row.user_id),
        handle: publicIdentity ? String(row.handle) : null,
        displayName: isMember || publicIdentity ? String(row.display_name) : "Private member",
        avatarUrl: (isMember || publicIdentity) && Boolean(row.show_avatar) && row.avatar_url ? String(row.avatar_url) : null,
        role: row.role === "owner" ? "owner" : "member",
        joinedAt: Number(row.joined_at),
        processedTokens: Number(row.processed_tokens),
        activeDays: Number(row.active_days),
        codexTokens: Number(row.codex_tokens),
        claudeTokens: Number(row.claude_tokens),
        workbuddyTokens: Number(row.workbuddy_tokens),
        showExactTokens,
      };
    });
    return {
      id: String(team.id),
      slug: String(team.slug),
      name: String(team.name),
      description: String(team.description || ""),
      isPublic: Boolean(team.is_public),
      isMember,
      isOwner: String(team.owner_user_id) === viewerUserId,
      createdAt: Number(team.created_at),
      memberCount: members.length,
      activeMembers: members.filter((member) => member.processedTokens > 0).length,
      processedTokens: members.reduce((total, member) => total + member.processedTokens, 0),
      activeDays: Number(stats?.active_days || 0),
      codexTokens: members.reduce((total, member) => total + member.codexTokens, 0),
      claudeTokens: members.reduce((total, member) => total + member.claudeTokens, 0),
      workbuddyTokens: members.reduce((total, member) => total + member.workbuddyTokens, 0),
      members,
    };
  } catch (error) {
    if (String(error).includes("no such table")) return null;
    throw error;
  }
}

export async function getTeamForUser(userId: string) {
  const db = await getD1();
  if (!db) return null;
  try {
    const row = await db.prepare(`SELECT t.id,t.slug,t.name,t.description,t.owner_user_id,t.is_public,t.created_at,tm.role,tm.joined_at,
      (SELECT COUNT(*) FROM team_members members WHERE members.team_id=t.id) member_count
      FROM team_members tm JOIN teams t ON t.id=tm.team_id WHERE tm.user_id=?1`).bind(userId).first<Record<string, unknown>>();
    if (!row) return null;
    return {
      id: String(row.id),
      slug: String(row.slug),
      name: String(row.name),
      description: String(row.description || ""),
      isPublic: Boolean(row.is_public),
      isOwner: String(row.owner_user_id) === userId,
      role: row.role === "owner" ? "owner" as const : "member" as const,
      joinedAt: Number(row.joined_at),
      createdAt: Number(row.created_at),
      memberCount: Number(row.member_count),
    };
  } catch (error) {
    if (String(error).includes("no such table")) return null;
    throw error;
  }
}
