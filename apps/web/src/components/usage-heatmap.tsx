"use client";

import { useMemo, useState } from "react";
import { formatTokenCount } from "@/lib/format";
import type { Locale } from "@/lib/i18n";

type DailyUsage = { date: string; tokens: number };
type ViewMode = "daily" | "weekly" | "cumulative";

const dayMs = 86_400_000;
const utcDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/;

function dateKey(time: number) {
  return new Date(time).toISOString().slice(0, 10);
}

function mondayOffset(time: number) {
  return (new Date(time).getUTCDay() + 6) % 7;
}

function levelFor(value: number, max: number) {
  if (value <= 0 || max <= 0) return 0;
  return Math.max(1, Math.ceil((value / max) * 4));
}

function formatMonth(time: number, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    month: "short",
    timeZone: "UTC",
  }).format(new Date(time));
}

export function buildActivityGrid(daily: DailyUsage[], today: string, mode: ViewMode = "daily") {
  const safeToday = utcDatePattern.test(today) ? today : new Date().toISOString().slice(0, 10);
  const todayTime = new Date(`${safeToday}T00:00:00.000Z`).getTime();
  const todayDate = new Date(todayTime);
  const rangeStart = Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth() - 11, 1);
  const gridStart = rangeStart - mondayOffset(rangeStart) * dayMs;
  const gridEnd = todayTime;
  const weeks = Math.floor((gridEnd - gridStart) / dayMs / 7) + 1;
  const byDate = new Map(daily.map((row) => [row.date, Number(row.tokens)]));
  const weekTotals = new Map<number, number>();
  let cumulative = 0;

  for (let time = rangeStart; time <= todayTime; time += dayMs) {
    const value = byDate.get(dateKey(time)) || 0;
    cumulative += value;
    const weekStart = time - mondayOffset(time) * dayMs;
    weekTotals.set(weekStart, (weekTotals.get(weekStart) || 0) + value);
  }

  cumulative = 0;
  const cells = Array.from({ length: Math.round((gridEnd - gridStart) / dayMs) + 1 }, (_, index) => {
    const time = gridStart + index * dayMs;
    const date = dateKey(time);
    const tokens = byDate.get(date) || 0;
    const visible = time >= rangeStart && time <= todayTime;
    if (visible) cumulative += tokens;
    const weekStart = time - mondayOffset(time) * dayMs;
    const value = mode === "weekly" ? weekTotals.get(weekStart) || 0 : mode === "cumulative" ? cumulative : tokens;
    return { date, tokens, value, visible };
  });
  const max = Math.max(0, ...cells.filter((cell) => cell.visible).map((cell) => cell.value));
  const months = Array.from({ length: 12 }, (_, index) => {
    const time = Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth() - 11 + index, 1);
    return { time, week: Math.floor((time - gridStart) / dayMs / 7) };
  });

  return {
    cells: cells.map((cell) => ({ ...cell, level: cell.visible ? levelFor(cell.value, max) : 0 })),
    months,
    max,
    weeks,
    total: Array.from(byDate.entries()).reduce((sum, [date, tokens]) => date >= dateKey(rangeStart) && date <= safeToday ? sum + tokens : sum, 0),
  };
}

export function UsageHeatmap({ daily, locale, today }: { daily: DailyUsage[]; locale: Locale; today: string }) {
  const [mode, setMode] = useState<ViewMode>("daily");
  const grid = useMemo(() => buildActivityGrid(daily, today, mode), [daily, mode, today]);
  const modes: Array<{ key: ViewMode; label: string }> = locale === "zh"
    ? [{ key: "daily", label: "每日" }, { key: "weekly", label: "每周" }, { key: "cumulative", label: "累计" }]
    : [{ key: "daily", label: "Daily" }, { key: "weekly", label: "Weekly" }, { key: "cumulative", label: "Cumulative" }];
  const modeName = modes.find((item) => item.key === mode)?.label || modes[0]?.label || "";

  return <div className="usage-activity">
    <div className="usage-activity-head">
      <div><h2>{locale === "zh" ? "Token 活动" : "Token activity"}</h2><span>{locale === "zh" ? `最近 12 个月 · UTC · ${formatTokenCount(grid.total)}` : `Last 12 months · UTC · ${formatTokenCount(grid.total)}`}</span></div>
      <div aria-label={locale === "zh" ? "活动统计方式" : "Activity aggregation"} className="usage-activity-tabs" role="tablist">
        {modes.map((item) => <button aria-selected={mode === item.key} key={item.key} onClick={() => setMode(item.key)} role="tab" type="button">{item.label}</button>)}
      </div>
    </div>
    <div className="usage-activity-scroll">
      <div className="usage-activity-chart">
        <div
          aria-label={locale === "zh" ? `最近 12 个月${modeName} Token 使用情况` : `${modeName} token usage for the last 12 months`}
          className="usage-activity-grid"
          role="group"
          style={{ gridTemplateColumns: `repeat(${grid.weeks}, minmax(8px, 1fr))` }}
        >
          {grid.cells.map((cell) => {
            if (!cell.visible) return <i aria-hidden="true" className="usage-activity-day usage-activity-day-empty" key={cell.date} />;
            const rate = grid.max && cell.value ? Math.round((cell.value / grid.max) * 100) : 0;
            const valueLabel = mode === "daily"
              ? formatTokenCount(cell.tokens)
              : mode === "weekly"
                ? `${formatTokenCount(cell.value)} ${locale === "zh" ? "本周" : "this week"}`
                : `${formatTokenCount(cell.value)} ${locale === "zh" ? "累计" : "cumulative"}`;
            const tooltip = `${cell.date} · ${valueLabel} · ${locale === "zh" ? `使用率 ${rate}%` : `${rate}% usage rate`}`;
            return <span aria-label={tooltip} className="usage-activity-day" data-level={cell.level} data-tooltip={tooltip} key={cell.date} role="img" tabIndex={0} title={tooltip} />;
          })}
        </div>
        <div aria-hidden="true" className="usage-activity-months" style={{ gridTemplateColumns: `repeat(${grid.weeks}, minmax(8px, 1fr))` }}>
          {grid.months.map((month) => <span key={month.time} style={{ gridColumnStart: month.week + 1 }}>{formatMonth(month.time, locale)}</span>)}
        </div>
      </div>
    </div>
  </div>;
}
