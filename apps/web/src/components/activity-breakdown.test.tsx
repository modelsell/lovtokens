import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActivityBreakdown } from "./activity-breakdown";

describe("ActivityBreakdown", () => {
  it("renders token totals with bars relative to the largest row", () => {
    const { container } = render(<ActivityBreakdown rows={[
      { label: "Codex", tokens: 400 },
      { label: "Claude Code", tokens: 100 },
    ]} />);

    expect(screen.getByText("Codex")).toBeInTheDocument();
    const bars = container.querySelectorAll(".dashboard-breakdown b");
    expect(bars[0]).toHaveStyle({ width: "100%" });
    expect(bars[1]).toHaveStyle({ width: "25%" });
  });

  it("shows an empty state without activity rows", () => {
    render(<ActivityBreakdown rows={[]} />);
    expect(screen.getByText("—")).toBeInTheDocument();
  });
});
