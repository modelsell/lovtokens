import { headers } from "next/headers";
import { Award } from "lucide-react";
import { AchievementCard, type AchievementCardData } from "@/components/achievement-card";
import { getSession } from "@/lib/auth";
import { getCertificatesForUser } from "@/lib/private-repository";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

export default async function CertificatesDashboard() {
  const locale = await getLocale();
  const session = await getSession(await headers());
  const rows: Array<Record<string, unknown>> = session?.user ? await getCertificatesForUser(session.user.id) : [];
  const achievements: AchievementCardData[] = rows.map((row) => ({
    id: String(row.id),
    kind: String(row.kind),
    period: String(row.period),
    processedTokens: Number(row.processed_tokens),
    rank: row.rank === null || row.rank === undefined ? null : Number(row.rank),
    coverage: Number(row.coverage ?? 0),
    trustLevel: String(row.trust_level ?? "verified"),
    status: String(row.status),
    issuedAt: Number(row.issued_at),
  }));

  return <>
    <div className="achievement-page-title">
      <h1>{t(locale, "Achievements.")}</h1>
      <p>{t(locale, "Every completed month and token milestone becomes a collectible achievement.")}</p>
    </div>
    {achievements.length ? <div className="achievement-gallery">
      {achievements.map((achievement) => <AchievementCard achievement={achievement} key={achievement.id} locale={locale} />)}
    </div> : <div className="setup-panel achievement-empty">
      <Award aria-hidden="true" size={30} strokeWidth={1.5} />
      <h2>{t(locale, "Your achievements will appear here")}</h2>
      <p>{t(locale, "Complete a calendar month or reach a token milestone to unlock your first achievement.")}</p>
    </div>}
  </>;
}
