import { execFile, spawn } from "node:child_process";
import { chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import type { CollectorConfig } from "./types.js";

const execFileAsync = promisify(execFile);
const credentialService = "dev.lovtokens.cli";
export const defaultServerUrl = "http://localhost:3100";

export const configPath = () => {
  if (process.platform === "win32") {
    return join(process.env.APPDATA || join(homedir(), "AppData", "Roaming"), "lovtokens", "config.json");
  }
  return join(process.env.XDG_CONFIG_HOME || join(homedir(), ".config"), "lovtokens", "config.json");
};

export const configDir = () => dirname(configPath());
export const autoSyncRunnerPath = () => join(configDir(), "auto-sync-runner.mjs");
export const updateStatePath = () => join(configDir(), "update-state.json");
export const updateRuntimeDir = () => join(configDir(), "runtime");

export async function readConfig(): Promise<CollectorConfig> {
  try {
    const config = JSON.parse(await readFile(configPath(), "utf8")) as CollectorConfig;
    config.serverUrl = resolveServerUrl(config.serverUrl, process.env.LOVTOKENS_URL);
    if (!config.deviceToken) config.deviceToken = await readSecureToken();
    return config;
  } catch {
    return { serverUrl: resolveServerUrl(undefined, process.env.LOVTOKENS_URL) };
  }
}

export function resolveServerUrl(configured: string | undefined, override: string | undefined) {
  if (override) return override.replace(/\/$/, "");
  if (!configured || configured === "http://localhost:3000" || configured === "http://127.0.0.1:3000") return defaultServerUrl;
  return configured.replace(/\/$/, "");
}

export async function writeConfig(config: CollectorConfig) {
  const path = configPath();
  await mkdir(dirname(path), { recursive: true, mode: 0o700 });
  const storedSecurely = config.deviceToken ? await writeSecureToken(config.deviceToken) : false;
  const persisted = storedSecurely ? { ...config, deviceToken: undefined } : config;
  await writeFile(path, `${JSON.stringify(persisted, null, 2)}\n`, { mode: 0o600 });
  if (process.platform !== "win32") await chmod(path, 0o600);
}

export async function removeConfig() {
  await removeSecureToken();
  await rm(configPath(), { force: true });
}

async function readSecureToken() {
  try {
    if (process.platform === "darwin") return (await execFileAsync("security", ["find-generic-password", "-s", credentialService, "-a", "device-token", "-w"])).stdout.trim() || undefined;
    if (process.platform === "linux" && await commandExists("secret-tool")) return (await execFileAsync("secret-tool", ["lookup", "service", credentialService, "account", "device-token"])).stdout.trim() || undefined;
    if (process.platform === "win32") return (await execFileAsync("powershell", ["-NoProfile", "-NonInteractive", "-Command", windowsReadScript(), credentialPath()])).stdout.trim() || undefined;
  } catch { return undefined; }
  return undefined;
}

async function writeSecureToken(token: string) {
  try {
    if (process.platform === "darwin") { await execFileAsync("security", ["add-generic-password", "-U", "-s", credentialService, "-a", "device-token", "-w", token]); return true; }
    if (process.platform === "linux" && await commandExists("secret-tool")) { await spawnWithInput("secret-tool", ["store", "--label=LovTokens device", "service", credentialService, "account", "device-token"], token); return true; }
    if (process.platform === "win32") { await mkdir(dirname(credentialPath()), { recursive: true }); await spawnWithInput("powershell", ["-NoProfile", "-NonInteractive", "-Command", windowsWriteScript(), credentialPath()], token); return true; }
  } catch { return false; }
  return false;
}

async function removeSecureToken() {
  try {
    if (process.platform === "darwin") await execFileAsync("security", ["delete-generic-password", "-s", credentialService, "-a", "device-token"]);
    else if (process.platform === "linux" && await commandExists("secret-tool")) await execFileAsync("secret-tool", ["clear", "service", credentialService, "account", "device-token"]);
    else if (process.platform === "win32") await rm(credentialPath(), { force: true });
  } catch { /* already absent */ }
}

async function commandExists(command: string) { try { await execFileAsync("which", [command]); return true; } catch { return false; } }
function credentialPath() { return join(dirname(configPath()), "device-token.dpapi"); }
function windowsWriteScript() { return "$p=$args[0];$s=[Console]::In.ReadToEnd();$b=[Text.Encoding]::UTF8.GetBytes($s);$e=[Security.Cryptography.ProtectedData]::Protect($b,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser);[IO.File]::WriteAllText($p,[Convert]::ToBase64String($e))"; }
function windowsReadScript() { return "$p=$args[0];if(Test-Path $p){$e=[Convert]::FromBase64String([IO.File]::ReadAllText($p));$b=[Security.Cryptography.ProtectedData]::Unprotect($e,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser);[Console]::Write([Text.Encoding]::UTF8.GetString($b))}"; }
function spawnWithInput(command: string, args: string[], input: string) { return new Promise<void>((resolve, reject) => { const child = spawn(command, args, { stdio: ["pipe", "ignore", "ignore"] }); child.once("error", reject); child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`))); child.stdin.end(input); }); }
