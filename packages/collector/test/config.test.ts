import { describe, expect, it } from "vitest";
import { defaultServerUrl, resolveServerUrl } from "../src/config.js";

describe("collector server URL", () => {
  it("uses the LovTokens development port", () => {
    expect(resolveServerUrl(undefined, undefined)).toBe(defaultServerUrl);
    expect(defaultServerUrl).toBe("http://localhost:3100");
  });

  it("migrates legacy local port configurations", () => {
    expect(resolveServerUrl("http://localhost:3000", undefined)).toBe(defaultServerUrl);
    expect(resolveServerUrl("http://127.0.0.1:3000", undefined)).toBe(defaultServerUrl);
  });

  it("keeps explicit servers and lets LOVTOKENS_URL override them", () => {
    expect(resolveServerUrl("https://lovtokens.example/", undefined)).toBe("https://lovtokens.example");
    expect(resolveServerUrl("https://old.example", "http://localhost:4111/")).toBe("http://localhost:4111");
  });
});
