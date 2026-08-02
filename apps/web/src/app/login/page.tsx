import { redirect } from "next/navigation";
import { AuthMethodsPanel } from "@/components/auth-methods-panel";
import { resolveAuthMethods } from "@/lib/auth-options";
import { localePath, t } from "@/lib/i18n";
import { getLocale, localizedMetadata } from "@/lib/i18n-server";
import { safeReturnTo } from "@/lib/redirect";
import { getRuntimeEnv, siteUrl } from "@/lib/runtime";
import { getViewer } from "@/lib/viewer";

export const generateMetadata = () => localizedMetadata({ path: "/login", title: "Sign in", zhTitle: "登录", robots: { index: false, follow: false } });

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ returnTo?: string; reset?: string }> }) {
  const locale = await getLocale();
  const fallback = localePath("/dashboard", locale);
  const params = await searchParams;
  const callbackURL = safeReturnTo(params.returnTo, fallback);
  const [viewer, env] = await Promise.all([getViewer(), getRuntimeEnv()]);
  if (viewer) redirect(callbackURL);
  const methods = resolveAuthMethods(env, siteUrl());
  return <section className="page-hero shell auth-page"><span className="eyebrow">{t(locale, "Your LovTokens account")}</span><h1>{t(locale, "Welcome back.")}</h1><p>{t(locale, "Sign in to view your private token portfolio, devices, privacy controls, and public profile.")}</p><div className="setup-panel"><h2>{t(locale, "Sign in")}</h2>{params.reset === "1" && <p className="auth-success">{t(locale, "Password reset complete. Sign in with your new password.")}</p>}<AuthMethodsPanel callbackURL={callbackURL} emailPassword={methods.emailPassword} github={methods.github} locale={locale} mode="sign-in" standalone /><p className="auth-help"><a href={localePath("/forgot-password", locale)}>{t(locale, "Forgot your password?")}</a></p></div></section>;
}
