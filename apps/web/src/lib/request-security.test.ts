import { describe, expect, it } from "vitest";
import { isSameOrigin } from "./request-security";

describe("isSameOrigin", () => {
  it("accepts matching browser origins", () => {
    expect(isSameOrigin(new Request("https://lovtokens.example/api/settings", { headers: { origin: "https://lovtokens.example", host: "lovtokens.example" } }))).toBe(true);
  });

  it("rejects missing and cross-site origins", () => {
    expect(isSameOrigin(new Request("https://lovtokens.example/api/settings"))).toBe(false);
    expect(isSameOrigin(new Request("https://lovtokens.example/api/settings", { headers: { origin: "https://evil.example", host: "lovtokens.example" } }))).toBe(false);
  });
});
