import { basename } from "node:path";
import { aggregateEvents, fingerprint, type UsageEvent } from "./aggregate.js";
import { canReadSessionFile, discoverJsonlFiles, forEachLine } from "./files.js";
import type { ScanResult } from "./types.js";

const count = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? Math.max(0, value) : 0);

export async function scanClaude(roots: string[]): Promise<ScanResult> {
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
    const seenMessages = new Set<string>();
    let fileEvents = 0;
    await forEachLine(file, (line) => {
      if (!line.includes('"usage"')) return;
      let row: any;
      try {
        row = JSON.parse(line);
      } catch {
        return;
      }
      const message = row.message;
      const usage = message?.usage;
      if (!usage || typeof usage !== "object") return;
      const identity = String(message?.id || row.uuid || `${row.timestamp}:${fileEvents}`);
      if (seenMessages.has(identity)) return;
      seenMessages.add(identity);
      const timestamp = new Date(row.timestamp || row.created_at || Date.now());
      if (Number.isNaN(timestamp.getTime())) return;
      events.push({
        source: "claude-code",
        timestamp: timestamp.toISOString(),
        model: String(message?.model || "claude").slice(0, 120),
        sessionFingerprint: fingerprint(`claude:${row.sessionId || basename(file, ".jsonl")}`),
        raw: {
          inputTokens: count(usage.input_tokens),
          cacheReadTokens: count(usage.cache_read_input_tokens),
          cacheWriteTokens: count(usage.cache_creation_input_tokens),
          outputTokens: count(usage.output_tokens),
          reasoningOutputTokens: 0,
          inputIncludesCache: false,
        },
      });
      fileEvents += 1;
    });
    if (fileEvents > 0) filesWithUsage += 1;
  }
  if (files.length > 0 && filesWithUsage < files.length) {
    warnings.push(`${files.length - filesWithUsage} Claude Code session files did not contain usage records.`);
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
