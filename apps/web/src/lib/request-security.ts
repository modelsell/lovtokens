export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const originURL = new URL(origin);
    const forwardedHost = request.headers.get("x-forwarded-host") || request.headers.get("host") || new URL(request.url).host;
    return originURL.host === forwardedHost;
  } catch {
    return false;
  }
}
