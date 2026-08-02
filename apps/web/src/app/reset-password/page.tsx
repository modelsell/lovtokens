import { ResetPasswordForm } from "@/components/reset-password-form";
import { localePath, t } from "@/lib/i18n";
import { getLocale, localizedMetadata } from "@/lib/i18n-server";

export const generateMetadata = () => localizedMetadata({ path: "/reset-password", title: "Reset password", zhTitle: "重置密码", robots: { index: false, follow: false } });

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const locale = await getLocale();
  const { token = "", error } = await searchParams;
  return <section className="page-hero shell auth-page"><span className="eyebrow">{t(locale, "Account recovery")}</span><h1>{t(locale, "Choose a new password.")}</h1><div className="setup-panel">{token && !error ? <ResetPasswordForm locale={locale} token={token} /> : <><p className="auth-error">{t(locale, "This reset link is invalid or expired.")}</p><p className="auth-help"><a href={localePath("/forgot-password", locale)}>{t(locale, "Request a new reset link")}</a></p></>}</div></section>;
}
