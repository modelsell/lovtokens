import { describe, expect, it } from "vitest";
import { resolveAuthMethods } from "./auth-options";

describe("resolveAuthMethods", () => {
  it("enables email and password automatically on localhost", () => {
    expect(resolveAuthMethods({}, "http://localhost:3100")).toEqual({ emailPassword: true, github: false });
    expect(resolveAuthMethods({ EMAIL_PASSWORD_AUTH_ENABLED: "" }, "http://localhost:3100").emailPassword).toBe(true);
  });

  it("keeps unverified email registration closed by default in production", () => {
    expect(resolveAuthMethods({}, "https://lovtokens.com")).toEqual({ emailPassword: false, github: false });
  });

  it("supports explicit production email auth and configured GitHub auth", () => {
    expect(resolveAuthMethods({ EMAIL_PASSWORD_AUTH_ENABLED: "true", GITHUB_CLIENT_ID: "id", GITHUB_CLIENT_SECRET: "secret" }, "https://lovtokens.com")).toEqual({ emailPassword: true, github: true });
  });

  it("allows the local default to be explicitly disabled", () => {
    expect(resolveAuthMethods({ EMAIL_PASSWORD_AUTH_ENABLED: "false" }, "http://127.0.0.1:3100").emailPassword).toBe(false);
  });
});
