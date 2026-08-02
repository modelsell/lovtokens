import { defineConfig } from "tsup";
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  noExternal: ["@lovtokens/token-schema"],
  banner: { js: "#!/usr/bin/env node" },
});
