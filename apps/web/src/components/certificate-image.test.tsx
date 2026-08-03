import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { CertificateRecord } from "@/lib/data";
import { achievementCardThemeFor, CertificateImage } from "./certificate-image";

const certificate: CertificateRecord = {
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

describe("CertificateImage", () => {
  it("renders a downloadable achievement image with proof QR", () => {
    render(<CertificateImage certificate={certificate} locale="zh" proof="hash-verified" qr="data:image/png;base64,qr" />);

    expect(screen.getByText("100M Token 里程碑")).toBeInTheDocument();
    expect(screen.getByText("数据完整性已验证")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Achievement proof QR code" })).toHaveAttribute("src", "data:image/png;base64,qr");
    expect(screen.getByText("扫码查看证明")).toBeInTheDocument();
  });

  it("assigns a distinct collectible tier to each token milestone", () => {
    expect(achievementCardThemeFor("milestone", 1_000_000).code).toBe("M—01");
    expect(achievementCardThemeFor("milestone", 10_000_000).code).toBe("M—02");
    expect(achievementCardThemeFor("milestone", 100_000_000).code).toBe("M—03");
    expect(achievementCardThemeFor("milestone", 1_000_000_000).code).toBe("M—04");
    expect(achievementCardThemeFor("milestone", 10_000_000_000).code).toBe("M—05");
    expect(achievementCardThemeFor("monthly", 10_000_000_000).code).toBe("A—MONTH");
  });
});
