import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LeaderboardTable } from "./leaderboard-table";

afterEach(cleanup);

describe("LeaderboardTable", () => {
  it("shows the earned achievement count after the builder name", () => {
    render(<LeaderboardTable entries={[{
      rank: 1,
      handle: "jie",
      displayName: "Jie",
      avatarUrl: null,
      isAnonymous: false,
      processedTokens: 100_000_000,
      activeDays: 12,
      percentile: 1,
      codexTokens: 60_000_000,
      claudeTokens: 30_000_000,
      workbuddyTokens: 10_000_000,
      achievementCount: 7,
      trustLevel: "collector-checked",
      showExactTokens: true,
      showAvatar: true,
    }]} locale="zh" />);

    expect(screen.getByLabelText("7 枚成就")).toHaveTextContent("7");
    expect(screen.getByText("Jie").parentElement).toContainElement(screen.getByLabelText("7 枚成就"));
  });
});
