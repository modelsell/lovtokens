import type { Locale } from "@/lib/i18n";
import { localePath, t } from "@/lib/i18n";
import { EmailAuthForm } from "./email-auth-form";
import { GitHubSignIn } from "./github-sign-in";
import { LocaleLink } from "./locale-link";

export function AuthMethodsPanel({ locale, callbackURL, mode, emailPassword, github, standalone = false }: { locale: Locale; callbackURL: string; mode: "sign-in" | "sign-up"; emailPassword: boolean; github: boolean; standalone?: boolean }) {
  const alternatePath = mode === "sign-in" ? "/register" : "/login";
  const alternateLabel = mode === "sign-in" ? "Create an account" : "Sign in to your account";
  const returnQuery = callbackURL !== localePath("/dashboard", locale) ? `?returnTo=${encodeURIComponent(callbackURL)}` : "";
  return <div className="auth-methods">
    {emailPassword && <EmailAuthForm allowModeSwitch={!standalone} callbackURL={callbackURL} initialMode={mode} locale={locale} />}
    {emailPassword && github && <div className="auth-divider"><span>{t(locale, "or")}</span></div>}
    {github && <div className="github-auth"><p>{t(locale, "GitHub proves account ownership only; it does not certify token totals.")}</p><GitHubSignIn callbackURL={callbackURL} locale={locale} /></div>}
    {!emailPassword && !github && <p className="auth-error">{t(locale, "No sign-in method is configured.")}</p>}
    {standalone && <p className="auth-alternate"><LocaleLink href={`${localePath(alternatePath, locale)}${returnQuery}`} locale={locale}>{t(locale, alternateLabel)}</LocaleLink></p>}
  </div>;
}
