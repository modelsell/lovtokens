import { headers } from "next/headers";
import { ShareCardPreview } from "@/components/share-card-preview";
import { getSession } from "@/lib/auth";
import { getPrivateSummary } from "@/lib/private-repository";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
export default async function ShareStudio() { const locale = await getLocale(); const s = await getSession(await headers()); const d = s?.user ? await getPrivateSummary(s.user.id) : null; const handle = String(d?.profile.handle || "your-handle"); const download = locale === "zh" ? "下载" : "Download"; return <><h1>{t(locale, "Share studio.")}</h1><div className="panel"><ShareCardPreview displayName={String(d?.profile.display_name || s?.user.name || (locale === "zh" ? "你的名字" : "Your Name"))} handle={handle} tokens={d?.total || 0} activeDays={d?.activeDays || 0} locale={locale} /><div className="theme-list" style={{ marginTop: 20 }}><a href={`/share/${handle}/month.png?theme=obsidian`}>{download} 1200×630 · Obsidian</a><a href={`/share/${handle}/lifetime-square.png?theme=terminal`}>{download} 1080×1080 · Terminal</a><a href={`/share/${handle}/story.png?theme=aurora`}>{download} 1080×1920 · Aurora</a><a href={`/share/${handle}/certificate.png?theme=ivory`}>{download} 1600×900 · Ivory</a></div></div></>; }
