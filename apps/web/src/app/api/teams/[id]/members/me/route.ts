import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/request-security";
import { getD1 } from "@/lib/runtime";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return new Response(null, { status: 403 });
  const session = await getSession(await headers());
  if (!session?.user) return new Response(null, { status: 401 });
  const db = await getD1();
  if (!db) return new Response(null, { status: 503 });
  const { id } = await params;
  const membership = await db.prepare("SELECT role FROM team_members WHERE team_id=?1 AND user_id=?2").bind(id, session.user.id).first<{ role: string }>();
  if (!membership) return new Response(null, { status: 404 });
  if (membership.role === "owner") return Response.json({ error: "The team owner cannot leave the challenge." }, { status: 409 });
  await db.prepare("DELETE FROM team_members WHERE team_id=?1 AND user_id=?2").bind(id, session.user.id).run();
  return Response.json({ ok: true });
}
