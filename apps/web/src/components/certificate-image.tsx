import { formatTokenCount } from "@/lib/format";
import type { CertificateRecord } from "@/lib/data";
import type { Locale } from "@/lib/i18n";
/* eslint-disable @next/next/no-img-element -- the server-rendered SVG embeds the QR data URI directly */

type Props = {
  certificate: CertificateRecord;
  locale: Locale;
  proof: "invalid" | "hash-verified" | "signature-verified";
  qr: string;
  style?: AchievementCardStyle;
};

export type AchievementCardStyle = "collector" | "archive";

type CardTheme = {
  code: string;
  mark: string;
  name: { en: string; zh: string };
  background: string;
  accent: string;
  secondary: string;
  pattern: string;
};

const milestoneThemes: Array<{ minimum: number; theme: CardTheme }> = [
  { minimum: 100_000_000_000, theme: { code: "M—05", mark: "V", name: { en: "Gilded Legend", zh: "鎏金传奇" }, background: "#18140c", accent: "#f2d27f", secondary: "#9c681f", pattern: "repeating-linear-gradient(118deg,rgba(242,210,127,.1) 0px,rgba(242,210,127,.1) 1px,transparent 1px,transparent 30px)" } },
  { minimum: 50_000_000_000, theme: { code: "M—04", mark: "IV", name: { en: "Amethyst Orbit", zh: "紫晶轨道" }, background: "#151020", accent: "#c49aef", secondary: "#684697", pattern: "repeating-radial-gradient(circle at 50% 35%,transparent 0 31px,rgba(196,154,239,.11) 32px 33px)" } },
  { minimum: 10_000_000_000, theme: { code: "M—03", mark: "III", name: { en: "Sapphire Signal", zh: "蓝宝石信标" }, background: "#0c1520", accent: "#79c5f2", secondary: "#305e9f", pattern: "linear-gradient(rgba(121,197,242,.07) 1px,transparent 1px),linear-gradient(90deg,rgba(121,197,242,.07) 1px,transparent 1px)" } },
  { minimum: 1_000_000_000, theme: { code: "M—02", mark: "II", name: { en: "Jade Momentum", zh: "翡翠进阶" }, background: "#0e1813", accent: "#8ad9a4", secondary: "#326b49", pattern: "repeating-linear-gradient(135deg,rgba(138,217,164,.08) 0px,rgba(138,217,164,.08) 1px,transparent 1px,transparent 34px)" } },
  { minimum: 0, theme: { code: "M—01", mark: "I", name: { en: "Bronze Origin", zh: "青铜起点" }, background: "#1a130f", accent: "#d69a63", secondary: "#754628", pattern: "radial-gradient(circle at 50% 35%,rgba(214,154,99,.14) 0 2px,transparent 3px)" } },
];

const monthlyTheme: CardTheme = {
  code: "A—MONTH",
  mark: "M",
  name: { en: "Platinum Monthly", zh: "铂金月度" },
  background: "#111722",
  accent: "#cfddf2",
  secondary: "#5d75a5",
  pattern: "linear-gradient(rgba(207,221,242,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(207,221,242,.06) 1px,transparent 1px)",
};

export function achievementCardThemeFor(kind: string, processedTokens: number) {
  return kind === "monthly" ? monthlyTheme : milestoneThemes.find(({ minimum }) => processedTokens >= minimum)!.theme;
}

export function CertificateImage(props: Props) {
  return props.style === "archive" ? <ArchiveCertificateImage {...props} /> : <CollectorCertificateImage {...props} />;
}

