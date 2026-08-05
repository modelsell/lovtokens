import { headers } from "next/headers";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { sha256 } from "@/lib/crypto";
import { isSameOrigin } from "@/lib/request-security";
import { getD1 } from "@/lib/runtime";

const joinSchema = z.object({ inviteCode: z.string().trim().regex(/^[a-f0-9]{36}$/i) });

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return new Response(null, { status: 403 });
  const session = await getSession(await headers());
  if (!session?.user) return new Response(null, { status: 401 });
  const input = joinSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return Response.json({ error: "Invalid invite code." }, { status: 400 });
  const db = await getD1();
  if (!db) return new Response(null, { status: 503 });

  const team = await db.prepare("SELECT id,slug FROM teams WHERE invite_code_hash=?1").bind(await sha256(input.data.inviteCode.toLowerCase())).first<{ id: string; slug: string }>();
  if (!team) return Response.json({ error: "This invite code is invalid or has been replaced." }, { status: 404 });
  const existing = await db.prepare("SELECT team_id FROM team_members WHERE user_id=?1").bind(session.user.id).first<{ team_id: string }>();
  if (existing?.team_id === team.id) return Response.json({ ok: true, team: { id: team.id, slug: team.slug } });
  if (existing) return Response.json({ error: "Leave your current team before joining another one." }, { status: 409 });

  await db.prepare("INSERT INTO team_members (team_id,user_id,role,joined_at) VALUES (?1,?2,'member',?3)").bind(team.id, session.user.id, Math.floor(Date.now() / 1000)).run();
  return Response.json({ ok: true, team: { id: team.id, slug: team.slug } });
}
