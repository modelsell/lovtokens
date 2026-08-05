import type { UsageBucketV2 } from "@lovtokens/token-schema";

export type ScanResult = {
  buckets: UsageBucketV2[];
  filesScanned: number;
  filesWithUsage: number;
  skippedFiles: number;
  warnings: string[];
};

export type CollectorConfig = {
  serverUrl: string;
  deviceId?: string;
  deviceToken?: string;
  handle?: string;
  lastSyncedAt?: string;
};
