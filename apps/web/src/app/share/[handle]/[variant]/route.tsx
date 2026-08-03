import { ImageResponse } from "next/og";
import QRCode from "qrcode";
import { achievementFor, formatTokenCount } from "@/lib/format";
import { getShareProfile } from "@/lib/repository";
import { getShareBucket, siteUrl } from "@/lib/runtime";
/* eslint-disable @next/next/no-img-element -- next/og requires directly renderable data URIs */

export const runtime = "nodejs";
const sizes = { "profile.png": [1080, 1350], "month.png": [1200, 630], "lifetime-square.png": [1080, 1080], "story.png": [1080, 1920], "certificate.png": [1600, 900] } as const;
const themes = {
  obsidian: { background: "#090c0a", accent: "#c8f06a", foreground: "#f6f7f3", pattern: "linear-gradient(rgba(200,240,106,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(200,240,106,.18) 1px,transparent 1px)" },
  terminal: { background: "linear-gradient(145deg,#06101d,#071c28)", accent: "#62d6ff", foreground: "#f3f7ff", pattern: "linear-gradient(rgba(98,214,255,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(98,214,255,.18) 1px,transparent 1px)" },
  ivory: { background: "#efe8d8", accent: "#192019", foreground: "#192019", pattern: "radial-gradient(circle at 78% 18%,rgba(25,32,25,.16) 0 2px,transparent 3px)" },
  aurora: { background: "linear-gradient(145deg,#0b1222 0%,#171230 48%,#082423 100%)", accent: "#c4a7ff", foreground: "#f8f4ff", pattern: "radial-gradient(circle at 75% 25%,rgba(149,111,255,.55),transparent 38%),radial-gradient(circle at 20% 85%,rgba(64,220,181,.3),transparent 42%)" },
} as const;

export async function GET(request: Request, { params }: { params: Promise<{ handle: string; variant: string }> }) {
  const { handle, variant } = await params; const size = sizes[variant as keyof typeof sizes]; if (!size) return new Response("Unknown image format", { status: 404 });
  const url = new URL(request.url); const theme = (url.searchParams.get("theme") || "obsidian") as keyof typeof themes; if (!themes[theme]) return new Response("Unknown theme", { status: 400 });
  const period = variant === "month.png" ? "month" : "all"; const p = await getShareProfile(handle, period); if (!p) return new Response("Profile is private or missing", { status: 404 });
  const cacheKey = `v5/${p.handle}/${p.statsVersion}-${p.privacyVersion}/${period}/${variant}/${theme}.png`; const bucket = await getShareBucket(); const cached = await bucket?.get(cacheKey); if (cached) return new Response(cached.body, { headers: { "content-type": "image/png", "cache-control": "public,max-age=31536000,immutable", etag: cached.httpEtag } });
  const { background, accent, foreground, pattern } = themes[theme]; const profileUrl = `${siteUrl()}/u/${p.handle}`; const qr = await QRCode.toDataURL(profileUrl, { margin: 1, width: 150, color: { dark: foreground, light: "#00000000" } });
  const cardProps = { p, background, accent, foreground, pattern, qr, theme };
  const response = new ImageResponse(variant === "profile.png" ? <PortraitCard {...cardProps} /> : <LegacyCard {...cardProps} period={period} tall={size[1] > size[0]} />, { width: size[0], height: size[1] });
  const bytes = await response.arrayBuffer(); await bucket?.put(cacheKey, bytes, { httpMetadata: { contentType: "image/png", cacheControl: "public,max-age=31536000,immutable" } });
  return new Response(bytes, { headers: { "content-type": "image/png", "cache-control": "public,max-age=31536000,immutable" } });
}
function Metric({ label, value }: { label: string; value: string }) { return <div style={{ display: "flex", flexDirection: "column", gap: 7 }}><span style={{ fontSize: 12, letterSpacing: 3, opacity: .58 }}>{label}</span><strong style={{ fontSize: 32 }}>{value}</strong></div>; }

type ShareProfile = NonNullable<Awaited<ReturnType<typeof getShareProfile>>>;
type CardProps = { p: ShareProfile; background: string; accent: string; foreground: string; pattern: string; qr: string; theme: keyof typeof themes };

