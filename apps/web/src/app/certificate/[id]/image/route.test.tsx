// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

const certificate = {
  id: "cert-100m",
  userId: "user-1",
  handle: "jie",
  displayName: "Jie",
  kind: "milestone",
  period: "100000000",
  processedTokens: 100_000_000,
  rank: 8,
  percentile: 0.4,
  coverage: 98,
  trustLevel: "device-verified",
  payloadHash: "abc123",
  payloadJson: "{}",
  signature: null,
  status: "active",
  issuedAt: 1_735_689_600,
  indexable: true,
};

vi.mock("@/lib/auth", () => ({ getSession: vi.fn(async () => null) }));
vi.mock("@/lib/crypto", () => ({ verifyPayload: vi.fn(async () => "hash-verified") }));
vi.mock("@/lib/repository", () => ({ getCertificate: vi.fn(async () => certificate) }));
vi.mock("@/lib/runtime", () => ({ getRuntimeEnv: vi.fn(async () => ({})), siteUrl: vi.fn(() => "https://lovtokens.test") }));

import { GET } from "./route";
import { getCertificate } from "@/lib/repository";

describe("achievement image route", () => {
  it.each([1_000_000, 10_000_000, 100_000_000, 1_000_000_000, 10_000_000_000])("renders the %d milestone theme as a downloadable portrait PNG", async (processedTokens) => {
    vi.mocked(getCertificate).mockResolvedValue({ ...certificate, period: String(processedTokens), processedTokens });
    const response = await GET(new Request("https://lovtokens.test/certificate/cert-100m/image?lang=zh&download=1"), {
      params: Promise.resolve({ id: "cert-100m" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("content-disposition")).toContain("attachment");
    expect(response.headers.get("content-disposition")).toContain(".png");
    const image = new Uint8Array(await response.arrayBuffer());
    expect(image.byteLength).toBeGreaterThan(20_000);
    expect(Array.from(image.slice(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    const view = new DataView(image.buffer, image.byteOffset, image.byteLength);
    expect(view.getUint32(16)).toBe(1080);
    expect(view.getUint32(20)).toBe(1350);
  }, 30_000);

  it("renders the archive edition without replacing the collector edition", async () => {
    vi.mocked(getCertificate).mockResolvedValue({ ...certificate });
    const response = await GET(new Request("https://lovtokens.test/certificate/cert-100m/image?lang=zh&style=archive"), {
      params: Promise.resolve({ id: "cert-100m" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    const image = new Uint8Array(await response.arrayBuffer());
    expect(Array.from(image.slice(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
  }, 30_000);
});
