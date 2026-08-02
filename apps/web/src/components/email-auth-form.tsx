"use client";

import { useState } from "react";
import { LoaderCircle, LogIn, UserPlus } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

type Mode = "sign-in" | "sign-up";

export function EmailAuthForm({ callbackURL, locale = "en", initialMode = "sign-in", allowModeSwitch = true }: { callbackURL: string; locale?: Locale; initialMode?: Mode; allowModeSwitch?: boolean }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(formData: FormData) {
    setLoading(true);
    setMessage("");
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    const result = mode === "sign-up"
      ? await authClient.signUp.email({
          name: String(formData.get("name") || "").trim(),
          email,
          password,
          callbackURL,
        })
      : await authClient.signIn.email({ email, password, callbackURL, rememberMe: true });

    if (result.error) {
      setMessage(authError(locale, result.error.code, result.error.message));
      setLoading(false);
      return;
    }

    window.location.assign(callbackURL);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setMessage("");
  }

  return (
    <div className="email-auth">
      {allowModeSwitch && <div className="auth-tabs" role="tablist" aria-label={t(locale, "Email account action")}>
        <button aria-selected={mode === "sign-in"} onClick={() => switchMode("sign-in")} role="tab" type="button">
          {t(locale, "Sign in")}
        </button>
        <button aria-selected={mode === "sign-up"} onClick={() => switchMode("sign-up")} role="tab" type="button">
          {t(locale, "Create account")}
        </button>
      </div>}
      <form action={submit} className="auth-form">
        {mode === "sign-up" && (
          <label>
            <span>{t(locale, "Name")}</span>
            <input autoComplete="name" maxLength={60} name="name" required />
          </label>
        )}
        <label>
          <span>{t(locale, "Email")}</span>
          <input autoComplete="email" name="email" required type="email" />
        </label>
        <label>
          <span>{t(locale, "Password")}</span>
          <input autoComplete={mode === "sign-up" ? "new-password" : "current-password"} maxLength={128} minLength={8} name="password" required type="password" />
          {mode === "sign-up" && <small>{t(locale, "Use at least 8 characters.")}</small>}
        </label>
        <button className="primary-button" disabled={loading} type="submit">
          {loading ? <LoaderCircle className="spin" size={17} /> : mode === "sign-up" ? <UserPlus size={17} /> : <LogIn size={17} />}
          {t(locale, mode === "sign-up" ? "Create account with email" : "Sign in with email")}
        </button>
        {message && <p className="auth-error" role="alert">{message}</p>}
      </form>
    </div>
  );
}

function authError(locale: Locale, code?: string, message?: string) {
  const value = `${code || ""} ${message || ""}`.toLowerCase();
  if (value.includes("invalid_email_or_password") || value.includes("invalid email or password")) return t(locale, "Incorrect email or password.");
  if (value.includes("email_not_verified") || value.includes("email not verified")) return t(locale, "Verify your email before signing in. A new verification email has been sent.");
  if (value.includes("user_already_exists") || value.includes("already exists")) return t(locale, "This email is already registered. Sign in instead.");
  return t(locale, "Could not complete authentication. Please try again.");
}
