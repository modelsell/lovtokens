// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(async () => ({ user: { id: "user-1" } })),
  existing: vi.fn(async () => null),
  batch: vi.fn(async () => []),
  bound: [] as Array<{ sql: string; args: unknown[] }>,
}));

const db = {
  prepare: vi.fn((sql: string) => ({
    bind: (...args: unknown[]) => {
      const statement = { sql, args, first: mocks.existing };
      mocks.bound.push({ sql, args });
      return statement;
    },
  })),
  batch: mocks.batch,
};

vi.mock("@/lib/auth", () => ({ getSession: mocks.getSession }));
vi.mock("@/lib/runtime", () => ({ getD1: vi.fn(async () => db) }));
vi.mock("next/headers", () => ({ headers: vi.fn(async () => new Headers()) }));

import { POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.bound.length = 0;
  mocks.existing.mockResolvedValue(null);
});

describe("team creation API", () => {
  it("creates a private team and owner membership atomically", async () => {
    const response = await POST(new Request("https://lovtokens.test/api/teams", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://lovtokens.test" },
      body: JSON.stringify({ name: "Agent Builders", slug: "agent-builders", description: "Build together" }),
    }));
    expect(response.status).toBe(201);
    expect(mocks.batch).toHaveBeenCalledOnce();
    const teamInsert = mocks.bound.find((entry) => entry.sql.startsWith("INSERT INTO teams"));
    expect(teamInsert?.args[5]).toBe(0);
    expect(mocks.bound.some((entry) => entry.sql.startsWith("INSERT INTO team_members") && entry.args[1] === "user-1")).toBe(true);
  });

  it("rejects a cross-origin create before any database write", async () => {
    const response = await POST(new Request("https://lovtokens.test/api/teams", {
      method: "POST",
      headers: { "content-type": "application/json", origin: "https://attacker.test" },
      body: JSON.stringify({ name: "Agent Builders", slug: "agent-builders" }),
    }));
    expect(response.status).toBe(403);
    expect(mocks.batch).not.toHaveBeenCalled();
  });
});
