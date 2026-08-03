import { headers } from "next/headers";
import { ShareThemeGallery } from "@/components/share-theme-gallery";
import { getSession } from "@/lib/auth";
import { getDashboardDetails, getPrivateSummary } from "@/lib/private-repository";
import { getLeaderboardPosition } from "@/lib/repository";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
export default async function ShareStudio() {
  const locale = await getLocale();
  const session = await getSession(await headers());
  const [details, activity, position] = session?.user ? await Promise.all([
    getPrivateSummary(session.user.id),
    getDashboardDetails(session.user.id),
    getLeaderboardPosition(session.user.id, "all"),
  ]) : [null, null, null];
  const profile = details?.profile;
  return <>
    <h1>{t(locale, "Share studio.")}</h1>
    <p>{locale === "zh" ? "选择一种竖版图片风格，预览并下载你的公开 Token 档案。" : "Choose a portrait image style to preview and download your public token portfolio."}</p>
    <ShareThemeGallery
      activeDays={details?.activeDays || 0}
      claudeTokens={details?.claudeTokens || 0}
      codexTokens={details?.codexTokens || 0}
      workbuddyTokens={details?.workbuddyTokens || 0}
      displayName={String(profile?.display_name || session?.user.name || (locale === "zh" ? "你的名字" : "Your Name"))}
      downloadEnabled={Boolean(profile?.is_public)}
      handle={String(profile?.handle || "your-handle")}
      history={Boolean(profile?.show_exact_tokens) ? (activity?.daily || []).map((row) => ({ date: row.date, tokens: Number(row.tokens) })) : []}
      locale={locale}
      models={Boolean(profile?.show_exact_tokens) && Boolean(profile?.show_models) ? (activity?.models || []).map((row) => ({ model: row.model, tokens: Number(row.tokens) })) : []}
      percentile={position?.percentile || 100}
      rank={position?.rank || 0}
      showExactTokens={Boolean(profile?.show_exact_tokens)}
      showRank={Boolean(profile?.show_rank)}
      sources={Boolean(profile?.show_exact_tokens) ? (activity?.sources || []).map((row) => ({ source: row.source, tokens: Number(row.tokens) })) : []}
      tokens={details?.total || 0}
    />
  </>;
}
