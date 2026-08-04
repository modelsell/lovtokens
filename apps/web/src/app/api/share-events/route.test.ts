// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ run: vi.fn(async () => ({})), first: vi.fn(async () => ({ user_id: "user-1" })), getCertificate: vi.fn() }));
const db = { prepare: vi.fn(() => ({ bind: vi.fn(() => ({ first: mocks.first, run: mocks.run })) })) };
vi.mock("@/lib/runtime", () => ({ getD1: vi.fn(async () => db) }));
vi.mock("@/lib/repository", () => ({ getCertificate: mocks.getCertificate }));

import { POST } from "./route";

beforeEach(() => vi.clearAllMocks());

describe("share events route", () => {
  it("stores only aggregate events for a public profile", async () => {
    const response = await POST(new Request("https://lovtokens.test/api/share-events", { method: "POST", headers: { "content-type": "application/json", origin: "https://lovtokens.test" }, body: JSON.stringify({ contentId: "jie", contentKind: "profile", target: "x", event: "target_click" }) }));
    expect(response.status).toBe(200);
    expect(mocks.run).toHaveBeenCalledOnce();
    expect(JSON.stringify(mocks.run.mock.calls)).not.toContain("user-agent");
  });

  it("rejects removed or unknown share targets", async () => {
    const response = await POST(new Request("https://lovtokens.test/api/share-events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contentId: "jie", contentKind: "profile", target: "wechat", event: "target_click" }) }));
    expect(response.status).toBe(400);
    expect(mocks.run).not.toHaveBeenCalled();
  });

  it("resolves public certificate ownership before aggregating", async () => {
    mocks.getCertificate.mockResolvedValue({ id: "cert-1", userId: "user-1", indexable: true });
    const response = await POST(new Request("https://lovtokens.test/api/share-events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contentId: "cert-1", contentKind: "certificate", target: "telegram", event: "landing" }) }));
    expect(response.status).toBe(200);
    expect(mocks.getCertificate).toHaveBeenCalledWith("cert-1");
  });
});
