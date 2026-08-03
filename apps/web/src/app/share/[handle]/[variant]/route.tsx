import QRCode from "qrcode";
import { renderToStaticMarkup } from "react-dom/server.browser";
import { achievementFor, formatTokenCount } from "@/lib/format";
import { getShareProfile } from "@/lib/repository";
import { getShareBucket, siteUrl } from "@/lib/runtime";
import { svgImageDocument } from "@/lib/svg-image";
/* eslint-disable @next/next/no-img-element -- the server-rendered SVG embeds the QR data URI directly */

export const runtime = "nodejs";
const sizes = { "profile.svg": [1080, 1350], "month.svg": [1200, 630], "lifetime-square.svg": [1080, 1080], "story.svg": [1080, 1920], "certificate.svg": [1600, 900] } as const;
const themes = {
  obsidian: { background: "#090c0a", accent: "#c8f06a", foreground: "#f6f7f3", pattern: "linear-gradient(rgba(200,240,106,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(200,240,106,.18) 1px,transparent 1px)" },
  terminal: { background: "linear-gradient(145deg,#06101d,#071c28)", accent: "#62d6ff", foreground: "#f3f7ff", pattern: "linear-gradient(rgba(98,214,255,.18) 1px,transparent 1px),linear-gradient(90deg,rgba(98,214,255,.18) 1px,transparent 1px)" },
  ivory: { background: "#efe8d8", accent: "#192019", foreground: "#192019", pattern: "radial-gradient(circle at 78% 18%,rgba(25,32,25,.16) 0 2px,transparent 3px)" },
  aurora: { background: "linear-gradient(145deg,#0b1222 0%,#171230 48%,#082423 100%)", accent: "#c4a7ff", foreground: "#f8f4ff", pattern: "radial-gradient(circle at 75% 25%,rgba(149,111,255,.55),transparent 38%),radial-gradient(circle at 20% 85%,rgba(64,220,181,.3),transparent 42%)" },
} as const;

export async function GET(request: Request, { params }: { params: Promise<{ handle: string; variant: string }> }) {
  const { handle, variant } = await params; const size = sizes[variant as keyof typeof sizes]; if (!size) return new Response("Unknown image format", { status: 404 });
  const url = new URL(request.url); const theme = (url.searchParams.get("theme") || "obsidian") as keyof typeof themes; if (!themes[theme]) return new Response("Unknown theme", { status: 400 });
  const period = variant === "month.svg" ? "month" : "all"; const p = await getShareProfile(handle, period); if (!p) return new Response("Profile is private or missing", { status: 404 });
  const cacheKey = `v10/${p.handle}/${p.statsVersion}-${p.privacyVersion}/${period}/${variant}/${theme}.svg`; const bucket = await getShareBucket(); const cached = await bucket?.get(cacheKey); if (cached) return new Response(cached.body, { headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "public,max-age=31536000,immutable", etag: cached.httpEtag } });
  const { background, accent, foreground, pattern } = themes[theme]; const profileUrl = `${siteUrl()}/u/${p.handle}`;
  let image: string;
  if (variant === "profile.svg") image = await portraitSvgImage(p, theme, profileUrl);
  else {
    const qr = await QRCode.toDataURL(profileUrl, { errorCorrectionLevel: "M", margin: 3, width: 280, color: { dark: "#111611", light: "#ffffff" } });
    const markup = renderToStaticMarkup(<LegacyCard p={p} background={background} accent={accent} foreground={foreground} pattern={pattern} qr={qr} theme={theme} period={period} tall={size[1] > size[0]} />);
    image = svgImageDocument(markup, size[0], size[1]);
  }
  await bucket?.put(cacheKey, image, { httpMetadata: { contentType: "image/svg+xml", cacheControl: "public,max-age=31536000,immutable" } });
  return new Response(image, { headers: { "content-type": "image/svg+xml; charset=utf-8", "cache-control": "public,max-age=31536000,immutable" } });
}

