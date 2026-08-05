import { z } from "zod";
import { getCertificate } from "@/lib/repository";
import { getD1 } from "@/lib/runtime";

const schema = z.object({
  contentId: z.string().min(1).max(100),
  contentKind: z.enum(["profile", "month", "certificate", "achievement"]),
  target: z.enum(["native", "x", "linkedin", "facebook", "telegram", "whatsapp", "copy-text", "copy-link", "copy-image", "download"]),
  event: z.enum(["modal_open", "target_click", "native_handoff", "landing", "cta_click", "signup"]),
});

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return new Response(null, { status: 403 });
  const input = schema.safeParse(await request.json().catch(() => null));
  if (!input.success) return Response.json({ error: "Invalid share event" }, { status: 400 });
  const db = await getD1();
  if (!db) return new Response(null, { status: 503 });
  const { contentId, contentKind, target, event } = input.data;
  let userId: string | null = null;
  if (contentKind === "certificate") {
    const certificate = await getCertificate(contentId);
    if (!certificate?.indexable || !certificate.userId) return new Response(null, { status: 404 });
    userId = certificate.userId;
  } else {
    const profile = await db.prepare("SELECT user_id FROM profiles WHERE handle=?1 AND is_public=1").bind(contentId).first<{ user_id: string }>();
    userId = profile?.user_id ?? null;
  }
  if (!userId) return new Response(null, { status: 404 });
  const now = Math.floor(Date.now() / 1000);
  await db.prepare(`INSERT INTO share_events_daily (utc_date,user_id,content_id,content_kind,target,event,event_count,updated_at)
    VALUES (date('now'),?1,?2,?3,?4,?5,1,?6)
    ON CONFLICT(utc_date,user_id,content_id,content_kind,target,event)
    DO UPDATE SET event_count=event_count+1,updated_at=excluded.updated_at`).bind(userId, contentId, contentKind, target, event, now).run();
  return Response.json({ ok: true });
}
