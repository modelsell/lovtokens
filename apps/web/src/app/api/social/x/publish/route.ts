import { getSession } from "@/lib/auth";
import { siteUrl } from "@/lib/runtime";
import { validPng } from "@/lib/share-preview";
import { publishPngToX, XSocialError } from "@/lib/x-social";

const maxBytes = 4_000_000;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ error: "forbidden", message: "Cross-origin publishing is not allowed." }, { status: 403 });
  if (Number(request.headers.get("content-length") || 0) > maxBytes + 100_000) return Response.json({ error: "invalid_request", message: "The publishing form is too large." }, { status: 413 });
  const session = await getSession(request.headers);
  if (!session?.user) return Response.json({ error: "unauthorized", message: "Sign in to connect and publish to X." }, { status: 401 });
  let form: FormData;
  try { form = await request.formData(); } catch { return Response.json({ error: "invalid_request", message: "Expected a PNG publishing form." }, { status: 400 }); }
  const image = form.get("image");
  const text = String(form.get("text") || "").trim();
  const sharedUrl = String(form.get("url") || "");
  if (!(image instanceof File) || image.type !== "image/png" || image.size <= 0 || image.size > maxBytes || !text || text.length > 500) return Response.json({ error: "invalid_request", message: "A valid PNG and share copy are required." }, { status: 400 });
  let parsedUrl: URL;
  try { parsedUrl = new URL(sharedUrl); } catch { return Response.json({ error: "invalid_request", message: "The shared URL is invalid." }, { status: 400 }); }
  if (parsedUrl.origin !== new URL(siteUrl()).origin) return Response.json({ error: "invalid_request", message: "Only LovTokens links can be published." }, { status: 400 });
  const bytes = new Uint8Array(await image.arrayBuffer());
  if (!validPng(bytes, 1080, 1350) && !validPng(bytes, 1200, 630)) return Response.json({ error: "invalid_request", message: "The PNG dimensions are not supported." }, { status: 400 });
  try {
    const post = await publishPngToX(session.user.id, bytes, `${text}\n${parsedUrl.toString()}`);
    return Response.json({ ok: true, post });
  } catch (error) {
    if (error instanceof XSocialError) {
      const body: { error: string; message: string; connectUrl?: string } = { error: error.code, message: error.message };
      if (error.code === "not_connected") body.connectUrl = `/api/social/x/connect?return_to=${encodeURIComponent(String(form.get("returnTo") || "/dashboard"))}`;
      return Response.json(body, { status: error.status });
    }
    return Response.json({ error: "publish_failed", message: "Unable to publish the image to X." }, { status: 500 });
  }
}
