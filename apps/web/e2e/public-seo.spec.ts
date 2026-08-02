import { expect, test } from "@playwright/test";

const testOrigin = "http://localhost:3107";

test("home renders the privacy boundary and primary command in initial HTML", async ({ request, page }) => {
  const response = await request.get("/"); const html = await response.text();
  expect(response.ok()).toBeTruthy();
  expect(html).toContain("Your AI Token Portfolio");
  expect(html).toContain("npx lovtokens@latest connect");
  expect(html).toContain("application/ld+json");
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Count it/i })).toBeVisible();
});

test("crawler routes and methodology are indexable", async ({ request }) => {
  for (const path of ["/robots.txt", "/sitemap.xml", "/llms.txt", "/methodology"]) {
    const response = await request.get(path); expect(response.status(), path).toBe(200);
  }
  const methodology = await (await request.get("/methodology")).text();
  expect(methodology).toContain("processed tokens");
  expect(methodology).toContain("Usage is not productivity");
});

test("Chinese routes render complete localized pages and preserve the locale in navigation", async ({ request, page }) => {
  const expectations = [
    ["/zh", "统计。"],
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

  await page.goto("/docs");
  await page.getByRole("link", { name: "切换到中文" }).click();
  await expect(page).toHaveURL(/\/zh\/docs$/);
  await expect(page.getByRole("heading", { name: "一条命令，边界清晰。" })).toBeVisible();
  await page.getByRole("link", { name: "统计方法", exact: true }).first().click();
  await expect(page).toHaveURL(/\/zh\/methodology$/);
  await expect(page.getByRole("heading", { name: "每个数字都有规则。" })).toBeVisible();
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
