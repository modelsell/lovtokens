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
  id?: string;
};

export function LocaleLink({ locale, href, children, className, style, hrefLang, ariaLabel, reload = false, id }: Props) {
  const props = { href, className, style, hrefLang, id, "aria-label": ariaLabel };
  return locale !== "en" || reload ? <a {...props}>{children}</a> : <Link {...props}>{children}</Link>;
}
