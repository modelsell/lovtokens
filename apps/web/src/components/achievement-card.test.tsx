import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AchievementCard, type AchievementCardData } from "./achievement-card";

const achievement: AchievementCardData = {
  id: "achievement-1",
  kind: "milestone",
  period: "100000000",
  processedTokens: 100_000_000,
  rank: 42,
  coverage: 96,
  trustLevel: "device-verified",
  status: "active",
  issuedAt: 1_735_689_600,
};

afterEach(cleanup);

describe("AchievementCard", () => {
  it("switches between both downloadable achievement styles", () => {
    render(<AchievementCard achievement={achievement} locale="zh" />);

    expect(screen.getByRole("img", { name: "100M Token 里程碑 · 金属典藏" })).toHaveAttribute("src", expect.stringContaining("/certificate/achievement-1/image?lang=zh&style=collector"));
    expect(screen.getByRole("link", { name: /下载图片/ })).toHaveAttribute("href", "/certificate/achievement-1/image?lang=zh&style=collector&download=1");
    fireEvent.click(screen.getByRole("button", { name: "档案典藏" }));
    expect(screen.getByRole("img", { name: "100M Token 里程碑 · 档案典藏" })).toHaveAttribute("src", expect.stringContaining("style=archive"));
    expect(screen.getByRole("link", { name: /下载图片/ })).toHaveAttribute("href", "/certificate/achievement-1/image?lang=zh&style=archive&download=1");
    expect(screen.getByRole("link", { name: "查看证明" })).toHaveAttribute("href", "/zh/certificate/achievement-1");
  });

  it("uses the month as the title for monthly achievements", () => {
    render(<AchievementCard achievement={{ ...achievement, kind: "monthly", period: "2026-07" }} locale="en" />);

    expect(screen.getByRole("img", { name: "2026-07 Monthly Achievement · Metal Collector" })).toBeInTheDocument();
    expect(screen.getByText(/Monthly achievement/)).toBeInTheDocument();
  });
});
