import { describe, expect, it } from "vitest";
import { PROFILE_STATEMENT_MAX_LENGTH, profileSettingsSchema } from "./profile-settings";

describe("profile settings", () => {
  it("accepts and trims a short personal statement", () => {
    const result = profileSettingsSchema.parse({ statement: "  Build gently. Ship boldly.  " });
    expect(result.statement).toBe("Build gently. Ship boldly.");
  });

  it("allows clearing the personal statement", () => {
    expect(profileSettingsSchema.parse({ statement: "  " }).statement).toBe("");
  });

  it("rejects statements beyond the public profile limit", () => {
    const result = profileSettingsSchema.safeParse({ statement: "x".repeat(PROFILE_STATEMENT_MAX_LENGTH + 1) });
    expect(result.success).toBe(false);
  });
});
