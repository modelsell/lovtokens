import { describe, expect, it } from "vitest";
import { languageAlternates, localePath, siteName, t } from "./i18n";

describe("bilingual routing", () => {
  it("uses the localized product name", () => {
    expect(siteName("zh")).toBe("LovTokens");
    expect(siteName("en")).toBe("LovTokens");
  });

  it("prefixes application pages in Chinese without prefixing APIs or generated images", () => {
    expect(localePath("/docs", "zh")).toBe("/zh/docs");
    expect(localePath("/zh/docs", "en")).toBe("/docs");
    expect(localePath("/api/settings/data", "zh")).toBe("/api/settings/data");
    expect(localePath("/share/jie/month.png", "zh")).toBe("/share/jie/month.png");
  });

  it("keeps canonical and hreflang URLs aligned with the active language", () => {
    expect(languageAlternates("/privacy", "zh")).toEqual({
      canonical: "/zh/privacy",
      languages: { en: "/privacy", "zh-CN": "/zh/privacy" },
    });
  });

  it("falls back to English when a translation is intentionally absent", () => {
    expect(t("zh", "Codex")).toBe("Codex");
    expect(t("zh", "Leaderboard")).toBe("排行榜");
  });
});
