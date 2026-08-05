import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SharePosterButton } from "./share-poster-button";

const png = new Blob(["png"], { type: "image/png" });
const mocks = vi.hoisted(() => ({ copyImage: vi.fn(async () => true), rasterize: vi.fn(async () => png), track: vi.fn(async () => undefined) }));
vi.mock("@/lib/client-png", () => ({ copyPngToClipboard: mocks.copyImage, rasterizeSvgToPng: mocks.rasterize, triggerPngDownload: vi.fn() }));
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
  vi.unstubAllGlobals();
});

describe("SharePosterButton", () => {
  it("opens the complete share studio with supported social targets", async () => {
    render(<SharePosterButton {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "分享档案" }));

    expect(screen.getByRole("dialog", { name: "分享工作室" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Obsidian Lime 全部档案" })).toHaveAttribute("src", "/share/jie/profile.svg?theme=obsidian");
    expect(screen.getByRole("button", { name: "全部档案" }).closest(".share-studio-scroll")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Obsidian Lime/ }).closest(".share-studio-scroll")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "发布图片到 X" })).toBeInTheDocument();
    for (const name of ["LinkedIn", "Facebook", "Telegram", "WhatsApp"]) expect(screen.getByRole("link", { name: new RegExp(name) })).toBeInTheDocument();
    expect(screen.queryByText("微信")).not.toBeInTheDocument();
    expect(screen.queryByText("微博")).not.toBeInTheDocument();
    expect((screen.getByRole("textbox", { name: "分享文案" }) as HTMLTextAreaElement).value).toContain("1.00B");
    await waitFor(() => expect(screen.getByRole("button", { name: "复制图片" })).toBeEnabled());
    expect(screen.queryByRole("button", { name: "带图片分享" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "复制文案" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "复制图片" }));
    await waitFor(() => expect(mocks.copyImage).toHaveBeenCalledWith(png));
    expect(screen.getByText("当前 PNG 图片已复制。")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("switches to the monthly landscape card and changes themes", async () => {
    const publish = vi.fn<(input: RequestInfo | URL, init?: RequestInit) => Promise<Response>>(async () => new Response(JSON.stringify({ ok: true, post: { url: "https://x.com/i/web/status/123" } }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", publish);
    render(<SharePosterButton {...props} />);
    fireEvent.click(screen.getByRole("button", { name: "分享档案" }));
    fireEvent.click(screen.getByRole("button", { name: "本月战报" }));
    fireEvent.click(screen.getByRole("button", { name: /Terminal Neon/ }));

    expect(screen.getByRole("button", { name: "本月战报" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("img", { name: "Terminal Neon 本月战报" })).toHaveAttribute("src", "/share/jie/month.svg?theme=terminal");
    expect((screen.getByRole("textbox", { name: "分享文案" }) as HTMLTextAreaElement).value).toContain("本月");
    await waitFor(() => expect(screen.getByRole("button", { name: "发布图片到 X" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "发布图片到 X" }));
    await waitFor(() => expect(publish).toHaveBeenCalled());
    const form = publish.mock.calls[0]![1]!.body as FormData;
    expect((form.get("image") as File).type).toBe("image/png");
    const sharedUrl = new URL(String(form.get("url")));
    expect(sharedUrl.searchParams.get("share_card")).toBe("month");
    expect(sharedUrl.searchParams.get("share_theme")).toBe("terminal");
    expect(screen.getByText("图片已作为媒体附件发布到 X。")).toBeInTheDocument();

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
