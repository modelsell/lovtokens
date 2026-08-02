import "@testing-library/jest-dom/vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { buildActivityGrid, UsageHeatmap } from "./usage-heatmap";

describe("UsageHeatmap", () => {
  it("builds a Monday-first 12-month contribution grid", () => {
    const grid = buildActivityGrid([{ date: "2026-08-03", tokens: 250 }], "2026-08-03");
    expect(grid.months).toHaveLength(12);
    expect(grid.cells.find((cell) => cell.date === "2026-08-03")).toMatchObject({ tokens: 250, level: 4, visible: true });
    expect(grid.cells[0]?.date).toBe("2025-09-01");
    expect(grid.cells.at(-1)?.date).toBe("2026-08-03");
    expect(grid.cells.some((cell) => cell.date > "2026-08-03")).toBe(false);
  });

  it("shows daily details and switches aggregation modes", () => {
    render(<UsageHeatmap daily={[
      { date: "2026-08-03", tokens: 200 },
      { date: "2026-08-04", tokens: 100 },
    ]} locale="zh" today="2026-08-04" />);

    expect(screen.getByLabelText(/2026-08-03.*200.*使用率 100%/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("tab", { name: "每周" }));
    expect(screen.getByRole("tab", { name: "每周" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByLabelText(/2026-08-03.*300.*本周/)).toBeInTheDocument();
  });
});
