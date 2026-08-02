import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";
import type { Locale } from "@/lib/i18n";

type Props = {
  locale: Locale;
  href: string;
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  hrefLang?: string;
  ariaLabel?: string;
  reload?: boolean;
};

export function LocaleLink({ locale, href, children, className, style, hrefLang, ariaLabel, reload = false }: Props) {
  const props = { href, className, style, hrefLang, "aria-label": ariaLabel };
  return locale === "zh" || reload ? <a {...props}>{children}</a> : <Link {...props}>{children}</Link>;
}