function PortraitCard({ p, background, accent, foreground, pattern, qr, theme }: CardProps) {
  const exact = p.showExactTokens ? formatTokenCount(p.processedTokens) : "PRIVATE";
  const activity = buildShareActivity(p.history, p.today);
  const sourceRows = p.sources.slice(0, 2).map((row) => ({ label: row.source === "claude-code" ? "Claude Code" : "Codex", tokens: row.tokens }));
  const modelRows = p.models.slice(0, 3).map((row) => ({ label: row.model, tokens: row.tokens }));
  return <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background, color: foreground, padding: 72, fontFamily: "Arial", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, display: "flex", opacity: theme === "ivory" ? .42 : .65, backgroundImage: pattern, backgroundSize: theme === "ivory" ? "32px 32px" : "42px 42px" }} />
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ display: "flex", fontSize: 32, fontWeight: 900, letterSpacing: -2 }}>LovTokens<span style={{ color: accent }}>/</span></div><div style={{ display: "flex", fontSize: 14, letterSpacing: 4, opacity: .7 }}>ALL-TIME TOKEN PORTFOLIO</div></div>
    <div style={{ display: "flex", flexDirection: "column", marginTop: 46 }}><div style={{ display: "flex", fontSize: 28, opacity: .62 }}>@{p.isAnonymous ? `anon-${p.handle.slice(-4)}` : p.handle}</div><div style={{ display: "flex", fontSize: 48, fontWeight: 800, marginTop: 5 }}>{p.displayName}</div><div style={{ display: "flex", color: accent, fontSize: 142, fontWeight: 900, letterSpacing: -8, lineHeight: .9, marginTop: 34 }}>{exact}</div><div style={{ display: "flex", fontSize: 15, letterSpacing: 5, marginTop: 16, opacity: .58 }}>{p.showExactTokens ? "TOKENS PROCESSED" : "EXACT TOTAL HIDDEN"}</div></div>
    <div style={{ display: "flex", flexDirection: "column", borderTop: `1px solid ${accent}`, borderBottom: `1px solid ${accent}`, marginTop: 38, padding: "18px 0 20px", position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, letterSpacing: 3, opacity: .7 }}><span>TOKEN ACTIVITY · 24 WEEKS</span><span>{p.showExactTokens ? formatTokenCount(activity.total) : "PRIVATE"}</span></div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 15 }}>{activity.weeks.map((week, weekIndex) => <div key={weekIndex} style={{ display: "flex", flexDirection: "column", gap: 4 }}>{week.map((cell, dayIndex) => <div key={dayIndex} style={{ display: "flex", width: 18, height: 18, background: cell.level ? accent : foreground, opacity: cell.level ? .25 + cell.level * .18 : .08 }} />)}</div>)}</div>
    </div>
    <div style={{ display: "flex", gap: 50, marginTop: 28 }}>{p.showRank && <Metric label="GLOBAL RANK" value={p.rank ? `#${p.rank}` : "—"} />}{p.showRank && <Metric label="PERCENTILE" value={`TOP ${p.percentile < 1 ? p.percentile.toFixed(1) : Math.round(p.percentile)}%`} />}<Metric label="ACTIVE DAYS" value={String(p.activeDays)} /></div>
    <div style={{ display: "flex", gap: 34, marginTop: 28 }}><ImageDistribution accent={accent} empty={p.showExactTokens ? "NO AGENT DATA" : "AGENT DATA PRIVATE"} rows={sourceRows} title="AGENT DISTRIBUTION" /><ImageDistribution accent={accent} empty={p.showExactTokens && p.showModels ? "NO MODEL DATA" : "MODEL DATA PRIVATE"} rows={modelRows} title="MODEL DISTRIBUTION" /></div>
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: "auto" }}><div style={{ display: "flex", flexDirection: "column", gap: 14 }}><div style={{ alignSelf: "flex-start", display: "flex", border: `1px solid ${accent}`, color: accent, padding: "9px 13px", fontSize: 14, letterSpacing: 2 }}>{achievementFor(p.processedTokens, p.activeDays, p.codexTokens, p.claudeTokens).toUpperCase()}</div><div style={{ display: "flex", fontSize: 12, opacity: .58 }}>Usage is not a productivity score · LovTokens</div></div><img alt="Profile QR code" src={qr} width={116} height={116} /></div>
  </div>;
}

