import { basename } from "node:path";
import { aggregateEvents, fingerprint, type UsageEvent } from "./aggregate.js";
import { canReadSessionFile, discoverJsonlFiles, forEachLine } from "./files.js";
import type { ScanResult } from "./types.js";

const count = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0;

export async function scanWorkBuddy(roots: string[]): Promise<ScanResult> {
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
    const seenEvents = new Set<string>();
    let fileEvents = 0;
    await forEachLine(file, (line) => {
      if (!line.includes('"usage"') && !line.includes('"rawUsage"')) return;
      let row: any;
      try {
        row = JSON.parse(line);
      } catch {
        return;
      }
      const rawUsage = row.providerData?.rawUsage;
      const messageUsage = row.message?.usage;
      const usage = rawUsage && typeof rawUsage === "object" ? rawUsage : messageUsage;
      if (!usage || typeof usage !== "object") return;
      const sessionId = String(row.sessionId || basename(file, ".jsonl"));
      const identity = String(row.id || `${row.timestamp}:${fileEvents}`);
      const eventKey = `${sessionId}:${identity}`;
      if (seenEvents.has(eventKey)) return;
      seenEvents.add(eventKey);
      const timestamp = new Date(row.timestamp || row.createdAt || Date.now());
      if (Number.isNaN(timestamp.getTime())) return;

      const inputTokens = Math.max(
        count(rawUsage?.prompt_tokens),
        count(rawUsage?.input_tokens),
        count(messageUsage?.input_tokens),
      );
      const cacheReadTokens = Math.max(
        count(rawUsage?.prompt_cache_hit_tokens),
        count(rawUsage?.cached_tokens),
        count(rawUsage?.cache_read_input_tokens),
        count(messageUsage?.cache_read_input_tokens),
      );
      const cacheWriteTokens = Math.max(
        count(rawUsage?.prompt_cache_write_tokens),
        count(rawUsage?.cache_creation_input_tokens),
      );
      const outputTokens = Math.max(
        count(rawUsage?.completion_tokens),
        count(rawUsage?.output_tokens),
        count(messageUsage?.output_tokens),
      );
      if (inputTokens === 0 && outputTokens === 0) return;

      events.push({
        source: "workbuddy",
        timestamp: timestamp.toISOString(),
        model: String(
          row.providerData?.requestModelName ||
            row.providerData?.requestModelId ||
            row.providerData?.model ||
            row.message?.model ||
            "workbuddy",
        ).slice(0, 120),
        sessionFingerprint: fingerprint(`workbuddy:${sessionId}`),
        raw: {
          inputTokens,
          cacheReadTokens,
          cacheWriteTokens,
          outputTokens,
          reasoningOutputTokens: Math.max(
            count(rawUsage?.completion_tokens_details?.reasoning_tokens),
            count(rawUsage?.completion_thinking_tokens),
          ),
          inputIncludesCache:
            count(rawUsage?.prompt_tokens) > 0 || count(messageUsage?.input_tokens) > 0,
        },
      });
      fileEvents += 1;
    });
    if (fileEvents > 0) filesWithUsage += 1;
  }

  if (files.length > 0 && filesWithUsage < files.length) {
    warnings.push(
      `${files.length - filesWithUsage} WorkBuddy session files did not contain usage records.`,
    );
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
