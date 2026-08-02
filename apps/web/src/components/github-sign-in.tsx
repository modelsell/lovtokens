"use client";
import { Code2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
export function GitHubSignIn({ callbackURL = "/dashboard", locale = "en" }: { callbackURL?: string; locale?: Locale }) { return <button className="primary-button" onClick={() => authClient.signIn.social({ provider: "github", callbackURL })} type="button"><Code2 size={17} /> {t(locale, "Continue with GitHub")}</button>; }
