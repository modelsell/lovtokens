import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SharePosterButton } from "./share-poster-button";

const png = new Blob(["png"], { type: "image/png" });
const mocks = vi.hoisted(() => ({ rasterize: vi.fn(async () => png), track: vi.fn(async () => undefined) }));
vi.mock("@/lib/client-png", () => ({ rasterizeSvgToPng: mocks.rasterize, triggerPngDownload: vi.fn() }));
vi.mock("@/lib/share-analytics", () => ({ trackShareEvent: mocks.track }));

const props = {
  activeDays: 48,
  displayName: "Jie",
  handle: "jie",
  locale: "zh" as const,
  processedTokens: 1_000_000_000,
  rank: 12,
  showExactTokens: true,
  showRank: true,
  siteOrigin: "https://lovtokens.test",
};

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
  location.hash = "";
  vi.clearAllMocks();
});

describe("SharePosterButton", () => {
  it("opens the complete share studio with supported social targets", async () => {
    render(<SharePosterButton {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "分享档案" }));

    expect(screen.getByRole("dialog", { name: "分享工作室" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Obsidian Lime 全部档案" })).toHaveAttribute("src", "/share/jie/profile.svg?theme=obsidian");
    for (const name of ["X", "LinkedIn", "Facebook", "Telegram", "WhatsApp"]) expect(screen.getByRole("link", { name: new RegExp(name) })).toBeInTheDocument();
    expect(screen.queryByText("微信")).not.toBeInTheDocument();
    expect(screen.queryByText("微博")).not.toBeInTheDocument();
    expect((screen.getByRole("textbox", { name: "分享文案" }) as HTMLTextAreaElement).value).toContain("1.00B");
    await waitFor(() => expect(screen.getByRole("button", { name: "带图片分享" })).toBeEnabled());
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("switches to the monthly landscape card and changes themes", async () => {
    render(<SharePosterButton {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "分享档案" }));
    fireEvent.click(screen.getByRole("button", { name: "本月战报" }));
    fireEvent.click(screen.getByRole("button", { name: /Terminal Neon/ }));

    expect(screen.getByRole("button", { name: "本月战报" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("img", { name: "Terminal Neon 本月战报" })).toHaveAttribute("src", "/share/jie/month.svg?theme=terminal");
    expect((screen.getByRole("textbox", { name: "分享文案" }) as HTMLTextAreaElement).value).toContain("本月");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
