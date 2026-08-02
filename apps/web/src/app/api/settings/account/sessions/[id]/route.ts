import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { getD1 } from "@/lib/runtime";
import { isSameOrigin } from "@/lib/request-security";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return new Response(null, { status: 403 });
  const session = await getSession(await headers());
  if (!session?.user) return new Response(null, { status: 401 });
  const { id } = await params;
  if (id === session.session.id) return Response.json({ error: "Use sign out for the current session." }, { status: 409 });
  const db = await getD1(); if (!db) return new Response(null, { status: 503 });
  const result = await db.prepare("DELETE FROM session WHERE id=?1 AND user_id=?2").bind(id, session.user.id).run();
  if (!result.meta.changes) return Response.json({ error: "Session not found." }, { status: 404 });
  return Response.json({ ok: true });
}
