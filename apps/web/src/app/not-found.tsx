import { LocaleLink } from "@/components/locale-link";
import { localePath, t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
export default async function NotFound() { const locale = await getLocale(); return <section className="page-hero shell"><span className="eyebrow">404 / {locale === "zh" ? "未统计" : "not measured"}</span><h1>{t(locale, "There is nothing public here.")}</h1><p>{t(locale, "The profile may be private, empty, or removed. LovTokens never creates placeholder people to fill the board.")}</p><p style={{ marginTop: 30 }}><LocaleLink className="header-cta" href={localePath("/leaderboard", locale)} locale={locale}>{t(locale, "Return to leaderboard")}</LocaleLink></p></section>; }
