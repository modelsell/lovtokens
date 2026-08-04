import { getCertificate } from "@/lib/repository";
import { certificatePreviewKey, certificateStyles } from "@/lib/share-preview";
import { getShareBucket } from "@/lib/runtime";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const certificate = await getCertificate(id);
  if (!certificate?.indexable) return new Response(null, { status: 404 });
  const url = new URL(request.url);
  const locale = url.searchParams.get("lang") === "zh" ? "zh" : "en";
  const requestedStyle = url.searchParams.get("style") || "collector";
  const style = certificateStyles.includes(requestedStyle as (typeof certificateStyles)[number]) ? requestedStyle as (typeof certificateStyles)[number] : "collector";
  const cached = await (await getShareBucket())?.get(certificatePreviewKey(id, certificate.issuedAt, certificate.status, locale, style));
  if (!cached) return Response.redirect(new URL("/share-fallback.png", request.url), 307);
  return new Response(cached.body, { headers: { "content-type": "image/png", "cache-control": "public,max-age=31536000,immutable", etag: cached.httpEtag } });
}
