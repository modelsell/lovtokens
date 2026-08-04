import { describe, expect, it } from "vitest";
import { directShareUrl, shareTargetFromRef, trackingUrl } from "./share-targets";

describe("share targets", () => {
  it("adds privacy-safe channel attribution without changing the destination path", () => {
    const result = new URL(trackingUrl("https://lovtokens.test/zh/u/jie", "x", "profile"));
    expect(result.pathname).toBe("/zh/u/jie");
    expect(result.searchParams.get("ref")).toBe("share_x");
    expect(result.searchParams.get("share_kind")).toBe("profile");
  });

  it("builds editable composer links for every supported direct target", () => {
    const payload = { title: "Title", text: "Measured usage", url: "https://lovtokens.test/u/jie?ref=share_x" };
    expect(directShareUrl("x", payload)).toContain("x.com/intent/tweet");
    expect(directShareUrl("linkedin", payload)).toContain("linkedin.com/sharing/share-offsite");
    expect(directShareUrl("facebook", payload)).toContain("facebook.com/sharer/sharer.php");
    expect(directShareUrl("telegram", payload)).toContain("t.me/share/url");
    expect(directShareUrl("whatsapp", payload)).toContain("wa.me/");
  });

  it("accepts only known share attribution values", () => {
    expect(shareTargetFromRef("share_telegram")).toBe("telegram");
    expect(shareTargetFromRef("share_wechat")).toBeNull();
    expect(shareTargetFromRef("unknown")).toBeNull();
  });
});
