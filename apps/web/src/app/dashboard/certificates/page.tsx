import { headers } from "next/headers";
import { LocaleLink } from "@/components/locale-link";
import { getSession } from "@/lib/auth";
import { getCertificatesForUser } from "@/lib/private-repository";
import { formatTokenCount } from "@/lib/format";
import { localePath, t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
export default async function CertificatesDashboard() { const locale = await getLocale(); const s = await getSession(await headers()); const rows: Array<Record<string, unknown>> = s?.user ? await getCertificatesForUser(s.user.id) : []; return <><h1>{t(locale, "Certificates.")}</h1><div className="settings-grid">{rows.length ? rows.map((c: Record<string, unknown>) => <LocaleLink className="setting-row" href={localePath(`/certificate/${c.id}`, locale)} key={String(c.id)} locale={locale}><span><strong>{String(c.kind)} · {String(c.period)}</strong><small>{String(c.status)}</small></span><strong>{formatTokenCount(Number(c.processed_tokens))}</strong></LocaleLink>) : <div className="setup-panel"><h2>{t(locale, "No frozen certificates yet")}</h2><p>{t(locale, "Complete calendar months and milestone thresholds are issued once, then kept immutable.")}</p></div>}</div></>; }
