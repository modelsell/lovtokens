import { describe, expect, it } from "vitest";
import { formatLocaleTimeZone, localeTimeZone } from "./locale-timezone";

describe("localized leaderboard time zones", () => {
  it("shows Simplified Chinese in Beijing time", () => {
    const text = formatLocaleTimeZone("zh", new Date("2026-08-05T00:00:00.000Z"));

    expect(localeTimeZone("zh")).toEqual({ label: "北京时间", timeZone: "Asia/Shanghai" });
    expect(text).toContain("北京时间");
    expect(text).toContain("08:00");
    expect(text).toContain("UTC+8");
  });

  it("calculates daylight-saving offsets for locale representative zones", () => {
    expect(formatLocaleTimeZone("en", new Date("2026-01-15T12:00:00.000Z"))).toContain("UTC-5");
    expect(formatLocaleTimeZone("en", new Date("2026-07-15T12:00:00.000Z"))).toContain("UTC-4");
  });

  it("maps each supported language to its representative regional time zone", () => {
    expect(localeTimeZone("ja").timeZone).toBe("Asia/Tokyo");
    expect(localeTimeZone("pt-br").timeZone).toBe("America/Sao_Paulo");
    expect(localeTimeZone("ru").timeZone).toBe("Europe/Moscow");
  });
});
