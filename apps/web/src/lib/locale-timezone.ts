import type { Locale } from "./i18n";

const localeTimeZones: Record<Locale, { display: string; label: string; offset: string }> = {
  en: { display: "Eastern Time daily cutoff: 19:00 / 20:00 on the previous day (UTC-5 / UTC-4)", label: "Eastern Time", offset: "UTC-5 / UTC-4" },
  zh: { display: "对应北京时间每天早上 08:00（UTC+8）", label: "北京时间", offset: "UTC+8" },
  "zh-tw": { display: "對應台北時間每天早上 08:00（UTC+8）", label: "台北時間", offset: "UTC+8" },
  ja: { display: "日本時間では毎日 09:00（UTC+9）", label: "日本時間", offset: "UTC+9" },
  ko: { display: "한국 표준시 기준 매일 09:00 (UTC+9)", label: "한국 표준시", offset: "UTC+9" },
  es: { display: "Corte diario en hora de Madrid: 01:00 / 02:00 (UTC+1 / UTC+2)", label: "Hora de Madrid", offset: "UTC+1 / UTC+2" },
  fr: { display: "Heure de coupure quotidienne à Paris : 01:00 / 02:00 (UTC+1 / UTC+2)", label: "Heure de Paris", offset: "UTC+1 / UTC+2" },
  de: { display: "Täglicher Stichtag in Berliner Zeit: 01:00 / 02:00 (UTC+1 / UTC+2)", label: "Berliner Zeit", offset: "UTC+1 / UTC+2" },
  "pt-br": { display: "Corte diário no horário de Brasília: 21:00 do dia anterior (UTC-3)", label: "Horário de Brasília", offset: "UTC-3" },
  ru: { display: "Ежедневная граница по московскому времени: 03:00 (UTC+3)", label: "Московское время", offset: "UTC+3" },
};

export function localeTimeZone(locale: Locale) {
  return localeTimeZones[locale];
}

export function formatLocaleTimeZone(locale: Locale) {
  return localeTimeZone(locale).display;
}
