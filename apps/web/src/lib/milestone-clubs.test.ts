import { describe, expect, it } from "vitest";
import { MILESTONE_CLUBS, milestoneClubForTokens, milestoneClubText } from "./milestone-clubs";

describe("milestone clubs", () => {
  it("uses the Token Club naming ladder for every proof milestone", () => {
    expect(MILESTONE_CLUBS.map((club) => milestoneClubText(club, "zh").title)).toEqual([
      "一亿俱乐部",
      "十亿俱乐部",
      "百亿俱乐部",
      "五百亿俱乐部",
      "千亿俱乐部",
    ]);
  });

  it("selects the highest club reached by a token total", () => {
    expect(milestoneClubForTokens(11_000_000_000).mark).toBe("10B");
    expect(milestoneClubForTokens(120_000_000_000).mark).toBe("100B");
  });
});
