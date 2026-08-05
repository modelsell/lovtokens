"use client";

import { useMemo, useState, useSyncExternalStore, type CSSProperties } from "react";
import { Activity, BrainCircuit, CalendarDays, Clock3, Gauge, Layers3, Moon, Repeat2, Sparkles } from "lucide-react";
import type { Locale } from "@/lib/i18n";

export type AnalyticsRow = {
  date: string;
  source: string;
  model: string;
  inputTokens: number;
  freshTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  requests: number;
};

export type HourlyAnalyticsRow = AnalyticsRow & { hour: number };

type RangeDays = 1 | 7 | 30 | 90;
type ZoneMode = "utc" | "local";

const colors = ["#9bcf36", "#5470ff", "#f0a53b", "#bc66db", "#16a6a1", "#e65f5c"];
const emptySubscribe = () => () => undefined;

export function CodingAnalyticsDashboard({ daily, hourly, locale, today }: { daily: AnalyticsRow[]; hourly: HourlyAnalyticsRow[]; locale: Locale; today: string }) {
  const [range, setRange] = useState<RangeDays>(30);
  const [source, setSource] = useState("all");
  const [selectedZone, setSelectedZone] = useState<ZoneMode | null>(null);
  const hydrated = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const zone = selectedZone || (hydrated ? "local" : "utc");
  const copy = locale === "zh" ? zhCopy : enCopy;
  const cutoff = dateBefore(today, range - 1);
  const filteredDaily = useMemo(() => daily.filter((row) => row.date >= cutoff && (source === "all" || row.source === source)), [cutoff, daily, source]);
  const filteredHourly = useMemo(() => hourly.filter((row) => row.date >= cutoff && (source === "all" || row.source === source)).map((row) => withDisplayTime(row, zone)), [cutoff, hourly, source, zone]);
  const stats = useMemo(() => summarize(filteredDaily, filteredHourly, range, today), [filteredDaily, filteredHourly, range, today]);
  const timezone = hydrated ? Intl.DateTimeFormat().resolvedOptions().timeZone : "UTC";

  return <section className="coding-analytics" aria-labelledby="coding-analytics-title">
    <div className="coding-analytics-header">
      <div><span className="eyebrow">{copy.eyebrow}</span><h2 id="coding-analytics-title">{copy.title}</h2><p>{copy.intro}</p></div>
      <div className="analytics-toolbar">
        <div className="analytics-segment" aria-label={copy.rangeLabel}>{([1, 7, 30, 90] as RangeDays[]).map((item) => <button key={item} type="button" aria-pressed={range === item} onClick={() => setRange(item)}>{item === 1 ? copy.today : `${item}${copy.days}`}</button>)}</div>
        <div className="analytics-segment" aria-label={copy.timezoneLabel}><button type="button" aria-pressed={zone === "local"} onClick={() => setSelectedZone("local")}>{copy.local}</button><button type="button" aria-pressed={zone === "utc"} onClick={() => setSelectedZone("utc")}>UTC</button></div>
      </div>
    </div>

    <div className="analytics-source-filter" aria-label={copy.sourceLabel}>{["all", "codex", "claude-code", "workbuddy"].map((item) => <button type="button" key={item} aria-pressed={source === item} onClick={() => setSource(item)}>{item === "all" ? copy.allAgents : item === "claude-code" ? "Claude Code" : item === "workbuddy" ? "WorkBuddy" : "Codex"}</button>)}</div>

    <div className="analytics-insight-grid">
      <Insight icon={<BrainCircuit size={18} />} label={copy.primaryModel} value={stats.primaryModel?.model || "—"} detail={stats.primaryModel ? `${percent(stats.primaryModel.share)} ${copy.ofTokens}` : copy.noData} />
      <Insight icon={<Clock3 size={18} />} label={copy.peakHour} value={stats.hourlyTokens ? hourRange(stats.peakHour, locale) : "—"} detail={stats.hourlyTokens ? `${copy.peakDay} · ${weekdayLabel(stats.peakWeekday, locale)}` : copy.waitingHourly} />
      <Insight icon={<Repeat2 size={18} />} label={copy.cacheReuse} value={percent(stats.cacheRatio)} detail={`${compact(stats.cacheRead, locale)} ${copy.cacheRead}`} />
      <Insight icon={<Gauge size={18} />} label={copy.avgRequest} value={stats.requests ? compact(Math.round(stats.tokens / stats.requests), locale) : "—"} detail={`${compact(stats.requests, locale)} ${copy.requests}`} />
      <Insight icon={<CalendarDays size={18} />} label={copy.activeDays} value={`${stats.activeDays}/${range}`} detail={`${copy.longestStreak} ${stats.longestStreak} ${copy.days}`} />
      <Insight icon={<Moon size={18} />} label={copy.lateNight} value={stats.hourlyTokens ? percent(stats.nightShare) : "—"} detail={stats.hourlyTokens ? copy.betweenNight : copy.waitingHourly} />
    </div>

    <HourlyCoverage coverage={stats.hourlyCoverage} hasHourly={stats.hourlyTokens > 0} locale={locale} timezone={zone === "local" ? timezone : "UTC"} />

    <div className="analytics-chart-grid">
      <article className="panel analytics-wide"><PanelHead title={range === 1 ? copy.hourlyTokenTrend : copy.tokenTrend} meta={range === 1 ? `24 ${copy.hourWindow}` : `${range} ${copy.dayWindow}`} /><TokenTrend dailyRows={filteredDaily} hourlyRows={filteredHourly} range={range} today={today} locale={locale} /></article>
      <article className="panel analytics-token-mix"><PanelHead title={copy.tokenAnatomy} meta={copy.processedDefinition} /><TokenAnatomy stats={stats} locale={locale} copy={copy} /></article>
      <article className="panel analytics-rhythm"><PanelHead title={copy.codingRhythm} meta={`${copy.displayedIn} ${zone === "local" ? timezone : "UTC"}`} /><WeekHourHeatmap rows={filteredHourly} locale={locale} empty={copy.waitingHourly} /></article>
      <article className="panel analytics-wide"><PanelHead title={copy.modelScoreboard} meta={copy.modelScoreboardMeta} /><ModelScoreboard rows={filteredDaily} locale={locale} copy={copy} /></article>
    </div>
  </section>;
}

