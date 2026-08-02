import { afterEach, describe, expect, it, vi } from "vitest";
import { authEmail, hasEmailDelivery, sendAuthEmail } from "./mailer";

afterEach(() => vi.unstubAllGlobals());

describe("authentication mail delivery", () => {
  it("requires both a Resend key and sender identity", () => {
    expect(hasEmailDelivery({ RESEND_API_KEY: "key", AUTH_EMAIL_FROM: "LovTokens <auth@example.com>" })).toBe(true);
    expect(hasEmailDelivery({ RESEND_API_KEY: "key" })).toBe(false);
  });

  it("escapes action URLs in HTML email", () => {
    const email = authEmail("reset", "https://example.com/reset?a=1&b=\"unsafe\"");
    expect(email.html).toContain("a=1&amp;b=&quot;unsafe&quot;");
    expect(email.text).toContain("https://example.com/reset");
  });

  it("sends the documented email payload without exposing the API key in the body", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: "email-id" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    await sendAuthEmail({ RESEND_API_KEY: "secret-key", AUTH_EMAIL_FROM: "LovTokens <auth@example.com>" }, { to: "user@example.com", subject: "Subject", text: "Text", html: "<p>HTML</p>" });
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(options.headers).toMatchObject({ authorization: "Bearer secret-key" });
    expect(String(options.body)).not.toContain("secret-key");
  });
});
