"use client";

import { useState } from "react";
import { Bot, Check, Copy, ExternalLink, TerminalSquare } from "lucide-react";
import type { Locale } from "@/lib/i18n";

type Mode = "agent" | "cli";

export function AgentRegistrationGuide({ content, documentUrl, locale, serverUrl }: { content: string; documentUrl: string; locale: Locale; serverUrl: string }) {
  const [mode, setMode] = useState<Mode>("agent");
  const [copied, setCopied] = useState("");
  const manualCommand = `npx lovtokens@latest agent-register --server ${serverUrl}`;

  async function copy(value: string, key: string) {
    await navigator.clipboard.writeText(value);
    setCopied(key);
    setTimeout(() => setCopied(""), 1800);
  }

  return (
    <div className="agent-guide">
      <div aria-label={locale === "zh" ? "选择配置方式" : "Choose setup method"} className="setup-tabs" role="tablist">
        <button aria-controls="agent-setup-panel" aria-selected={mode === "agent"} onClick={() => setMode("agent")} role="tab" type="button"><Bot size={17} /> {locale === "zh" ? "让 Agent 配置" : "Set up with Agent"}<small>{locale === "zh" ? "推荐" : "Recommended"}</small></button>
        <button aria-controls="cli-setup-panel" aria-selected={mode === "cli"} onClick={() => setMode("cli")} role="tab" type="button"><TerminalSquare size={17} /> {locale === "zh" ? "手动配置" : "Manual setup"}</button>
      </div>

      {mode === "agent" ? (
        <div className="agent-setup-panel simple-agent-panel" id="agent-setup-panel" role="tabpanel">
          <span className="simple-kicker">{locale === "zh" ? "推荐 · 自动适配当前系统" : "RECOMMENDED · MATCHES YOUR SYSTEM"}</span>
          <h2>{locale === "zh" ? "把这一句话发给 Codex 或 Claude Code" : "Send this sentence to Codex or Claude Code"}</h2>
          <p>{locale === "zh" ? "Agent 会询问邮箱、昵称和隐私选择，然后完成注册与自动采集配置。" : "Your agent asks for email, nickname, and privacy choices, then completes registration and collection setup."}</p>
          <div className="simple-handoff"><code>{content}</code></div>
          <button className="simple-copy-button" onClick={() => copy(content, "handoff")} type="button">
            {copied === "handoff" ? <Check size={18} /> : <Copy size={18} />}
            {copied === "handoff" ? (locale === "zh" ? "已复制，可以发送了" : "Copied — ready to send") : (locale === "zh" ? "复制推荐语" : "Copy recommendation")}
          </button>
          <a className="simple-doc-link" href={documentUrl} rel="noreferrer" target="_blank">{locale === "zh" ? "查看 Agent 将执行的完整说明" : "See the full instructions your agent will follow"} <ExternalLink size={13} /></a>
        </div>
      ) : (
        <div className="cli-setup-panel simple-cli-panel" id="cli-setup-panel" role="tabpanel">
          <span className="simple-kicker">{locale === "zh" ? "手动方式" : "MANUAL SETUP"}</span>
          <h2>{locale === "zh" ? "运行 1 条命令即可" : "Run one command"}</h2>
          <p className="manual-intro">{locale === "zh" ? "终端会逐项询问并完成账号、隐私、首次同步和可选定时采集。" : "The terminal walks you through account, privacy, first sync, and optional scheduled collection."}</p>
          <button aria-label={locale === "zh" ? "复制配置命令" : "Copy setup command"} className="single-cli-command" onClick={() => copy(manualCommand, "manual-command")} type="button">
            <code>{manualCommand}</code>{copied === "manual-command" ? <Check size={16} /> : <Copy size={16} />}
          </button>
          <div className="manual-result" aria-label={locale === "zh" ? "命令执行内容" : "What the command configures"}>
            <span><Check size={13} /> {locale === "zh" ? "创建账号" : "Account"}</span>
            <span><Check size={13} /> {locale === "zh" ? "首次同步" : "First sync"}</span>
            <span><Check size={13} /> {locale === "zh" ? "可选自动更新" : "Optional updates"}</span>
          </div>
          <p className="cli-extra">{locale === "zh" ? <>想先查看上传数据？运行 <code>npx lovtokens@latest show-data</code>。</> : <>Want to inspect the payload first? Run <code>npx lovtokens@latest show-data</code>.</>}</p>
        </div>
      )}
    </div>
  );
}
