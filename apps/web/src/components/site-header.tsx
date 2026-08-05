import { LayoutDashboard, Menu, Settings, Star, UserRound } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { localePath, t } from "@/lib/i18n";
import { getGitHubStarCount } from "@/lib/github";
import type { Viewer } from "@/lib/viewer";
import { Brand } from "./brand";
import { LanguageSwitcher } from "./language-switcher";
import { LocaleLink } from "./locale-link";
import { SignOutButton } from "./sign-out-button";
import { ThemeSwitcher } from "./theme-switcher";

export async function SiteHeader({ locale, viewer }: { locale: Locale; viewer: Viewer }) {
  const link = (path: string) => localePath(path, locale);
  const githubStars = await getGitHubStarCount();
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Brand href={link("/")} locale={locale} />
        <nav className="desktop-nav" aria-label={t(locale, "Main navigation")}>
          <LocaleLink href={link("/leaderboard")} locale={locale}>{t(locale, "Leaderboard")}</LocaleLink>
          <LocaleLink href={link("/teams")} locale={locale}>{t(locale, "Teams")}</LocaleLink>
          <LocaleLink href={link("/methodology")} locale={locale}>{t(locale, "Methodology")}</LocaleLink>
          <LocaleLink href={link("/docs")} locale={locale}>{t(locale, "Docs")}</LocaleLink>
          <LocaleLink href={link("/privacy")} locale={locale}>{t(locale, "Privacy contract")}</LocaleLink>
        </nav>
        <div className="header-actions">
          <ThemeSwitcher locale={locale} />
          <LanguageSwitcher locale={locale} />
          <a aria-label={`${t(locale, "LovTokens source code on GitHub")} · ${githubStars ?? "—"} Stars`} className="github-repo-link" href="https://github.com/modelsell/lovtokens" rel="noreferrer" target="_blank"><GitHubMark /><span className="github-star-count"><Star aria-hidden="true" fill="currentColor" size={11} />{githubStars ?? "—"}</span></a>
          {viewer ? <AccountMenu locale={locale} viewer={viewer} /> : <><LocaleLink className="header-login" href={link("/login")} locale={locale}>{t(locale, "Sign in")}</LocaleLink><LocaleLink className="header-cta" href={link("/register")} locale={locale}>{t(locale, "Create account")}</LocaleLink></>}
          <details className="mobile-menu"><summary aria-label={t(locale, "Open menu")}><Menu size={20} /></summary><nav><LocaleLink href={link("/leaderboard")} locale={locale}>{t(locale, "Leaderboard")}</LocaleLink><LocaleLink href={link("/teams")} locale={locale}>{t(locale, "Teams")}</LocaleLink><LocaleLink href={link("/methodology")} locale={locale}>{t(locale, "Methodology")}</LocaleLink><LocaleLink href={link("/docs")} locale={locale}>{t(locale, "Docs")}</LocaleLink><LocaleLink href={link("/privacy")} locale={locale}>{t(locale, "Privacy contract")}</LocaleLink>{viewer ? <><LocaleLink href={link("/dashboard")} locale={locale}>{t(locale, "Personal center")}</LocaleLink><LocaleLink href={link("/settings/account")} locale={locale}>{t(locale, "Account and security")}</LocaleLink><SignOutButton className="mobile-sign-out" locale={locale} /></> : <><LocaleLink href={link("/login")} locale={locale}>{t(locale, "Sign in")}</LocaleLink><LocaleLink href={link("/register")} locale={locale}>{t(locale, "Create account")}</LocaleLink></>}</nav></details>
        </div>
      </div>
    </header>
  );
}

function GitHubMark() {
  return <svg aria-hidden="true" height="18" viewBox="0 0 16 16" width="18"><path d="M8 0C3.58 0 0 3.64 0 8.13c0 3.59 2.29 6.64 5.47 7.72.4.08.55-.18.55-.39 0-.19-.01-.83-.01-1.5-2.01.38-2.53-.5-2.69-.96-.09-.23-.48-.96-.82-1.15-.28-.15-.68-.53-.01-.54.63-.01 1.08.59 1.23.83.72 1.23 1.87.88 2.33.67.07-.53.28-.88.51-1.08-1.78-.21-3.64-.91-3.64-4.02 0-.89.31-1.62.82-2.19-.08-.21-.36-1.04.08-2.16 0 0 .67-.22 2.2.84A7.4 7.4 0 0 1 8 3.95c.68 0 1.36.09 2 .27 1.53-1.06 2.2-.84 2.2-.84.44 1.12.16 1.95.08 2.16.51.57.82 1.3.82 2.19 0 3.12-1.87 3.81-3.65 4.02.29.25.54.74.54 1.51 0 1.09-.01 1.97-.01 2.24 0 .22.15.47.55.39A8.1 8.1 0 0 0 16 8.13C16 3.64 12.42 0 8 0Z" fill="currentColor" /></svg>;
}

function AccountMenu({ locale, viewer }: { locale: Locale; viewer: NonNullable<Viewer> }) {
  const link = (path: string) => localePath(path, locale);
  const initial = (viewer.user.name || viewer.user.email).trim().slice(0, 1).toUpperCase();
  const visibility = viewer.profile?.isPublic ? t(locale, "Public profile") : t(locale, "Private profile");
  return <details className="account-menu"><summary aria-label={t(locale, "Open account menu")}><span className="account-avatar">{initial}</span><span className="account-name">{viewer.user.name}</span></summary><div className="account-popover"><div className="account-identity"><strong>{viewer.user.name}</strong><small>{viewer.user.email}</small><span data-public={viewer.profile?.isPublic || undefined}>{visibility}</span></div><LocaleLink href={link("/dashboard")} locale={locale}><LayoutDashboard size={15} />{t(locale, "Personal center")}</LocaleLink>{viewer.profile?.isPublic && <LocaleLink href={link(`/u/${viewer.profile.handle}`)} locale={locale}><UserRound size={15} />{t(locale, "View public profile")}</LocaleLink>}<LocaleLink href={link("/settings/account")} locale={locale}><Settings size={15} />{t(locale, "Account and security")}</LocaleLink><SignOutButton className="account-sign-out" locale={locale} /></div></details>;
}
