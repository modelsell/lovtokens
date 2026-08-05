import { headers } from "next/headers";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { randomToken, sha256 } from "@/lib/crypto";
import { isSameOrigin } from "@/lib/request-security";
import { getD1 } from "@/lib/runtime";

const teamSchema = z.object({
  name: z.string().trim().min(2).max(48),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/),
  description: z.string().trim().max(160).default(""),
  isPublic: z.boolean().default(false),
});

export async function POST(request: Request) {
  if (!isSameOrigin(request)) return new Response(null, { status: 403 });
  const session = await getSession(await headers());
  if (!session?.user) return new Response(null, { status: 401 });
  const input = teamSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return Response.json({ error: input.error.issues[0]?.message || "Invalid team" }, { status: 400 });
  const db = await getD1();
  if (!db) return new Response(null, { status: 503 });

  const existing = await db.prepare("SELECT id FROM team_members WHERE user_id=?1").bind(session.user.id).first();
  if (existing) return Response.json({ error: "You already belong to a team." }, { status: 409 });

  const id = crypto.randomUUID();
  const inviteCode = randomToken(18);
  const inviteCodeHash = await sha256(inviteCode);
  const now = Math.floor(Date.now() / 1000);
  try {
    await db.batch([
      db.prepare("INSERT INTO teams (id,slug,name,description,owner_user_id,is_public,invite_code_hash,created_at,updated_at) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?8)").bind(id, input.data.slug, input.data.name, input.data.description, session.user.id, input.data.isPublic ? 1 : 0, inviteCodeHash, now),
      db.prepare("INSERT INTO team_members (team_id,user_id,role,joined_at) VALUES (?1,?2,'owner',?3)").bind(id, session.user.id, now),
    ]);
  } catch (error) {
    const message = String(error);
    if (message.includes("UNIQUE") || message.includes("constraint")) return Response.json({ error: "That team URL is already in use." }, { status: 409 });
    throw error;
  }
  return Response.json({ ok: true, team: { id, slug: input.data.slug }, inviteCode }, { status: 201 });
}
