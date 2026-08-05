import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { hashPassword } from "better-auth/crypto";

const DATABASE = "lovtokens-db";
const TEST_PASSWORD = "LovTokens-test-2026!";
const webDirectory = fileURLToPath(new URL("..", import.meta.url));

function runWrangler(args) {
  const result = spawnSync("pnpm", ["exec", "wrangler", ...args], {
    cwd: webDirectory,
    encoding: "utf8",
    stdio: "inherit",
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Wrangler exited with status ${result.status ?? "unknown"}.`);
  }
}

const temporaryDirectory = await mkdtemp(join(tmpdir(), "lovtokens-local-seed-"));
const generatedSqlPath = join(temporaryDirectory, "seed-local.sql");

try {
  console.log("Applying local D1 migrations...");
  runWrangler(["d1", "migrations", "apply", DATABASE, "--local"]);

  const template = await readFile(new URL("./seed-local.sql", import.meta.url), "utf8");
  if (!template.includes("__TEST_PASSWORD_HASH__")) {
    throw new Error("Local seed SQL is missing its password-hash placeholder.");
  }
  const passwordHash = await hashPassword(TEST_PASSWORD);
  await writeFile(
    generatedSqlPath,
    template.replaceAll("__TEST_PASSWORD_HASH__", passwordHash),
    { mode: 0o600 },
  );

  console.log("Replacing LovTokens local seed records...");
  runWrangler(["d1", "execute", DATABASE, "--local", "--file", generatedSqlPath, "--yes"]);

  console.log("Verifying local seed totals...");
  runWrangler([
    "d1",
    "execute",
    DATABASE,
    "--local",
    "--command",
    `SELECT
      COUNT(*) AS users,
      (SELECT COUNT(*) FROM profiles WHERE user_id LIKE 'seed-user-%') AS profiles,
      (SELECT COUNT(*) FROM devices WHERE user_id LIKE 'seed-user-%') AS devices,
      (SELECT COUNT(*) FROM usage_daily WHERE user_id LIKE 'seed-user-%') AS usage_rows,
      (SELECT COUNT(*) FROM leaderboard_snapshots WHERE user_id LIKE 'seed-user-%') AS snapshots,
      (SELECT COUNT(*) FROM leaderboard_rank_history WHERE user_id LIKE 'seed-user-%') AS rank_history,
      (SELECT COUNT(*) FROM certificates WHERE user_id LIKE 'seed-user-%') AS certificates,
      (SELECT COUNT(*) FROM achievements WHERE user_id LIKE 'seed-user-%') AS achievements,
      (SELECT COUNT(*) FROM teams WHERE id LIKE 'seed-team-%') AS teams,
      (SELECT COUNT(*) FROM team_members WHERE team_id LIKE 'seed-team-%') AS team_members
    FROM user WHERE id LIKE 'seed-user-%';`,
  ]);

  console.log("Local test login: seed01@lovtokens.local / LovTokens-test-2026!");
  console.log("Other accounts use seed02..seed30@lovtokens.local with the same password.");
} finally {
  await rm(temporaryDirectory, { recursive: true, force: true });
}