function Insight({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: string; detail: string }) {
  return <div className="analytics-insight"><span>{icon}</span><small>{label}</small><strong title={value}>{value}</strong><em>{detail}</em></div>;
}

function PanelHead({ title, meta }: { title: string; meta: string }) {
  return <div className="panel-head analytics-panel-head"><h3>{title}</h3><span>{meta}</span></div>;
}

function HourlyCoverage({ coverage, hasHourly, locale, timezone }: { coverage: number; hasHourly: boolean; locale: Locale; timezone: string }) {
  const complete = coverage >= .995;
  return <div className="analytics-coverage" data-complete={complete || undefined}><span><Activity size={17} /><span><strong>{hasHourly ? (locale === "zh" ? `小时明细覆盖 ${percent(coverage)}` : `${percent(coverage)} hourly detail coverage`) : (locale === "zh" ? "等待小时明细回填" : "Waiting for hourly detail")}</strong><small>{hasHourly ? (locale === "zh" ? `热力图与小时模型图按 ${timezone} 展示；其余总量仍来自完整日汇总。` : `Heatmaps use ${timezone}; complete daily aggregates still power the other totals.`) : (locale === "zh" ? "升级采集器并重新同步后，会从本地历史事件生成精确小时分桶；当前不会对旧数据做估算。" : "Upgrade and resync to build exact hourly buckets from local history. Older data is never estimated.")}</small></span></span><b><i style={{ width: `${Math.min(100, coverage * 100)}%` }} /></b></div>;
}

