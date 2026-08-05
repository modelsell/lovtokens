// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  rows: [] as Record<string, unknown>[],
  first: null as Record<string, unknown> | null,
  sql: [] as string[],
}));

const db = {
  prepare: vi.fn((sql: string) => {
    mocks.sql.push(sql);
    return { bind: vi.fn(() => ({ all: vi.fn(async () => ({ results: mocks.rows })), first: vi.fn(async () => mocks.first) })) };
  }),
};

vi.mock("server-only", () => ({}));
vi.mock("@/lib/runtime", () => ({ getD1: vi.fn(async () => db) }));

import { getTeamDetail, getTeamLeaderboard } from "./team-repository";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.rows = [];
  mocks.first = null;
  mocks.sql.length = 0;
});

describe("team ranking privacy contract", () => {
  it("only queries public teams and counts eligible usage after each join date", async () => {
    await getTeamLeaderboard("month", "all", 10);
    expect(mocks.sql[0]).toContain("WHERE t.is_public=1");
    expect(mocks.sql[0]).toContain("ud.quarantined=0");
    expect(mocks.sql[0]).toContain("ud.trust_level!='imported'");
    expect(mocks.sql[0]).toContain("ud.utc_date>=date(tm.joined_at,'unixepoch')");
  });

  it("returns no detail for a private team when the viewer is not a member", async () => {
    mocks.first = { id: "team-1", slug: "private-team", is_public: 0, is_member: 0 };
    await expect(getTeamDetail("private-team", null)).resolves.toBeNull();
    expect(db.prepare).toHaveBeenCalledOnce();
  });
});
