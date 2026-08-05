import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { PublicAchievementShelf } from "./public-achievement-shelf";

afterEach(cleanup);

describe("PublicAchievementShelf", () => {
  it("renders earned behavior and certificate badges without locked slots", () => {
    const { container } = render(<PublicAchievementShelf achievements={[
      { key: "night-owl", kind: "behavior", earnedAt: 1_735_689_600 },
      { key: "removed-rule", kind: "behavior", earnedAt: 1_735_689_700 },
      { key: "milestone-100000000", kind: "milestone", earnedAt: 1_735_689_800, certificateId: "cert-1", period: "100000000", processedTokens: 100_000_000 },
    ]} locale="zh" />);

    expect(screen.getByRole("heading", { name: "已获得成就徽章" })).toBeInTheDocument();
    expect(screen.getByText("UTC 夜航者")).toBeInTheDocument();
    expect(screen.getByText("青铜起点")).toBeInTheDocument();
    expect(screen.queryByText("removed-rule")).not.toBeInTheDocument();
    expect(container.querySelector("#achievement-night-owl")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /青铜起点/ })).toHaveAttribute("href", "/zh/certificate/cert-1");
  });
});
