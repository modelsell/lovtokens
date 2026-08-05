import { describe, expect, it } from "vitest";
import { formatLocaleTimeZone, localeTimeZone } from "./locale-timezone";

describe("localized leaderboard time zones", () => {
  it("shows Simplified Chinese in Beijing time", () => {
    const text = formatLocaleTimeZone("zh");

    expect(localeTimeZone("zh")).toMatchObject({ label: "北京时间", offset: "UTC+8" });
    expect(text).toBe("对应北京时间每天早上 08:00（UTC+8）");
  });

  it("shows both standard and daylight-saving offsets without calculating a clock", () => {
    expect(formatLocaleTimeZone("en")).toContain("19:00 / 20:00 on the previous day");
    expect(formatLocaleTimeZone("fr")).toContain("01:00 / 02:00");
  });

  it("maps each supported language to its representative regional time zone", () => {
    expect(localeTimeZone("ja").offset).toBe("UTC+9");
    expect(localeTimeZone("pt-br").offset).toBe("UTC-3");
    expect(localeTimeZone("ru").offset).toBe("UTC+3");
  });
});