function TokenTrend({ dailyRows, hourlyRows, range, today, locale }: { dailyRows: AnalyticsRow[]; hourlyRows: DisplayHourlyRow[]; range: number; today: string; locale: Locale }) {
  const [hovered, setHovered] = useState<{ date: string; total: number; models: Array<{ model: string; tokens: number }>; x: number } | null>(null);
  const hourlyMode = range === 1;
  const points = hourlyMode ? Array.from({ length: 24 }, (_, hour) => String(hour)) : Array.from({ length: range }, (_, index) => dateBefore(today, range - index - 1));
  const rows = hourlyMode ? hourlyRows : dailyRows;
  const models = topModels(rows, 4);
  const totals = new Map<string, number>();
  const byModel = new Map<string, number>();
  for (const row of rows) {
    const value = tokens(row);
    const key = hourlyMode ? String((row as DisplayHourlyRow).displayHour) : row.date;
    totals.set(key, (totals.get(key) || 0) + value);
    byModel.set(`${key}\u0000${row.model}`, (byModel.get(`${key}\u0000${row.model}`) || 0) + value);
  }
  const max = Math.max(1, ...points.map((key) => totals.get(key) || 0));
  const xAt = (index: number) => points.length === 1 ? 460 : 48 + index * (824 / (points.length - 1));
  const point = (value: number, index: number) => `${xAt(index)},${218 - value / max * 178}`;
  const totalPoints = points.map((key, index) => point(totals.get(key) || 0, index));
  const area = [`48,218`, ...totalPoints, `872,218`].join(" ");
  return <div className="token-trend-chart"><svg viewBox="0 0 920 250" role="img" aria-label={hourlyMode ? (locale === "zh" ? "今日每小时 token 趋势" : "Today's hourly token trend") : (locale === "zh" ? "每日 token 趋势" : "Daily token trend")}>
    <defs><linearGradient id="token-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#9bcf36" stopOpacity=".28"/><stop offset="1" stopColor="#9bcf36" stopOpacity=".02"/></linearGradient></defs>
    {[0, .25, .5, .75, 1].map((ratio) => <g key={ratio}><line x1="48" x2="872" y1={218 - ratio * 178} y2={218 - ratio * 178} className="chart-grid-line"/><text x="40" y={222 - ratio * 178} textAnchor="end">{compact(max * ratio, locale)}</text></g>)}
    <polygon points={area} fill="url(#token-area)"/><polyline points={totalPoints.join(" ")} className="chart-total-line"/>
    {models.map((model, modelIndex) => <polyline key={model} points={points.map((key, index) => point(byModel.get(`${key}\u0000${model}`) || 0, index)).join(" ")} className="chart-model-line" style={{ stroke: colors[modelIndex] }} />)}
    {points.map((key, index) => { const total = totals.get(key) || 0; const label = hourlyMode ? hourRange(Number(key), locale) : key; const modelValues = models.map((model) => ({ model, tokens: byModel.get(`${key}\u0000${model}`) || 0 })).filter((item) => item.tokens > 0); const hover = () => setHovered({ date: label, total, models: modelValues, x: Math.min(88, Math.max(12, xAt(index) / 920 * 100)) }); const width = points.length === 1 ? 824 : 824 / points.length; return <g key={`hover-${key}`} className="chart-hover-target" tabIndex={0} aria-label={`${label} · ${exact(total, locale)} tokens`} onMouseEnter={hover} onMouseLeave={() => setHovered(null)} onFocus={hover} onBlur={() => setHovered(null)}><rect x={points.length === 1 ? 48 : xAt(index) - width / 2} y="35" width={width} height="185"/><circle cx={xAt(index)} cy={218 - total / max * 178} r="4" /></g>; })}
    {points.map((key, index) => { const show = hourlyMode ? index % 3 === 0 || index === 23 : index === 0 || index === points.length - 1 || index % Math.max(1, Math.round(range / 6)) === 0; if (!show) return null; return <text key={key} x={xAt(index)} y="240" textAnchor={index === 0 ? "start" : index === points.length - 1 ? "end" : "middle"}>{hourlyMode ? `${String(index).padStart(2, "0")}:00` : shortDate(key, locale)}</text>; })}
  </svg>{hovered && <div className="analytics-chart-tooltip" style={{ left: `${hovered.x}%` }}><strong>{hovered.date}</strong><span>{locale === "zh" ? "总量" : "Total"} · {exact(hovered.total, locale)} tokens</span>{hovered.models.map((item) => <small key={item.model}>{item.model} · {exact(item.tokens, locale)}</small>)}</div>}<div className="analytics-legend"><span><i style={{ background: "#19221a" }} />{locale === "zh" ? "总量" : "Total"}</span>{models.map((model, index) => <span key={model}><i style={{ background: colors[index] }} />{model}</span>)}</div></div>;
}

