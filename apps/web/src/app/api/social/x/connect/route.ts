import { getSession } from "@/lib/auth";
import { safeReturnTo } from "@/lib/redirect";
import { beginXConnection, XSocialError } from "@/lib/x-social";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = safeReturnTo(url.searchParams.get("return_to") || undefined, "/dashboard");
  const session = await getSession(request.headers);
  if (!session?.user) return Response.redirect(new URL(`/login?returnTo=${encodeURIComponent(returnTo)}`, request.url), 302);
  try {
    return Response.redirect(await beginXConnection(session.user.id, returnTo), 302);
  } catch (error) {
    if (error instanceof XSocialError) return Response.json({ error: error.code, message: error.message }, { status: error.status });
    return Response.json({ error: "oauth_failed", message: "Unable to start X authorization." }, { status: 500 });
  }
}
