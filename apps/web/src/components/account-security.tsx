"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle, LogOut, MailCheck, Save, ShieldCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { localePath, t, type Locale } from "@/lib/i18n";

type SecuritySession = { id: string; createdAt: number; updatedAt: number; expiresAt: number; ipAddress: string | null; userAgent: string | null; current: boolean };

export function AccountSecurity({ locale, user, providers, initialSessions, emailDelivery }: { locale: Locale; user: { name: string; email: string; emailVerified: boolean }; providers: string[]; initialSessions: SecuritySession[]; emailDelivery: boolean }) {
  const [sessions, setSessions] = useState(initialSessions);
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const hasPassword = providers.includes("credential");

  async function updateName(formData: FormData) {
    setBusy("name"); setMessage("");
    const result = await authClient.updateUser({ name: String(formData.get("name") || "").trim() });
    setBusy(""); setMessage(result.error ? t(locale, "Could not update account.") : t(locale, "Account updated."));
    if (!result.error) window.location.reload();
  }

  async function changePassword(formData: FormData) {
    const currentPassword = String(formData.get("currentPassword") || "");
    const newPassword = String(formData.get("newPassword") || "");
    const confirmation = String(formData.get("confirmation") || "");
    if (newPassword !== confirmation) { setMessage(t(locale, "New passwords do not match.")); return; }
    setBusy("password"); setMessage("");
    const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
    setBusy(""); setMessage(result.error ? t(locale, "Could not change password. Check your current password.") : t(locale, "Password changed. Other sessions were revoked."));
    if (!result.error) setSessions((current) => current.filter((item) => item.current));
  }

  async function verifyEmail() {
    setBusy("verify"); setMessage("");
    const result = await authClient.sendVerificationEmail({ email: user.email, callbackURL: localePath("/settings/account?verified=1", locale) });
    setBusy(""); setMessage(result.error ? t(locale, "Could not send verification email.") : t(locale, "Verification email sent."));
  }

  async function revokeSession(id: string) {
    setBusy(id); setMessage("");
    const response = await fetch(`/api/settings/account/sessions/${encodeURIComponent(id)}`, { method: "DELETE" });
    setBusy("");
    if (response.ok) setSessions((current) => current.filter((item) => item.id !== id));
    else setMessage(t(locale, "Could not revoke session."));
  }

  async function revokeOthers() {
    setBusy("sessions"); setMessage("");
    const response = await fetch("/api/settings/account/sessions", { method: "DELETE" });
    setBusy("");
    if (response.ok) { setSessions((current) => current.filter((item) => item.current)); setMessage(t(locale, "Other sessions revoked.")); }
    else setMessage(t(locale, "Could not revoke sessions."));
  }

  return <div className="account-security-grid">
    <section className="panel account-panel"><div className="panel-head"><h2>{t(locale, "Account identity")}</h2><ShieldCheck size={18} /></div><form action={updateName} className="auth-form"><label><span>{t(locale, "Name")}</span><input defaultValue={user.name} maxLength={60} name="name" required /></label><label><span>{t(locale, "Email")}</span><input disabled value={user.email} /></label><div className="account-status"><span data-ok={user.emailVerified || undefined}>{user.emailVerified ? <CheckCircle2 size={14} /> : <MailCheck size={14} />}{user.emailVerified ? t(locale, "Email verified") : t(locale, "Email not verified")}</span><span>{t(locale, "Login methods")}: {providers.map(providerLabel).join(" · ") || "—"}</span></div>{!user.emailVerified && emailDelivery && <button className="secondary-button" disabled={busy === "verify"} onClick={verifyEmail} type="button">{busy === "verify" ? <LoaderCircle className="spin" size={16} /> : <MailCheck size={16} />}{t(locale, "Send verification email")}</button>}<button className="primary-button" disabled={busy === "name"} type="submit">{busy === "name" ? <LoaderCircle className="spin" size={16} /> : <Save size={16} />}{t(locale, "Save account")}</button></form></section>
    <section className="panel account-panel"><div className="panel-head"><h2>{t(locale, "Password")}</h2></div>{hasPassword ? <form action={changePassword} className="auth-form"><label><span>{t(locale, "Current password")}</span><input autoComplete="current-password" minLength={8} name="currentPassword" required type="password" /></label><label><span>{t(locale, "New password")}</span><input autoComplete="new-password" minLength={8} name="newPassword" required type="password" /></label><label><span>{t(locale, "Confirm new password")}</span><input autoComplete="new-password" minLength={8} name="confirmation" required type="password" /></label><small>{t(locale, "Changing your password revokes every other web session.")}</small><button className="primary-button" disabled={busy === "password"} type="submit">{busy === "password" ? <LoaderCircle className="spin" size={16} /> : <ShieldCheck size={16} />}{t(locale, "Change password")}</button></form> : <p className="form-message">{t(locale, "This account signs in through a social provider and has no password.")}</p>}</section>
    <section className="panel account-sessions"><div className="panel-head"><h2>{t(locale, "Web sessions")}</h2><button className="secondary-button" disabled={busy === "sessions" || sessions.length < 2} onClick={revokeOthers} type="button">{t(locale, "Revoke others")}</button></div><div className="session-list">{sessions.map((item) => <div key={item.id}><span><strong>{browserLabel(item.userAgent)}</strong><small>{item.current ? t(locale, "Current session") : `${item.ipAddress || t(locale, "Unknown IP")} · ${new Date(item.updatedAt * 1000).toLocaleString(locale === "zh" ? "zh-CN" : "en-US")}`}</small></span>{item.current ? <span className="current-pill">{t(locale, "Current")}</span> : <button aria-label={t(locale, "Revoke session")} disabled={busy === item.id} onClick={() => revokeSession(item.id)} type="button">{busy === item.id ? <LoaderCircle className="spin" size={15} /> : <LogOut size={15} />}</button>}</div>)}</div></section>
    {message && <p className="account-message" role="status">{message}</p>}
  </div>;
}

function providerLabel(value: string) { return value === "credential" ? "Email" : value === "github" ? "GitHub" : value; }
function browserLabel(value: string | null) { if (!value) return "Unknown browser"; if (value.includes("Edg/")) return "Microsoft Edge"; if (value.includes("Chrome/")) return "Chrome"; if (value.includes("Safari/") && !value.includes("Chrome/")) return "Safari"; if (value.includes("Firefox/")) return "Firefox"; return value.slice(0, 48); }
