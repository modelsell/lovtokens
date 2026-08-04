import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { detectRequestLocale, middleware } from "./middleware";

describe("locale middleware", () => {
  it("uses an explicit locale prefix before saved and browser preferences", () => {
    const request = new NextRequest("https://lovtokens.com/fr/docs", {
      headers: { "accept-language": "ja-JP,ja;q=0.9", cookie: "lovtokens-locale=ko" },
    });
    expect(detectRequestLocale(request)).toBe("fr");
    expect(middleware(request).headers.get("x-middleware-rewrite")).toBe("https://lovtokens.com/docs");
  });

  it("redirects an unprefixed first visit to the best supported system language", () => {
    const request = new NextRequest("https://lovtokens.com/docs?tab=setup", {
      headers: { "accept-language": "it-IT;q=0.9,ja-JP;q=1,en;q=0.7" },
    });
    const response = middleware(request);
    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://lovtokens.com/ja/docs?tab=setup");
  });

  it("uses a saved manual choice and leaves saved English routes unprefixed", () => {
    const french = new NextRequest("https://lovtokens.com/leaderboard", { headers: { cookie: "lovtokens-locale=fr" } });
    expect(middleware(french).headers.get("location")).toBe("https://lovtokens.com/fr/leaderboard");

    const english = new NextRequest("https://lovtokens.com/leaderboard", {
      headers: { "accept-language": "zh-CN", cookie: "lovtokens-locale=en" },
    });
    expect(detectRequestLocale(english)).toBe("en");
    expect(middleware(english).headers.get("x-middleware-next")).toBe("1");
  });
});