function CollectorCertificateImage({ certificate: c, locale, proof, qr }: Props) {
  const monthly = c.kind === "monthly";
  const revoked = c.status !== "active";
  const theme = achievementCardThemeFor(c.kind, c.processedTokens);
  const title = monthly
    ? (locale === "zh" ? `${c.period} 月度成就` : `${c.period} Monthly Achievement`)
    : (locale === "zh" ? `${formatTokenCount(c.processedTokens)} Token 里程碑` : `${formatTokenCount(c.processedTokens)} Token Milestone`);
  const proofLabel = proof === "signature-verified"
    ? (locale === "zh" ? "签名与数据完整性已验证" : "Signature and data integrity verified")
    : proof === "hash-verified"
      ? (locale === "zh" ? "数据完整性已验证" : "Data integrity verified")
      : (locale === "zh" ? "验真失败" : "Verification failed");
  const issued = new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    day: "numeric", month: "short", year: "numeric",
  }).format(new Date(c.issuedAt * 1000));
  const foil = `linear-gradient(135deg,${theme.secondary},${theme.accent} 46%,#fff8d6 54%,${theme.accent} 63%,${theme.secondary})`;

  return <div style={{ background: theme.background, color: "#f6f3eb", display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif", height: "100%", overflow: "hidden", padding: 68, position: "relative", width: "100%" }}>
    <div style={{ backgroundImage: theme.pattern, backgroundSize: theme.code === "M—03" || monthly ? "40px 40px" : "50px 50px", display: "flex", inset: 0, opacity: .9, position: "absolute" }} />
    <div style={{ background: `radial-gradient(circle,${theme.secondary}aa 0%,${theme.secondary}22 44%,transparent 72%)`, display: "flex", height: 760, left: 160, position: "absolute", top: 80, width: 760 }} />
    <div style={{ border: `3px solid ${theme.accent}`, display: "flex", inset: 28, opacity: .82, position: "absolute" }} />
    <div style={{ border: `1px solid ${theme.accent}`, display: "flex", inset: 40, opacity: .38, position: "absolute" }} />
    {[{ left: 38, top: 38 }, { right: 38, top: 38 }, { bottom: 38, left: 38 }, { bottom: 38, right: 38 }].map((position, index) => <span key={index} style={{ ...position, background: theme.accent, display: "flex", height: 18, opacity: .9, position: "absolute", transform: "rotate(45deg)", width: 18 }} />)}

    <header style={{ alignItems: "center", display: "flex", justifyContent: "space-between", position: "relative" }}>
      <div style={{ alignItems: "center", display: "flex", gap: 13 }}><div style={{ display: "flex", flexWrap: "wrap", gap: 3, height: 31, transform: "rotate(-7deg)", width: 31 }}>{[0, 1, 2, 3].map((item) => <span key={item} style={{ background: item === 1 || item === 2 ? theme.accent : "#f6f3eb", display: "flex", height: 14, width: 14 }} />)}</div><div style={{ display: "flex", flexDirection: "column" }}><strong style={{ fontSize: 28, letterSpacing: -1 }}>LovTokens</strong><span style={{ fontSize: 11, letterSpacing: 4, marginTop: 4, opacity: .64 }}>VERIFIED COLLECTOR SERIES</span></div></div>
      <div style={{ alignItems: "flex-end", display: "flex", flexDirection: "column", gap: 6 }}><strong style={{ color: theme.accent, fontFamily: "monospace", fontSize: 18 }}>{theme.code}</strong><span style={{ fontFamily: "monospace", fontSize: 10, letterSpacing: 2, opacity: .55 }}>{c.id.slice(0, 12).toUpperCase()}</span></div>
    </header>

    <div style={{ alignItems: "center", display: "flex", flexDirection: "column", marginTop: 55, position: "relative" }}>
      <div style={{ alignItems: "center", background: foil, borderRadius: 999, display: "flex", height: 348, justifyContent: "center", padding: 7, width: 348 }}>
        <div style={{ alignItems: "center", background: theme.background, border: `2px solid ${theme.accent}`, borderRadius: 999, display: "flex", flexDirection: "column", height: "100%", justifyContent: "center", width: "100%" }}>
          <span style={{ fontSize: 12, fontWeight: 900, letterSpacing: 5, opacity: .68 }}>{monthly ? "ARCHIVE EDITION" : "MILESTONE TIER"}</span>
          <strong style={{ backgroundImage: foil, color: "transparent", display: "flex", fontFamily: "Georgia, serif", fontSize: 132, letterSpacing: -9, lineHeight: .9, marginTop: 9, WebkitBackgroundClip: "text" }}>{theme.mark}</strong>
          <span style={{ color: theme.accent, fontSize: 15, fontWeight: 900, letterSpacing: 3, marginTop: 8 }}>{theme.name[locale === "zh" || locale === "zh-tw" ? "zh" : "en"].toUpperCase()}</span>
        </div>
      </div>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 49, fontWeight: 500, letterSpacing: -2.5, lineHeight: 1, margin: "32px 0 0", textAlign: "center" }}>{title}</h1>
      <span style={{ fontSize: 21, marginTop: 12, opacity: .58 }}>{revoked ? (locale === "zh" ? "身份已撤回" : "Identity withdrawn") : c.displayName}</span>
      <strong style={{ backgroundImage: foil, color: "transparent", display: "flex", fontSize: 122, fontWeight: 900, letterSpacing: -8, lineHeight: .85, marginTop: 31, WebkitBackgroundClip: "text" }}>{formatTokenCount(c.processedTokens)}</strong>
      <span style={{ fontSize: 13, fontWeight: 900, letterSpacing: 6, marginTop: 16, opacity: .72 }}>{locale === "zh" ? "已处理 TOKEN" : "TOKENS PROCESSED"}</span>
    </div>

    <div style={{ borderBottom: `1px solid ${theme.accent}66`, borderTop: `1px solid ${theme.accent}66`, display: "flex", marginTop: "auto", padding: "22px 0", position: "relative" }}>
      <CardMetric label={locale === "zh" ? "全球排名" : "GLOBAL RANK"} value={c.rank ? `#${c.rank}` : "—"} />
      <CardMetric label={locale === "zh" ? "数据覆盖率" : "DATA COVERAGE"} value={`${c.coverage.toFixed(0)}%`} />
      <CardMetric label={locale === "zh" ? "获得日期" : "DATE EARNED"} value={issued} />
    </div>

    <footer style={{ alignItems: "flex-end", display: "flex", justifyContent: "space-between", marginTop: 25, position: "relative" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 690 }}>
        <div style={{ alignItems: "center", color: proof === "invalid" ? "#f16d63" : theme.accent, display: "flex", fontSize: 15, fontWeight: 900, gap: 9 }}><span style={{ background: proof === "invalid" ? "#f16d63" : theme.accent, borderRadius: 999, display: "flex", height: 9, width: 9 }} />{proofLabel}</div>
        <span style={{ fontFamily: "monospace", fontSize: 11, opacity: .44 }}>SHA-256 / {c.payloadHash.slice(0, 36)}…</span>
        <span style={{ border: `1px solid ${theme.accent}`, color: theme.accent, display: "flex", fontSize: 11, fontWeight: 900, letterSpacing: 2, padding: "8px 11px", textTransform: "uppercase" }}>{revoked ? (locale === "zh" ? "已撤销" : "Revoked") : c.trustLevel.replaceAll("-", " ")}</span>
      </div>
      <div style={{ alignItems: "center", display: "flex", flexDirection: "column", gap: 7 }}><div style={{ background: "#ffffff", border: `2px solid ${theme.accent}`, display: "flex", padding: 7 }}><img alt="Achievement proof QR code" height={120} src={qr} width={120} /></div><span style={{ color: theme.accent, fontSize: 10, fontWeight: 900, letterSpacing: 2 }}>{locale === "zh" ? "扫码查看证明" : "SCAN TO VERIFY"}</span></div>
    </footer>
    {revoked && <div style={{ border: "7px solid #cf4e45", color: "#cf4e45", display: "flex", fontSize: 60, fontWeight: 900, left: 320, padding: "14px 26px", position: "absolute", top: 590, transform: "rotate(-12deg)" }}>{locale === "zh" ? "已撤销" : "REVOKED"}</div>}
  </div>;
}

