import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";
export default defineConfig({ resolve: { alias: { "@lovtokens/token-schema": fileURLToPath(new URL("../token-schema/src/index.ts", import.meta.url)) } } });
