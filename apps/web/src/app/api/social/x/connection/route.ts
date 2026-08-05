import { getSession } from "@/lib/auth";
import { disconnectX, XSocialError } from "@/lib/x-social";

export async function DELETE(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return new Response(null, { status: 403 });
  const session = await getSession(request.headers);
  if (!session?.user) return new Response(null, { status: 401 });
  try {
    await disconnectX(session.user.id);
    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof XSocialError) return Response.json({ error: error.code, message: error.message }, { status: error.status });
    return Response.json({ error: "disconnect_failed" }, { status: 500 });
  }
}
