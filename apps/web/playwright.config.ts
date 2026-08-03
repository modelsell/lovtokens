import { defineConfig, devices } from "@playwright/test";
const externalBaseURL = process.env.PLAYWRIGHT_BASE_URL;
const baseURL = externalBaseURL || "http://localhost:3107";
export default defineConfig({ testDir: "./e2e", use: { baseURL, trace: "retain-on-failure" }, webServer: externalBaseURL ? undefined : { command: "pnpm exec next dev --port 3107", url: baseURL, reuseExistingServer: false, env: { PUBLIC_SITE_URL: baseURL, BETTER_AUTH_URL: baseURL } }, projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }] });
