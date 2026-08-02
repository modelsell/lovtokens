import { redirect } from "next/navigation";
import { AuthMethodsPanel } from "@/components/auth-methods-panel";
import { resolveAuthMethods } from "@/lib/auth-options";
import { localePath, t } from "@/lib/i18n";
import { getLocale, localizedMetadata } from "@/lib/i18n-server";
import { safeReturnTo } from "@/lib/redirect";
import { getRuntimeEnv, siteUrl } from "@/lib/runtime";
import { getViewer } from "@/lib/viewer";

export const generateMetadata = () => localizedMetadata({ path: "/register", title: "Create account", zhTitle: "注册账号", robots: { index: false, follow: false } });

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const locale = await getLocale();
  const fallback = localePath("/dashboard", locale);
  const callbackURL = safeReturnTo((await searchParams).returnTo, fallback);
  const [viewer, env] = await Promise.all([getViewer(), getRuntimeEnv()]);
  if (viewer) redirect(callbackURL);
  const methods = resolveAuthMethods(env, siteUrl());
  return <section className="page-hero shell auth-page"><span className="eyebrow">{t(locale, "Private by default")}</span><h1>{t(locale, "Create your token portfolio.")}</h1><p>{t(locale, "Create an account, connect your collector, and choose exactly what becomes public.")}</p><div className="setup-panel"><h2>{t(locale, "Create account")}</h2><AuthMethodsPanel callbackURL={callbackURL} emailPassword={methods.emailPassword} github={methods.github} locale={locale} mode="sign-up" standalone /></div></section>;
}
