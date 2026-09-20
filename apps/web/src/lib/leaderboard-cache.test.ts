// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestD1 } from "./testing/d1-sqlite";
import { refreshLeaderboards } from "./leaderboard-cache";
const runtime = vi.hoisted(() => ({ db: null as D1Database | null }));
vi.mock("./runtime", () => ({ getD1: async () => runtime.db }));
import { getLeaderboard } from "./repository";

let test: ReturnType<typeof createTestD1>;
const now = new Date("2026-09-20T12:00:00Z");
const usageQueries = () => test.calls.filter(({ sql }) => sql.includes("FROM usage_daily"));
beforeEach(() => { test = createTestD1(); runtime.db = test.db; vi.useFakeTimers(); vi.setSystemTime(now); });
afterEach(() => { vi.useRealTimers(); test.sqlite.close(); });

describe("versioned leaderboard snapshots", () => {
  it("reuses unchanged snapshots, including empty sources, without reading usage", async () => {
    test.addUser("alice");
    test.addUsage("alice", "2026-09-20", 100);
    expect(await refreshLeaderboards(test.db, now)).toBe(20);
    expect(test.sqlite.prepare("SELECT COUNT(*) n FROM leaderboard_snapshot_state").get()!.n).toBe(20);
    test.calls.length = 0;
    expect(await refreshLeaderboards(test.db, now)).toBe(0);
    expect(await getLeaderboard("month", "workbuddy")).toEqual([]);
    expect((await getLeaderboard("month"))[0]).toMatchObject({ handle: "alice", processedTokens: 100, rank: 1 });
    expect(usageQueries()).toHaveLength(0);
  });

  it("invalidates same-second corrections and quarantine changes, but not timestamp-only writes", async () => {
    test.addUser("alice");
    test.addUsage("alice", "2026-09-20", 100);
    await refreshLeaderboards(test.db, now);
    test.sqlite.exec("UPDATE usage_daily SET updated_at=123");
    expect(await refreshLeaderboards(test.db, now)).toBe(0);
    test.sqlite.exec("UPDATE usage_daily SET input_tokens_total=50,fresh_input_tokens=50");
    expect((await getLeaderboard("month"))[0]?.processedTokens).toBe(50);
    expect(await refreshLeaderboards(test.db, now)).toBe(20);
    test.sqlite.exec("UPDATE usage_daily SET quarantined=1,anomaly_reason='test'");
    expect(await getLeaderboard("month")).toEqual([]);
    await refreshLeaderboards(test.db, now);
    test.calls.length = 0;
    expect(await getLeaderboard("month")).toEqual([]);
    expect(usageQueries()).toHaveLength(0);
  });

  it("immediately reranks after privacy changes/deletion and reads presentation privacy live", async () => {
    for (const [id, tokens] of [["alice", 100], ["bob", 50]] as const) { test.addUser(id); test.addUsage(id, "2026-09-20", tokens); }
    await refreshLeaderboards(test.db, now);
    test.sqlite.exec("UPDATE profiles SET is_anonymous=1,show_exact_tokens=0 WHERE user_id='alice'");
    test.calls.length = 0;
    expect((await getLeaderboard("month"))[0]).toMatchObject({ isAnonymous: true, showExactTokens: false });
    expect(usageQueries()).toHaveLength(0);
    test.sqlite.exec("UPDATE profiles SET show_rank=0 WHERE user_id='alice'");
    expect(await getLeaderboard("month")).toMatchObject([{ handle: "bob", rank: 1 }]);
    await refreshLeaderboards(test.db, now);
    test.sqlite.exec("UPDATE profiles SET show_rank=1,is_public=0 WHERE user_id='alice'");
    expect(await getLeaderboard("month")).toMatchObject([{ handle: "bob", rank: 1 }]);
    test.sqlite.exec("UPDATE profiles SET is_public=1 WHERE user_id='alice'");
    await refreshLeaderboards(test.db, now);
    test.sqlite.exec("DELETE FROM user WHERE id='alice'");
    expect(await getLeaderboard("month")).toMatchObject([{ handle: "bob", rank: 1 }]);
  });

  it("refreshes moving UTC windows and retains daily history for unchanged all-time/month boards", async () => {
    test.addUser("alice");
    test.addUsage("alice", "2026-09-20", 100);
    await refreshLeaderboards(test.db, now);
    const tomorrow = new Date("2026-09-21T00:00:00Z");
    vi.setSystemTime(tomorrow);
    expect(await getLeaderboard("today")).toEqual([]);
    expect(await refreshLeaderboards(test.db, tomorrow)).toBe(12);
    expect(test.sqlite.prepare("SELECT processed_tokens FROM leaderboard_rank_history WHERE period='all' AND source='all' AND snapshot_date='2026-09-21'").get()!.processed_tokens).toBe(100);
    const nextMonth = new Date("2026-10-01T00:00:00Z");
    vi.setSystemTime(nextMonth);
    expect(await refreshLeaderboards(test.db, nextMonth)).toBe(16);
    expect(await getLeaderboard("month")).toEqual([]);
  });

  it("rolls back rows and metadata together on refresh failure", async () => {
    test.addUser("alice"); test.addUsage("alice", "2026-09-20", 100);
    await refreshLeaderboards(test.db, now);
    const oldRows = test.sqlite.prepare("SELECT * FROM leaderboard_snapshots ORDER BY id").all();
    const oldState = test.sqlite.prepare("SELECT * FROM leaderboard_snapshot_state ORDER BY period,source").all();
    test.addUsage("alice", "2026-09-20", 200);
    test.setBeforeQuery((sql) => { if (sql.includes("INSERT INTO leaderboard_snapshot_state")) throw new Error("injected write failure"); });
    await expect(refreshLeaderboards(test.db, now)).rejects.toThrow("injected write failure");
    expect(test.sqlite.prepare("SELECT * FROM leaderboard_snapshots ORDER BY id").all()).toEqual(oldRows);
    expect(test.sqlite.prepare("SELECT * FROM leaderboard_snapshot_state ORDER BY period,source").all()).toEqual(oldState);
  });

  it("keeps changes that arrive during refresh dirty and excludes imported usage from public ranks", async () => {
    test.addUser("alice"); test.addUser("imported");
    test.addUsage("alice", "2026-09-20", 100);
    test.addUsage("imported", "2026-09-20", 999, { trust: "imported" });
    test.setBeforeQuery((sql) => {
      if (sql.includes("INSERT INTO leaderboard_snapshots")) {
        test.setBeforeQuery(); test.addUsage("alice", "2026-09-20", 25);
      }
    });
    await refreshLeaderboards(test.db, now);
    expect(await getLeaderboard("month")).toMatchObject([{ handle: "alice", processedTokens: 125 }]);
    expect(await refreshLeaderboards(test.db, now)).toBe(20);
    expect(await refreshLeaderboards(test.db, now)).toBe(0);
  });
});
