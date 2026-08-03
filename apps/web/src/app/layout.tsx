import type { Metadata, Viewport } from "next";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { languageAlternates, siteName, t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { siteUrl } from "@/lib/runtime";
import { getViewer } from "@/lib/viewer";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const name = siteName(locale);
  const title = `${name} — ${t(locale, "Your AI Token Portfolio")}`;
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: title, template: `%s · ${name}` },
    description: t(locale, "Privately count Codex, Claude Code, and WorkBuddy tokens, join transparent usage leaderboards, and create shareable AI token certificates."),
    applicationName: name,
    alternates: languageAlternates("/", locale),
    openGraph: { title, description: t(locale, "Count it. Rank it. Share it."), type: "website", siteName: name, locale: locale === "zh" ? "zh_CN" : "en_US" },
    twitter: { card: "summary_large_image" },
    icons: { icon: "/icon.svg" },
  };
}

export const viewport: Viewport = { colorScheme: "light", themeColor: "#f1f0ea", width: "device-width", initialScale: 1 };

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const [locale, viewer] = await Promise.all([getLocale(), getViewer()]);
  return <html data-scroll-behavior="smooth" lang={locale === "zh" ? "zh-CN" : "en"}><body><SiteHeader locale={locale} viewer={viewer} /><main>{children}</main><SiteFooter locale={locale} /></body></html>;
}
