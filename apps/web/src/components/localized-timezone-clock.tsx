"use client";

import { useEffect, useState } from "react";
import type { Locale } from "@/lib/i18n";
import { formatLocaleTimeZone, localeTimeZone } from "@/lib/locale-timezone";

export function LocalizedTimezoneClock({ baseLabel, initialNow, locale }: { baseLabel: string; initialNow: string; locale: Locale }) {
  const [now, setNow] = useState(() => new Date(initialNow));

  useEffect(() => {
    const update = () => setNow(new Date());
    update();
    const timer = window.setInterval(update, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const config = localeTimeZone(locale);
  return <span>{baseLabel} · <time dateTime={now.toISOString()} title={config.timeZone}>{formatLocaleTimeZone(locale, now)}</time></span>;
}