function TokenAnatomy({ stats, locale, copy }: { stats: Summary; locale: Locale; copy: typeof zhCopy }) {
  const parts = [
    { label: copy.freshInput, value: stats.fresh, color: colors[0] },
    { label: copy.cacheReadShort, value: stats.cacheRead, color: colors[1] },
    { label: copy.cacheWrite, value: stats.cacheWrite, color: colors[2] },
    { label: copy.output, value: stats.output, color: colors[3] },
  ];
  let cursor = 0;
  const stops = parts.map((part) => { const start = cursor; cursor += stats.tokens ? part.value / stats.tokens * 100 : 0; return `${part.color} ${start}% ${cursor}%`; });
  const style = { background: stats.tokens ? `conic-gradient(${stops.join(",")})` : "var(--track)" } as CSSProperties;
  return <div className="token-anatomy"><div className="token-donut" style={style}><span><strong>{compact(stats.tokens, locale)}</strong><small>{copy.tokens}</small></span></div><div className="token-anatomy-list">{parts.map((part) => <div key={part.label} className="analytics-hover-tip" tabIndex={0} data-tooltip={`${part.label} · ${exact(part.value, locale)} tokens`}><span><i style={{ background: part.color }} />{part.label}</span><strong>{percent(stats.tokens ? part.value / stats.tokens : 0)}</strong><small>{compact(part.value, locale)}</small></div>)}<div className="reasoning-subset analytics-hover-tip" tabIndex={0} data-tooltip={`${copy.reasoningOutput} · ${exact(stats.reasoning, locale)} tokens`}><span><Sparkles size={13} />{copy.reasoningOutput}</span><strong>{percent(stats.output ? stats.reasoning / stats.output : 0)}</strong><small>{copy.ofOutput}</small></div></div></div>;
}

function WeekHourHeatmap({ rows, locale, empty }: { rows: DisplayHourlyRow[]; locale: Locale; empty: string }) {
  const cells = new Map<string, number>();
  for (const row of rows) cells.set(`${row.weekday}:${row.displayHour}`, (cells.get(`${row.weekday}:${row.displayHour}`) || 0) + tokens(row));
  const max = Math.max(0, ...cells.values());
  if (!max) return <EmptyChart text={empty} />;
  return <div className="week-hour-chart"><div className="week-hour-axis">{Array.from({ length: 24 }, (_, hour) => <span key={hour}>{hour % 3 === 0 ? String(hour).padStart(2, "0") : ""}</span>)}</div><div className="week-hour-body"><div className="weekday-axis">{Array.from({ length: 7 }, (_, day) => <span key={day}>{weekdayLabel(day, locale, true)}</span>)}</div><div className="week-hour-grid">{Array.from({ length: 7 }, (_, day) => Array.from({ length: 24 }, (_, hour) => { const value = cells.get(`${day}:${hour}`) || 0; const level = value ? Math.max(1, Math.ceil(value / max * 5)) : 0; const tooltip = `${weekdayLabel(day, locale)} ${String(hour).padStart(2, "0")}:00 · ${exact(value, locale)} tokens`; return <span key={`${day}-${hour}`} className="analytics-hover-tip" tabIndex={0} data-level={level} data-tooltip={tooltip} aria-label={tooltip} title={tooltip} />; }))}</div></div><div className="heatmap-foot"><span>{locale === "zh" ? "低" : "Less"}</span>{[0,1,2,3,4,5].map((level) => <i key={level} data-level={level} />)}<span>{locale === "zh" ? "高" : "More"}</span></div></div>;
}

