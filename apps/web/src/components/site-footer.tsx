import type { Locale } from "@/lib/i18n";
import { localePath, siteName, t } from "@/lib/i18n";
import { Brand } from "./brand";
import { LanguageSwitcher } from "./language-switcher";
import { LocaleLink } from "./locale-link";

export function SiteFooter({ locale }: { locale: Locale }) {
  const link = (path: string) => localePath(path, locale);
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div><Brand href={link("/")} locale={locale} /><p>{t(locale, "Your AI Token Portfolio. Usage is an activity signal, not a productivity score.")}</p></div>
        <div><strong>{t(locale, "Product")}</strong><LocaleLink href={link("/leaderboard")} locale={locale}>{t(locale, "Leaderboard")}</LocaleLink><LocaleLink href={link("/docs")} locale={locale}>{t(locale, "Collector")}</LocaleLink><LocaleLink href={link("/methodology")} locale={locale}>{t(locale, "Methodology")}</LocaleLink><LocaleLink href={link("/login")} locale={locale}>{t(locale, "Sign in")}</LocaleLink><LocaleLink href={link("/register")} locale={locale}>{t(locale, "Create account")}</LocaleLink></div>
        <div><strong>{t(locale, "Trust")}</strong><LocaleLink href={link("/privacy")} locale={locale}>{t(locale, "Privacy")}</LocaleLink><LocaleLink href={link("/methodology#verification")} locale={locale}>{t(locale, "Verification")}</LocaleLink><a href="https://github.com/modelsell/lovtokens" rel="noreferrer" target="_blank">Source · AGPL-3.0</a><a href="/llms.txt">llms.txt</a></div>
        <div><strong>{t(locale, "Language")}</strong><LanguageSwitcher locale={locale} placement="footer" /></div>
      </div>
      <div className="shell footer-bottom"><span>© 2026 {siteName(locale)}</span><span>{t(locale, "Independent and not affiliated with OpenAI or Anthropic.")}</span></div>
    </footer>
  );
}
