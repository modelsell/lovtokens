import { afterEach, describe, expect, it, vi } from "vitest";
import { getGitHubStarCount } from "./github";

afterEach(() => vi.unstubAllGlobals());

describe("getGitHubStarCount", () => {
  it("reads and caches the public repository star count", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ stargazers_count: 17 }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(getGitHubStarCount()).resolves.toBe(17);
    expect(fetchMock).toHaveBeenCalledWith("https://api.github.com/repos/modelsell/lovtokens", expect.objectContaining({
      next: { revalidate: 3_600 },
    }));
  });

  it("falls back when GitHub is unavailable or returns an invalid count", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ stargazers_count: -1 }), { status: 200 })));
    await expect(getGitHubStarCount()).resolves.toBeNull();

    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(getGitHubStarCount()).resolves.toBeNull();
  });
});
