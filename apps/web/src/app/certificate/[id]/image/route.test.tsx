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
  it.each([100_000_000, 1_000_000_000, 10_000_000_000, 50_000_000_000, 100_000_000_000])("renders the %d milestone theme as a downloadable portrait SVG source", async (processedTokens) => {
    vi.mocked(getCertificate).mockResolvedValue({ ...certificate, period: String(processedTokens), processedTokens });
    const response = await GET(new Request("https://lovtokens.test/certificate/cert-100m/image?lang=zh&download=1"), {
      params: Promise.resolve({ id: "cert-100m" }),
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("image/svg+xml");
    expect(response.headers.get("content-disposition")).toContain("attachment");
    const svg = await response.text();
    expect(svg.length).toBeGreaterThan(1_000);
    expect(svg).toContain('width="1080" height="1350"');
    expect(svg).toContain("LovTokens");
  }, 30_000);

  it("renders the archive edition without replacing the collector edition", async () => {
    vi.mocked(getCertificate).mockResolvedValue({ ...certificate });
    const response = await GET(new Request("https://lovtokens.test/certificate/cert-100m/image?lang=zh&style=archive"), {
      params: Promise.resolve({ id: "cert-100m" }),
    });

    expect(response.status).toBe(200);
    const svg = await response.text();
    expect(svg).toContain('width="1080" height="1350"');
    expect(svg).toContain("LovTokens Archive");
  }, 30_000);
});
