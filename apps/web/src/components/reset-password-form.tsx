"use client";

import { useState } from "react";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { localePath, t, type Locale } from "@/lib/i18n";

export function ResetPasswordForm({ locale, token }: { locale: Locale; token: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(formData: FormData) {
    const password = String(formData.get("password") || "");
    if (password !== String(formData.get("confirmation") || "")) { setMessage(t(locale, "New passwords do not match.")); return; }
    setLoading(true); setMessage("");
    const result = await authClient.resetPassword({ newPassword: password, token });
    setLoading(false);
    if (result.error) { setMessage(t(locale, "This reset link is invalid or expired.")); return; }
    window.location.assign(`${localePath("/login", locale)}?reset=1`);
  }
  return <form action={submit} className="auth-form"><label><span>{t(locale, "New password")}</span><input autoComplete="new-password" maxLength={128} minLength={8} name="password" required type="password" /></label><label><span>{t(locale, "Confirm new password")}</span><input autoComplete="new-password" maxLength={128} minLength={8} name="confirmation" required type="password" /></label><button className="primary-button" disabled={loading} type="submit">{loading ? <LoaderCircle className="spin" size={16} /> : <ShieldCheck size={16} />}{t(locale, "Reset password")}</button>{message && <p className="auth-error" role="alert">{message}</p>}</form>;
}
