import { PageHero } from "@/components/page-hero";
import { t } from "@/lib/i18n";
import { getLocale, localizedMetadata } from "@/lib/i18n-server";

export const generateMetadata = () => localizedMetadata({
  path: "/methodology",
  title: "Token Counting Methodology",
  zhTitle: "Token 统计方法",
  description: "How LovTokens normalizes Codex, Claude Code, and WorkBuddy token events without double counting cache or reasoning tokens.",
  zhDescription: "LovTokens 如何统一 Codex、Claude Code 与 WorkBuddy Token 事件，并避免重复统计缓存或推理 Token。",
});

export default async function MethodologyPage() {
  const locale = await getLocale();
  return <>
    <PageHero
      eyebrow={t(locale, "Open methodology · Schema v1")}
      title={t(locale, "The numbers have rules.")}
      description={t(locale, "A conservative, auditable counting model for three agent log formats—and an explicit line between usage and value.")}
    />
    <article className="shell prose-shell">
      <h2>{t(locale, "The headline metric")}</h2>
      <pre><code>{`fresh input = input total - cache read - cache write\nprocessed tokens = input total + output total`}</code></pre>
      <p>{locale === "zh" ? "缓存读取和写入都是输入的组成部分，推理是输出的组成部分，两者都不会再次累加。这可以避免最常见的总量虚高问题。" : "Cache reads and writes are components of input. Reasoning is a component of output. Neither is added again. This prevents the most common source of inflated totals."}</p>

      <h2>{t(locale, "Source adapters")}</h2>
      <h3>Codex</h3>
      <p>{locale === "zh" ? <>Codex 日志可能报告累计的 <code>token_count</code>。适配器会按会话计算非负增量，并把计数器重置视为新的累计区段，绝不估算缺失事件。</> : <>Codex logs may report cumulative <code>token_count</code> values. The adapter calculates non-negative deltas per session and treats counter resets as a new cumulative segment. It never estimates a missing event.</>}</p>
      <h3>Claude Code</h3>
      <p>{locale === "zh" ? "Claude Code 会同时报告非缓存输入、缓存创建和缓存读取。LovTokens 只把这些组成部分相加一次来重建完整输入，并保留各组成部分用于明细分析。" : "Claude Code reports uncached input alongside cache creation and cache reads. LovTokens reconstructs complete input by adding those components once, then keeps the components visible for breakdowns."}</p>
      <h3>WorkBuddy</h3>
      <p>{locale === "zh" ? <>WorkBuddy 会在完成的本地响应事件中记录输入、输出、缓存命中和推理 Token。适配器只读取这些用量字段、模型、时间与会话标识，并把缓存视为输入总量的组成部分。</> : <>WorkBuddy records input, output, cache-hit, and reasoning tokens on completed local response events. The adapter reads only those usage fields, model, time, and session identity, and treats cache as a component of total input.</>}</p>

      <h2>{t(locale, "Coverage")}</h2>
      <p>{locale === "zh" ? "包含有效 Token 事件的会话视为完整。发现会话但没有可用事件时会产生覆盖缺口。缺失使用量不会被静默转为零，也绝不会被猜测。" : "A session with valid token events is complete. A discovered session without usable events creates a coverage gap. Missing usage is not silently converted to zero and is never guessed."}</p>

      <h2 id="verification">{t(locale, "Trust levels")}</h2>
      <table><thead><tr><th>{t(locale, "Level")}</th><th>{t(locale, "Meaning")}</th><th>{t(locale, "Public board")}</th></tr></thead><tbody>
        <tr><td>{locale === "zh" ? "采集器检查" : "Collector Checked"}</td><td>{locale === "zh" ? "已通过开源采集器结构和服务端异常检查。" : "Open collector schema and server anomaly checks passed."}</td><td>{t(locale, "Yes")}</td></tr>
        <tr><td>{locale === "zh" ? "服务商验证" : "Provider Verified"}</td><td>{locale === "zh" ? "为未来由服务商支持的验证路径预留。" : "Reserved for a future provider-supported verification path."}</td><td>{t(locale, "Yes")}</td></tr>
        <tr><td>{locale === "zh" ? "导入" : "Imported"}</td><td>{locale === "zh" ? "用户自行提供的汇总数据。" : "User-supplied aggregate data."}</td><td>{t(locale, "No")}</td></tr>
      </tbody></table>

      <h2>{t(locale, "Rank rules")}</h2>
      <p>{locale === "zh" ? "默认榜单按当前 UTC 自然月统计。相同总量先比较活跃天数，再比较达到该分数的最早时间。隔离的异常记录和导入数据保持私密。" : "The default board is the current UTC calendar month. Ties compare active days, then the earliest time the score was reached. Quarantined anomalies and imported records stay private."}</p>
      <div className="callout"><strong>{t(locale, "Usage is not productivity.")}</strong><br />{locale === "zh" ? "更多 Token 可能代表更大的任务、更长的上下文、重试、探索，也可能代表低效。LovTokens 不评价技能、影响力或代码质量。" : "More tokens can mean larger tasks, longer context, retries, exploration—or inefficiency. LovTokens does not score skill, impact, or code quality."}</div>
    </article>
  </>;
}