function ModelScoreboard({ rows, locale, copy }: { rows: AnalyticsRow[]; locale: Locale; copy: typeof zhCopy }) {
  const grouped = new Map<string, Omit<Summary, "primaryModel" | "peakHour" | "peakWeekday" | "nightShare" | "hourlyTokens" | "hourlyCoverage" | "longestStreak"> & { days: Set<string> }>();
  for (const row of rows) {
    const item = grouped.get(row.model) || { tokens: 0, input: 0, fresh: 0, cacheRead: 0, cacheWrite: 0, output: 0, reasoning: 0, requests: 0, activeDays: 0, cacheRatio: 0, days: new Set<string>() };
    item.tokens += tokens(row); item.input += row.inputTokens; item.fresh += row.freshTokens; item.cacheRead += row.cacheReadTokens; item.cacheWrite += row.cacheWriteTokens; item.output += row.outputTokens; item.reasoning += row.reasoningTokens; item.requests += row.requests; item.days.add(row.date); grouped.set(row.model, item);
  }
  const models = [...grouped.entries()].sort((a, b) => b[1].tokens - a[1].tokens);
  const total = models.reduce((sum, [, item]) => sum + item.tokens, 0);
  if (!models.length) return <EmptyChart text={copy.noData} />;
  return <div className="model-scoreboard"><div className="model-scoreboard-head"><span>{copy.model}</span><span>{copy.share}</span><span>{copy.inputOutput}</span><span>{copy.cache}</span><span>{copy.perRequest}</span><span>{copy.active}</span></div>{models.map(([model, item], index) => <div className="model-scoreboard-row" key={model}><span><i style={{ background: colors[index % colors.length] }} /><strong title={model}>{model}</strong><small>{compact(item.tokens, locale)} tokens</small></span><span><b style={{ width: `${item.tokens / total * 100}%` }} /><em>{percent(item.tokens / total)}</em></span><span>{compact(item.input, locale)}<small>/ {compact(item.output, locale)}</small></span><span>{percent(item.input ? item.cacheRead / item.input : 0)}</span><span>{item.requests ? compact(item.tokens / item.requests, locale) : "—"}</span><span>{item.days.size} {copy.days}</span></div>)}</div>;
}

function EmptyChart({ text }: { text: string }) { return <div className="analytics-empty"><Layers3 size={24} /><span>{text}</span></div>; }

type DisplayHourlyRow = HourlyAnalyticsRow & { displayDate: string; displayHour: number; weekday: number };
type Summary = {
  tokens: number; input: number; fresh: number; cacheRead: number; cacheWrite: number; output: number; reasoning: number; requests: number;
  activeDays: number; longestStreak: number; cacheRatio: number; primaryModel: { model: string; share: number } | null;
  peakHour: number; peakWeekday: number; nightShare: number; hourlyTokens: number; hourlyCoverage: number;
};

