import { Code2, LayoutDashboard, Menu, Settings, UserRound } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { localePath, t } from "@/lib/i18n";
import type { Viewer } from "@/lib/viewer";
import { Brand } from "./brand";
import { LanguageSwitcher } from "./language-switcher";
import { LocaleLink } from "./locale-link";
import { SignOutButton } from "./sign-out-button";
import { ThemeSwitcher } from "./theme-switcher";

export async function SiteHeader({ locale, viewer }: { locale: Locale; viewer: Viewer }) {
  const link = (path: string) => localePath(path, locale);
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Brand href={link("/")} locale={locale} />
        <nav className="desktop-nav" aria-label={t(locale, "Main navigation")}>
          <LocaleLink href={link("/leaderboard")} locale={locale}>{t(locale, "Leaderboard")}</LocaleLink>
          <LocaleLink href={link("/methodology")} locale={locale}>{t(locale, "Methodology")}</LocaleLink>
          <LocaleLink href={link("/docs")} locale={locale}>{t(locale, "Docs")}</LocaleLink>
          <LocaleLink href={link("/blog")} locale={locale}>{t(locale, "Journal")}</LocaleLink>
        </nav>
        <div className="header-actions">
          <ThemeSwitcher locale={locale} />
          <LanguageSwitcher locale={locale} />
          <a aria-label={t(locale, "LovTokens source code on GitHub")} className="icon-link" href="https://github.com/modelsell/lovtokens" rel="noreferrer" target="_blank"><Code2 size={17} /></a>
          {viewer ? <AccountMenu locale={locale} viewer={viewer} /> : <><LocaleLink className="header-login" href={link("/login")} locale={locale}>{t(locale, "Sign in")}</LocaleLink><LocaleLink className="header-cta" href={link("/register")} locale={locale}>{t(locale, "Create account")}</LocaleLink></>}
          <details className="mobile-menu"><summary aria-label={t(locale, "Open menu")}><Menu size={20} /></summary><nav><LocaleLink href={link("/leaderboard")} locale={locale}>{t(locale, "Leaderboard")}</LocaleLink><LocaleLink href={link("/methodology")} locale={locale}>{t(locale, "Methodology")}</LocaleLink><LocaleLink href={link("/docs")} locale={locale}>{t(locale, "Docs")}</LocaleLink><LocaleLink href={link("/blog")} locale={locale}>{t(locale, "Journal")}</LocaleLink>{viewer ? <><LocaleLink href={link("/dashboard")} locale={locale}>{t(locale, "Personal center")}</LocaleLink><LocaleLink href={link("/settings/account")} locale={locale}>{t(locale, "Account and security")}</LocaleLink><SignOutButton className="mobile-sign-out" locale={locale} /></> : <><LocaleLink href={link("/login")} locale={locale}>{t(locale, "Sign in")}</LocaleLink><LocaleLink href={link("/register")} locale={locale}>{t(locale, "Create account")}</LocaleLink></>}</nav></details>
        </div>
      </div>
    </header>
  );
}

function AccountMenu({ locale, viewer }: { locale: Locale; viewer: NonNullable<Viewer> }) {
  const link = (path: string) => localePath(path, locale);
  const initial = (viewer.user.name || viewer.user.email).trim().slice(0, 1).toUpperCase();
  const visibility = viewer.profile?.isPublic ? t(locale, "Public profile") : t(locale, "Private profile");
  return <details className="account-menu"><summary aria-label={t(locale, "Open account menu")}><span className="account-avatar">{initial}</span><span className="account-name">{viewer.user.name}</span></summary><div className="account-popover"><div className="account-identity"><strong>{viewer.user.name}</strong><small>{viewer.user.email}</small><span data-public={viewer.profile?.isPublic || undefined}>{visibility}</span></div><LocaleLink href={link("/dashboard")} locale={locale}><LayoutDashboard size={15} />{t(locale, "Personal center")}</LocaleLink>{viewer.profile?.isPublic && <LocaleLink href={link(`/u/${viewer.profile.handle}`)} locale={locale}><UserRound size={15} />{t(locale, "View public profile")}</LocaleLink>}<LocaleLink href={link("/settings/account")} locale={locale}><Settings size={15} />{t(locale, "Account and security")}</LocaleLink><SignOutButton className="account-sign-out" locale={locale} /></div></details>;
}
