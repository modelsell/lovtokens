// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ first: vi.fn(), run: vi.fn(async () => ({ success: true })) }));
const db = { prepare: vi.fn(() => ({ bind: vi.fn(() => ({ first: mocks.first, run: mocks.run })) })) };
vi.mock("@/lib/runtime", () => ({
  getD1: vi.fn(async () => db),
  getRuntimeEnv: vi.fn(async () => ({ X_CLIENT_ID: "client-id", X_CLIENT_SECRET: "client-secret", SOCIAL_TOKEN_ENCRYPTION_KEY: "test-encryption-secret-at-least-32-bytes" })),
  siteUrl: vi.fn(() => "https://lovtokens.test"),
}));

import { decryptSecret, encryptSecret, publishPngToX } from "./x-social";

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllGlobals());

describe("X social publishing", () => {
  it("encrypts connected-account tokens at rest", async () => {
    const encrypted = await encryptSecret("user-access-token", "encryption-secret");
    expect(encrypted).not.toContain("user-access-token");
    await expect(decryptSecret(encrypted, "encryption-secret")).resolves.toBe("user-access-token");
  });

  it("uploads the PNG and creates a post with the returned media id", async () => {
    mocks.first.mockResolvedValueOnce({
      access_token_encrypted: await encryptSecret("user-access-token", "test-encryption-secret-at-least-32-bytes"),
      refresh_token_encrypted: null,
      token_expires_at: Math.floor(Date.now() / 1000) + 3600,
      scope: "tweet.write media.write",
    });
    const request = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { id: "media-123" } }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ data: { id: "post-456", text: "Shared" } }), { status: 201 }));
    vi.stubGlobal("fetch", request);

    await expect(publishPngToX("user-1", new Uint8Array([137, 80, 78, 71]), "Shared from LovTokens")).resolves.toEqual({ id: "post-456", url: "https://x.com/i/web/status/post-456" });
    expect(request).toHaveBeenNthCalledWith(1, "https://api.x.com/2/media/upload", expect.objectContaining({ method: "POST", headers: expect.objectContaining({ authorization: "Bearer user-access-token" }) }));
    expect(JSON.parse(String(request.mock.calls[0]![1]!.body))).toEqual(expect.objectContaining({ media_category: "tweet_image", media_type: "image/png" }));
    expect(JSON.parse(String(request.mock.calls[1]![1]!.body))).toEqual({ text: "Shared from LovTokens", media: { media_ids: ["media-123"] } });
  });
});
