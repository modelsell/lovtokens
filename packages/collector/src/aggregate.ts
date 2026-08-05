import { createHash } from "node:crypto";
import {
  normalizeTokenUsage,
  type Coverage,
  type RawTokenUsage,
  type TokenSource,
  type UsageBucketV2,
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

export function aggregateEvents(events: UsageEvent[], coverage: Coverage): UsageBucketV2[] {
  const grouped = new Map<string, UsageBucketV2>();
  for (const event of events) {
    const normalized = normalizeTokenUsage(event.raw);
    const eventAt = new Date(event.timestamp).toISOString();
    const date = utcDate(eventAt);
    const hour = new Date(eventAt).getUTCHours();
    const key = [event.source, date, hour, event.model, event.sessionFingerprint].join(":");
    const existing = grouped.get(key);
    if (!existing) {
      grouped.set(key, {
        schemaVersion: 2,
        source: event.source,
        utcDate: date,
        utcHour: hour,
        model: event.model,
        sessionFingerprint: event.sessionFingerprint,
        inputTokensTotal: normalized.inputTokensTotal,
        freshInputTokens: normalized.freshInputTokens,
        cacheReadTokens: normalized.cacheReadTokens,
        cacheWriteTokens: normalized.cacheWriteTokens,
        outputTokensTotal: normalized.outputTokensTotal,
        reasoningOutputTokens: normalized.reasoningOutputTokens,
        requestCount: 1,
        firstEventAt: eventAt,
        lastEventAt: eventAt,
        parserVersion: "0.2.0",
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
    if (eventAt < existing.firstEventAt) existing.firstEventAt = eventAt;
    if (eventAt > existing.lastEventAt) existing.lastEventAt = eventAt;
  }
  return [...grouped.values()].sort((a, b) =>
    `${a.utcDate}:${String(a.utcHour).padStart(2, "0")}:${a.source}:${a.model}`.localeCompare(`${b.utcDate}:${String(b.utcHour).padStart(2, "0")}:${b.source}:${b.model}`),
  );
}
