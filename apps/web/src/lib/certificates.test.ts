// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createCertificateIssuer, ELIGIBILITY_RULE_VERSION } from "./certificates";
import { createTestD1 } from "./testing/d1-sqlite";

let test: ReturnType<typeof createTestD1>;
const now = new Date("2026-09-20T12:00:00Z");
const rankQueries = () => test.calls.filter(({ sql }) => sql.includes("ROW_NUMBER() OVER"));
beforeEach(() => { test = createTestD1(); });
afterEach(() => test.sqlite.close());

describe("certificate/achievement incremental processing", () => {
  it("shares two ranking queries across all users, then skips all unchanged usage reads", async () => {
    for (const id of ["alice", "bob", "carol"]) {
      test.addUser(id);
      test.addUsage(id, "2026-08-01", 200_000_000);
    }
    const issuer = createCertificateIssuer(test.db, undefined, now);
    for (const id of ["alice", "bob", "carol"]) await issuer(id);
    expect(rankQueries()).toHaveLength(2);
    expect(test.sqlite.prepare("SELECT COUNT(*) n FROM certificates").get()!.n).toBe(6);
    const original = test.sqlite.prepare("SELECT * FROM certificates ORDER BY id").all();
    test.calls.length = 0;
    const nextIssuer = createCertificateIssuer(test.db, undefined, now);
    for (const id of ["alice", "bob", "carol"]) await nextIssuer(id);
    expect(test.calls).toHaveLength(3);
    expect(test.calls.some(({ sql }) => sql.includes("FROM usage_daily"))).toBe(false);
    expect(test.sqlite.prepare("SELECT * FROM certificates ORDER BY id").all()).toEqual(original);
  });

  it("does not rank users below a milestone or recompute ranks for existing/revoked certificates", async () => {
    test.addUser("alice");
    test.addUsage("alice", "2026-09-01", 10);
    await createCertificateIssuer(test.db, undefined, now)("alice");
    expect(rankQueries()).toHaveLength(0);
    test.addUsage("alice", "2026-08-02", 200_000_000);
    await createCertificateIssuer(test.db, undefined, now)("alice");
    test.sqlite.exec("UPDATE certificates SET status='revoked',revoked_at=123");
    const original = test.sqlite.prepare("SELECT * FROM certificates ORDER BY id").all();
    test.addUsage("alice", "2026-09-02", 1);
    test.calls.length = 0;
    await createCertificateIssuer(test.db, undefined, now)("alice");
    expect(rankQueries()).toHaveLength(0);
    expect(test.sqlite.prepare("SELECT * FROM certificates ORDER BY id").all()).toEqual(original);
  });

  it("issues new month certificates with unchanged usage and retries late-arriving previous-month data", async () => {
    test.addUser("alice");
    test.addUsage("alice", "2026-09-01", 10);
    await createCertificateIssuer(test.db, undefined, now)("alice");
    expect(test.sqlite.prepare("SELECT COUNT(*) n FROM certificates").get()!.n).toBe(0);
    await createCertificateIssuer(test.db, undefined, new Date("2026-10-01T00:00:00Z"))("alice");
    expect(test.sqlite.prepare("SELECT period FROM certificates").get()!.period).toBe("2026-09");
    test.addUser("late");
    await createCertificateIssuer(test.db, undefined, now)("late");
    test.addUsage("late", "2026-08-20", 25);
    await createCertificateIssuer(test.db, undefined, now)("late");
    expect(test.sqlite.prepare("SELECT period,processed_tokens FROM certificates WHERE user_id='late'").get()).toEqual({ period: "2026-08", processed_tokens: 25 });
  });

  it("preserves certificate ranks for private, imported and quarantined usage", async () => {
    for (const id of ["public", "imported", "quarantine"]) test.addUser(id);
    test.addUser("private", false);
    test.addUsage("public", "2026-08-01", 200_000_000);
    test.addUsage("imported", "2026-08-01", 300_000_000, { trust: "imported" });
    test.addUsage("private", "2026-08-01", 400_000_000);
    test.addUsage("quarantine", "2026-08-01", 500_000_000, { quarantined: 1 });
    const issue = createCertificateIssuer(test.db, undefined, now);
    for (const id of ["public", "imported", "private", "quarantine"]) await issue(id);
    expect(test.sqlite.prepare("SELECT rank,percentile FROM certificates WHERE user_id='public' AND kind='monthly'").get()).toEqual({ rank: 2, percentile: 100 });
    expect(test.sqlite.prepare("SELECT rank,percentile FROM certificates WHERE user_id='private' AND kind='monthly'").get()).toEqual({ rank: null, percentile: null });
    expect(test.sqlite.prepare("SELECT COUNT(*) n FROM certificates WHERE user_id='quarantine'").get()!.n).toBe(0);
  });

  it("re-evaluates changed rules and leaves failed work retryable", async () => {
    test.addUser("alice");
    test.addUsage("alice", "2026-09-01", 100);
    await createCertificateIssuer(test.db, undefined, now)("alice");
    test.sqlite.prepare("UPDATE certificate_processing_state SET rules_version=?").run(ELIGIBILITY_RULE_VERSION - 1);
    test.calls.length = 0;
    test.setBeforeQuery((sql) => { if (sql.includes("COUNT(DISTINCT lower(trim(model)))")) throw new Error("injected read failure"); });
    await expect(createCertificateIssuer(test.db, undefined, now)("alice")).rejects.toThrow("injected read failure");
    expect(test.sqlite.prepare("SELECT rules_version FROM certificate_processing_state").get()!.rules_version).toBe(ELIGIBILITY_RULE_VERSION - 1);
    test.setBeforeQuery();
    await createCertificateIssuer(test.db, undefined, now)("alice");
    expect(test.sqlite.prepare("SELECT rules_version FROM certificate_processing_state").get()!.rules_version).toBe(ELIGIBILITY_RULE_VERSION);
  });

  it("does not mark concurrent new usage as processed", async () => {
    test.addUser("alice");
    test.addUsage("alice", "2026-09-01", 10);
    test.setBeforeQuery((sql) => {
      if (sql.includes("INSERT INTO certificate_processing_state")) {
        test.setBeforeQuery();
        test.addUsage("alice", "2026-09-02", 200_000_000);
      }
    });
    await createCertificateIssuer(test.db, undefined, now)("alice");
    const versions = test.sqlite.prepare("SELECT p.stats_version actual,s.stats_version processed FROM profiles p JOIN certificate_processing_state s USING(user_id)").get()!;
    expect(versions.actual).not.toBe(versions.processed);
    await createCertificateIssuer(test.db, undefined, now)("alice");
    expect(test.sqlite.prepare("SELECT COUNT(*) n FROM certificates WHERE kind='milestone'").get()!.n).toBe(1);
  });
});
