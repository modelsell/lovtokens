import { AccountSecurity } from "@/components/account-security";
import { ConnectedSocialAccounts } from "@/components/connected-social-accounts";
import { hasEmailDelivery } from "@/lib/mailer";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { getAccountSecurityInfo } from "@/lib/private-repository";
import { getRuntimeEnv } from "@/lib/runtime";
import { getViewer } from "@/lib/viewer";

export default async function AccountSettingsPage({ searchParams }: { searchParams: Promise<{ verified?: string }> }) {
  const [locale, viewer, env] = await Promise.all([getLocale(), getViewer(), getRuntimeEnv()]);
  if (!viewer) return null;
  const info = await getAccountSecurityInfo(viewer.user.id, viewer.session.id);
  const verified = (await searchParams).verified === "1";
  return <><h1>{t(locale, "Account and security")}</h1><p>{t(locale, "Manage your sign-in identity, password, verification, and active web sessions.")}</p>{verified && <p className="auth-success account-verification-success">{t(locale, "Email verification complete.")}</p>}<AccountSecurity emailDelivery={hasEmailDelivery(env)} initialSessions={info.sessions} locale={locale} providers={info.providers} user={viewer.user} /><ConnectedSocialAccounts initialAccounts={info.socialAccounts} locale={locale} /></>;
}
