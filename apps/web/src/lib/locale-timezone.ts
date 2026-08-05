import { localeDetails, type Locale } from "./i18n";

const localeTimeZones: Record<Locale, { label: string; timeZone: string }> = {
  en: { label: "Eastern Time", timeZone: "America/New_York" },
  zh: { label: "北京时间", timeZone: "Asia/Shanghai" },
  "zh-tw": { label: "台北時間", timeZone: "Asia/Taipei" },
  ja: { label: "日本時間", timeZone: "Asia/Tokyo" },
  ko: { label: "한국 표준시", timeZone: "Asia/Seoul" },
  es: { label: "Hora de Madrid", timeZone: "Europe/Madrid" },
  fr: { label: "Heure de Paris", timeZone: "Europe/Paris" },
  de: { label: "Berliner Zeit", timeZone: "Europe/Berlin" },
  "pt-br": { label: "Horário de Brasília", timeZone: "America/Sao_Paulo" },
  ru: { label: "Московское время", timeZone: "Europe/Moscow" },
};

export function localeTimeZone(locale: Locale) {
  return localeTimeZones[locale];
}

export function formatLocaleTimeZone(locale: Locale, date: Date) {
  const config = localeTimeZone(locale);
  const formattedTime = new Intl.DateTimeFormat(localeDetails(locale).htmlLang, {
    day: "numeric",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "short",
    timeZone: config.timeZone,
  }).format(date);
  const offsetPart = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    timeZone: config.timeZone,
    timeZoneName: "longOffset",
  }).formatToParts(date).find((part) => part.type === "timeZoneName")?.value || "GMT";
  const offset = offsetPart.replace("GMT", "UTC").replace(/:00$/, "").replace(/^UTC([+-])0/, "UTC$1");

  return locale === "zh" || locale === "zh-tw"
    ? `${config.label}：${formattedTime}（${offset}）`
    : `${config.label}: ${formattedTime} (${offset})`;
}
