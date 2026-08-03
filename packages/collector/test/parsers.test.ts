import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { scanClaude } from "../src/claude.js";
import { scanCodex } from "../src/codex.js";
import { scanWorkBuddy } from "../src/workbuddy.js";

describe("Codex scanner", () => {
  it("uses last_token_usage and keeps cache as an input subset", async () => {
    const root = await mkdtemp(join(tmpdir(), "lovtokens-codex-"));
    const lines = [
      { type: "session_meta", payload: { id: "session-a", cwd: "/private/project" } },
      { type: "turn_context", payload: { model: "gpt-5.6", cwd: "/private/project" } },
      { timestamp: "2026-08-03T10:00:00.000Z", type: "event_msg", payload: { type: "token_count", info: { total_token_usage: { input_tokens: 10_000, cached_input_tokens: 7_000, output_tokens: 500, reasoning_output_tokens: 200 }, last_token_usage: { input_tokens: 10_000, cached_input_tokens: 7_000, output_tokens: 500, reasoning_output_tokens: 200 } } } },
      { timestamp: "2026-08-03T10:01:00.000Z", type: "response_item", payload: { type: "message", content: [{ text: "secret prompt must never be returned" }] } },
    ];
    await writeFile(join(root, "session.jsonl"), lines.map((row) => JSON.stringify(row)).join("\n"));
    const result = await scanCodex([root]);
    expect(result.buckets).toHaveLength(1);
    expect(result.buckets[0]).toMatchObject({ inputTokensTotal: 10_000, freshInputTokens: 3_000, cacheReadTokens: 7_000, outputTokensTotal: 500 });
    expect(JSON.stringify(result)).not.toContain("secret prompt");
    expect(JSON.stringify(result)).not.toContain("/private/project");
  });

  it("turns cumulative counters into deltas across UTC days and handles resets", async () => {
    const root = await mkdtemp(join(tmpdir(), "lovtokens-codex-cumulative-"));
    const event = (timestamp: string, input: number, output: number) => ({ timestamp, type: "event_msg", payload: { type: "token_count", info: { total_token_usage: { input_tokens: input, cached_input_tokens: 0, output_tokens: output } } } });
    const lines = [{ type: "session_meta", payload: { id: "session-cumulative" } }, event("2026-08-02T23:59:00.000Z", 100, 20), event("2026-08-03T00:01:00.000Z", 180, 35), event("2026-08-03T00:02:00.000Z", 30, 5)];
    await writeFile(join(root, "session.jsonl"), lines.map((row) => JSON.stringify(row)).join("\n"));
    const result = await scanCodex([root]);
    expect(result.buckets).toHaveLength(2);
    expect(result.buckets[0]).toMatchObject({ utcDate: "2026-08-02", inputTokensTotal: 100, outputTokensTotal: 20 });
    expect(result.buckets[1]).toMatchObject({ utcDate: "2026-08-03", inputTokensTotal: 110, outputTokensTotal: 20, requestCount: 2 });
  });
});

describe("Claude scanner", () => {
  it("normalizes native cache input and deduplicates message ids", async () => {
    const root = await mkdtemp(join(tmpdir(), "lovtokens-claude-"));
    const row = { sessionId: "claude-a", timestamp: "2026-08-03T11:00:00.000Z", message: { id: "msg-1", model: "claude-opus", content: "private", usage: { input_tokens: 1_000, cache_read_input_tokens: 8_000, cache_creation_input_tokens: 1_000, output_tokens: 400 } } };
    await writeFile(join(root, "session.jsonl"), `${JSON.stringify(row)}\n${JSON.stringify(row)}\n`);
    const result = await scanClaude([root]);
    expect(result.buckets).toHaveLength(1);
    expect(result.buckets[0]).toMatchObject({ inputTokensTotal: 10_000, freshInputTokens: 1_000, cacheReadTokens: 8_000, cacheWriteTokens: 1_000, requestCount: 1 });
    expect(JSON.stringify(result)).not.toContain("private");
  });
});

describe("WorkBuddy scanner", () => {
  it("reads response usage without retaining conversation content or paths", async () => {
    const root = await mkdtemp(join(tmpdir(), "lovtokens-workbuddy-"));
    const row = {
      type: "message",
      id: "response-1",
      sessionId: "workbuddy-a",
      timestamp: 1_775_290_400_000,
      cwd: "/private/workbuddy-project",
      content: "private WorkBuddy response",
      providerData: {
        requestModelName: "Hy3",
        rawUsage: {
          prompt_tokens: 10_000,
          prompt_cache_hit_tokens: 7_000,
          prompt_cache_write_tokens: 500,
          completion_tokens: 400,
          completion_tokens_details: { reasoning_tokens: 200 },
        },
      },
    };
    await writeFile(join(root, "session.jsonl"), `${JSON.stringify(row)}\n${JSON.stringify(row)}\n`);
    const result = await scanWorkBuddy([root]);
    expect(result.buckets).toHaveLength(1);
    expect(result.buckets[0]).toMatchObject({
      source: "workbuddy",
      model: "Hy3",
      inputTokensTotal: 10_000,
      freshInputTokens: 2_500,
      cacheReadTokens: 7_000,
      cacheWriteTokens: 500,
      outputTokensTotal: 400,
      reasoningOutputTokens: 200,
      requestCount: 1,
    });
    expect(JSON.stringify(result)).not.toContain("private WorkBuddy response");
    expect(JSON.stringify(result)).not.toContain("/private/workbuddy-project");
  });
});
