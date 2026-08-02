import { createHash } from "node:crypto";
import {
  normalizeTokenUsage,
  type Coverage,
  type RawTokenUsage,
  type TokenSource,
  type UsageBucketV1,
  utcDate,
} from "@lovtokens/token-schema";

export type UsageEvent = {
  source: TokenSource;
  timestamp: string;
  model: string;
  sessionFingerprint: string;
  raw: RawTokenUsage;
};

export function fingerprint(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export function aggregateEvents(events: UsageEvent[], coverage: Coverage): UsageBucketV1[] {
  const grouped = new Map<string, UsageBucketV1>();
  for (const event of events) {
    const normalized = normalizeTokenUsage(event.raw);
    const date = utcDate(event.timestamp);
    const key = [event.source, date, event.model, event.sessionFingerprint].join(":");
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        schemaVersion: 1,
        source: event.source,
        utcDate: date,
        model: event.model,
        sessionFingerprint: event.sessionFingerprint,
        inputTokensTotal: normalized.inputTokensTotal,
        freshInputTokens: normalized.freshInputTokens,
        cacheReadTokens: normalized.cacheReadTokens,
        cacheWriteTokens: normalized.cacheWriteTokens,
        outputTokensTotal: normalized.outputTokensTotal,
        reasoningOutputTokens: normalized.reasoningOutputTokens,
        requestCount: 1,
        firstEventAt: new Date(event.timestamp).toISOString(),
        lastEventAt: new Date(event.timestamp).toISOString(),
        parserVersion: "0.1.0",
        coverage,
      });
      continue;
    }
    existing.inputTokensTotal += normalized.inputTokensTotal;
    existing.freshInputTokens += normalized.freshInputTokens;
    existing.cacheReadTokens += normalized.cacheReadTokens;
    existing.cacheWriteTokens += normalized.cacheWriteTokens;
    existing.outputTokensTotal += normalized.outputTokensTotal;
    existing.reasoningOutputTokens += normalized.reasoningOutputTokens;
    existing.requestCount += 1;
    if (event.timestamp < existing.firstEventAt) existing.firstEventAt = new Date(event.timestamp).toISOString();
    if (event.timestamp > existing.lastEventAt) existing.lastEventAt = new Date(event.timestamp).toISOString();
  }
  return [...grouped.values()].sort((a, b) =>
    `${a.utcDate}:${a.source}:${a.model}`.localeCompare(`${b.utcDate}:${b.source}:${b.model}`),
  );
}
