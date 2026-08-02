import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/lib/db/schema.ts",
  out: "../../migrations/drizzle",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || "missing",
    databaseId: process.env.CLOUDFLARE_DATABASE_ID || "missing",
    token: process.env.CLOUDFLARE_D1_TOKEN || "missing",
  },
});
