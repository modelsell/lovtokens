import { syncPayloadV1Schema, processedTokens } from "@lovtokens/token-schema";
import { sha256 } from "@/lib/crypto";
import { getD1, siteUrl } from "@/lib/runtime";
import { issueEligibleCertificates } from "@/lib/certificates";

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, ""); if (!token) return Response.json({ error: "Missing device token" }, { status: 401 });
  const raw = await request.text(); if (raw.length > 1_000_000) return Response.json({ error: "Payload too large" }, { status: 413 });
  let json: unknown; try { json = JSON.parse(raw); } catch { return Response.json({ error: "Invalid JSON" }, { status: 400 }); }
  const input = syncPayloadV1Schema.safeParse(json); if (!input.success) return Response.json({ error: "Invalid sync payload", issues: input.error.issues.slice(0, 5) }, { status: 400 });
  const db = await getD1(); if (!db) return Response.json({ error: "D1 is not configured" }, { status: 503 });
  const device = await db.prepare("SELECT d.id,d.user_id,d.last_synced_at,p.handle,p.is_public FROM devices d JOIN profiles p ON p.user_id=d.user_id WHERE d.token_hash=?1 AND d.status='active'").bind(await sha256(token)).first<{ id: string; user_id: string; handle: string; is_public: number; last_synced_at: number | null }>();
  if (!device || device.id !== input.data.deviceId) return Response.json({ error: "Invalid or revoked device" }, { status: 401 });
  const now = Math.floor(Date.now() / 1000); if (device.last_synced_at && now - device.last_synced_at < 2) return Response.json({ error: "Syncing too frequently" }, { status: 429, headers: { "retry-after": "2" } });
  const baselineRow = await db.prepare("SELECT AVG(total) baseline FROM (SELECT utc_date,SUM(input_tokens_total+output_tokens_total) total FROM usage_daily WHERE user_id=?1 AND quarantined=0 AND utc_date>=date('now','-30 days') GROUP BY utc_date)").bind(device.user_id).first<{ baseline: number | null }>();
  const incomingByDate = new Map<string, number>(); for (const bucket of input.data.buckets) incomingByDate.set(bucket.utcDate, (incomingByDate.get(bucket.utcDate) || 0) + processedTokens(bucket));
  const abnormalDates = new Set<string>(); const baseline = Number(baselineRow?.baseline || 0); if (baseline > 0) for (const [date, total] of incomingByDate) if (total > Math.max(100_000_000, baseline * 8)) abnormalDates.add(date);
  let quarantined = 0;
  const statements = input.data.buckets.map((bucket) => {
    const anomaly = abnormalDates.has(bucket.utcDate) ? "abnormal-daily-growth" : detectAnomaly(bucket.utcDate, processedTokens(bucket), bucket.firstEventAt, bucket.lastEventAt); if (anomaly) quarantined += 1;
    return db.prepare(`INSERT INTO usage_daily (id,user_id,device_id,utc_date,source,model,session_fingerprint,input_tokens_total,fresh_input_tokens,cache_read_tokens,cache_write_tokens,output_tokens_total,reasoning_output_tokens,request_count,first_event_at,last_event_at,parser_version,coverage,trust_level,quarantined,anomaly_reason,created_at,updated_at)
      VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,'collector-checked',?19,?20,?21,?21)
      ON CONFLICT(user_id,utc_date,source,model,session_fingerprint) DO UPDATE SET device_id=excluded.device_id,input_tokens_total=excluded.input_tokens_total,fresh_input_tokens=excluded.fresh_input_tokens,cache_read_tokens=excluded.cache_read_tokens,cache_write_tokens=excluded.cache_write_tokens,output_tokens_total=excluded.output_tokens_total,reasoning_output_tokens=excluded.reasoning_output_tokens,request_count=excluded.request_count,first_event_at=excluded.first_event_at,last_event_at=excluded.last_event_at,parser_version=excluded.parser_version,coverage=excluded.coverage,quarantined=excluded.quarantined,anomaly_reason=excluded.anomaly_reason,updated_at=excluded.updated_at`)
      .bind(crypto.randomUUID(), device.user_id, device.id, bucket.utcDate, bucket.source, bucket.model, bucket.sessionFingerprint, bucket.inputTokensTotal, bucket.freshInputTokens, bucket.cacheReadTokens, bucket.cacheWriteTokens, bucket.outputTokensTotal, bucket.reasoningOutputTokens, bucket.requestCount, bucket.firstEventAt, bucket.lastEventAt, bucket.parserVersion, bucket.coverage, anomaly ? 1 : 0, anomaly, now);
  });
  const chunks = chunk(statements, 80); for (const part of chunks) await db.batch(part);
  await db.batch([db.prepare("UPDATE devices SET last_synced_at=?1 WHERE id=?2").bind(now, device.id), db.prepare("UPDATE profiles SET stats_version=stats_version+1,updated_at=?1 WHERE user_id=?2").bind(now, device.user_id)]);
  await issueEligibleCertificates(device.user_id);
  const visibility = device.is_public ? "public" : "private";
  return Response.json({
    accepted: input.data.buckets.length - quarantined,
    quarantined,
    visibility,
    profileUrl: device.is_public ? `${siteUrl()}/u/${device.handle}` : undefined,
    privacySettingsUrl: `${siteUrl()}/settings/privacy`,
  });
}

function detectAnomaly(date: string, total: number, first: string, last: string) { const today = new Date().toISOString().slice(0, 10); const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10); if (date > tomorrow) return "future-date"; if (total > 10_000_000_000) return "bucket-over-10b"; if (new Date(last) < new Date(first)) return "reversed-time-range"; if (date > today && new Date(last).getTime() > Date.now() + 15 * 60_000) return "future-event"; return null; }
function chunk<T>(items: T[], size: number) { return Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size)); }