function LegacyCard({ p, background, accent, foreground, pattern, qr, theme, period, tall }: CardProps & { period: "month" | "all"; tall: boolean }) {
  const exact = p.showExactTokens ? formatTokenCount(p.processedTokens) : "PRIVATE"; const codexPercent = Math.round((p.codexTokens / Math.max(1, p.processedTokens)) * 100);
  return <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background, color: foreground, padding: tall ? 78 : 64, fontFamily: "Arial", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, display: "flex", opacity: theme === "ivory" ? .45 : .7, backgroundImage: pattern, backgroundSize: theme === "ivory" ? "32px 32px" : "42px 42px" }} />
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ display: "flex", fontSize: 34, fontWeight: 900, letterSpacing: -2 }}>LovTokens<span style={{ color: accent }}>/</span></div><div style={{ display: "flex", fontSize: 16, letterSpacing: 4 }}>{period === "month" ? "THIS MONTH · UTC" : "ALL-TIME PORTFOLIO"}</div></div>
    <div style={{ display: "flex", flexDirection: "column" }}><div style={{ display: "flex", fontSize: tall ? 38 : 28, opacity: .62 }}>@{p.isAnonymous ? `anon-${p.handle.slice(-4)}` : p.handle}</div><div style={{ display: "flex", fontSize: tall ? 62 : 46, fontWeight: 800, marginTop: 8 }}>{p.displayName}</div><div style={{ display: "flex", color: accent, fontSize: tall ? 180 : 132, fontWeight: 900, letterSpacing: -9, lineHeight: .9, marginTop: tall ? 130 : 45 }}>{exact}</div>{p.showExactTokens && <div style={{ display: "flex", fontSize: 18, letterSpacing: 5, marginTop: 22, opacity: .58 }}>TOKENS PROCESSED</div>}</div>
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}><div style={{ display: "flex", flexDirection: "column", gap: 20 }}><div style={{ display: "flex", gap: 52 }}>{p.showRank && <Metric label="GLOBAL RANK" value={p.rank ? `#${p.rank}` : "—"} />} {p.showRank && <Metric label="PERCENTILE" value={`TOP ${p.percentile < 1 ? p.percentile.toFixed(1) : Math.round(p.percentile)}%`} />}<Metric label="ACTIVE DAYS" value={String(p.activeDays)} /></div><div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 15, letterSpacing: 2 }}><div style={{ width: 300, height: 8, display: "flex", background: "#647067" }}><div style={{ width: `${codexPercent}%`, background: accent }} /></div><span>CODEX {codexPercent}% · CLAUDE {100 - codexPercent}%</span></div><div style={{ alignSelf: "flex-start", display: "flex", border: `1px solid ${accent}`, color: accent, padding: "10px 14px", fontSize: 16, letterSpacing: 2 }}>{achievementFor(p.processedTokens, p.activeDays, p.codexTokens, p.claudeTokens).toUpperCase()}</div><div style={{ display: "flex", fontSize: 13, opacity: .58 }}>Usage is not a productivity score · LovTokens</div></div><img alt="Profile QR code" src={qr} width={tall ? 170 : 130} height={tall ? 170 : 130} /></div>
  </div>;
}

function ImageDistribution({ accent, empty, rows, title }: { accent: string; empty: string; rows: Array<{ label: string; tokens: number }>; title: string }) {
  const max = Math.max(1, ...rows.map((row) => row.tokens));
  return <div style={{ display: "flex", flexDirection: "column", gap: 10, width: 451 }}><div style={{ display: "flex", fontSize: 11, letterSpacing: 3, opacity: .65 }}>{title}</div>{rows.length ? rows.map((row) => <div key={row.label} style={{ display: "flex", flexDirection: "column", gap: 5 }}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}><span style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{row.label}</span><span style={{ opacity: .58 }}>{formatTokenCount(row.tokens)}</span></div><div style={{ display: "flex", height: 6, background: "#777d76" }}><div style={{ display: "flex", width: `${(row.tokens / max) * 100}%`, background: accent }} /></div></div>) : <div style={{ display: "flex", fontSize: 13, opacity: .5 }}>{empty}</div>}</div>;
}

function buildShareActivity(history: Array<{ date: string; tokens: number }>, today: string) {
  const dayMs = 86_400_000; const end = new Date(`${today}T00:00:00.000Z`).getTime(); const byDate = new Map(history.map((row) => [row.date, row.tokens]));
  const values = Array.from({ length: 168 }, (_, index) => byDate.get(new Date(end - (167 - index) * dayMs).toISOString().slice(0, 10)) || 0); const max = Math.max(1, ...values); const total = values.reduce((sum, value) => sum + value, 0);
  const cells = values.map((value) => ({ level: value <= 0 ? 0 : Math.max(1, Math.ceil((value / max) * 4)) }));
  return { total, weeks: Array.from({ length: 24 }, (_, index) => cells.slice(index * 7, index * 7 + 7)) };
}
