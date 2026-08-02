import { basename } from "node:path";
import { aggregateEvents, fingerprint, type UsageEvent } from "./aggregate.js";
import { canReadSessionFile, discoverJsonlFiles, forEachLine } from "./files.js";
import type { ScanResult } from "./types.js";

type Counters = {
  input_tokens?: number;
  cached_input_tokens?: number;
  cache_read_tokens?: number;
  cache_write_tokens?: number;
  cache_creation_tokens?: number;
  output_tokens?: number;
  reasoning_output_tokens?: number;
};

const count = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0);
const cumulativeDelta = (current: unknown, previous: unknown) => {
  const next = count(current); const before = count(previous);
  return next >= before ? next - before : next;
};

export async function scanCodex(roots: string[]): Promise<ScanResult> {
  const files = await discoverJsonlFiles(roots);
  const events: UsageEvent[] = [];
  const warnings: string[] = [];
  let filesWithUsage = 0;
  let skippedFiles = 0;

  for (const file of files) {
    if (!(await canReadSessionFile(file))) {
      skippedFiles += 1;
      continue;
    }
    let currentModel = "codex";
    let sessionId = basename(file, ".jsonl");
    let previousTotal: Counters | undefined;
    let fileEvents = 0;
    await forEachLine(file, (line) => {
      const relevant = line.includes('"token_count"') || line.includes('"session_meta"') || line.includes('"turn_context"');
      if (!relevant) return;
      let row: any;
      try {
        row = JSON.parse(line);
      } catch {
        return;
      }
      if (row.type === "session_meta") {
        sessionId = String(row.payload?.id || sessionId);
        return;
      }
      if (row.type === "turn_context") {
        currentModel = String(row.payload?.model || currentModel).slice(0, 120);
        return;
      }
      if (row.type !== "event_msg" || row.payload?.type !== "token_count") return;
      const info = row.payload?.info;
      const total = info?.total_token_usage as Counters | undefined;
      const last = info?.last_token_usage as Counters | undefined;
      if (!total && !last) return;

      const delta = last ?? {
        input_tokens: cumulativeDelta(total?.input_tokens, previousTotal?.input_tokens),
        cached_input_tokens: cumulativeDelta(total?.cached_input_tokens, previousTotal?.cached_input_tokens),
        cache_write_tokens: cumulativeDelta(total?.cache_write_tokens, previousTotal?.cache_write_tokens),
        output_tokens: cumulativeDelta(total?.output_tokens, previousTotal?.output_tokens),
        reasoning_output_tokens: cumulativeDelta(total?.reasoning_output_tokens, previousTotal?.reasoning_output_tokens),
      };
      previousTotal = total ?? previousTotal;
      const timestamp = new Date(row.timestamp || Date.now());
      if (Number.isNaN(timestamp.getTime())) return;
      events.push({
        source: "codex",
        timestamp: timestamp.toISOString(),
        model: currentModel,
        sessionFingerprint: fingerprint(`codex:${sessionId}`),
        raw: {
          inputTokens: count(delta.input_tokens),
          cacheReadTokens: count(delta.cached_input_tokens ?? delta.cache_read_tokens),
          cacheWriteTokens: count(delta.cache_write_tokens ?? delta.cache_creation_tokens),
          outputTokens: count(delta.output_tokens),
          reasoningOutputTokens: count(delta.reasoning_output_tokens),
          inputIncludesCache: true,
        },
      });
      fileEvents += 1;
    });
    if (fileEvents > 0) filesWithUsage += 1;
  }

  if (files.length > 0 && filesWithUsage < files.length) {
    warnings.push(`${files.length - filesWithUsage} Codex session files did not contain token_count events.`);
  }
  const coverage = files.length === filesWithUsage && skippedFiles === 0 ? "complete" : "partial";
  return {
    buckets: aggregateEvents(events, coverage),
    filesScanned: files.length,
    filesWithUsage,
    skippedFiles,
    warnings,
  };
}
