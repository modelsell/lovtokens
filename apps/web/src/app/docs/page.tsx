import { PageHero } from "@/components/page-hero";
import { t } from "@/lib/i18n";
import { getLocale, localizedMetadata } from "@/lib/i18n-server";

export const generateMetadata = () => localizedMetadata({ path: "/docs", title: "LovTokens Collector Documentation", zhTitle: "LovTokens 采集器文档", description: "Install, connect, inspect, sync and remove the open LovTokens token collector.", zhDescription: "安装、连接、检查、同步和移除开源 LovTokens Token 采集器。" });

export default async function DocsPage() {
  const locale = await getLocale();
  return <>
    <PageHero eyebrow={t(locale, "Collector docs · Node 20+")} title={t(locale, "One command, visible boundaries.")} description={t(locale, "Connect Codex, Claude Code, and WorkBuddy usage from macOS, Linux, or Windows without uploading the conversations behind the count.")} />
    <article className="shell prose-shell">
      <h2>{locale === "zh" ? "让 Agent 注册" : "Register through your agent"}</h2>
      <div className="docs-command"><code>/agent-register.md</code></div>
      <p>{locale === "zh" ? "从首页复制短指令并发送给 Codex、Claude Code 或 WorkBuddy。Agent 会访问生产环境的 /agent-register.md，读取完整隐私与操作说明，再询问邮箱、昵称、三档隐私范围和定时采集授权。CLI 在本机生成初始密码，注册账号与设备，执行首次同步，并且只显示一次密码。" : "Copy the short handoff from the homepage into Codex, Claude Code, or WorkBuddy. The agent opens the production /agent-register.md for the full privacy and execution workflow, then asks for email, nickname, one of three privacy levels, and scheduled-sync consent. The CLI generates the initial password locally, registers the account and device, runs the first sync, and shows the password once."}</p>

      <h2>{t(locale, "Connect")}</h2>
      <div className="docs-command"><code>npx lovtokens@latest connect --server &lt;LovTokens URL&gt;</code></div>
      <p>{t(locale, "A browser opens with a one-time code. Create an account or sign in, approve that code, and the CLI performs its first scan.")}</p>

      <h2>{t(locale, "Inspect before upload")}</h2>
      <pre><code>npx lovtokens@latest show-data</code></pre>
      <p>{t(locale, "This prints the complete JSON payload. It contains schema version, collector version, a random device ID, timestamps, and aggregate usage buckets.")}</p>

      <h2>{t(locale, "Commands")}</h2>
      <table><tbody>
        <tr><td><code>lovtokens agent-register</code></td><td>{locale === "zh" ? "对话式创建账号、设备、隐私设置和可选定时采集。" : "Conversational account, device, privacy, and optional scheduled-sync setup."}</td></tr>
        <tr><td><code>lovtokens sync</code></td><td>{t(locale, "Rescan and replace absolute bucket values idempotently.")}</td></tr>
        <tr><td><code>lovtokens status</code></td><td>{t(locale, "Show sources, coverage, last sync and connection.")}</td></tr>
        <tr><td><code>lovtokens card</code></td><td>{t(locale, "Open the latest public share card.")}</td></tr>
        <tr><td><code>lovtokens auto-sync install</code></td><td>{t(locale, "Opt in to an hourly user-level task with daily automatic updates.")}</td></tr>
        <tr><td><code>lovtokens auto-sync remove</code></td><td>{t(locale, "Remove only the LovTokens task.")}</td></tr>
        <tr><td><code>lovtokens disconnect</code></td><td>{t(locale, "Revoke this device and delete local credentials.")}</td></tr>
      </tbody></table>

      <h2>{t(locale, "Data sources")}</h2>
      <p>{locale === "zh" ? <>Codex：<code>$CODEX_HOME/sessions</code> 和 <code>archived_sessions</code>。Claude Code：已知的 <code>~/.claude/projects</code> 兼容目录。WorkBuddy：<code>$WORKBUDDY_HOME/projects</code>，默认是 <code>~/.workbuddy/projects</code>。指向这些根目录之外的符号链接会被跳过。</> : <>Codex: <code>$CODEX_HOME/sessions</code> and <code>archived_sessions</code>. Claude Code: known <code>~/.claude/projects</code> compatible directories. WorkBuddy: <code>$WORKBUDDY_HOME/projects</code>, defaulting to <code>~/.workbuddy/projects</code>. Symlinks escaping these roots are skipped.</>}</p>

      <h2>{t(locale, "Credentials")}</h2>
      <p>{locale === "zh" ? <>采集器会优先使用操作系统凭据存储。便携式回退方案是权限限制为 <code>0600</code> 的配置文件。不会请求任何服务商 API Key。</> : <>The collector uses the operating system credential store when available. The portable fallback is a configuration file restricted to mode <code>0600</code>. No provider API key is requested.</>}</p>

      <h2>{t(locale, "Troubleshooting")}</h2>
      <h3>{t(locale, "No events found")}</h3>
      <p>{locale === "zh" ? <>运行 <code>lovtokens status</code>，对比扫描文件数与包含使用量的文件数。缺失事件会显示为覆盖率警告，而不会被估算为零。</> : <>Run <code>lovtokens status</code> and review files scanned versus files with usage. Missing events become a coverage warning, not an estimated zero.</>}</p>
      <h3>{t(locale, "Reset a device")}</h3>
      <p>{locale === "zh" ? <>运行 <code>lovtokens disconnect</code>，然后重新连接。智能体日志绝不会被修改。</> : <>Run <code>lovtokens disconnect</code>, then connect again. Agent logs are never altered.</>}</p>
    </article>
  </>;
}
