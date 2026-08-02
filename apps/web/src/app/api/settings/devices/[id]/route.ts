import { headers } from "next/headers";
import { getSession } from "@/lib/auth";
import { getD1 } from "@/lib/runtime";
export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) { const s = await getSession(await headers()); if (!s?.user) return new Response(null, { status: 401 }); const { id } = await params; const db = await getD1(); if (!db) return new Response(null, { status: 503 }); await db.prepare("UPDATE devices SET status='revoked',revoked_at=?1 WHERE id=?2 AND user_id=?3").bind(Math.floor(Date.now() / 1000), id, s.user.id).run(); return Response.json({ ok: true }); }
