import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { ShareThemeGallery } from "./share-theme-gallery";

afterEach(cleanup);

describe("ShareThemeGallery", () => {
  it("shows four portrait themes linked to the matching generated image", () => {
    const { container } = render(<ShareThemeGallery handle="jie" locale="zh" />);
    expect(container.querySelectorAll(".share-theme-image")).toHaveLength(4);
    expect(screen.getByText("Obsidian Lime").closest(".share-theme-option")?.querySelector("a")).toHaveAttribute("href", "/share/jie/profile.png?theme=obsidian&download=1");
    expect(screen.getAllByText("1080 × 1350 · PNG")).toHaveLength(4);
  });

  it("opens a large preview and closes it with Escape", () => {
    render(<ShareThemeGallery handle="jie" locale="zh" />);
    fireEvent.click(screen.getByRole("button", { name: "放大预览 Obsidian Lime" }));
    expect(screen.getByRole("dialog", { name: "Obsidian Lime 放大预览" })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps previews visible while disabling downloads for a private profile", () => {
    const { container } = render(<ShareThemeGallery
      downloadEnabled={false}
      handle="private"
      history={[{ date: "2026-08-03", tokens: 1200 }]}
      locale="zh"
      models={[{ model: "gpt-5", tokens: 700 }]}
      sources={[{ source: "codex", tokens: 700 }, { source: "claude-code", tokens: 300 }]}
      tokens={1000}
    />);
    expect(container.querySelectorAll(".share-card")).toHaveLength(4);
    expect(container.querySelectorAll(".share-card-heatmap i")).toHaveLength(336);
    expect(screen.getAllByText("模型分布")).toHaveLength(4);
    expect(container.querySelectorAll("a")).toHaveLength(0);
    expect(screen.getAllByText("公开后下载")).toHaveLength(4);
  });
});
