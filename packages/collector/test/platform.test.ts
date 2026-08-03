import { describe, expect, it } from "vitest";
import { buildAutoSyncRunner } from "../src/platform.js";

describe("auto-sync runner", () => {
  it("prefers the atomically activated managed executable and keeps a fallback", () => {
    const source = buildAutoSyncRunner("/opt/lovtokens/dist/index.js");
    expect(source).toContain("installedExecutable");
    expect(source).toContain('"/opt/lovtokens/dist/index.js"');
    expect(source).toContain('[target, "sync"]');
  });
});
