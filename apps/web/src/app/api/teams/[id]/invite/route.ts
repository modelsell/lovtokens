import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { randomToken, sha256 } from "@/lib/crypto";
import { isSameOrigin } from "@/lib/request-security";
import { getD1 } from "@/lib/runtime";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return new Response(null, { status: 403 });
  const session = await getSession(await headers());
  if (!session?.user) return new Response(null, { status: 401 });
  const db = await getD1();
  if (!db) return new Response(null, { status: 503 });
  const inviteCode = randomToken(18);
  const { id } = await params;
  const result = await db.prepare("UPDATE teams SET invite_code_hash=?1,updated_at=?2 WHERE id=?3 AND owner_user_id=?4")
    .bind(await sha256(inviteCode), Math.floor(Date.now() / 1000), id, session.user.id).run();
  if (!result.meta.changes) return new Response(null, { status: 404 });
  return Response.json({ ok: true, inviteCode });
}
