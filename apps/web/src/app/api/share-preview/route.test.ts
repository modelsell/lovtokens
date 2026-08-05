// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ put: vi.fn(async () => undefined), getSession: vi.fn(async () => ({ user: { id: "user-1" } })), getCertificate: vi.fn() }));
const profile = { user_id: "user-1", stats_version: 8, privacy_version: 3 };
const db = { prepare: vi.fn(() => ({ bind: vi.fn(() => ({ first: vi.fn(async () => profile) })) })) };
vi.mock("@/lib/auth", () => ({ getSession: mocks.getSession }));
vi.mock("@/lib/repository", () => ({ getCertificate: mocks.getCertificate }));
vi.mock("@/lib/runtime", () => ({ getD1: vi.fn(async () => db), getShareBucket: vi.fn(async () => ({ put: mocks.put })) }));

import { POST } from "./route";

function png(width: number, height: number) {
  const bytes = new Uint8Array(33);
  bytes.set([137, 80, 78, 71, 13, 10, 26, 10]);
  bytes.set([73, 72, 68, 82], 12);
  const view = new DataView(bytes.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return bytes;
}

beforeEach(() => vi.clearAllMocks());

describe("share preview upload", () => {
  it("stores an owner-generated profile PNG under a server-computed R2 key", async () => {
    const response = await POST(new Request("https://lovtokens.test/api/share-preview?kind=profile&id=jie&theme=obsidian", { method: "POST", headers: { "content-type": "image/png", origin: "https://lovtokens.test" }, body: png(1200, 630) }));
    expect(response.status).toBe(201);
    expect(mocks.put).toHaveBeenCalledWith("social-v1/profile/jie/8-3/obsidian.png", expect.any(Uint8Array), expect.any(Object));
  });

  it("stores the selected monthly card for social link previews", async () => {
    const response = await POST(new Request("https://lovtokens.test/api/share-preview?kind=profile&id=jie&variant=month&theme=terminal", { method: "POST", headers: { "content-type": "image/png", origin: "https://lovtokens.test" }, body: png(1200, 630) }));
    expect(response.status).toBe(201);
    expect(mocks.put).toHaveBeenCalledWith("social-v1/month/jie/8-3/terminal.png", expect.any(Uint8Array), expect.any(Object));
  });

  it("rejects incorrectly sized image payloads", async () => {
    const response = await POST(new Request("https://lovtokens.test/api/share-preview?kind=profile&id=jie&theme=obsidian", { method: "POST", headers: { "content-type": "image/png" }, body: png(1080, 1350) }));
    expect(response.status).toBe(400);
    expect(mocks.put).not.toHaveBeenCalled();
  });

  it("requires an authenticated owner", async () => {
    mocks.getSession.mockResolvedValueOnce(null as never);
    const response = await POST(new Request("https://lovtokens.test/api/share-preview?kind=profile&id=jie&theme=obsidian", { method: "POST", headers: { "content-type": "image/png" }, body: png(1200, 630) }));
    expect(response.status).toBe(401);
  });
});