function summarize(daily: AnalyticsRow[], hourly: DisplayHourlyRow[], range: number, today: string): Summary {
  const totals = daily.reduce((acc, row) => { acc.input += row.inputTokens; acc.fresh += row.freshTokens; acc.cacheRead += row.cacheReadTokens; acc.cacheWrite += row.cacheWriteTokens; acc.output += row.outputTokens; acc.reasoning += row.reasoningTokens; acc.requests += row.requests; return acc; }, { input: 0, fresh: 0, cacheRead: 0, cacheWrite: 0, output: 0, reasoning: 0, requests: 0 });
  const allTokens = totals.input + totals.output;
  const modelTotals = new Map<string, number>();
  const dates = new Set<string>();
  daily.forEach((row) => { modelTotals.set(row.model, (modelTotals.get(row.model) || 0) + tokens(row)); if (tokens(row) > 0) dates.add(row.date); });
  const primary = [...modelTotals.entries()].sort((a, b) => b[1] - a[1])[0];
  const hourTotals = Array.from({ length: 24 }, () => 0);
  const weekdayTotals = Array.from({ length: 7 }, () => 0);
  let hourlyTokens = 0; let nightTokens = 0;
  hourly.forEach((row) => { const value = tokens(row); hourTotals[row.displayHour] = (hourTotals[row.displayHour] || 0) + value; weekdayTotals[row.weekday] = (weekdayTotals[row.weekday] || 0) + value; hourlyTokens += value; if (row.displayHour >= 22 || row.displayHour < 6) nightTokens += value; });
  return {
    tokens: allTokens, ...totals, activeDays: dates.size, longestStreak: streak(dates, range, today), cacheRatio: totals.input ? totals.cacheRead / totals.input : 0,
    primaryModel: primary ? { model: primary[0], share: allTokens ? primary[1] / allTokens : 0 } : null,
    peakHour: maxIndex(hourTotals), peakWeekday: maxIndex(weekdayTotals), nightShare: hourlyTokens ? nightTokens / hourlyTokens : 0,
    hourlyTokens, hourlyCoverage: allTokens ? Math.min(1, hourlyTokens / allTokens) : 0,
  };
}

function withDisplayTime(row: HourlyAnalyticsRow, zone: ZoneMode): DisplayHourlyRow {
  const date = new Date(`${row.date}T${String(row.hour).padStart(2, "0")}:00:00.000Z`);
  const displayDate = zone === "local" ? localDate(date) : row.date;
  const displayHour = zone === "local" ? date.getHours() : row.hour;
  const weekday = ((zone === "local" ? date.getDay() : date.getUTCDay()) + 6) % 7;
  return { ...row, displayDate, displayHour, weekday };
}

function localDate(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function tokens(row: Pick<AnalyticsRow, "inputTokens" | "outputTokens">) { return row.inputTokens + row.outputTokens; }
function topModels(rows: AnalyticsRow[], limit: number) { const values = new Map<string, number>(); rows.forEach((row) => values.set(row.model, (values.get(row.model) || 0) + tokens(row))); return [...values.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([model]) => model); }
function maxIndex(values: number[]) { return values.reduce((best, value, index) => value > (values[best] ?? Number.NEGATIVE_INFINITY) ? index : best, 0); }
function dateBefore(date: string, days: number) { const value = new Date(`${date}T00:00:00.000Z`); value.setUTCDate(value.getUTCDate() - days); return value.toISOString().slice(0, 10); }
function shortDate(date: string, locale: Locale) { const [, month, day] = date.split("-"); return locale === "zh" ? `${Number(month)}/${Number(day)}` : `${month}/${day}`; }
function compact(value: number, locale: Locale) { return Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en", { notation: "compact", maximumFractionDigits: 1 }).format(Math.round(value)); }
function exact(value: number, locale: Locale) { return Intl.NumberFormat(locale === "zh" ? "zh-CN" : "en-US").format(Math.round(value)); }
function percent(value: number) { return `${Math.round(value * 100)}%`; }
function hourRange(hour: number, locale: Locale) { const start = String(hour).padStart(2, "0"); const end = String((hour + 1) % 24).padStart(2, "0"); return locale === "zh" ? `${start}:00–${end}:00` : `${start}:00–${end}:00`; }
function weekdayLabel(day: number, locale: Locale, short = false) { const zh = short ? ["一", "二", "三", "四", "五", "六", "日"] : ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]; const en = short ? ["M", "T", "W", "T", "F", "S", "S"] : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]; return (locale === "zh" ? zh : en)[day] || "—"; }
function streak(dates: Set<string>, range: number, today: string) { let best = 0; let current = 0; for (let index = range - 1; index >= 0; index -= 1) { if (dates.has(dateBefore(today, index))) { current += 1; best = Math.max(best, current); } else current = 0; } return best; }

