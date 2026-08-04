"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useSyncExternalStore } from "react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export type ThemePreference = "system" | "light" | "dark";

const storageKey = "lovtokens-theme";
const themeChangeEvent = "lovtokens-theme-change";

function isThemePreference(value: string | null): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

function resolvedTheme(preference: ThemePreference) {
  return preference === "system"
    ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
    : preference;
}

function applyTheme(preference: ThemePreference) {
  const theme = resolvedTheme(preference);
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.themePreference = preference;
  document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#111411" : "#f1f0ea");
}

function getPreferenceSnapshot(): ThemePreference {
  const saved = localStorage.getItem(storageKey);
  return isThemePreference(saved) ? saved : "system";
}

function subscribeToPreference(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(themeChangeEvent, onStoreChange);
  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(themeChangeEvent, onStoreChange);
  };
}

export function ThemeSwitcher({ locale }: { locale: Locale }) {
  const preference = useSyncExternalStore<ThemePreference>(subscribeToPreference, getPreferenceSnapshot, () => "system");

  useEffect(() => {
    applyTheme(preference);
    if (preference !== "system") return;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = () => applyTheme("system");
    systemTheme.addEventListener("change", handleSystemThemeChange);
    return () => systemTheme.removeEventListener("change", handleSystemThemeChange);
  }, [preference]);

  const selectTheme = (nextPreference: ThemePreference) => {
    localStorage.setItem(storageKey, nextPreference);
    applyTheme(nextPreference);
    window.dispatchEvent(new Event(themeChangeEvent));
  };

  const options = [
    { icon: Monitor, label: t(locale, "Use system theme"), value: "system" as const },
    { icon: Sun, label: t(locale, "Use light theme"), value: "light" as const },
    { icon: Moon, label: t(locale, "Use dark theme"), value: "dark" as const },
  ];

  return <div aria-label={t(locale, "Theme")} className="theme-switcher" role="group">{options.map(({ icon: Icon, label, value }) => <button aria-label={label} aria-pressed={preference === value} key={value} onClick={() => selectTheme(value)} title={label} type="button"><Icon aria-hidden="true" size={14} /></button>)}</div>;
}
