// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/repository", () => ({
  getShareProfile: vi.fn(async () => ({
    activeDays: 48,
    claudeTokens: 320_000_000,
    codexTokens: 680_000_000,
    displayName: "Portrait Builder",
    handle: "portrait-builder",
    history: [
      { date: "2026-08-01", tokens: 12_000_000 },
      { date: "2026-08-02", tokens: 24_000_000 },
      { date: "2026-08-03", tokens: 18_000_000 },
    ],
    isAnonymous: false,
    models: [
      { model: "gpt-5", tokens: 650_000_000 },
      { model: "claude-opus", tokens: 350_000_000 },
    ],
    percentile: 2.4,
    privacyVersion: 3,
    processedTokens: 1_000_000_000,
    rank: 12,
    showExactTokens: true,
    showModels: true,
    showRank: true,
    sources: [
      { source: "codex", tokens: 680_000_000 },
      { source: "claude-code", tokens: 320_000_000 },
    ],
    statsVersion: 8,
    today: "2026-08-03",
  })),
}));

vi.mock("@/lib/runtime", () => ({
  getShareBucket: vi.fn(async () => null),
  siteUrl: vi.fn(() => "https://lovtokens.test"),
}));

import { GET } from "./route";

describe("portrait share image", () => {
  it.each(["obsidian", "terminal", "ivory", "aurora"])("renders the 1080 × 1350 profile card for the %s theme", async (theme) => {
    const response = await GET(new Request(`https://lovtokens.test/share/portrait-builder/profile.png?theme=${theme}`), {
      params: Promise.resolve({ handle: "portrait-builder", variant: "profile.png" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    const png = await response.arrayBuffer();
    const header = new DataView(png);
    expect(png.byteLength).toBeGreaterThan(1_000);
    expect(header.getUint32(16)).toBe(1080);
    expect(header.getUint32(20)).toBe(1350);
  }, 20_000);
});
