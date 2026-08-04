"use client";

import { localeOptions, localePath, t, type Locale } from "@/lib/i18n";

const LOCALE_COOKIE = "lovtokens-locale";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function LanguageSwitcher({ locale, placement = "header" }: { locale: Locale; placement?: "header" | "footer" }) {
  function switchLanguage(nextLocale: Locale) {
    document.cookie = `${LOCALE_COOKIE}=${encodeURIComponent(nextLocale)}; Path=/; Max-Age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.assign(localePath(currentUrl, nextLocale));
  }

  return (
    <label className={`language-switch language-switch-${placement}`}>
      <span className="sr-only">{t(locale, "Language")}</span>
      <select aria-label={t(locale, "Language")} onChange={(event) => switchLanguage(event.target.value as Locale)} value={locale}>
        {localeOptions.map((option) => <option key={option.locale} value={option.locale}>{option.label}</option>)}
      </select>
    </label>
  );
}
