// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestD1 } from "@/lib/testing/d1-sqlite";
import { sha256 } from "@/lib/crypto";
const runtime = vi.hoisted(() => ({ db: null as D1Database | null }));
vi.mock("@/lib/runtime", () => ({ getD1: async () => runtime.db, getRuntimeEnv: async () => ({}), siteUrl: () => "https://example.test" }));
import { POST } from "./route";

let test: ReturnType<typeof createTestD1>;
const deviceId = "00000000-0000-4000-8000-000000000001";
const bucket = {
  schemaVersion: 2, utcHour: 9, source: "codex", utcDate: "2026-09-19", model: "test-model", sessionFingerprint: "a".repeat(64),
  inputTokensTotal: 100, freshInputTokens: 100, cacheReadTokens: 0, cacheWriteTokens: 0, outputTokensTotal: 10, reasoningOutputTokens: 0,
  requestCount: 1, firstEventAt: "2026-09-19T09:00:00Z", lastEventAt: "2026-09-19T09:30:00Z", parserVersion: "test", coverage: "complete",
};
async function sync(buckets = [bucket]) {
  return POST(new Request("https://example.test/api/sync/v1", { method: "POST", headers: { authorization: "Bearer test-token" }, body: JSON.stringify({ schemaVersion: 2, collectorVersion: "test", deviceId, generatedAt: new Date().toISOString(), buckets }) }));
}
const version = () => test.sqlite.prepare("SELECT stats_version FROM profiles").get()!.stats_version;
beforeEach(async () => {
  test = createTestD1(); runtime.db = test.db;
  test.addUser("alice");
  test.sqlite.prepare("UPDATE devices SET id=?,token_hash=?").run(deviceId, await sha256("test-token"));
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-09-20T12:00:00Z"));
});
afterEach(() => { vi.useRealTimers(); test.sqlite.close(); });

describe("idempotent sync writes and version invalidation", () => {
  it("keeps identical daily/hourly rows and versions unchanged but updates the device heartbeat", async () => {
    expect((await sync()).status).toBe(200);
    const originalVersion = version();
    const daily = test.sqlite.prepare("SELECT * FROM usage_daily").all();
    const hourly = test.sqlite.prepare("SELECT * FROM usage_hourly").all();
    const heartbeat = test.sqlite.prepare("SELECT last_synced_at FROM devices").get()!.last_synced_at;
    vi.setSystemTime(new Date("2026-09-20T12:00:03Z"));
    test.calls.length = 0;
    expect((await sync()).status).toBe(200);
    expect(version()).toBe(originalVersion);
    expect(test.sqlite.prepare("SELECT * FROM usage_daily").all()).toEqual(daily);
    expect(test.sqlite.prepare("SELECT * FROM usage_hourly").all()).toEqual(hourly);
    expect(test.sqlite.prepare("SELECT last_synced_at FROM devices").get()!.last_synced_at).not.toBe(heartbeat);
    expect(test.calls.filter(({ sql }) => sql.includes("ROW_NUMBER()") || sql.includes("COUNT(DISTINCT lower(trim(model)))"))).toHaveLength(0);
  });

  it("accepts downward corrections and NULL/non-NULL anomaly changes", async () => {
    expect((await sync()).status).toBe(200);
    const originalVersion = Number(version());
    vi.setSystemTime(new Date("2026-09-20T12:00:03Z"));
    expect((await sync([{ ...bucket, inputTokensTotal: 50, freshInputTokens: 50 }])).status).toBe(200);
    expect(Number(version())).toBeGreaterThan(originalVersion);
    expect(test.sqlite.prepare("SELECT input_tokens_total FROM usage_daily").get()!.input_tokens_total).toBe(50);
    test.sqlite.exec("UPDATE usage_daily SET quarantined=1,anomaly_reason='test'; UPDATE usage_hourly SET quarantined=1,anomaly_reason='test'");
    vi.setSystemTime(new Date("2026-09-20T12:00:06Z"));
    expect((await sync()).status).toBe(200);
    expect(test.sqlite.prepare("SELECT quarantined,anomaly_reason FROM usage_daily").get()).toEqual({ quarantined: 0, anomaly_reason: null });
  });

  it("versions committed partial batches even if a later batch fails and safely retries", async () => {
    const buckets = Array.from({ length: 81 }, (_, i) => ({ ...bucket, sessionFingerprint: i.toString(16).padStart(64, "0") }));
    const originalVersion = Number(version());
    let inserts = 0;
    test.setBeforeQuery((sql) => { if (sql.includes("INSERT INTO usage_daily") && ++inserts === 81) throw new Error("injected batch failure"); });
    await expect(sync(buckets)).rejects.toThrow("injected batch failure");
    expect(test.sqlite.prepare("SELECT COUNT(*) n FROM usage_daily").get()!.n).toBe(80);
    expect(Number(version())).toBeGreaterThan(originalVersion);
    expect(test.sqlite.prepare("SELECT COUNT(*) n FROM certificate_processing_state").get()!.n).toBe(0);
    test.setBeforeQuery();
    expect((await sync(buckets)).status).toBe(200);
    expect(test.sqlite.prepare("SELECT COUNT(*) n FROM usage_daily").get()!.n).toBe(81);
    expect(test.sqlite.prepare("SELECT COUNT(*) n FROM usage_hourly").get()!.n).toBe(81);
  });
});
