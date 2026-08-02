"use client";

import { useState } from "react";
import { LoaderCircle, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { t, type Locale } from "@/lib/i18n";

export function ForgotPasswordForm({ locale, redirectTo }: { locale: Locale; redirectTo: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  async function submit(formData: FormData) {
    setLoading(true); setMessage("");
    await authClient.requestPasswordReset({ email: String(formData.get("email") || "").trim(), redirectTo });
    setLoading(false); setMessage(t(locale, "If the account exists, a password-reset email has been sent."));
  }
  return <form action={submit} className="auth-form"><label><span>{t(locale, "Email")}</span><input autoComplete="email" name="email" required type="email" /></label><button className="primary-button" disabled={loading} type="submit">{loading ? <LoaderCircle className="spin" size={16} /> : <Mail size={16} />}{t(locale, "Send reset link")}</button>{message && <p className="auth-success" role="status">{message}</p>}</form>;
}
