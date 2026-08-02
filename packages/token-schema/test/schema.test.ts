import { describe, expect, it } from "vitest";
import {
  formatTokenCount,
  normalizeTokenUsage,
  processedTokens,
  usageBucketV1Schema,
} from "../src/index.js";

describe("normalizeTokenUsage", () => {
  it("does not double count Codex cached input", () => {
    expect(
      normalizeTokenUsage({
        inputTokens: 10_000,
        cacheReadTokens: 7_000,
        outputTokens: 500,
        reasoningOutputTokens: 200,
        inputIncludesCache: true,
      }),
    ).toEqual({
      inputTokensTotal: 10_000,
      freshInputTokens: 3_000,
      cacheReadTokens: 7_000,
      cacheWriteTokens: 0,
      outputTokensTotal: 500,
      reasoningOutputTokens: 200,
      processedTokens: 10_500,
    });
  });

  it("adds native Claude cache buckets to input", () => {
    const usage = normalizeTokenUsage({
      inputTokens: 1_000,
      cacheReadTokens: 8_000,
      cacheWriteTokens: 1_000,
      outputTokens: 400,
      inputIncludesCache: false,
    });
    expect(usage.inputTokensTotal).toBe(10_000);
    expect(usage.processedTokens).toBe(10_400);
  });
});

describe("usageBucketV1Schema", () => {
  const bucket = {
    schemaVersion: 1 as const,
    source: "codex" as const,
    utcDate: "2026-08-03",
    model: "gpt-5.6",
    sessionFingerprint: "a".repeat(64),
    inputTokensTotal: 100,
    freshInputTokens: 50,
    cacheReadTokens: 50,
    cacheWriteTokens: 0,
    outputTokensTotal: 20,
    reasoningOutputTokens: 5,
    requestCount: 1,
    firstEventAt: "2026-08-03T01:00:00.000Z",
    lastEventAt: "2026-08-03T01:01:00.000Z",
    parserVersion: "1.0.0",
    coverage: "complete" as const,
  };

  it("accepts a normalized bucket", () => {
    const parsed = usageBucketV1Schema.parse(bucket);
    expect(processedTokens(parsed)).toBe(120);
  });

  it("rejects token math that double counts cache", () => {
    expect(() => usageBucketV1Schema.parse({ ...bucket, inputTokensTotal: 150 })).toThrow();
  });

  it("rejects content-bearing fields instead of silently accepting them", () => {
    expect(() => usageBucketV1Schema.parse({ ...bucket, prompt: "must stay local" })).toThrow();
  });
});

it("formats share-card token values", () => {
  expect(formatTokenCount(1_284_000_000)).toBe("1.28B");
  expect(formatTokenCount(19_600_000)).toBe("19.6M");
});