const zhCopy = {
  eyebrow: "CODING HABITS", title: "你的 Coding 数据驾驶舱", intro: "从模型选择、工作节奏到上下文复用，找到真正影响效率的使用习惯。所有统计只基于已采集的 token 元数据。",
  rangeLabel: "统计周期", timezoneLabel: "时区", local: "本地时区", today: "今天", days: "天", sourceLabel: "Agent 来源", allAgents: "全部 Agent",
  primaryModel: "主力模型", ofTokens: "的处理量", peakHour: "高产时段", peakDay: "最常活跃", cacheReuse: "缓存复用率", cacheRead: "缓存读取", avgRequest: "单次调用均值", requests: "次调用", activeDays: "活跃天数", longestStreak: "最长连续", lateNight: "深夜 Coding", betweenNight: "22:00–06:00 的处理量", waitingHourly: "升级采集器并重新同步后显示", noData: "当前周期暂无数据",
  tokenTrend: "每日 Token 走势与模型切换", hourlyTokenTrend: "今日每小时 Token 走势与模型切换", dayWindow: "天窗口", hourWindow: "小时窗口", tokenAnatomy: "Token 构成", processedDefinition: "输入 + 输出", codingRhythm: "星期 × 小时活跃热力图", displayedIn: "显示时区", modelScoreboard: "模型效率明细", modelScoreboardMeta: "用量、结构与调用粒度",
  freshInput: "新输入", cacheReadShort: "缓存读取", cacheWrite: "缓存写入", output: "输出", reasoningOutput: "其中推理输出", ofOutput: "占输出", tokens: "tokens", model: "模型", share: "占比", inputOutput: "输入 / 输出", cache: "缓存复用", perRequest: "单次均值", active: "活跃天数",
};

const enCopy: typeof zhCopy = {
  eyebrow: "CODING HABITS", title: "Your coding data cockpit", intro: "See how model choice, work rhythm, and context reuse shape your workflow. Every metric uses token metadata already collected.",
  rangeLabel: "Date range", timezoneLabel: "Timezone", local: "Local time", today: "Today", days: "d", sourceLabel: "Agent source", allAgents: "All agents",
  primaryModel: "Primary model", ofTokens: "of processed tokens", peakHour: "Peak hour", peakDay: "Most active", cacheReuse: "Cache reuse", cacheRead: "cache-read tokens", avgRequest: "Tokens / request", requests: "requests", activeDays: "Active days", longestStreak: "Longest streak", lateNight: "Late-night coding", betweenNight: "processed from 22:00–06:00", waitingHourly: "Available after collector upgrade and resync", noData: "No data in this range",
  tokenTrend: "Daily tokens and model shifts", hourlyTokenTrend: "Today's hourly tokens and model shifts", dayWindow: "day window", hourWindow: "hour window", tokenAnatomy: "Token anatomy", processedDefinition: "input + output", codingRhythm: "Weekday × hour activity", displayedIn: "Shown in", modelScoreboard: "Model efficiency scoreboard", modelScoreboardMeta: "volume, anatomy, and request size",
  freshInput: "Fresh input", cacheReadShort: "Cache read", cacheWrite: "Cache write", output: "Output", reasoningOutput: "Reasoning subset", ofOutput: "of output", tokens: "tokens", model: "Model", share: "Share", inputOutput: "Input / output", cache: "Cache reuse", perRequest: "Per request", active: "Active days",
};
