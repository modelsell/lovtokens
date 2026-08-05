"use client";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

type Values = Record<string, string | boolean>;
type Field = { key: string; label: string; help: string; type: "text" | "textarea" | "toggle"; maxLength?: number };
export function SettingsForm({ initial, fields, locale = "en" }: { initial: Values; fields: Field[]; locale?: Locale }) {
  const [values, setValues] = useState(initial); const [message, setMessage] = useState("");
  async function save() { setMessage(t(locale, "Saving…")); const response = await fetch("/api/settings/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify(values) }); const data = await response.json() as { error?: string }; setMessage(response.ok ? t(locale, "Saved. New images will use a fresh privacy cache key.") : t(locale, data.error || "Could not save.")); }
  return <div className="settings-grid">{fields.map((field) => <label className={`setting-row${field.type === "textarea" ? " setting-row-long" : ""}`} key={field.key}><span><strong>{field.label}</strong><small>{field.help}</small></span>{field.type === "text" ? <input className="text-input" maxLength={field.maxLength} value={String(values[field.key] || "")} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} /> : field.type === "textarea" ? <span className="setting-textarea"><textarea className="text-input" maxLength={field.maxLength} rows={4} value={String(values[field.key] || "")} onChange={(event) => setValues({ ...values, [field.key]: event.target.value })} /><small>{String(values[field.key] || "").length} / {field.maxLength}</small></span> : <input checked={Boolean(values[field.key])} onChange={(event) => setValues({ ...values, [field.key]: event.target.checked })} type="checkbox" />}</label>)}<button className="primary-button" onClick={save} type="button">{t(locale, "Save changes")}</button>{message && <p className="form-message">{message}</p>}</div>;
}