async function portraitSvgImage(p: ShareProfile, theme: keyof typeof themes, profileUrl: string) {
  const { accent, foreground } = themes[theme];
  const exact = p.showExactTokens ? formatTokenCount(p.processedTokens) : "PRIVATE";
  const activity = buildShareActivity(p.history, p.today);
  const sourceRows = p.sources.slice(0, 2).map((row) => ({ label: row.source === "claude-code" ? "Claude Code" : "Codex", tokens: row.tokens }));
  const modelRows = p.models.slice(0, 3).map((row) => ({ label: row.model, tokens: row.tokens }));
  const qr = (await QRCode.toString(profileUrl, { type: "svg", errorCorrectionLevel: "M", margin: 3, width: 224, color: { dark: "#111611", light: "#ffffff" } })).replace("<svg ", '<svg x="793" y="1077" ');
  const background = theme === "ivory" ? "#efe8d8" : theme === "terminal" ? "url(#terminal-bg)" : theme === "aurora" ? "url(#aurora-bg)" : "#090c0a";
  const pattern = theme === "ivory" ? '<pattern id="card-pattern" width="32" height="32" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r="2" fill="#192019" opacity=".12"/></pattern>' : `<pattern id="card-pattern" width="42" height="42" patternUnits="userSpaceOnUse"><path d="M42 0H0V42" fill="none" stroke="${accent}" stroke-width="1" opacity=".16"/></pattern>`;
  const heatmap = activity.weeks.flatMap((week, weekIndex) => week.map((cell, dayIndex) => `<rect x="${58 + weekIndex * 40}" y="${588 + dayIndex * 25}" width="29" height="20" fill="${cell.level ? accent : foreground}" opacity="${cell.level ? .22 + cell.level * .16 : .08}"/>`)).join("");
  const ranks = [
    ...(p.showRank ? [{ label: "GLOBAL RANK", value: p.rank ? `#${p.rank}` : "—" }, { label: "PERCENTILE", value: `TOP ${p.percentile < 1 ? p.percentile.toFixed(1) : Math.round(p.percentile)}%` }] : []),
    { label: "ACTIVE DAYS", value: String(p.activeDays) },
  ];
  const metrics = ranks.map((metric, index) => `<g transform="translate(${58 + index * 280} 838)"><text class="label">${escapeSvg(metric.label)}</text><text class="metric" y="48">${escapeSvg(metric.value)}</text></g>`).join("");
  const achievement = achievementFor(p.processedTokens, p.activeDays, p.codexTokens, p.claudeTokens).toUpperCase();
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350" data-share-layout="portrait-v3">
  <defs>
    <linearGradient id="terminal-bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#06101d"/><stop offset="1" stop-color="#071c28"/></linearGradient>
    <linearGradient id="aurora-bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0b1222"/><stop offset=".5" stop-color="#171230"/><stop offset="1" stop-color="#082423"/></linearGradient>
    <radialGradient id="aurora-glow"><stop stop-color="#956fff" stop-opacity=".55"/><stop offset="1" stop-color="#956fff" stop-opacity="0"/></radialGradient>
    ${pattern}
    <style>.text{font-family:Arial,"Noto Sans",sans-serif;fill:${foreground}}.label{font:700 14px Arial,"Noto Sans",sans-serif;letter-spacing:3px;fill:${foreground};opacity:.6}.metric{font:800 40px Arial,"Noto Sans",sans-serif;fill:${foreground}}</style>
  </defs>
  <rect width="1080" height="1350" fill="${background}"/>
  <rect width="1080" height="1350" fill="url(#card-pattern)" opacity="${theme === "ivory" ? .5 : .72}"/>
  ${theme === "aurora" ? '<circle cx="850" cy="260" r="360" fill="url(#aurora-glow)"/>' : ""}
  <g class="text">
    <text x="56" y="82" font-size="36" font-weight="900" letter-spacing="-2">LovTokens<tspan fill="${accent}">/</tspan></text>
    <text x="1024" y="78" font-size="15" letter-spacing="4" text-anchor="end" opacity=".7">ALL-TIME TOKEN PORTFOLIO</text>
    <text x="56" y="154" font-size="31" opacity=".62">@${escapeSvg(p.isAnonymous ? `anon-${p.handle.slice(-4)}` : p.handle)}</text>
    <text x="56" y="214" font-size="54" font-weight="800">${escapeSvg(p.displayName)}</text>
    <text x="56" y="368" fill="${accent}" font-size="158" font-weight="900" letter-spacing="-8">${escapeSvg(exact)}</text>
    <text x="56" y="407" font-size="17" letter-spacing="5" opacity=".58">${p.showExactTokens ? "TOKENS PROCESSED" : "EXACT TOTAL HIDDEN"}</text>
    <line x1="56" y1="520" x2="1024" y2="520" stroke="${accent}" opacity=".8"/>
    <text x="56" y="554" font-size="14" letter-spacing="3" opacity=".7">TOKEN ACTIVITY · 24 WEEKS</text>
    <text x="1024" y="554" font-size="14" text-anchor="end" letter-spacing="3" opacity=".7">${p.showExactTokens ? formatTokenCount(activity.total) : "PRIVATE"}</text>
    ${heatmap}
    <line x1="56" y1="785" x2="1024" y2="785" stroke="${accent}" opacity=".8"/>
    ${metrics}
    ${distributionSvg(sourceRows, 58, 944, 438, "AGENT DISTRIBUTION", accent, foreground, p.showExactTokens ? "NO AGENT DATA" : "AGENT DATA PRIVATE")}
    ${distributionSvg(modelRows, 584, 944, 438, "MODEL DISTRIBUTION", accent, foreground, p.showExactTokens && p.showModels ? "NO MODEL DATA" : "MODEL DATA PRIVATE")}
    <rect x="56" y="1247" width="${Math.min(520, achievement.length * 12 + 36)}" height="45" fill="none" stroke="${accent}"/>
    <text x="74" y="1276" fill="${accent}" font-size="17" letter-spacing="2">${escapeSvg(achievement)}</text>
    <text x="56" y="1321" font-size="15" opacity=".58">Usage is not a productivity score · LovTokens</text>
  </g>
  <rect x="786" y="1070" width="238" height="238" fill="#fff"/>
  ${qr}
</svg>`;
}

function distributionSvg(rows: Array<{ label: string; tokens: number }>, x: number, y: number, width: number, title: string, accent: string, foreground: string, empty: string) {
  const max = Math.max(1, ...rows.map((row) => row.tokens));
  const content = rows.length ? rows.map((row, index) => { const rowY = 38 + index * 48; return `<text x="0" y="${rowY}" font-size="16">${escapeSvg(row.label)}</text><text x="${width}" y="${rowY}" font-size="14" text-anchor="end" opacity=".58">${formatTokenCount(row.tokens)}</text><rect x="0" y="${rowY + 12}" width="${width}" height="8" fill="${foreground}" opacity=".18"/><rect x="0" y="${rowY + 12}" width="${(row.tokens / max) * width}" height="8" fill="${accent}"/>`; }).join("") : `<text y="40" font-size="16" opacity=".5">${empty}</text>`;
  return `<g transform="translate(${x} ${y})"><text font-size="14" letter-spacing="3" opacity=".65">${title}</text>${content}</g>`;
}

function escapeSvg(value: string) { return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" })[character] || character); }
function Metric({ label, value }: { label: string; value: string }) { return <div style={{ display: "flex", flexDirection: "column", gap: 7 }}><span style={{ fontSize: 14, letterSpacing: 3, opacity: .58 }}>{label}</span><strong style={{ fontSize: 40 }}>{value}</strong></div>; }

type ShareProfile = NonNullable<Awaited<ReturnType<typeof getShareProfile>>>;
type CardProps = { p: ShareProfile; background: string; accent: string; foreground: string; pattern: string; qr: string; theme: keyof typeof themes };

function LegacyCard({ p, background, accent, foreground, pattern, qr, theme, period, tall }: CardProps & { period: "month" | "all"; tall: boolean }) {
  const exact = p.showExactTokens ? formatTokenCount(p.processedTokens) : "PRIVATE"; const codexPercent = Math.round((p.codexTokens / Math.max(1, p.processedTokens)) * 100);
  return <div style={{ width: "100%", height: "100%", boxSizing: "border-box", display: "flex", flexDirection: "column", justifyContent: "space-between", background, color: foreground, padding: tall ? 78 : 64, fontFamily: "Arial", position: "relative", overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, display: "flex", opacity: theme === "ivory" ? .45 : .7, backgroundImage: pattern, backgroundSize: theme === "ivory" ? "32px 32px" : "42px 42px" }} />
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div style={{ display: "flex", fontSize: 34, fontWeight: 900, letterSpacing: -2 }}>LovTokens<span style={{ color: accent }}>/</span></div><div style={{ display: "flex", fontSize: 16, letterSpacing: 4 }}>{period === "month" ? "THIS MONTH · UTC" : "ALL-TIME PORTFOLIO"}</div></div>
    <div style={{ display: "flex", flexDirection: "column" }}><div style={{ display: "flex", fontSize: tall ? 38 : 28, opacity: .62 }}>@{p.isAnonymous ? `anon-${p.handle.slice(-4)}` : p.handle}</div><div style={{ display: "flex", fontSize: tall ? 62 : 46, fontWeight: 800, marginTop: 8 }}>{p.displayName}</div><div style={{ display: "flex", color: accent, fontSize: tall ? 180 : 132, fontWeight: 900, letterSpacing: -9, lineHeight: .9, marginTop: tall ? 130 : 45 }}>{exact}</div>{p.showExactTokens && <div style={{ display: "flex", fontSize: 18, letterSpacing: 5, marginTop: 22, opacity: .58 }}>TOKENS PROCESSED</div>}</div>
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}><div style={{ display: "flex", flexDirection: "column", gap: 20 }}><div style={{ display: "flex", gap: 52 }}>{p.showRank && <Metric label="GLOBAL RANK" value={p.rank ? `#${p.rank}` : "—"} />} {p.showRank && <Metric label="PERCENTILE" value={`TOP ${p.percentile < 1 ? p.percentile.toFixed(1) : Math.round(p.percentile)}%`} />}<Metric label="ACTIVE DAYS" value={String(p.activeDays)} /></div><div style={{ display: "flex", alignItems: "center", gap: 18, fontSize: 15, letterSpacing: 2 }}><div style={{ width: 300, height: 8, display: "flex", background: "#647067" }}><div style={{ width: `${codexPercent}%`, background: accent }} /></div><span>CODEX {codexPercent}% · CLAUDE {100 - codexPercent}%</span></div><div style={{ alignSelf: "flex-start", display: "flex", border: `1px solid ${accent}`, color: accent, padding: "10px 14px", fontSize: 16, letterSpacing: 2 }}>{achievementFor(p.processedTokens, p.activeDays, p.codexTokens, p.claudeTokens).toUpperCase()}</div><div style={{ display: "flex", fontSize: 13, opacity: .58 }}>Usage is not a productivity score · LovTokens</div></div><img alt="Profile QR code" src={qr} width={tall ? 170 : 130} height={tall ? 170 : 130} /></div>
  </div>;
}

function buildShareActivity(history: Array<{ date: string; tokens: number }>, today: string) {
  const dayMs = 86_400_000; const end = new Date(`${today}T00:00:00.000Z`).getTime(); const byDate = new Map(history.map((row) => [row.date, row.tokens]));
  const values = Array.from({ length: 168 }, (_, index) => byDate.get(new Date(end - (167 - index) * dayMs).toISOString().slice(0, 10)) || 0); const max = Math.max(1, ...values); const total = values.reduce((sum, value) => sum + value, 0);
  const cells = values.map((value) => ({ level: value <= 0 ? 0 : Math.max(1, Math.ceil((value / max) * 4)) }));
  return { total, weeks: Array.from({ length: 24 }, (_, index) => cells.slice(index * 7, index * 7 + 7)) };
}
