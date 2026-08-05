"use client";

import { useState } from "react";
import { Link2Off } from "lucide-react";
import type { Locale } from "@/lib/i18n";

type SocialAccount = { provider: string; username: string | null; updatedAt: number };

export function ConnectedSocialAccounts({ initialAccounts, locale }: { initialAccounts: SocialAccount[]; locale: Locale }) {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");

  async function disconnect(provider: string) {
    setBusy(provider);
    setMessage("");
    try {
      const response = await fetch(`/api/social/${provider}/connection`, { method: "DELETE" });
      if (!response.ok) throw new Error(locale === "zh" ? "断开连接失败，请重试。" : "Could not disconnect the account. Try again.");
      setAccounts((current) => current.filter((account) => account.provider !== provider));
      setMessage(locale === "zh" ? "已删除本地保存的 X 授权。" : "The locally stored X authorization was removed.");
    } catch (error) { setMessage(error instanceof Error ? error.message : String(error)); }
    finally { setBusy(""); }
  }

  return <section className="panel account-panel">
    <div className="panel-head"><h2>{locale === "zh" ? "社交平台发布授权" : "Social publishing authorization"}</h2></div>
    {accounts.length ? <div className="connected-social-list">{accounts.map((account) => <div key={account.provider}><span><strong>X</strong><small>{account.username ? `@${account.username}` : (locale === "zh" ? "已连接账号" : "Connected account")}</small></span><button disabled={busy === account.provider} onClick={() => disconnect(account.provider)} type="button"><Link2Off size={14} />{locale === "zh" ? "断开连接" : "Disconnect"}</button></div>)}</div> : <p className="form-message">{locale === "zh" ? "尚未连接 X。首次点击“发布图片到 X”时会进入授权流程。" : "X is not connected. Authorization starts the first time you choose “Publish image to X”."}</p>}
    {message && <p className="form-message" aria-live="polite">{message}</p>}
  </section>;
}
