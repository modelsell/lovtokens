import { headers } from "next/headers";
import { DeviceList } from "@/components/device-list";
import { getSession } from "@/lib/auth";
import { getDevices } from "@/lib/private-repository";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
export default async function DevicesSettings() { const locale = await getLocale(); const s = await getSession(await headers()); const rows = s?.user ? await getDevices(s.user.id) : []; return <><h1>{t(locale, "Devices.")}</h1><DeviceList devices={rows} locale={locale} /></>; }
