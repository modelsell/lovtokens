import type { Metadata } from "next";
import { ArrowRight, BarChart3, Bot, Clock3, Copy, EyeOff, FileJson2, ShieldCheck } from "lucide-react";
import { AgentRegistrationGuide } from "@/components/agent-registration-guide";
import { JsonLd } from "@/components/json-ld";
import { LeaderboardTable } from "@/components/leaderboard-table";
import { HomeAccountCard } from "@/components/home-account-card";
import { LocaleLink } from "@/components/locale-link";
import { agentRegistrationHandoff } from "@/lib/agent-registration";
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
  const [leaders, viewerRank] = await Promise.all([getLeaderboard("month", "all", 10), viewer?.profile?.isPublic && viewer.profile.showRank ? getLeaderboardPosition(viewer.user.id, "month") : Promise.resolve(null)]);
  const tracked = leaders.reduce((sum, row) => sum + (row.showExactTokens ? row.processedTokens : 0), 0);
  const root = siteUrl();
  const name = siteName(locale);
  const registrationDocumentUrl = `${root}/agent-register.md`;
  const handoff = agentRegistrationHandoff(root, locale);
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
    <section className="hero agent-hero"><div className="shell hero-grid"><div className="hero-copy"><span className="eyebrow">{locale === "zh" ? "CODEX + CLAUDE CODE + WORKBUDDY" : "CODEX + CLAUDE CODE + WORKBUDDY"}</span><h1>{locale === "zh" ? <>看清你的<em>AI 编程用量。</em></> : <>See your<em>AI coding usage.</em></>}</h1><p className="hero-lead">{locale === "zh" ? "LovTokens 自动汇总 Codex、Claude Code 与 WorkBuddy 的 Token 使用量，生成个人趋势、模型分布和可选排行榜。" : "LovTokens turns Codex, Claude Code, and WorkBuddy token usage into personal trends, model breakdowns, and an optional leaderboard."}</p><div className="hero-assurance"><span><ShieldCheck size={13} /> {locale === "zh" ? "不上传对话和代码" : "No conversations or code"}</span><span><EyeOff size={13} /> {locale === "zh" ? "默认私密" : "Private by default"}</span><span><Clock3 size={13} /> {locale === "zh" ? "可选每小时更新" : "Optional hourly updates"}</span></div></div><div className="hero-visual" id="agent-register"><AgentRegistrationGuide content={handoff} documentUrl={registrationDocumentUrl} locale={locale} serverUrl={root} /></div></div></section>
    <section className="stats-band"><div className="shell stats-grid"><div><small>{t(locale, "PUBLIC BUILDERS")}</small><strong>{leaders.length || "—"}</strong></div><div><small>{t(locale, "MONTHLY TOKENS ON BOARD")}</small><strong>{tracked ? formatTokenCount(tracked) : "—"}</strong></div><div><small>{t(locale, "SUPPORTED AGENTS")}</small><strong>03</strong></div><div><small>{t(locale, "CONTENT UPLOADED")}</small><strong>0 bytes</strong></div></div></section>
    <section className="section shell"><div className="section-head"><div><span className="eyebrow">{t(locale, "Live board")}</span><h2>{t(locale, "Built from real syncs.")}</h2></div><p>{t(locale, "No invented profiles. No random growth counters. Public ranks appear only after users explicitly publish measured usage.")}</p></div><LeaderboardTable entries={leaders} compact locale={locale} /><p style={{ textAlign: "right", marginTop: 22 }}><LocaleLink className="section-link" href={link("/leaderboard")} locale={locale}>{t(locale, "Explore leaderboard")} <ArrowRight size={15} /></LocaleLink></p></section>
    <section className="section shell"><div className="section-head"><div><span className="eyebrow">{t(locale, "Three steps")}</span><h2>{locale === "zh" ? "注册变成一次对话。" : "Registration becomes a conversation."}</h2></div><p>{locale === "zh" ? "不再要求用户先理解 CLI、设备码和设置页面。Agent 负责执行，但每一项身份与公开选择仍由用户决定。" : "Users no longer need to understand the CLI, device codes, or settings pages first. The agent executes; the user still controls every identity and visibility choice."}</p></div><div className="how-grid"><article className="how-card"><span>01 / COPY</span><Copy /><h3>{locale === "zh" ? "复制短指令" : "Copy the handoff"}</h3><p>{locale === "zh" ? "只复制文档地址和一句执行要求，不再粘贴整篇说明。" : "Copy only the document URL and one execution sentence instead of the full guide."}</p></article><article className="how-card"><span>02 / READ</span><Bot /><h3>{locale === "zh" ? "Agent 读取 MD" : "The agent reads the MD"}</h3><p>{locale === "zh" ? "生产 URL 文档包含身份确认、隐私边界、执行步骤和完成标准。" : "The production document contains identity checks, privacy boundaries, execution steps, and completion rules."}</p></article><article className="how-card"><span>03 / COMPLETE</span><Clock3 /><h3>{locale === "zh" ? "自动注册与采集" : "Register and sync"}</h3><p>{locale === "zh" ? "创建账号和设备、首次同步，并可安装每小时执行、每天检查更新的本机任务。" : "Create the account and device, run the first sync, and optionally install an hourly task with daily update checks."}</p></article></div></section>
    <section className="privacy-band"><div className="shell privacy-grid"><div><span className="eyebrow">{t(locale, "A deliberate boundary")}</span><h2>{t(locale, "Your content stays yours.")}</h2><p>{t(locale, "LovTokens counts usage without building a second copy of your work. It never uploads prompts, replies, code, file paths, repository names, or API keys.")}</p><LocaleLink className="section-link" href={link("/privacy")} locale={locale}>{t(locale, "Read the privacy contract")} <ArrowRight size={15} /></LocaleLink></div><div className="privacy-list"><span><ShieldCheck size={17} /> {t(locale, "Aggregates only")}</span><span><EyeOff size={17} /> {t(locale, "Private by default")}</span><span><BarChart3 size={17} /> {t(locale, "Absolute-value upserts")}</span><span><FileJson2 size={17} /> {t(locale, "Open schema")}</span></div></div></section>
  </>;
}
