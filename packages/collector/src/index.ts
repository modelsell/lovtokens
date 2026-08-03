import { access } from "node:fs/promises";
import { randomBytes } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { Command } from "commander";
import { formatTokenCount, processedTokens, syncPayloadV1Schema } from "@lovtokens/token-schema";
import { readConfig, removeConfig, resolveServerUrl, writeConfig } from "./config.js";
import { installAutoSync, openExternal, removeAutoSync } from "./platform.js";
import { scanAll } from "./scanner.js";
import { maybeAutoUpdate } from "./updater.js";

const program = new Command();
const collectorVersion = "0.1.3";
program.name("lovtokens").description("Your private AI token collector").version(collectorVersion);

program.command("connect").description("Connect this device and run the first sync").option("--server <url>", "LovTokens site URL").action(async ({ server }: { server?: string }) => {
  const config = await readConfig();
  config.serverUrl = registrationServer(resolveServerUrl(server || config.serverUrl, process.env.LOVTOKENS_URL));
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

program.command("agent-register")
  .description("Conversational account registration for Codex, Claude Code, and WorkBuddy")
  .option("--server <url>", "LovTokens site URL shown in the copied registration guide")
  .action(async ({ server }: { server?: string }) => {
    const current = await readConfig();
    if (current.deviceId) throw new Error(`This device is already connected as @${current.handle || "unknown"}. Run lovtokens status instead.`);
    const serverUrl = registrationServer(resolveServerUrl(server || current.serverUrl, process.env.LOVTOKENS_URL));
    const answers = await promptAgentRegistration();
    const password = `${randomBytes(18).toString("base64url")}Aa1!`;
    const deviceName = `${process.platform} · ${process.env.USER || process.env.USERNAME || "agent-device"}`;

    const response = await fetch(`${serverUrl}/api/agent/register/v1`, {
      method: "POST",
      headers: { "content-type": "application/json", "user-agent": `lovtokens/${program.version()} agent-register` },
      body: JSON.stringify({ ...answers, password, deviceName }),
    });
    const result = await response.json().catch(() => null) as AgentRegistrationResponse | { error?: string } | null;
    if (!response.ok || !result || !("ok" in result)) {
      throw new Error(result && "error" in result && result.error ? result.error : `Registration failed (${response.status})`);
    }

    console.log("Account and device created.");
    console.log(`Email: ${result.email}`);
    console.log(`Nickname: ${result.nickname}`);
    console.log(`Handle: @${result.handle}`);
    console.log(`Privacy: ${result.visibility}`);
    console.log(`Initial password (shown once): ${password}`);
    console.log(`Login: ${result.loginUrl}`);
    if (result.profileUrl) console.log(`Public profile: ${result.profileUrl}`);
    if (result.verificationRequired) console.log("Email verification: required · check your inbox before web sign-in.");

    try {
      await writeConfig({ serverUrl, deviceId: result.deviceId, deviceToken: result.deviceToken, handle: result.handle });
    } catch (error) {
      throw new Error(`Account was created, but local credentials could not be stored. Sign in at ${result.loginUrl} with the initial password above and revoke the incomplete device. ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      console.log("Running the first privacy-safe sync…");
      await sync(false);
    } catch (error) {
      throw new Error(`Account was created, but the first sync failed. Run lovtokens sync to retry. ${error instanceof Error ? error.message : String(error)}`);
    }

    if (answers.autoSync) {
      const executable = process.argv[1];
      if (!executable || !(await exists(executable))) throw new Error("Account and first sync completed, but the scheduled task could not resolve the lovtokens executable. Run lovtokens auto-sync install to retry.");
      try {
        console.log(`Scheduled sync and daily automatic updates: installed at ${await installAutoSync(executable)}`);
        await checkForAutoUpdate();
      } catch (error) {
        throw new Error(`Account and first sync completed, but scheduled sync installation failed. Run lovtokens auto-sync install to retry. ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      console.log("Scheduled sync: not installed by user choice.");
    }

    console.log("Registration complete.");
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
autoSync.command("install").description("Install hourly sync with daily automatic updates").action(async () => {
  const executable = process.argv[1];
  if (!executable || !(await exists(executable))) throw new Error("Could not resolve the lovtokens executable.");
  console.log(`Installing an hourly background task with daily automatic updates for ${executable}`);
  console.log(`Installed: ${await installAutoSync(executable)}`);
  await checkForAutoUpdate();
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
  await checkForAutoUpdate();
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

async function checkForAutoUpdate() {
  try {
    const update = await maybeAutoUpdate({ currentVersion: collectorVersion });
    if (update.status === "updated") {
      console.log(`LovTokens ${update.latestVersion} installed. The next scheduled sync will use it.`);
    } else if (update.status === "failed") {
      console.error(`LovTokens update check failed; sync remains active: ${update.error}`);
    }
  } catch (error) {
    console.error(`LovTokens update check failed; sync remains active: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function makePayload(deviceId: string, buckets: Awaited<ReturnType<typeof scanAll>>["buckets"]) {
  return syncPayloadV1Schema.parse({ schemaVersion: 1, collectorVersion, deviceId, generatedAt: new Date().toISOString(), buckets });
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

type AgentRegistrationResponse = {
  ok: true;
  email: string;
  nickname: string;
  handle: string;
  visibility: "private" | "summary" | "public";
  deviceId: string;
  deviceToken: string;
  verificationRequired: boolean;
  loginUrl: string;
  privacySettingsUrl: string;
  profileUrl: string | null;
};

async function promptAgentRegistration() {
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  try {
    const email = await askUntil(prompt, "Email: ", (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254, "Enter a valid email address.");
    const nickname = await askUntil(prompt, "Nickname: ", (value) => value.length >= 1 && value.length <= 60, "Nickname must contain 1–60 characters.");
    const visibilityAnswer = await askUntil(prompt, "Privacy [1 private (recommended) / 2 summary / 3 public]: ", (value) => ["", "1", "2", "3", "private", "summary", "public"].includes(value.toLowerCase()), "Choose 1, 2, or 3.");
    const visibility = ({ "2": "summary", "3": "public", summary: "summary", public: "public" } as const)[visibilityAnswer.toLowerCase() as "2" | "3" | "summary" | "public"] || "private";
    const autoSyncAnswer = await askUntil(prompt, "Install a local hourly scheduled sync with daily automatic updates? [y/N]: ", (value) => ["", "y", "yes", "n", "no"].includes(value.toLowerCase()), "Answer yes or no.");
    const autoSync = ["y", "yes"].includes(autoSyncAnswer.toLowerCase());
    console.log(`\nConfirm: ${email} · ${nickname} · ${visibility} · scheduled sync ${autoSync ? "on" : "off"}`);
    const confirmed = await askUntil(prompt, "Create the account and run the first sync? [y/N]: ", (value) => ["", "y", "yes", "n", "no"].includes(value.toLowerCase()), "Answer yes or no.");
    if (!["y", "yes"].includes(confirmed.toLowerCase())) throw new Error("Registration cancelled before any account was created.");
    return { email: email.toLowerCase(), nickname, visibility, autoSync };
  } finally {
    prompt.close();
  }
}

async function askUntil(prompt: ReturnType<typeof createInterface>, question: string, valid: (value: string) => boolean, error: string) {
  while (true) {
    const value = (await prompt.question(question)).trim();
    if (valid(value)) return value;
    console.error(error);
  }
}

function registrationServer(value: string) {
  let url: URL;
  try { url = new URL(value); } catch { throw new Error("The registration guide contains an invalid LovTokens server URL."); }
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(local && url.protocol === "http:")) throw new Error("Agent registration requires HTTPS, except on localhost.");
  if (url.username || url.password) throw new Error("The LovTokens server URL must not contain credentials.");
  return url.toString().replace(/\/$/, "");
}

program.parseAsync().catch((error: unknown) => {
  console.error(`LovTokens: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
