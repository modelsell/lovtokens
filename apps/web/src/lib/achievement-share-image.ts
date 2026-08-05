"use client";

import QRCode from "qrcode";
import { rasterizeSvgStringToPng } from "./client-png";

export type AchievementShareStyle = "signal" | "gallery";

type Options = {
  style: AchievementShareStyle;
  badgeImage: string;
  title: string;
  description: string;
  mark: string;
  targetLabel: string;
  displayName: string;
  handle: string;
  earnedLabel: string;
  canonicalUrl: string;
  isPublic: boolean;
};

function escapeXml(value: string) {
  return value.replace(/[<>&"']/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[character]!);
}

function wrap(value: string, width: number, lines = 2) {
  const words = value.includes(" ") ? value.split(/\s+/) : [...value];
  const separator = value.includes(" ") ? " " : "";
  const output: string[] = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current}${separator}${word}` : word;
    if (next.length > width && current) { output.push(current); current = word; } else current = next;
    if (output.length === lines - 1) break;
  }
  const consumed = output.join(separator).length;
  if (output.length === lines - 1 && consumed < value.length) {
    const remainder = value.slice(consumed + (separator ? 1 : 0));
    output.push(remainder.length > width ? `${remainder.slice(0, width - 1)}…` : remainder);
  } else if (current) output.push(current);
  return output.slice(0, lines);
}

async function dataUrl(source: string) {
  const response = await fetch(source);
  if (!response.ok) throw new Error(`Unable to load badge artwork (${response.status})`);
  const blob = await response.blob();
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error || new Error("Unable to read badge artwork"));
    reader.readAsDataURL(blob);
  });
}

export async function renderAchievementSharePng(options: Options) {
  const [art, qr] = await Promise.all([
    dataUrl(options.badgeImage),
    options.isPublic ? QRCode.toDataURL(options.canonicalUrl, { errorCorrectionLevel: "M", margin: 1, width: 190, color: { dark: "#11170f", light: "#f6f4eb" } }) : Promise.resolve(""),
  ]);
  const dark = options.style === "signal";
  const palette = dark
    ? { background: "#07110d", panel: "#101b15", line: "#2b3d31", ink: "#f4f5ec", muted: "#91a198", acid: "#c8f06a", glow: "#31572f" }
    : { background: "#eee9dc", panel: "#f8f5eb", line: "#c6c0b0", ink: "#172019", muted: "#656d63", acid: "#587a28", glow: "#d7e8b5" };
  const descriptionLines = wrap(options.description, /[\u3400-\u9fff]/.test(options.description) ? 24 : 45);
  const titleLines = wrap(options.title, /[\u3400-\u9fff]/.test(options.title) ? 12 : 24);
  const qrMarkup = qr
    ? `<rect x="824" y="1084" width="184" height="184" rx="18" fill="#f6f4eb"/><image href="${qr}" x="836" y="1096" width="160" height="160"/><text x="916" y="1292" fill="${palette.muted}" font-size="18" text-anchor="middle">SCAN COLLECTION</text>`
    : `<rect x="754" y="1142" width="254" height="74" rx="37" fill="${palette.panel}" stroke="${palette.line}"/><text x="881" y="1188" fill="${palette.muted}" font-size="20" font-weight="700" text-anchor="middle">PRIVATE COLLECTION</text>`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
    <defs><radialGradient id="glow" cx="50%" cy="36%" r="62%"><stop offset="0" stop-color="${palette.glow}" stop-opacity=".72"/><stop offset="1" stop-color="${palette.background}" stop-opacity="0"/></radialGradient><filter id="shadow"><feDropShadow dx="0" dy="28" stdDeviation="24" flood-color="#000" flood-opacity=".34"/></filter></defs>
    <rect width="1080" height="1350" fill="${palette.background}"/><circle cx="540" cy="410" r="520" fill="url(#glow)"/>
    <g font-family="Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif">
      <text x="72" y="91" fill="${palette.acid}" font-size="24" font-weight="900" letter-spacing="5">LOVTOKENS</text><text x="1008" y="91" fill="${palette.muted}" font-size="18" font-weight="700" letter-spacing="3" text-anchor="end">ACHIEVEMENT / ${escapeXml(options.mark)}</text>
      <rect x="72" y="132" width="936" height="692" rx="40" fill="${palette.panel}" stroke="${palette.line}" stroke-width="2"/>
      <circle cx="540" cy="466" r="280" fill="none" stroke="${palette.line}" stroke-width="2"/><circle cx="540" cy="466" r="230" fill="none" stroke="${palette.line}" stroke-dasharray="8 16" stroke-width="2"/>
      <image href="${art}" x="205" y="146" width="670" height="670" preserveAspectRatio="xMidYMid meet" filter="url(#shadow)"/>
      <rect x="98" y="158" width="150" height="48" rx="24" fill="${palette.background}" fill-opacity=".78" stroke="${palette.line}"/><text x="173" y="190" fill="${palette.muted}" font-size="17" font-weight="800" letter-spacing="2" text-anchor="middle">UNLOCKED</text>
      <rect x="72" y="858" width="${Math.max(190, Math.min(390, options.targetLabel.length * 21 + 70))}" height="54" rx="27" fill="${palette.acid}"/><text x="101" y="893" fill="${dark ? "#162014" : "#fff"}" font-size="20" font-weight="900" letter-spacing="2">${escapeXml(options.targetLabel)}</text>
      ${titleLines.map((line, index) => `<text x="72" y="${978 + index * 70}" fill="${palette.ink}" font-size="62" font-weight="900" letter-spacing="-2">${escapeXml(line)}</text>`).join("")}
      ${descriptionLines.map((line, index) => `<text x="72" y="${1080 + index * 38}" fill="${palette.muted}" font-size="27">${escapeXml(line)}</text>`).join("")}
      <line x1="72" y1="1154" x2="706" y2="1154" stroke="${palette.line}" stroke-width="2"/>
      <text x="72" y="1210" fill="${palette.ink}" font-size="28" font-weight="800">${escapeXml(options.displayName)}</text><text x="72" y="1248" fill="${palette.muted}" font-size="21">@${escapeXml(options.handle)}</text>
      <text x="72" y="1300" fill="${palette.muted}" font-size="18" font-weight="700" letter-spacing="2">${escapeXml(options.earnedLabel.toUpperCase())}</text>
      ${qrMarkup}
    </g>
  </svg>`;
  return rasterizeSvgStringToPng(svg, 1080, 1350);
}
