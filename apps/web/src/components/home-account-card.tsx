import { ArrowRight, EyeOff, RefreshCw, Trophy, UserRound } from "lucide-react";
import { formatRelativeTime, formatTokenCount } from "@/lib/format";
import type { Locale } from "@/lib/i18n";
import { localePath, t } from "@/lib/i18n";
import type { Viewer } from "@/lib/viewer";
import { LocaleLink } from "./locale-link";

export function HomeAccountCard({ locale, viewer, rank }: { locale: Locale; viewer: NonNullable<Viewer>; rank: { rank: number; total: number } | null }) {
  const link = (path: string) => localePath(path, locale);
  const hasUsage = viewer.stats.total > 0;
  return <section className="home-account shell"><div className="home-account-head"><div><span className="eyebrow">{t(locale, "Welcome back")}</span><h2>{viewer.user.name}</h2></div><span className="visibility-pill" data-public={viewer.profile?.isPublic || undefined}>{viewer.profile?.isPublic ? <UserRound size={14} /> : <EyeOff size={14} />}{viewer.profile?.isPublic ? t(locale, "Public profile") : t(locale, "Private profile")}</span></div>{hasUsage ? <><div className="home-account-stats"><div><small>{t(locale, "THIS MONTH")}</small><strong>{formatTokenCount(viewer.stats.month)}</strong></div><div><small>{t(locale, "TODAY")}</small><strong>{formatTokenCount(viewer.stats.today)}</strong></div><div><small>{t(locale, "ACTIVE DAYS")}</small><strong>{viewer.stats.activeDays}</strong></div><div><small>{t(locale, "MONTHLY RANK")}</small><strong>{rank ? `#${rank.rank}` : "—"}</strong></div></div><div className="home-account-foot"><span><RefreshCw size={14} />{t(locale, "Last sync")}: {formatRelativeTime(viewer.devices.lastSyncedAt, locale)} · {viewer.devices.active} {t(locale, "active devices")}</span><div><LocaleLink className="secondary-button" href={link("/settings/privacy")} locale={locale}>{t(locale, "Privacy settings")}</LocaleLink><LocaleLink className="primary-button" href={link("/dashboard")} locale={locale}>{t(locale, "Personal center")}<ArrowRight size={15} /></LocaleLink></div></div></> : <div className="home-account-empty"><Trophy size={36} /><div><h3>{t(locale, "Your account is ready.")}</h3><p>{t(locale, "Connect your first device to build your private token portfolio.")}</p></div><LocaleLink className="primary-button" href={link("/connect")} locale={locale}>{t(locale, "Connect device")}<ArrowRight size={15} /></LocaleLink></div>}</section>;
}
