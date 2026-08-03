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
    const png = await response.arrayBuffer();
    const header = new DataView(png);
    expect(png.byteLength).toBeGreaterThan(1_000);
    expect(header.getUint32(16)).toBe(1080);
    expect(header.getUint32(20)).toBe(1350);
  }, 30_000);
});
