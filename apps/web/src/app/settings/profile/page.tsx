import { headers } from "next/headers";
import { SettingsForm } from "@/components/settings-form";
import { getSession } from "@/lib/auth";
import { getPrivateSummary } from "@/lib/private-repository";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { PROFILE_STATEMENT_MAX_LENGTH } from "@/lib/profile-settings";
export default async function ProfileSettings() { const locale = await getLocale(); const s = await getSession(await headers()); const d = s?.user ? await getPrivateSummary(s.user.id) : null; return <><h1>{t(locale, "Profile.")}</h1><p className="dashboard-intro">{t(locale, "Make the page sound like you, not just your numbers.")}</p><SettingsForm locale={locale} initial={{ handle: String(d?.profile.handle || ""), displayName: String(d?.profile.display_name || s?.user.name || ""), statement: String(d?.profile.statement || ""), isAnonymous: Boolean(d?.profile.is_anonymous) }} fields={[{ key: "handle", label: t(locale, "Public handle"), help: t(locale, "Lowercase letters, numbers and hyphens."), type: "text" }, { key: "displayName", label: t(locale, "Display name"), help: t(locale, "Shown only when anonymous mode is off."), type: "text" }, { key: "statement", label: t(locale, "Builder statement"), help: t(locale, "Add a short opinion, motto, or belief to the top of your public profile."), type: "textarea", maxLength: PROFILE_STATEMENT_MAX_LENGTH }, { key: "isAnonymous", label: t(locale, "Anonymous mode"), help: t(locale, "Show a stable anonymous label and no avatar."), type: "toggle" }]} /></>; }
