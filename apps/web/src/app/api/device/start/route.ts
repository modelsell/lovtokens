import { z } from "zod";
import { randomToken, randomUserCode, sha256 } from "@/lib/crypto";
import { getD1, siteUrl } from "@/lib/runtime";

const inputSchema = z.object({ name: z.string().trim().min(1).max(80) });
export async function POST(request: Request) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null)); if (!parsed.success) return Response.json({ error: "Invalid device name" }, { status: 400 });
  const db = await getD1(); if (!db) return Response.json({ error: "D1 is not configured" }, { status: 503 });
  const deviceCode = randomToken(); const userCode = randomUserCode(); const now = Math.floor(Date.now() / 1000);
  await db.prepare("INSERT INTO device_codes (code_hash,user_code,device_name,expires_at,created_at) VALUES (?1,?2,?3,?4,?5)").bind(await sha256(deviceCode), userCode, parsed.data.name, now + 600, now).run();
  return Response.json({ deviceCode, userCode, verificationUri: `${siteUrl()}/connect?code=${encodeURIComponent(userCode)}`, interval: 3, expiresIn: 600 });
}
