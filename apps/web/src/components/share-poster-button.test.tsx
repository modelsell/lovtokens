import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SharePosterButton } from "./share-poster-button";

vi.mock("./png-download-button", () => ({
  PngDownloadButton: ({ children, className }: { children: ReactNode; className?: string }) => <button className={className} type="button">{children}</button>,
}));

afterEach(() => {
  cleanup();
  document.body.style.overflow = "";
});

describe("SharePosterButton", () => {
  it("opens the poster picker from the public profile button", () => {
    render(<SharePosterButton handle="jie" locale="zh" />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "分享海报" }));

    expect(screen.getByRole("dialog", { name: "选择海报样式" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Obsidian Lime 分享海报预览" })).toHaveAttribute("src", "/share/jie/profile.svg?theme=obsidian");
    expect(screen.getByRole("button", { name: /下载图片/ })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("switches poster styles and closes with Escape", () => {
    render(<SharePosterButton handle="jie" locale="zh" />);
    fireEvent.click(screen.getByRole("button", { name: "分享海报" }));
    fireEvent.click(screen.getByRole("button", { name: /Terminal Neon/ }));

    expect(screen.getByRole("button", { name: /Terminal Neon/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("img", { name: "Terminal Neon 分享海报预览" })).toHaveAttribute("src", "/share/jie/profile.svg?theme=terminal");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe("");
  });
});
