import { NextResponse, type NextRequest } from "next/server";
import { localeFromPath, localePath, resolveLocale, type Locale } from "@/lib/i18n";

export const LOCALE_COOKIE = "lovtokens-locale";

export function detectRequestLocale(request: NextRequest): Locale {
  const pathLocale = localeFromPath(request.nextUrl.pathname);
  if (pathLocale) return pathLocale;

  const savedLocale = resolveLocale(request.cookies.get(LOCALE_COOKIE)?.value);
  if (savedLocale) return savedLocale;

  const acceptedLanguages = (request.headers.get("accept-language")?.split(",") ?? [])
    .map((accepted, index) => {
      const [language = "", ...parameters] = accepted.trim().split(";");
      const qualityParameter = parameters.find((parameter) => parameter.trim().startsWith("q="));
      const quality = qualityParameter ? Number.parseFloat(qualityParameter.split("=")[1] ?? "0") : 1;
      return { language, quality: Number.isFinite(quality) ? quality : 0, index };
    })
    .filter(({ quality }) => quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);
  for (const accepted of acceptedLanguages) {
    const locale = resolveLocale(accepted.language);
    if (locale) return locale;
  }
  return "en";
}

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const pathLocale = localeFromPath(pathname);
  const locale = detectRequestLocale(request);

  if (!pathLocale && locale !== "en") {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = localePath(pathname, locale);
    return NextResponse.redirect(redirectUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-lovtokens-locale", pathLocale ?? "en");
  requestHeaders.set("x-lovtokens-path", pathname);

  if (!pathLocale) return NextResponse.next({ request: { headers: requestHeaders } });

  const url = request.nextUrl.clone();
  url.pathname = localePath(pathname, "en");
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|robots.txt|sitemap.xml|sitemaps/|llms.txt).*)"],
};
