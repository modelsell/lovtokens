import { getSession } from "@/lib/auth";
import { getCertificate } from "@/lib/repository";
import { certificatePreviewKey, certificateStyles, monthlyPreviewKey, profilePreviewKey, shareThemes, validPng } from "@/lib/share-preview";
import { getD1, getShareBucket } from "@/lib/runtime";

const maxBytes = 4_000_000;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return new Response(null, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > maxBytes || request.headers.get("content-type") !== "image/png") return new Response(null, { status: 415 });
  const session = await getSession(request.headers);
  if (!session?.user) return new Response(null, { status: 401 });
  const bucket = await getShareBucket();
  const db = await getD1();
  if (!bucket || !db) return new Response(null, { status: 503 });
  const url = new URL(request.url);
  const kind = url.searchParams.get("kind");
  const id = url.searchParams.get("id") || "";
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (!bytes.length || bytes.length > maxBytes) return new Response(null, { status: 413 });
  let key: string;
  if (kind === "profile") {
    const theme = url.searchParams.get("theme") || "obsidian";
    const variant = url.searchParams.get("variant") === "month" ? "month" : "profile";
    if (!shareThemes.includes(theme as (typeof shareThemes)[number]) || !validPng(bytes, 1200, 630)) return new Response(null, { status: 400 });
    const profile = await db.prepare("SELECT user_id,stats_version,privacy_version FROM profiles WHERE handle=?1 AND is_public=1").bind(id).first<{ user_id: string; stats_version: number; privacy_version: number }>();
    if (!profile || profile.user_id !== session.user.id) return new Response(null, { status: 403 });
    key = variant === "month"
      ? monthlyPreviewKey(id, Number(profile.stats_version), Number(profile.privacy_version), theme as (typeof shareThemes)[number])
      : profilePreviewKey(id, Number(profile.stats_version), Number(profile.privacy_version), theme as (typeof shareThemes)[number]);
  } else if (kind === "certificate") {
    const style = url.searchParams.get("style") || "collector";
    const locale = url.searchParams.get("locale") === "zh" ? "zh" : "en";
    if (!certificateStyles.includes(style as (typeof certificateStyles)[number]) || !validPng(bytes, 1080, 1350)) return new Response(null, { status: 400 });
    const certificate = await getCertificate(id);
    if (!certificate?.indexable || certificate.userId !== session.user.id) return new Response(null, { status: 403 });
    key = certificatePreviewKey(id, certificate.issuedAt, certificate.status, locale, style as (typeof certificateStyles)[number]);
  } else return new Response(null, { status: 400 });
  await bucket.put(key, bytes, { httpMetadata: { contentType: "image/png", cacheControl: "public,max-age=31536000,immutable" } });
  return Response.json({ ok: true }, { status: 201 });
}
