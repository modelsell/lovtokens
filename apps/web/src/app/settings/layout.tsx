import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { ensureProfile } from "@/lib/profile";
import { localePath } from "@/lib/i18n";
import { getLocale, getRequestedPath } from "@/lib/i18n-server";
import { getViewer } from "@/lib/viewer";
export const metadata = { robots: { index: false, follow: false } };
export default async function SettingsLayout({ children }: { children: React.ReactNode }) { const [locale, viewer, path] = await Promise.all([getLocale(), getViewer(), getRequestedPath()]); if (!viewer) redirect(`${localePath("/login", locale)}?returnTo=${encodeURIComponent(path)}`); await ensureProfile(viewer.user); return <div className="shell dashboard-shell"><DashboardNav locale={locale} /><section className="dashboard-main">{children}</section></div>; }
