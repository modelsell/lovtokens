import { getD1, getRuntimeEnv } from "@/lib/runtime";
import { createCertificateIssuer } from "@/lib/certificates";
import { refreshLeaderboards } from "@/lib/leaderboard-cache";

export async function POST(request: Request) {
  const env = await getRuntimeEnv();
  if (!env.CRON_SECRET || request.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) return new Response(null, { status: 401 });
  const db = await getD1();
  if (!db) return new Response(null, { status: 503 });
  const current = new Date();
  const refreshed = await refreshLeaderboards(db, current);
  // Enumerate the small profile table instead of scanning all usage buckets.
  // Each issuer checks the saved data/rule/month version before doing any work.
  const users = await db.prepare("SELECT user_id FROM profiles").all<{ user_id: string }>();
  const issue = createCertificateIssuer(db, env.CERTIFICATE_PRIVATE_JWK, current);
  for (const user of users.results) await issue(user.user_id);
  return Response.json({ ok: true, generatedAt: Math.floor(current.getTime() / 1000), refreshed });
}
