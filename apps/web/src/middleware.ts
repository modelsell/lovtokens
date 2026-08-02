import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const chinese = pathname === "/zh" || pathname.startsWith("/zh/");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-lovtokens-locale", chinese ? "zh" : "en");
  requestHeaders.set("x-lovtokens-path", pathname);

  if (!chinese) return NextResponse.next({ request: { headers: requestHeaders } });

  const url = request.nextUrl.clone();
  url.pathname = pathname.slice(3) || "/";
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|sitemaps/|llms.txt).*)"],
};
