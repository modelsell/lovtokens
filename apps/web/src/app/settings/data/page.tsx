import { DataActions } from "@/components/data-actions";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
export default async function DataSettings() { const locale = await getLocale(); return <><h1>{t(locale, "Your data.")}</h1><DataActions locale={locale} /></>; }
