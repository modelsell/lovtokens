import { headers } from "next/headers";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { ensureProfile } from "@/lib/profile";
import { getD1 } from "@/lib/runtime";

const schema = z.object({ userCode: z.string().regex(/^[A-Z2-9]{4}-[A-Z2-9]{4}$/) });
export async function POST(request: Request) {
  const session = await getSession(await headers()); if (!session?.user) return Response.json({ error: "Sign in required" }, { status: 401 });
  const input = schema.safeParse(await request.json().catch(() => null)); if (!input.success) return Response.json({ error: "Invalid connection code" }, { status: 400 });
  const db = await getD1(); if (!db) return Response.json({ error: "D1 is not configured" }, { status: 503 });
  const now = Math.floor(Date.now() / 1000); const handle = await ensureProfile(session.user);
  const result = await db.prepare("UPDATE device_codes SET user_id=?1,approved_at=?2 WHERE user_code=?3 AND expires_at>=?2 AND approved_at IS NULL").bind(session.user.id, now, input.data.userCode).run();
  if (!result.meta.changes) return Response.json({ error: "Code expired or already approved" }, { status: 409 });
  return Response.json({ ok: true, handle });
}