function ArchiveCertificateImage({ certificate: c, locale, proof, qr }: Props) {
  const monthly = c.kind === "monthly";
  const revoked = c.status !== "active";
  const theme = achievementCardThemeFor(c.kind, c.processedTokens);
  const accent = archiveAccentFor(theme.code);
  const title = monthly
    ? (locale === "zh" ? `${c.period} 月度成就` : `${c.period} Monthly Achievement`)
    : (locale === "zh" ? `${formatTokenCount(c.processedTokens)} Token 里程碑` : `${formatTokenCount(c.processedTokens)} Token Milestone`);
  const proofLabel = proof === "signature-verified"
    ? (locale === "zh" ? "签名与数据完整性已验证" : "Signature and data integrity verified")
    : proof === "hash-verified"
      ? (locale === "zh" ? "数据完整性已验证" : "Data integrity verified")
      : (locale === "zh" ? "验真失败" : "Verification failed");
  const issued = new Intl.DateTimeFormat(locale === "zh" ? "zh-CN" : "en-US", {
    day: "numeric", month: "short", year: "numeric",
  }).format(new Date(c.issuedAt * 1000));

  return <div style={{ background: "#f1ecdf", color: "#172033", display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif", height: "100%", overflow: "hidden", padding: "66px 70px 58px 104px", position: "relative", width: "100%" }}>
    <div style={{ background: accent, bottom: 0, display: "flex", left: 0, position: "absolute", top: 0, width: 34 }} />
    <div style={{ border: "2px solid #172033", display: "flex", inset: "28px 28px 28px 52px", opacity: .8, position: "absolute" }} />
    <div style={{ border: "1px solid rgba(23,32,51,.22)", display: "flex", inset: "39px 39px 39px 63px", position: "absolute" }} />
    <div style={{ background: `repeating-radial-gradient(circle at 84% 16%,transparent 0 21px,${accent}22 22px 23px)`, display: "flex", height: 610, position: "absolute", right: -90, top: -105, width: 610 }} />
    <div style={{ color: accent, display: "flex", fontFamily: "Georgia, serif", fontSize: 260, fontWeight: 700, letterSpacing: -25, lineHeight: 1, opacity: .09, position: "absolute", right: 55, top: 150 }}>{theme.mark}</div>

    <header style={{ alignItems: "flex-start", borderBottom: "1px solid rgba(23,32,51,.3)", display: "flex", justifyContent: "space-between", paddingBottom: 25, position: "relative" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}><strong style={{ fontSize: 30, letterSpacing: -2 }}>LovTokens Archive</strong><span style={{ fontSize: 11, letterSpacing: 4 }}>CURATED ACHIEVEMENT RECORD</span></div>
      <div style={{ alignItems: "flex-end", display: "flex", flexDirection: "column", gap: 7 }}><strong style={{ color: accent, fontFamily: "monospace", fontSize: 19 }}>{theme.code}</strong><span style={{ fontFamily: "monospace", fontSize: 11 }}>{c.id.slice(0, 12).toUpperCase()}</span></div>
    </header>

    <div style={{ display: "flex", flexDirection: "column", marginTop: 92, position: "relative" }}>
      <div style={{ alignItems: "center", display: "flex", gap: 12 }}><span style={{ background: accent, color: "#f1ecdf", display: "flex", fontSize: 12, fontWeight: 900, letterSpacing: 3, padding: "10px 13px" }}>{locale === "zh" ? "典藏档案版" : "ARCHIVE EDITION"}</span><span style={{ color: accent, fontSize: 14, fontWeight: 900, letterSpacing: 3 }}>{theme.name[locale === "zh" || locale === "zh-tw" ? "zh" : "en"].toUpperCase()}</span></div>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 58, fontWeight: 500, letterSpacing: -3.5, lineHeight: .98, margin: "31px 0 0", maxWidth: 790 }}>{title}</h1>
      <span style={{ fontFamily: "Georgia, serif", fontSize: 23, fontStyle: "italic", marginTop: 16, opacity: .58 }}>{revoked ? (locale === "zh" ? "身份已撤回" : "Identity withdrawn") : c.displayName}</span>
    </div>

    <div style={{ display: "flex", flexDirection: "column", marginTop: 105, position: "relative" }}>
      <span style={{ color: accent, fontSize: 14, fontWeight: 900, letterSpacing: 6 }}>{locale === "zh" ? "累计已处理" : "AGGREGATE PROCESSED"}</span>
      <strong style={{ color: "#172033", display: "flex", fontSize: 164, fontWeight: 900, letterSpacing: -13, lineHeight: .82, marginTop: 18 }}>{formatTokenCount(c.processedTokens)}</strong>
      <span style={{ fontSize: 14, fontWeight: 900, letterSpacing: 7, marginTop: 23 }}>INPUT + OUTPUT TOKENS</span>
    </div>

    <div style={{ alignItems: "center", display: "flex", marginTop: "auto", position: "relative" }}>
      <div style={{ alignItems: "center", border: `3px solid ${accent}`, borderRadius: 999, color: accent, display: "flex", flexDirection: "column", height: 150, justifyContent: "center", padding: 8, transform: "rotate(-8deg)", width: 150 }}><div style={{ alignItems: "center", border: `1px solid ${accent}`, borderRadius: 999, display: "flex", flexDirection: "column", height: "100%", justifyContent: "center", width: "100%" }}><strong style={{ fontFamily: "Georgia, serif", fontSize: 47 }}>{theme.mark}</strong><span style={{ fontSize: 9, fontWeight: 900, letterSpacing: 2 }}>{locale === "zh" ? "典藏认证" : "ARCHIVED"}</span></div></div>
      <div style={{ borderBottom: "1px solid rgba(23,32,51,.3)", borderTop: "1px solid rgba(23,32,51,.3)", display: "flex", marginLeft: 35, padding: "24px 0", width: 700 }}>
        <ArchiveMetric label={locale === "zh" ? "全球排名" : "GLOBAL RANK"} value={c.rank ? `#${c.rank}` : "—"} />
        <ArchiveMetric label={locale === "zh" ? "数据覆盖率" : "DATA COVERAGE"} value={`${c.coverage.toFixed(0)}%`} />
        <ArchiveMetric label={locale === "zh" ? "获得日期" : "DATE EARNED"} value={issued} />
      </div>
    </div>

    <footer style={{ alignItems: "flex-end", display: "flex", justifyContent: "space-between", marginTop: 33, position: "relative" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 13, maxWidth: 670 }}>
        <div style={{ alignItems: "center", color: proof === "invalid" ? "#a83a32" : accent, display: "flex", fontSize: 15, fontWeight: 900, gap: 9 }}><span style={{ background: proof === "invalid" ? "#a83a32" : accent, borderRadius: 999, display: "flex", height: 9, width: 9 }} />{proofLabel}</div>
        <span style={{ fontFamily: "monospace", fontSize: 11, opacity: .48 }}>SHA-256 / {c.payloadHash.slice(0, 36)}…</span>
        <span style={{ fontSize: 11, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase" }}>{revoked ? (locale === "zh" ? "已撤销" : "Revoked") : c.trustLevel.replaceAll("-", " ")}</span>
      </div>
      <div style={{ alignItems: "center", display: "flex", flexDirection: "column", gap: 7 }}><div style={{ background: "white", border: `2px solid ${accent}`, display: "flex", padding: 7 }}><img alt="Achievement proof QR code" height={120} src={qr} width={120} /></div><span style={{ color: accent, fontSize: 10, fontWeight: 900, letterSpacing: 2 }}>{locale === "zh" ? "扫码查看证明" : "SCAN TO VERIFY"}</span></div>
    </footer>
    {revoked && <div style={{ border: "7px solid #a83a32", color: "#a83a32", display: "flex", fontSize: 60, fontWeight: 900, left: 320, padding: "14px 26px", position: "absolute", top: 590, transform: "rotate(-12deg)" }}>{locale === "zh" ? "已撤销" : "REVOKED"}</div>}
  </div>;
}

function archiveAccentFor(code: string) {
  if (code === "M—05") return "#9c681f";
  if (code === "M—04") return "#684696";
  if (code === "M—03") return "#285f8d";
  if (code === "M—02") return "#356b4b";
  if (code === "M—01") return "#875531";
  return "#40598f";
}

function ArchiveMetric({ label, value }: { label: string; value: string }) {
  return <div style={{ borderRight: "1px solid rgba(23,32,51,.22)", display: "flex", flexDirection: "column", gap: 8, padding: "0 20px", width: "33.333%" }}><span style={{ fontSize: 10, letterSpacing: 2, opacity: .55 }}>{label}</span><strong style={{ fontSize: 23 }}>{value}</strong></div>;
}

function CardMetric({ label, value }: { label: string; value: string }) {
  return <div style={{ borderRight: "1px solid rgba(255,255,255,.18)", display: "flex", flexDirection: "column", gap: 8, padding: "0 23px", width: "33.333%" }}><span style={{ fontSize: 11, letterSpacing: 3, opacity: .5 }}>{label}</span><strong style={{ fontSize: 25 }}>{value}</strong></div>;
}
