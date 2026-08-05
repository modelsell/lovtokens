// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ publish: vi.fn(), getSession: vi.fn(async () => ({ user: { id: "user-1" } })) }));
vi.mock("@/lib/auth", () => ({ getSession: mocks.getSession }));
vi.mock("@/lib/runtime", () => ({ siteUrl: () => "https://lovtokens.test" }));
vi.mock("@/lib/x-social", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/x-social")>();
  return { ...actual, publishPngToX: mocks.publish };
});

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

function request() {
  const form = new FormData();
  form.set("image", new File([png(1080, 1350)], "share.png", { type: "image/png" }));
  form.set("text", "My LovTokens achievement");
  form.set("url", "https://lovtokens.test/u/jie?share_kind=achievement");
  form.set("returnTo", "/u/jie");
  return new Request("https://lovtokens.test/api/social/x/publish", { method: "POST", headers: { origin: "https://lovtokens.test" }, body: form });
}

beforeEach(() => vi.clearAllMocks());

describe("X image publishing API", () => {
  it("publishes the validated PNG with share copy and LovTokens URL", async () => {
    mocks.publish.mockResolvedValueOnce({ id: "post-1", url: "https://x.com/i/web/status/post-1" });
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(mocks.publish).toHaveBeenCalledWith("user-1", expect.any(Uint8Array), "My LovTokens achievement\nhttps://lovtokens.test/u/jie?share_kind=achievement");
    await expect(response.json()).resolves.toEqual({ ok: true, post: { id: "post-1", url: "https://x.com/i/web/status/post-1" } });
  });

  it("rejects a non-LovTokens destination before any external publish", async () => {
    const form = new FormData();
    form.set("image", new File([png(1200, 630)], "share.png", { type: "image/png" }));
    form.set("text", "Share");
    form.set("url", "https://example.com/not-lovtokens");
    const response = await POST(new Request("https://lovtokens.test/api/social/x/publish", { method: "POST", body: form }));
    expect(response.status).toBe(400);
    expect(mocks.publish).not.toHaveBeenCalled();
  });
});
