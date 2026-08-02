"use client";
import { useState } from "react";
import { Check, LoaderCircle } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export function DeviceApproval({ initialCode, locale = "en" }: { initialCode: string; locale?: Locale }) {
  const [code, setCode] = useState(initialCode.toUpperCase()); const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle"); const [message, setMessage] = useState("");
  async function approve() { setState("loading"); const response = await fetch("/api/device/approve", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ userCode: code.trim().toUpperCase() }) }); const data = await response.json() as { error?: string }; if (!response.ok) { setState("error"); setMessage(t(locale, data.error || "Could not approve this device.")); return; } setState("done"); setMessage(t(locale, "Device approved. Return to your terminal; the first sync will start automatically.")); }
  return <div className="approval-form"><label htmlFor="device-code">{t(locale, "One-time device code")}</label><input id="device-code" maxLength={9} onChange={(event) => setCode(event.target.value)} placeholder="ABCD-2345" value={code} /><button className="primary-button" disabled={state === "loading" || state === "done"} onClick={approve} type="button">{state === "loading" ? <LoaderCircle className="spin" size={17} /> : <Check size={17} />} {t(locale, "Approve this device")}</button>{message && <p data-error={state === "error" || undefined}>{message}</p>}</div>;
}
