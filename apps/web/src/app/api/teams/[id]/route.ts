import { headers } from "next/headers";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { isSameOrigin } from "@/lib/request-security";
import { getD1 } from "@/lib/runtime";

const updateSchema = z.object({
  name: z.string().trim().min(2).max(48).optional(),
  description: z.string().trim().max(160).optional(),
  isPublic: z.boolean().optional(),
}).refine((value) => Object.keys(value).length > 0, "No changes supplied");

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!isSameOrigin(request)) return new Response(null, { status: 403 });
  const session = await getSession(await headers());
  if (!session?.user) return new Response(null, { status: 401 });
  const input = updateSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return Response.json({ error: input.error.issues[0]?.message || "Invalid team settings" }, { status: 400 });
  const db = await getD1();
  if (!db) return new Response(null, { status: 503 });
  const { id } = await params;
  const result = await db.prepare(`UPDATE teams SET name=COALESCE(?1,name),description=COALESCE(?2,description),
    is_public=COALESCE(?3,is_public),updated_at=?4 WHERE id=?5 AND owner_user_id=?6`)
    .bind(input.data.name ?? null, input.data.description ?? null, input.data.isPublic === undefined ? null : input.data.isPublic ? 1 : 0, Math.floor(Date.now() / 1000), id, session.user.id).run();
  if (!result.meta.changes) return new Response(null, { status: 404 });
  return Response.json({ ok: true });
}
