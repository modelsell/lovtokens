const moduleUtcDate = new Date().toISOString().slice(0, 10);

import type { Locale } from "@/lib/i18n";

export function Heatmap({ history, locale = "en" }: { history: Array<{ date: string; tokens: number }>; locale?: Locale }) {
  const byDate = new Map(history.map((item) => [item.date, item.tokens]));
  const max = Math.max(1, ...history.map((item) => item.tokens));
  const days = Array.from({ length: 84 }, (_, index) => {
    const date = new Date(`${moduleUtcDate}T00:00:00.000Z`);
    date.setUTCDate(date.getUTCDate() - (83 - index));
    const dateKey = date.toISOString().slice(0, 10);
    const value = byDate.get(dateKey) || 0;
    return { date: dateKey, value, level: value === 0 ? 0 : Math.max(1, Math.ceil((value / max) * 4)) };
  });
  return <div className="heatmap" aria-label={locale === "zh" ? "84 天 Token 活动" : "84 day token activity"}>{days.map((day) => <i data-level={day.level} key={day.date} title={`${day.date}: ${day.value.toLocaleString()} ${locale === "zh" ? "Token" : "tokens"}`} />)}</div>;
}
