import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
export default defineConfig({ resolve: { alias: { "@lovtokens/token-schema": fileURLToPath(new URL("../../packages/token-schema/src/index.ts", import.meta.url)), "@": fileURLToPath(new URL("./src", import.meta.url)) } }, test: { environment: "jsdom", exclude: ["e2e/**", "node_modules/**", ".next/**", ".open-next/**"] } });
