// @vitest-environment node

import { describe, expect, it, vi } from "vitest";
import { chromium } from "@playwright/test";

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
    const response = await GET(new Request(`https://lovtokens.test/share/portrait-builder/profile.svg?theme=${theme}`), {
      params: Promise.resolve({ handle: "portrait-builder", variant: "profile.svg" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/svg+xml");
    const svg = await response.text();
    expect(svg.length).toBeGreaterThan(1_000);
    expect(svg).toContain('width="1080" height="1350"');
    expect(svg).toContain("ALL-TIME TOKEN PORTFOLIO");
    expect(svg).toContain('data-share-layout="portrait-v3"');
    expect(svg).toContain('<svg x="793" y="1077"');
  }, 20_000);

  it("can be rasterized by the browser as a 1080 × 1350 PNG", async () => {
    const response = await GET(new Request("https://lovtokens.test/share/portrait-builder/profile.svg?theme=obsidian"), {
      params: Promise.resolve({ handle: "portrait-builder", variant: "profile.svg" }),
    });
    const svg = await response.text();
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      const result = await page.evaluate(async ({ source, width, height }) => {
        const sourceUrl = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
        try {
          const image = new Image(); image.src = sourceUrl;
          await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("decode failed")); });
          const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = height;
          canvas.getContext("2d")?.drawImage(image, 0, 0, width, height);
          const png = await new Promise<Blob>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("encode failed")), "image/png"));
          return { size: png.size, signature: Array.from(new Uint8Array(await png.arrayBuffer()).slice(0, 8)) };
        } finally { URL.revokeObjectURL(sourceUrl); }
      }, { source: svg, width: 1080, height: 1350 });
      expect(result.size).toBeGreaterThan(20_000);
      expect(result.signature).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    } finally { await browser.close(); }
  }, 30_000);
});
