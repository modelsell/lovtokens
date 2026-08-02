"use client";

import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import type { Locale } from "@/lib/i18n";
import { localePath, t } from "@/lib/i18n";

export function SignOutButton({ locale, className = "dashboard-sign-out" }: { locale: Locale; className?: string }) {
  async function signOut() {
    await authClient.signOut();
    window.location.assign(localePath("/", locale));
  }

  return <button className={className} onClick={signOut} type="button"><LogOut size={15} />{t(locale, "Sign out")}</button>;
}
