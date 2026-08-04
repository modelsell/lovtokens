import { describe, expect, it } from "vitest";
import { achievementProgress, type AchievementMetrics } from "./achievement-metrics";

const metrics: AchievementMetrics = {
  codexTokens: 4_000_000,
  claudeTokens: 3_000_000,
  workbuddyTokens: 2_000_000,
  cacheTokens: 11_000_000_000,
  outputTokens: 12_000_000,
  modelCount: 11,
  sessionCount: 600,
  activeDays: 120,
  activeWeeks: 16,
  weekendDays: 8,
  nightTokens: 2_000_000,
  maxDailyTokens: 1_200_000_000,
  longestStreak: 35,
};

describe("achievementProgress", () => {
  it("derives every advanced achievement from its intended metric", () => {
    const progress = achievementProgress(metrics);

    expect(progress["tri-agent-commander"]).toEqual({ value: 2_000_000, target: 1_000_000 });
    expect(progress["model-museum"]).toEqual({ value: 11, target: 10 });
    expect(progress["session-voyager"]).toEqual({ value: 600, target: 500 });
    expect(progress["output-forge"]).toEqual({ value: 12_000_000, target: 10_000_000 });
    expect(progress["thirty-day-flame"]).toEqual({ value: 35, target: 30 });
    expect(progress["twelve-week-serial"]).toEqual({ value: 16, target: 12 });
    expect(progress["hundred-day-expedition"]).toEqual({ value: 120, target: 100 });
    expect(progress["daily-supernova"]).toEqual({ value: 1_200_000_000, target: 1_000_000_000 });
    expect(progress["cache-mithril"]).toEqual({ value: 11_000_000_000, target: 1_000_000_000 });
    expect(progress["cache-legend"]).toEqual({ value: 11_000_000_000, target: 10_000_000_000 });
  });
});
