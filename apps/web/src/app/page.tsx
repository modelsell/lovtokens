import type { Metadata } from "next";
import { ArrowRight, BarChart3, EyeOff, FileJson2, ScanLine, ShieldCheck, Sparkles, TerminalSquare } from "lucide-react";
import { CommandCopy } from "@/components/command-copy";
import { JsonLd } from "@/components/json-ld";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { ShareCardPreview } from "@/components/share-card-preview";
import { HomeAccountCard } from "@/components/home-account-card";
import { LocaleLink } from "@/components/locale-link";
import { getLeaderboard, getLeaderboardPosition } from "@/lib/repository";
import { formatTokenCount } from "@/lib/format";
import { languageAlternates, localePath, siteName, t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { siteUrl } from "@/lib/runtime";
import { getViewer } from "@/lib/viewer";

export async function generateMetadata(): Promise<Metadata> { const locale = await getLocale(); return { alternates: languageAlternates("/", locale) }; }
export default async function HomePage() {
  const locale = await getLocale();
  const link = (path: string) => localePath(path, locale);
  const viewer = await getViewer();
  const [leaders, viewerRank] = await Promise.all([getLeaderboard("month", "all", 3), viewer?.profile?.isPublic && viewer.profile.showRank ? getLeaderboardPosition(viewer.user.id, "month") : Promise.resolve(null)]);
  const tracked = leaders.reduce((sum, row) => sum + (row.showExactTokens ? row.processedTokens : 0), 0);
  const root = siteUrl();
  const name = siteName(locale);
  return <>
    <JsonLd data={[
      { "@context": "https://schema.org", "@type": "WebSite", name, url: root, description: "Your AI Token Portfolio." },
      { "@context": "https://schema.org", "@type": "SoftwareApplication", name: "LovTokens CLI", applicationCategory: "DeveloperApplication", operatingSystem: "macOS, Linux, Windows", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } },
      { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [
        { "@type": "Question", name: "Does LovTokens upload prompts or code?", acceptedAnswer: { "@type": "Answer", text: "No. The collector uploads only daily aggregate token counts, timestamps, model names, coverage and non-reversible session fingerprints." } },
        { "@type": "Question", name: "Is a high token count a productivity score?", acceptedAnswer: { "@type": "Answer", text: "No. LovTokens ranks measured usage, not productivity, skill or code quality." } },
      ] },
    ]} />
    {viewer && <HomeAccountCard locale={locale} rank={viewerRank} viewer={viewer} />}
    <section className="hero"><div className="shell hero-grid"><div className="hero-copy"><span className="eyebrow">{t(locale, "Private by design · Open collector")}</span><h1>{locale === "zh" ? <>{"统计。"}<em>排名。</em>{"分享。"}</> : <>{"Count it."}<em>Rank it.</em>{"Share it."}</>}</h1><p className="hero-lead">{t(locale, "Turn your Codex and Claude Code activity into a private token portfolio, a transparent public rank, and a certificate worth sharing.")}</p><CommandCopy /><div className="hero-assurance"><span><ShieldCheck size={13} /> {t(locale, "No prompts or code")}</span><span><TerminalSquare size={13} /> macOS · Linux · Windows</span><span><EyeOff size={13} /> {t(locale, "You control every public field")}</span></div></div><div className="hero-visual"><span className="sample-tag">{t(locale, "CONCEPT PREVIEW · NOT LIVE DATA")}</span><ShareCardPreview locale={locale} sample /></div></div></section>
    <section className="stats-band"><div className="shell stats-grid"><div><small>{t(locale, "PUBLIC BUILDERS")}</small><strong>{leaders.length || "—"}</strong></div><div><small>{t(locale, "MONTHLY TOKENS ON BOARD")}</small><strong>{tracked ? formatTokenCount(tracked) : "—"}</strong></div><div><small>{t(locale, "SUPPORTED AGENTS")}</small><strong>02</strong></div><div><small>{t(locale, "CONTENT UPLOADED")}</small><strong>0 bytes</strong></div></div></section>
    <section className="section shell"><div className="section-head"><div><span className="eyebrow">{t(locale, "Live board")}</span><h2>{t(locale, "Built from real syncs.")}</h2></div><p>{t(locale, "No invented profiles. No random growth counters. Public ranks appear only after users explicitly publish measured usage.")}</p></div><LeaderboardTable entries={leaders} compact locale={locale} /><p style={{ textAlign: "right", marginTop: 22 }}><LocaleLink className="section-link" href={link("/leaderboard")} locale={locale}>{t(locale, "Explore leaderboard")} <ArrowRight size={15} /></LocaleLink></p></section>
    <section className="section shell"><div className="section-head"><div><span className="eyebrow">{t(locale, "Three steps")}</span><h2>{t(locale, "From logs to a portfolio.")}</h2></div><p>{t(locale, "The collector looks only in known agent directories, extracts token events as a stream, and sends an inspectable aggregate.")}</p></div><div className="how-grid"><article className="how-card"><span>{t(locale, "01 / CONNECT")}</span><ScanLine /><h3>{t(locale, "Scan locally")}</h3><p>{t(locale, "Read Codex and Claude Code token events without recursively searching your home folder.")}</p></article><article className="how-card"><span>{t(locale, "02 / NORMALIZE")}</span><FileJson2 /><h3>{t(locale, "Inspect the payload")}</h3><p>{locale === "zh" ? <>使用 <code>lovtokens show-data</code>，在数据离开设备前查看每一个字段。</> : <>Use <code>lovtokens show-data</code> to see every field before it leaves your machine.</>}</p></article><article className="how-card"><span>{t(locale, "03 / PUBLISH")}</span><Sparkles /><h3>{t(locale, "Share your proof")}</h3><p>{t(locale, "Choose public fields, publish your profile, and export four original card formats.")}</p></article></div></section>
    <section className="privacy-band"><div className="shell privacy-grid"><div><span className="eyebrow">{t(locale, "A deliberate boundary")}</span><h2>{t(locale, "Your content stays yours.")}</h2><p>{t(locale, "LovTokens counts usage without building a second copy of your work. It never uploads prompts, replies, code, file paths, repository names, or API keys.")}</p><LocaleLink className="section-link" href={link("/privacy")} locale={locale}>{t(locale, "Read the privacy contract")} <ArrowRight size={15} /></LocaleLink></div><div className="privacy-list"><span><ShieldCheck size={17} /> {t(locale, "Aggregates only")}</span><span><EyeOff size={17} /> {t(locale, "Private by default")}</span><span><BarChart3 size={17} /> {t(locale, "Absolute-value upserts")}</span><span><FileJson2 size={17} /> {t(locale, "Open schema")}</span></div></div></section>
  </>;
}
