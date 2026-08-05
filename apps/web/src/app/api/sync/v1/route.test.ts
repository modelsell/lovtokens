import { describe, expect, it } from "vitest";
import { aggregateDaily } from "./route";

describe("hourly sync compatibility", () => {
  it("rolls hourly details back into the existing daily accounting bucket", () => {
    const base = {
      schemaVersion: 2 as const,
      source: "codex" as const,
      utcDate: "2026-08-05",
      model: "gpt-5.6",
      sessionFingerprint: "a".repeat(64),
      freshInputTokens: 40,
      cacheReadTokens: 50,
      cacheWriteTokens: 10,
      inputTokensTotal: 100,
      outputTokensTotal: 20,
      reasoningOutputTokens: 5,
      requestCount: 1,
      parserVersion: "0.2.0",
      coverage: "complete" as const,
    };
    const [daily] = aggregateDaily([
      { ...base, utcHour: 9, firstEventAt: "2026-08-05T09:01:00.000Z", lastEventAt: "2026-08-05T09:45:00.000Z" },
      { ...base, utcHour: 10, firstEventAt: "2026-08-05T10:05:00.000Z", lastEventAt: "2026-08-05T10:55:00.000Z" },
    ]);

    expect(daily).toMatchObject({ schemaVersion: 1, inputTokensTotal: 200, outputTokensTotal: 40, requestCount: 2, firstEventAt: "2026-08-05T09:01:00.000Z", lastEventAt: "2026-08-05T10:55:00.000Z" });
    expect(daily).not.toHaveProperty("utcHour");
  });
});
