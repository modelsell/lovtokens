import { expect, test } from "@playwright/test";

const testOrigin = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3107";

test("home explains the product and switches between agent and one-command setup", async ({ request, page }) => {
  const response = await request.get("/"); const html = await response.text();
  expect(response.ok()).toBeTruthy();
  expect(html).toContain("Your AI Token Portfolio");
  expect(html).toContain(`${testOrigin}/agent-register.md`);
  expect(html).toContain(`For my current operating system, read and follow ${testOrigin}/agent-register.md`);
  expect(html).toContain("application/ld+json");
  await page.goto("/");
  await expect(
    page.getByRole("heading", { level: 1, name: "See your AI coding usage." }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /LovTokens source code on GitHub · (?:\d+|—) Stars/ })).toHaveAttribute("href", "https://github.com/modelsell/lovtokens");
  await expect(page.locator(".github-repo-link > svg")).toBeVisible();
  await expect(page.locator(".github-star-count")).toHaveText(/^(?:\d+|—)$/);
  expect(await page.locator(".desktop-nav a").evaluateAll((links) => links.map((link) => link.getAttribute("href")))).toEqual(["/leaderboard", "/teams", "/methodology", "/docs", "/privacy"]);
  await expect(page.locator(".desktop-nav").getByRole("link", { name: "Privacy contract" })).toHaveAttribute("href", "/privacy");
  await expect(page.locator(".desktop-nav").getByRole("link", { name: "Journal" })).toHaveCount(0);
  await expect(page.locator('.mobile-menu nav a[href="/docs"]')).toHaveText("Docs");
  await expect(page.locator('.mobile-menu nav a[href="/privacy"]')).toHaveText("Privacy contract");
  await expect(page.locator(".mobile-menu nav").getByRole("link", { name: "Journal" })).toHaveCount(0);
  await expect(page.getByRole("tab", { name: /Set up with Agent/ })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("button", { name: "Copy recommendation" })).toBeVisible();
  await expect(page.getByRole("link", { name: /See the full instructions/ })).toHaveAttribute("href", `${testOrigin}/agent-register.md`);
  await page.getByRole("tab", { name: "Manual setup" }).click();
  await expect(page.getByText("Run one command")).toBeVisible();
  await expect(page.getByText(`npx lovtokens@latest agent-register --server ${testOrigin}`, { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy setup command" })).toBeVisible();
  await expect(page.getByText("The collector is open source.")).toBeVisible();
  await expect(page.getByText("npx lovtokens@latest show-data", { exact: true }).last()).toBeVisible();
  await expect(page.getByRole("link", { name: /See upload code and privacy details/ })).toHaveAttribute("href", "/privacy#inspect-upload");
  await expect(page.getByRole("link", { name: /View the open-source project/ })).toHaveAttribute("href", "https://github.com/modelsell/lovtokens");
  await page.getByRole("tab", { name: /Set up with Agent/ }).click();
  await expect(page.getByRole("button", { name: "Copy recommendation" })).toBeVisible();
});

test("crawler routes and methodology are indexable", async ({ request }) => {
  for (const path of ["/robots.txt", "/sitemap.xml", "/llms.txt", "/methodology", "/agent-register.md"]) {
    const response = await request.get(path); expect(response.status(), path).toBe(200);
  }
  const methodology = await (await request.get("/methodology")).text();
  expect(methodology).toContain("processed tokens");
  expect(methodology).toContain("Usage is not productivity");
  const registrationDocument = await (await request.get("/agent-register.md")).text();
  expect(registrationDocument).toContain("npx lovtokens@latest agent-register --server {LOVTOKENS_ORIGIN}");
  expect(registrationDocument).toContain("Registration complete.");
  expect(registrationDocument).toContain("注册默认使用 `public` 模式");
  expect(registrationDocument).toContain("只有得到用户明确确认后才能继续");
});

test("Chinese routes render complete localized pages and preserve the locale in navigation", async ({ request, page }) => {
  const expectations = [
    ["/zh", "看清你的"],
    ["/zh/leaderboard", "公开 Token 排行榜"],
    ["/zh/docs", "一条命令，边界清晰"],
    ["/zh/privacy", "只汇总数字，不采集工作内容"],
    ["/zh/methodology", "每个数字都有规则"],
    ["/zh/blog", "结合上下文衡量"],
    ["/zh/compare/codex-vs-claude-code-token-usage", "统计方式不同"],
  ] as const;

  for (const [path, text] of expectations) {
    const response = await request.get(path);
    const html = await response.text();
    expect(response.status(), path).toBe(200);
    expect(html, path).toContain('lang="zh-CN"');
    expect(html, path).toContain(text);
    expect(html, path).toContain('href="/zh/docs"');
  }

  const docs = await (await request.get("/zh/docs")).text();
  expect(docs).toContain("<title>LovTokens 采集器文档 · LovTokens</title>");
  expect(docs).toContain(`rel="canonical" href="${testOrigin}/zh/docs"`);
  expect(docs).toContain(`hrefLang="en" href="${testOrigin}/docs"`);
  expect(docs).not.toContain('id="inspect-upload"');
  expect(docs).not.toContain("body: JSON.stringify(payload)");

  const privacy = await (await request.get("/zh/privacy")).text();
  expect(privacy).toContain('id="inspect-upload"');
  expect(privacy).toContain("采集器与上传逻辑已经开源");
  expect(privacy).toContain("body: JSON.stringify(payload)");
  expect(privacy).toContain("sessionFingerprint: z.string().regex");
  expect(privacy).toContain("buckets: z.array(usageBucketV2Schema)");
  expect(privacy).toContain("utcHour: z.number().int().min(0).max(23)");
  expect(privacy).toContain("https://github.com/modelsell/lovtokens/blob/main/packages/collector/src/index.ts");

  await page.goto("/docs");
  await page.locator(".site-header").getByRole("combobox", { name: "Language" }).selectOption("zh");
  await expect(page).toHaveURL(/\/zh\/docs$/);
  await expect(page.getByRole("heading", { name: "一条命令，边界清晰。" })).toBeVisible();
  await page.getByRole("link", { name: "统计方法", exact: true }).first().click();
  await expect(page).toHaveURL(/\/zh\/methodology$/);
  await expect(page.getByRole("heading", { name: "每个数字都有规则。" })).toBeVisible();
});

test("agent registration creates a private account and bound device without exposing the token in a web session", async ({ request }) => {
  const stamp = Date.now();
  const email = `agent-register-${stamp}@example.test`;
  const password = "LovTokens-agent-register-2026!";
  const response = await request.post("/api/agent/register/v1", {
    data: { email, nickname: `Agent ${stamp}`, password, visibility: "private", deviceName: "playwright · agent" },
  });
  expect(response.status()).toBe(201);
  const registration = await response.json() as { handle: string; visibility: string; deviceId: string; deviceToken: string; profileUrl: string | null };
  expect(registration.visibility).toBe("private");
  expect(registration.profileUrl).toBeNull();
  expect(registration.deviceId).toMatch(/^[0-9a-f-]{36}$/);
  expect(registration.deviceToken).toMatch(/^[0-9a-f]{64}$/);

  const duplicate = await request.post("/api/agent/register/v1", {
    data: { email, nickname: "Different Agent", password: "Different-password-2026!", visibility: "public", deviceName: "untrusted duplicate" },
  });
  expect(duplicate.status()).toBe(409);

  const login = await request.post("/api/auth/sign-in/email", { headers: { origin: testOrigin }, data: { email, password } });
  expect(login.status()).toBe(200);
  const cleanup = await request.delete("/api/settings/data", { headers: { origin: testOrigin } });
  expect(cleanup.status()).toBe(200);
});

test("local device approval offers bilingual email registration without GitHub OAuth", async ({ page }) => {
  await page.goto("/connect?code=ABCD-2345");
  await expect(page.getByRole("tab", { name: "Sign in" })).toBeVisible();
  await page.getByRole("tab", { name: "Create account" }).click();
  await expect(page.getByRole("button", { name: "Create account with email" })).toBeVisible();

  await page.goto("/zh/connect?code=ABCD-2345");
  await expect(page.getByRole("tab", { name: "登录" })).toBeVisible();
  await page.getByRole("tab", { name: "注册账号" }).click();
  await expect(page.getByRole("button", { name: "使用邮箱注册" })).toBeVisible();
});

test("homepage exposes authentication and a signed-in user can reach the personal center", async ({ page, request }) => {
  const protectedResponse = await request.get("/dashboard", { maxRedirects: 0 });
  expect(protectedResponse.status()).toBe(307);
  expect(protectedResponse.headers().location).toContain("/login?returnTo=%2Fdashboard");
  const stamp = Date.now();
  const email = `playwright-account-${stamp}@example.test`;
  await page.goto(`${testOrigin}/`);
  await expect(page.getByRole("link", { name: "Sign in", exact: true }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Create account", exact: true }).first()).toBeVisible();

  await page.goto(`${testOrigin}/register`);
  await page.getByLabel("Name").fill(`Playwright ${stamp}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("LovTokens-playwright-2026!");
  await page.getByRole("button", { name: "Create account with email" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  await page.goto(`${testOrigin}/`);
  await expect(page.locator(".home-account").getByText(`Playwright ${stamp}`, { exact: true })).toBeVisible();
  await expect(page.locator(".home-account").getByText("Private profile", { exact: true })).toBeVisible();
  await page.getByLabel("Open account menu").click();
  await page.getByRole("link", { name: "Personal center", exact: true }).first().click();
  await expect(page).toHaveURL(/\/dashboard$/);
  await page.getByRole("link", { name: "Data dashboard", exact: true }).click();
  await expect(page).toHaveURL(/\/dashboard\/insights$/);
  await expect(page.getByRole("heading", { name: "Data dashboard" })).toBeVisible();

  await page.goto(`${testOrigin}/settings/account`);
  await expect(page.getByRole("heading", { name: "Account and security" })).toBeVisible();
  await expect(page.getByLabel("Email")).toHaveValue(email);

  const extraSession = await page.request.post(`${testOrigin}/api/auth/sign-in/email`, { headers: { origin: testOrigin }, data: { email, password: "LovTokens-playwright-2026!" } });
  expect(extraSession.status()).toBe(200);
  await page.reload();
  await expect(page.locator(".session-list > div")).toHaveCount(2);
  await page.getByRole("button", { name: "Revoke others" }).click();
  await expect(page.locator(".session-list > div")).toHaveCount(1);

  await page.getByLabel("Current password").fill("LovTokens-playwright-2026!");
  await page.getByLabel("New password", { exact: true }).fill("LovTokens-playwright-new-2026!");
  await page.getByLabel("Confirm new password").fill("LovTokens-playwright-new-2026!");
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByText("Password changed. Other sessions were revoked.")).toBeVisible();

  await page.getByLabel("Open account menu").click();
  await page.getByRole("button", { name: "Sign out" }).first().click();
  await expect(page).toHaveURL(`${testOrigin}/`);
  await page.goto(`${testOrigin}/login`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("LovTokens-playwright-new-2026!");
  await page.getByRole("button", { name: "Sign in with email" }).click();
  await expect(page).toHaveURL(/\/dashboard$/);

  const cleanup = await page.request.delete(`${testOrigin}/api/settings/data`, { headers: { origin: testOrigin } });
  expect(cleanup.status()).toBe(200);
});
