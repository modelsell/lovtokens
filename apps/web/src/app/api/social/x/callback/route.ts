import { getSession } from "@/lib/auth";
import { finishXConnection, XSocialError } from "@/lib/x-social";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const session = await getSession(request.headers);
  if (!session?.user) return Response.redirect(new URL("/login", request.url), 302);
  const state = url.searchParams.get("state") || "";
  const code = url.searchParams.get("code") || "";
  if (!state || !code || url.searchParams.has("error")) return Response.json({ error: "oauth_failed", message: "X authorization was cancelled or incomplete." }, { status: 400 });
  try {
    const returnTo = await finishXConnection(session.user.id, state, code);
    const destination = new URL(returnTo, request.url);
    destination.searchParams.set("x_connected", "1");
    return Response.redirect(destination, 302);
  } catch (error) {
    if (error instanceof XSocialError) return Response.json({ error: error.code, message: error.message }, { status: error.status });
    return Response.json({ error: "oauth_failed", message: "Unable to finish X authorization." }, { status: 500 });
  }
}
