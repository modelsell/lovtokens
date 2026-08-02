import { access } from "node:fs/promises";
import { Command } from "commander";
import { formatTokenCount, processedTokens, syncPayloadV1Schema } from "@lovtokens/token-schema";
import { readConfig, removeConfig, writeConfig } from "./config.js";
import { installAutoSync, openExternal, removeAutoSync } from "./platform.js";
import { scanAll } from "./scanner.js";

const program = new Command();
program.name("lovtokens").description("Your private AI token collector").version("0.1.0");

program.command("connect").description("Connect this device and run the first sync").action(async () => {
  const config = await readConfig();
  const response = await fetch(`${config.serverUrl}/api/device/start`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: `${process.platform} · ${process.env.USER || process.env.USERNAME || "device"}` }),
  });
  if (!response.ok) throw new Error(`Could not start device connection (${response.status})`);
  const connection = (await response.json()) as { deviceCode: string; userCode: string; verificationUri: string; interval: number };
  console.log(`Open ${connection.verificationUri}\nEnter code: ${connection.userCode}`);
  openExternal(connection.verificationUri);
  const deadline = Date.now() + 10 * 60_000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, connection.interval * 1_000));
    const poll = await fetch(`${config.serverUrl}/api/device/poll`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ deviceCode: connection.deviceCode }),
    });
    if (poll.status === 428) continue;
    if (!poll.ok) throw new Error(`Device connection failed (${poll.status})`);
    const credentials = (await poll.json()) as { deviceId: string; token: string; handle: string };
    await writeConfig({ ...config, deviceId: credentials.deviceId, deviceToken: credentials.token, handle: credentials.handle });
    console.log(`Connected as @${credentials.handle}. Running first sync…`);
    await sync(false);
    return;
  }
  throw new Error("Connection expired. Run lovtokens connect again.");
});

program.command("sync").option("--dry-run", "print the payload without uploading").action(async ({ dryRun }) => sync(Boolean(dryRun)));

program.command("show-data").description("Print the exact privacy-safe upload payload").action(async () => {
  const config = await readConfig();
  const data = await scanAll();
  const payload = makePayload(config.deviceId || "00000000-0000-4000-8000-000000000000", data.buckets);
  console.log(JSON.stringify(payload, null, 2));
  printCoverage(data.sources);
});

program.command("status").description("Show local coverage and public profile status").action(async () => {
  const config = await readConfig();
  const data = await scanAll();
  const total = data.buckets.reduce((sum, bucket) => sum + processedTokens(bucket), 0);
  console.log(`Local total: ${formatTokenCount(total)} processed tokens`);
  printCoverage(data.sources);
  console.log(config.deviceId ? `Connected as @${config.handle || "unknown"} · last sync ${config.lastSyncedAt || "never"}` : "Not connected");
});

program.command("card").description("Open your latest public share card").action(async () => {
  const config = await readConfig();
  if (!config.handle) throw new Error("Connect this device first.");
  openExternal(`${config.serverUrl}/u/${encodeURIComponent(config.handle)}#share`);
});

const autoSync = program.command("auto-sync");
autoSync.command("install").description("Install an opt-in 30 minute background sync").action(async () => {
  const executable = process.argv[1];
  if (!executable || !(await exists(executable))) throw new Error("Could not resolve the lovtokens executable.");
  console.log(`Installing a 30 minute background task for ${executable}`);
  console.log(`Installed: ${await installAutoSync(executable)}`);
});
autoSync.command("remove").description("Remove the background sync").action(async () => {
  await removeAutoSync();
  console.log("LovTokens background sync removed.");
});

program.command("disconnect").description("Revoke and remove this device configuration").action(async () => {
  const config = await readConfig();
  if (config.deviceToken) {
    await fetch(`${config.serverUrl}/api/device/revoke`, { method: "POST", headers: { authorization: `Bearer ${config.deviceToken}` } }).catch(() => undefined);
  }
  await removeAutoSync();
  await removeConfig();
  console.log("This device is disconnected. Local agent logs were not changed.");
});

async function sync(dryRun: boolean) {
  const config = await readConfig();
  const data = await scanAll();
  const payload = makePayload(config.deviceId || "00000000-0000-4000-8000-000000000000", data.buckets);
  if (dryRun) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  if (!config.deviceId || !config.deviceToken) throw new Error("Run lovtokens connect first, or use sync --dry-run.");
  const response = await fetch(`${config.serverUrl}/api/sync/v1`, {
    method: "POST",
    headers: { authorization: `Bearer ${config.deviceToken}`, "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(`Sync failed (${response.status}): ${await response.text()}`);
  const result = (await response.json()) as { accepted: number; quarantined: number; visibility?: "public" | "private"; profileUrl?: string; privacySettingsUrl?: string };
  await writeConfig({ ...config, lastSyncedAt: new Date().toISOString() });
  console.log(`Synced ${result.accepted} buckets${result.quarantined ? ` · ${result.quarantined} quarantined` : ""}.`);
  if (result.profileUrl) console.log(result.profileUrl);
  if (result.visibility === "private" && result.privacySettingsUrl) {
    console.log(`Your profile is private. Enable Public profile and Rank and percentile to appear on the leaderboard:\n${result.privacySettingsUrl}`);
  }
}

function makePayload(deviceId: string, buckets: Awaited<ReturnType<typeof scanAll>>["buckets"]) {
  return syncPayloadV1Schema.parse({ schemaVersion: 1, collectorVersion: "0.1.0", deviceId, generatedAt: new Date().toISOString(), buckets });
}

function printCoverage(sources: Awaited<ReturnType<typeof scanAll>>["sources"]) {
  for (const [source, result] of Object.entries(sources)) {
    console.error(`${source}: ${result.filesWithUsage}/${result.filesScanned} files with usage · ${result.buckets.length} buckets`);
    for (const warning of result.warnings) console.error(`  warning: ${warning}`);
  }
}

async function exists(path: string) {
  try { await access(path); return true; } catch { return false; }
}

program.parseAsync().catch((error: unknown) => {
  console.error(`LovTokens: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
