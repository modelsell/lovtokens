import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { CertificateImage } from "@/components/certificate-image";
import { getSession } from "@/lib/auth";
import { verifyPayload } from "@/lib/crypto";
import type { Locale } from "@/lib/i18n";
import { localePath } from "@/lib/i18n";
import { getCertificate } from "@/lib/repository";
import { getRuntimeEnv, siteUrl } from "@/lib/runtime";

export const runtime = "nodejs";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const certificate = await getCertificate(id);
  const session = await getSession(request.headers);
  const publiclyViewable = certificate?.status !== "active" || certificate?.indexable;
  const ownerViewable = Boolean(certificate?.userId && certificate.userId === session?.user.id);
  if (!certificate || (!publiclyViewable && !ownerViewable)) return new Response("Achievement not found", { status: 404 });

  const url = new URL(request.url);
  const locale: Locale = url.searchParams.get("lang") === "zh" ? "zh" : "en";
  const proofUrl = `${siteUrl()}${localePath(`/certificate/${certificate.id}`, locale)}`;
  const qr = await QRCode.toDataURL(proofUrl, { errorCorrectionLevel: "M", margin: 2, width: 220, color: { dark: "#111827", light: "#ffffff" } });
  const env = await getRuntimeEnv();
  const proof = await verifyPayload(certificate.payloadJson, certificate.payloadHash, certificate.signature, env.CERTIFICATE_PRIVATE_JWK);
  const response = new ImageResponse(<CertificateImage certificate={certificate} locale={locale} proof={proof} qr={qr} />, { height: 1350, width: 1080 });
  const bytes = await response.arrayBuffer();
  const filename = `lovtokens-achievement-${certificate.id.replace(/[^a-zA-Z0-9_-]/g, "-")}.png`;
  const download = url.searchParams.get("download") === "1";

  return new Response(bytes, { headers: {
    "cache-control": publiclyViewable ? "public,max-age=86400,stale-while-revalidate=604800" : "private,no-store",
    "content-disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
    "content-type": "image/png",
  } });
}
