import type { Locale } from "@/lib/i18n";
import { siteName } from "@/lib/i18n";

export function Brand({ href = "/", locale }: { href?: string; locale: Locale }) {
  const name = siteName(locale);
  return (
    <a className="brand" href={href} aria-label={locale === "zh" ? `${name}首页` : `${name} home`}>
      <span className="brand-mark" aria-hidden="true"><i /><i /><i /><i /></span>
      <span>{name}</span>
    </a>
  );
}
