import { describe, expect, it } from "vitest";
import { languageAlternates, localeDetails, localeFromPath, localePath, resolveLocale, siteName, t } from "./i18n";

describe("bilingual routing", () => {
  it("uses the localized product name", () => {
    expect(siteName("zh")).toBe("LovTokens");
    expect(siteName("en")).toBe("LovTokens");
  });

  it("prefixes localized application pages without prefixing APIs or generated images", () => {
    expect(localePath("/docs", "zh")).toBe("/zh/docs");
    expect(localePath("/zh/docs", "en")).toBe("/docs");
    expect(localePath("/zh/docs?tab=setup#cli", "ja")).toBe("/ja/docs?tab=setup#cli");
    expect(localePath("/fr", "pt-br")).toBe("/pt-br");
    expect(localePath("/api/settings/data", "zh")).toBe("/api/settings/data");
    expect(localePath("/share/jie/month.png", "zh")).toBe("/share/jie/month.png");
  });

  it("keeps canonical and hreflang URLs aligned with the active language", () => {
    expect(languageAlternates("/privacy", "zh")).toMatchObject({
      canonical: "/zh/privacy",
      languages: { en: "/privacy", "zh-CN": "/zh/privacy", "zh-TW": "/zh-tw/privacy", ja: "/ja/privacy", "pt-BR": "/pt-br/privacy" },
    });
  });

  it("normalizes browser language variants and localized route prefixes", () => {
    expect(resolveLocale("zh-Hant-HK")).toBe("zh-tw");
    expect(resolveLocale("pt-PT")).toBe("pt-br");
    expect(resolveLocale("ja-JP")).toBe("ja");
    expect(resolveLocale("nl-NL")).toBeNull();
    expect(localeFromPath("/ko/leaderboard")).toBe("ko");
    expect(localeFromPath("/en/leaderboard")).toBe("en");
    expect(localeDetails("de").htmlLang).toBe("de");
  });

  it("falls back to English when a translation is intentionally absent", () => {
    expect(t("zh", "Codex")).toBe("Codex");
    expect(t("zh", "Leaderboard")).toBe("排行榜");
    expect(t("ja", "Leaderboard")).toBe("リーダーボード");
  });
});
