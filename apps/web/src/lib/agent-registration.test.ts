import { describe, expect, it } from "vitest";
import { agentRegistrationHandoff, agentRegistrationSchema, privacyForVisibility } from "./agent-registration";

describe("agent registration", () => {
  it("keeps the default registration private", () => {
    const input = agentRegistrationSchema.parse({
      email: "builder@example.com",
      nickname: "Builder",
      password: "a-secure-password",
      deviceName: "darwin · laptop",
    });
    expect(input.visibility).toBe("private");
    expect(privacyForVisibility(input.visibility)).toMatchObject({ isPublic: 0, showExactTokens: 0, showRank: 0 });
  });

  it("maps summary and public consent to distinct fields", () => {
    expect(privacyForVisibility("summary")).toMatchObject({ isPublic: 1, showExactTokens: 0, showModels: 0 });
    expect(privacyForVisibility("public")).toMatchObject({ isPublic: 1, showExactTokens: 1, showModels: 1 });
  });

  it("keeps the copyable handoff short and points to the current production document", () => {
    const handoff = agentRegistrationHandoff("https://lovtokens.example", "zh");
    expect(handoff).toContain("https://lovtokens.example/agent-register.md");
    expect(handoff).toContain("根据我当前的操作系统");
    expect(handoff).toContain("Codex、Claude Code 和 WorkBuddy Token 用量");
    expect(handoff.split("。").filter(Boolean)).toHaveLength(1);
    expect(handoff.length).toBeLessThan(220);
  });
});
