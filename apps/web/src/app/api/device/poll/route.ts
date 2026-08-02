import { z } from "zod";
import { randomToken, sha256 } from "@/lib/crypto";
import { getD1, siteUrl } from "@/lib/runtime";

const schema = z.object({ deviceCode: z.string().length(64) });
export async function POST(request: Request) {
  const input = schema.safeParse(await request.json().catch(() => null)); if (!input.success) return Response.json({ error: "Invalid device code" }, { status: 400 });
  const db = await getD1(); if (!db) return Response.json({ error: "D1 is not configured" }, { status: 503 });
  const hash = await sha256(input.data.deviceCode); const now = Math.floor(Date.now() / 1000);
  const code = await db.prepare("SELECT dc.*, p.handle FROM device_codes dc LEFT JOIN profiles p ON p.user_id=dc.user_id WHERE dc.code_hash=?1").bind(hash).first<Record<string, unknown>>();
  if (!code || Number(code.expires_at) < now) return Response.json({ error: "Connection expired" }, { status: 410 });
  if (!code.approved_at || !code.user_id) return Response.json({ status: "authorization_pending" }, { status: 428 });
  if (code.consumed_at) return Response.json({ error: "Connection code already used" }, { status: 409 });
  const deviceId = crypto.randomUUID(); const token = randomToken(); const tokenHash = await sha256(token);
  const batch = await db.batch([
    db.prepare("INSERT INTO devices (id,user_id,name,token_hash,status,created_at) SELECT ?1,user_id,device_name,?2,'active',?3 FROM device_codes WHERE code_hash=?4 AND approved_at IS NOT NULL AND consumed_at IS NULL").bind(deviceId, tokenHash, now, hash),
    db.prepare("UPDATE device_codes SET consumed_at=?1 WHERE code_hash=?2 AND consumed_at IS NULL").bind(now, hash),
  ]);
  if (!batch[0]?.meta.changes || !batch[1]?.meta.changes) return Response.json({ error: "Connection code already used" }, { status: 409 });
  return Response.json({ deviceId, token, handle: String(code.handle), profileUrl: `${siteUrl()}/u/${code.handle}` });
}
