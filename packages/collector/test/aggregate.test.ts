import { describe, expect, it } from "vitest";
import { aggregateEvents, fingerprint } from "../src/aggregate.js";

describe("hourly aggregation", () => {
  it("keeps model usage in exact UTC hour buckets", () => {
    const common = { source: "codex" as const, model: "gpt-5.6", sessionFingerprint: fingerprint("session"), raw: { inputTokens: 100, outputTokens: 20, inputIncludesCache: true } };
    const buckets = aggregateEvents([
      { ...common, timestamp: "2026-08-03T01:59:00.000Z" },
      { ...common, timestamp: "2026-08-03T02:01:00.000Z" },
    ], "complete");

    expect(buckets).toHaveLength(2);
    expect(buckets.map((bucket) => ({ date: bucket.utcDate, hour: bucket.utcHour, tokens: bucket.inputTokensTotal + bucket.outputTokensTotal }))).toEqual([
      { date: "2026-08-03", hour: 1, tokens: 120 },
      { date: "2026-08-03", hour: 2, tokens: 120 },
    ]);
  });
});
