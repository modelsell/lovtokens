import { sha256 } from "@/lib/crypto";
import { getD1 } from "@/lib/runtime";
export async function POST(request: Request) { const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, ""); if (!token) return new Response(null, { status: 401 }); const db = await getD1(); if (!db) return new Response(null, { status: 503 }); const now = Math.floor(Date.now() / 1000); await db.prepare("UPDATE devices SET status='revoked',revoked_at=?1 WHERE token_hash=?2").bind(now, await sha256(token)).run(); return Response.json({ ok: true }); }
