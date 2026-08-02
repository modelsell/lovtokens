import { ForgotPasswordForm } from "@/components/forgot-password-form";
import { hasEmailDelivery } from "@/lib/mailer";
import { localePath, t } from "@/lib/i18n";
import { getLocale, localizedMetadata } from "@/lib/i18n-server";
import { getRuntimeEnv } from "@/lib/runtime";

export const generateMetadata = () => localizedMetadata({ path: "/forgot-password", title: "Forgot password", zhTitle: "忘记密码", robots: { index: false, follow: false } });

export default async function ForgotPasswordPage() {
  const [locale, env] = await Promise.all([getLocale(), getRuntimeEnv()]);
  const enabled = hasEmailDelivery(env);
  return <section className="page-hero shell auth-page"><span className="eyebrow">{t(locale, "Account recovery")}</span><h1>{t(locale, "Reset your password.")}</h1><p>{t(locale, "We send a time-limited reset link without revealing whether an account exists.")}</p><div className="setup-panel"><h2>{t(locale, "Password reset")}</h2>{enabled ? <ForgotPasswordForm locale={locale} redirectTo={localePath("/reset-password", locale)} /> : <p className="auth-error">{t(locale, "Password-reset email is not configured in this environment.")}</p>}<p className="auth-help"><a href={localePath("/login", locale)}>{t(locale, "Return to sign in")}</a></p></div></section>;
}
