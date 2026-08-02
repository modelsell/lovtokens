import { describe, expect, it } from "vitest";
import { safeReturnTo } from "./redirect";

describe("safeReturnTo", () => {
  it("accepts local application paths", () => {
    expect(safeReturnTo("/zh/settings/privacy?tab=public", "/dashboard")).toBe("/zh/settings/privacy?tab=public");
  });

  it("rejects external, protocol-relative and API paths", () => {
    for (const value of ["https://evil.example", "//evil.example", "/api/auth/sign-out", "javascript:alert(1)"]) {
      expect(safeReturnTo(value, "/dashboard")).toBe("/dashboard");
    }
  });
});
