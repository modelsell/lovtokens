import { describe, expect, it } from "vitest";
import { achievementFor, formatPercent } from "./format";

describe("public formatting", () => {
  it("keeps the activity framing explicit", () => {
    expect(achievementFor(1_000_000_000, 12, 700_000_000, 300_000_000)).toBe("Billion Token Club");
    expect(formatPercent(0.42)).toBe("Top 0.4%");
  });
});
