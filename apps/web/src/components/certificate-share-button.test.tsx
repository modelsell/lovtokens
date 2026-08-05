import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CertificateShareButton } from "./certificate-share-button";

const png = new Blob(["png"], { type: "image/png" });
const mocks = vi.hoisted(() => ({ copyImage: vi.fn(async () => true), rasterize: vi.fn(async () => png), track: vi.fn(async () => undefined) }));
vi.mock("@/lib/client-png", () => ({ copyPngToClipboard: mocks.copyImage, rasterizeSvgToPng: mocks.rasterize, triggerPngDownload: vi.fn() }));
vi.mock("@/lib/share-analytics", () => ({ trackShareEvent: mocks.track }));

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
  vi.clearAllMocks();
  vi.unstubAllGlobals();
});

describe("CertificateShareButton", () => {
  it("shares the selected certificate image style with social platforms", async () => {
    const publish = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => new Response(JSON.stringify({ ok: true, post: { url: "https://x.com/i/web/status/123" } }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", publish);
    render(<CertificateShareButton id="cert-100m" locale="zh" processedTokens={100_000_000} siteOrigin="https://lovtokens.test" title="100M Token 成就" />);
    fireEvent.click(screen.getByRole("button", { name: "分享成就" }));
    fireEvent.click(screen.getByRole("button", { name: "档案典藏" }));

    expect(screen.getByRole("button", { name: "档案典藏" }).closest(".share-studio-scroll")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "100M Token 成就 · archive" })).toHaveAttribute("src", "/certificate/cert-100m/image?lang=zh&style=archive");
    await waitFor(() => expect(screen.getByRole("button", { name: "发布图片到 X" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "发布图片到 X" }));
    await waitFor(() => expect(publish).toHaveBeenCalled());
    const form = publish.mock.calls[0]![1]!.body as FormData;
    const sharedUrl = new URL(String(form.get("url")));
    expect(sharedUrl.searchParams.get("share_style")).toBe("archive");

    await waitFor(() => expect(screen.getByRole("button", { name: "复制图片" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "复制图片" }));
    await waitFor(() => expect(mocks.copyImage).toHaveBeenCalledWith(png));
  });
});
