import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { getD1 } from "@/lib/runtime";
import { isSameOrigin } from "@/lib/request-security";

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) return new Response(null, { status: 403 });
  const session = await getSession(await headers());
  if (!session?.user) return new Response(null, { status: 401 });
  const db = await getD1(); if (!db) return new Response(null, { status: 503 });
  const result = await db.prepare("DELETE FROM session WHERE user_id=?1 AND id!=?2").bind(session.user.id, session.session.id).run();
  return Response.json({ ok: true, revoked: result.meta.changes || 0 });
}
