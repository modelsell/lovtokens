import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { localePath } from "@/lib/i18n";
import { getLocale, getRequestedPath } from "@/lib/i18n-server";
import { getViewer } from "@/lib/viewer";
import { ShareSignupAttribution } from "@/components/share-signup-attribution";
export const metadata = { robots: { index: false, follow: false } };
export default async function DashboardLayout({ children }: { children: React.ReactNode }) { const [locale, viewer, path] = await Promise.all([getLocale(), getViewer(), getRequestedPath()]); if (!viewer) redirect(`${localePath("/login", locale)}?returnTo=${encodeURIComponent(path)}`); return <div className="shell dashboard-shell"><ShareSignupAttribution stage="complete" /><DashboardNav locale={locale} /><section className="dashboard-main">{children}</section></div>; }
