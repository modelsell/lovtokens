import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CodingAnalyticsDashboard, type AnalyticsRow, type HourlyAnalyticsRow } from "./coding-analytics-dashboard";

const daily: AnalyticsRow[] = [
  { date: "2026-08-05", source: "codex", model: "gpt-5.6", inputTokens: 800, freshTokens: 300, cacheReadTokens: 400, cacheWriteTokens: 100, outputTokens: 200, reasoningTokens: 80, requests: 2 },
  { date: "2026-08-04", source: "claude-code", model: "claude-opus", inputTokens: 400, freshTokens: 300, cacheReadTokens: 100, cacheWriteTokens: 0, outputTokens: 100, reasoningTokens: 0, requests: 1 },
];

const hourly: HourlyAnalyticsRow[] = [
  { ...daily[0]!, hour: 14 },
  { ...daily[1]!, hour: 22 },
];

describe("CodingAnalyticsDashboard", () => {
  it("renders exact hourly coverage and responds to source and range filters", () => {
    const { container } = render(<CodingAnalyticsDashboard daily={daily} hourly={hourly} locale="zh" today="2026-08-05" />);

    expect(screen.getByRole("heading", { name: "你的 Coding 数据驾驶舱" })).toBeInTheDocument();
    expect(screen.getByText("小时明细覆盖 100%")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "7天" }));
    expect(screen.getByRole("button", { name: "7天" })).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(screen.getByRole("button", { name: "Codex" }));
    expect(screen.getByRole("button", { name: "Codex" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByText("gpt-5.6").length).toBeGreaterThan(0);
    expect(screen.queryByText("claude-opus")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "UTC" }));
    fireEvent.click(screen.getByRole("button", { name: "今天" }));
    expect(screen.getByRole("button", { name: "今天" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("heading", { name: "今日每小时 Token 走势与模型切换" })).toBeInTheDocument();
    expect(container.querySelectorAll(".chart-hover-target")).toHaveLength(24);
    fireEvent.mouseEnter(container.querySelector('[aria-label^="14:00–15:00"]')!);
    expect(screen.getByText("总量 · 1,000 tokens")).toBeInTheDocument();
  });
});
