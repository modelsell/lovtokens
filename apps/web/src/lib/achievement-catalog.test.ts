import { describe, expect, it } from "vitest";
import { advancedAchievements, legendaryAchievements } from "./achievement-catalog";
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

  it("exposes a separate seven-badge legendary collection", () => {
    const achievements = legendaryAchievements(EMPTY_ACHIEVEMENT_METRICS, "zh");

    expect(achievements).toHaveLength(7);
    expect(achievements.map(({ key }) => key)).toEqual([
      "agent-trinity",
      "model-constellation",
      "session-odyssey",
      "yearkeeper",
      "output-star",
      "night-sovereign",
      "token-cosmos",
    ]);
    expect(achievements[6]).toMatchObject({ title: "Token 宇宙", tier: "legendary", target: 100_000_000_000 });
  });

  it("does not preserve an old unlock below the current target", () => {
    const earnedAt = 1_786_000_000;
    const [achievement] = advancedAchievements(EMPTY_ACHIEVEMENT_METRICS, "en", new Map([["tri-agent-commander", earnedAt]]));

    expect(achievement).toMatchObject({ unlocked: false, issuedAt: undefined });
  });
});
