import { describe, expect, it } from "vitest";
import { advancedAchievements } from "./achievement-catalog";
import { EMPTY_ACHIEVEMENT_METRICS } from "./achievement-metrics";

describe("advancedAchievements", () => {
  it("exposes the ten new localized collectible slots", () => {
    const achievements = advancedAchievements(EMPTY_ACHIEVEMENT_METRICS, "zh");

    expect(achievements).toHaveLength(10);
    expect(achievements.map(({ key }) => key)).toEqual([
      "tri-agent-commander",
      "model-museum",
      "session-voyager",
      "output-forge",
      "thirty-day-flame",
      "twelve-week-serial",
      "hundred-day-expedition",
      "daily-supernova",
      "cache-mithril",
      "cache-legend",
    ]);
    expect(achievements[0]).toMatchObject({ title: "三栖指挥官", image: "/achievements/tri-agent-commander.png", unlocked: false });
  });

  it("keeps a previously earned achievement unlocked", () => {
    const earnedAt = 1_786_000_000;
    const [achievement] = advancedAchievements(EMPTY_ACHIEVEMENT_METRICS, "en", new Map([["tri-agent-commander", earnedAt]]));

    expect(achievement).toMatchObject({ unlocked: true, issuedAt: earnedAt });
  });
});
