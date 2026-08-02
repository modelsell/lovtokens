import { z } from "zod";

export const TOKEN_SCHEMA_VERSION = 1 as const;
export const ACCOUNTING_VERSION = "2026-08-v1";

export const tokenSourceSchema = z.enum(["codex", "claude-code"]);
export const coverageSchema = z.enum(["complete", "partial"]);
export const trustLevelSchema = z.enum([
  "provider-verified",
  "collector-checked",
  "imported",
]);

const safeTokenCount = z
  .number()
  .int()
  .min(0)
  .max(Number.MAX_SAFE_INTEGER);

export const usageBucketV1Schema = z
  .object({
    schemaVersion: z.literal(TOKEN_SCHEMA_VERSION),
    source: tokenSourceSchema,
    utcDate: z.iso.date(),
    model: z.string().trim().min(1).max(120),
    sessionFingerprint: z.string().regex(/^[a-f0-9]{64}$/),
    inputTokensTotal: safeTokenCount,
    freshInputTokens: safeTokenCount,
    cacheReadTokens: safeTokenCount,
    cacheWriteTokens: safeTokenCount,
    outputTokensTotal: safeTokenCount,
    reasoningOutputTokens: safeTokenCount,
    requestCount: z.number().int().min(0).max(10_000_000),
    firstEventAt: z.iso.datetime({ offset: true }),
    lastEventAt: z.iso.datetime({ offset: true }),
    parserVersion: z.string().trim().min(1).max(40),
    coverage: coverageSchema,
  })
  .strict()
  .superRefine((value, context) => {
    if (
      value.freshInputTokens + value.cacheReadTokens + value.cacheWriteTokens !==
      value.inputTokensTotal
    ) {
      context.addIssue({
        code: "custom",
        path: ["inputTokensTotal"],
        message: "inputTokensTotal must equal fresh + cache read + cache write",
      });
    }
    if (value.reasoningOutputTokens > value.outputTokensTotal) {
      context.addIssue({
        code: "custom",
        path: ["reasoningOutputTokens"],
        message: "reasoning output is a subset of output",
      });
    }
    if (Date.parse(value.firstEventAt) > Date.parse(value.lastEventAt)) {
      context.addIssue({
        code: "custom",
        path: ["firstEventAt"],
        message: "firstEventAt cannot follow lastEventAt",
      });
    }
  });

export const syncPayloadV1Schema = z.object({
  schemaVersion: z.literal(TOKEN_SCHEMA_VERSION),
  collectorVersion: z.string().min(1).max(40),
  deviceId: z.string().uuid(),
  generatedAt: z.iso.datetime({ offset: true }),
  buckets: z.array(usageBucketV1Schema).max(5_000),
}).strict();

export type TokenSource = z.infer<typeof tokenSourceSchema>;
export type Coverage = z.infer<typeof coverageSchema>;
export type TrustLevel = z.infer<typeof trustLevelSchema>;
export type UsageBucketV1 = z.infer<typeof usageBucketV1Schema>;
export type SyncPayloadV1 = z.infer<typeof syncPayloadV1Schema>;

export type RawTokenUsage = {
  inputTokens: number;
  cacheReadTokens?: number;
  cacheWriteTokens?: number;
  outputTokens: number;
  reasoningOutputTokens?: number;
  inputIncludesCache: boolean;
};

export type NormalizedTokenUsage = {
  inputTokensTotal: number;
  freshInputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  outputTokensTotal: number;
  reasoningOutputTokens: number;
  processedTokens: number;
};

const nonNegativeInteger = (value: number | undefined) =>
  Math.max(0, Math.trunc(Number.isFinite(value) ? (value ?? 0) : 0));

export function normalizeTokenUsage(raw: RawTokenUsage): NormalizedTokenUsage {
  const sourceInput = nonNegativeInteger(raw.inputTokens);
  const rawCacheRead = nonNegativeInteger(raw.cacheReadTokens);
  const rawCacheWrite = nonNegativeInteger(raw.cacheWriteTokens);
  const output = nonNegativeInteger(raw.outputTokens);
  const reasoning = Math.min(output, nonNegativeInteger(raw.reasoningOutputTokens));
  const inputTotal = raw.inputIncludesCache
    ? sourceInput
    : sourceInput + rawCacheRead + rawCacheWrite;
  const cacheRead = raw.inputIncludesCache ? Math.min(rawCacheRead, inputTotal) : rawCacheRead;
  const cacheWrite = raw.inputIncludesCache ? Math.min(rawCacheWrite, Math.max(0, inputTotal - cacheRead)) : rawCacheWrite;
  const freshInput = Math.max(0, inputTotal - cacheRead - cacheWrite);

  return {
    inputTokensTotal: inputTotal,
    freshInputTokens: freshInput,
    cacheReadTokens: cacheRead,
    cacheWriteTokens: cacheWrite,
    outputTokensTotal: output,
    reasoningOutputTokens: reasoning,
    processedTokens: inputTotal + output,
  };
}

export function processedTokens(bucket: Pick<UsageBucketV1, "inputTokensTotal" | "outputTokensTotal">) {
  return bucket.inputTokensTotal + bucket.outputTokensTotal;
}

export function formatTokenCount(value: number): string {
  const absolute = Math.abs(value);
  if (absolute < 1_000) return Math.round(value).toLocaleString("en-US");
  const units = [
    { threshold: 1_000_000_000_000, suffix: "T" },
    { threshold: 1_000_000_000, suffix: "B" },
    { threshold: 1_000_000, suffix: "M" },
    { threshold: 1_000, suffix: "K" },
  ];
  const unit = units.find((candidate) => absolute >= candidate.threshold)!;
  const scaled = value / unit.threshold;
  return `${scaled >= 100 ? scaled.toFixed(0) : scaled >= 10 ? scaled.toFixed(1) : scaled.toFixed(2)}${unit.suffix}`;
}

export function utcDate(value: string | number | Date): string {
  return new Date(value).toISOString().slice(0, 10);
}
