import { headers } from "next/headers";
import { CommandCopy } from "@/components/command-copy";
import { DeviceApproval } from "@/components/device-approval";
import { AuthMethodsPanel } from "@/components/auth-methods-panel";
import { getSession } from "@/lib/auth";
import { resolveAuthMethods } from "@/lib/auth-options";
import { localePath, t } from "@/lib/i18n";
import { getLocale, localizedMetadata } from "@/lib/i18n-server";
import { getRuntimeEnv, siteUrl } from "@/lib/runtime";

export const generateMetadata = () => localizedMetadata({ path: "/connect", title: "Connect the LovTokens Collector", zhTitle: "连接 LovTokens 采集器", robots: { index: false, follow: false } });
export default async function ConnectPage({ searchParams }: { searchParams: Promise<{ code?: string }> }) {
  const locale = await getLocale();
  const { code = "" } = await searchParams;
  const [session, env] = await Promise.all([getSession(await headers()), getRuntimeEnv()]);
  const methods = resolveAuthMethods(env, siteUrl());
  const callbackURL = `${localePath("/connect", locale)}?code=${encodeURIComponent(code)}`;

  return (
    <section className="page-hero shell connect-shell">
      <span className="eyebrow">{t(locale, "Secure device connection")}</span>
      <h1>{t(locale, code ? "Approve your collector." : "Start in one command.")}</h1>
      <p>{t(locale, code ? "This one-time code links the CLI to your LovTokens account. Approve only a code shown in your own terminal." : "The CLI opens this page, binds the current device, performs the first privacy-safe scan, and prints exactly what was accepted.")}</p>
      <div className="setup-panel">
        {!code ? (
          <>
            <h2>{t(locale, "Run the collector")}</h2>
            <CommandCopy />
            <p>{t(locale, "Node.js 20 or newer is required. No global install and no API key.")}</p>
          </>
        ) : session?.user ? (
          <>
            <h2>{locale === "zh" ? `已登录：${session.user.name}` : `Signed in as ${session.user.name}`}</h2>
            <DeviceApproval initialCode={code} locale={locale} />
          </>
        ) : (
          <>
            <h2>{locale === "zh" ? `登录以确认 ${code}` : `Sign in to approve ${code}`}</h2>
            <p>{t(locale, "Create an account or sign in, then approve the code shown in your terminal.")}</p>
            <AuthMethodsPanel callbackURL={callbackURL} emailPassword={methods.emailPassword} github={methods.github} locale={locale} mode="sign-in" />
          </>
        )}
      </div>
    </section>
  );
}
