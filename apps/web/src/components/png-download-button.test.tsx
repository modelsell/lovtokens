import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ rasterizeSvgToPng: vi.fn(), triggerPngDownload: vi.fn() }));

vi.mock("@/lib/client-png", () => mocks);

import { PngDownloadButton } from "./png-download-button";

describe("PngDownloadButton", () => {
  it("rasterizes the SVG source before downloading a PNG file", async () => {
    const png = new Blob(["png"], { type: "image/png" });
    mocks.rasterizeSvgToPng.mockResolvedValue(png);
    render(<PngDownloadButton filename="share.png" loadingLabel="生成中" sourceUrl="/share/jie/profile.svg?theme=obsidian">下载图片</PngDownloadButton>);
    fireEvent.click(screen.getByRole("button", { name: "下载图片" }));

    await waitFor(() => expect(mocks.rasterizeSvgToPng).toHaveBeenCalledWith("/share/jie/profile.svg?theme=obsidian", 1080, 1350));
    expect(mocks.triggerPngDownload).toHaveBeenCalledWith(png, "share.png");
  });
});
