import { execFile } from "node:child_process";
import { access, mkdir, open, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { promisify } from "node:util";
import {
  autoSyncRunnerPath,
  updateRuntimeDir,
  updateStatePath,
} from "./config.js";

const execFileAsync = promisify(execFile);
export const AUTO_UPDATE_INTERVAL_MS = 24 * 60 * 60 * 1_000;
const LOCK_MAX_AGE_MS = 60 * 60 * 1_000;
const versionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

type UpdateState = {
  lastCheckedAt: number;
  latestVersion?: string;
  installedVersion?: string;
  installedExecutable?: string;
  error?: string;
};

type ExecResult = { stdout: string; stderr?: string };
type UpdateOptions = {
  currentVersion: string;
  now?: number;
  baseDir?: string;
  runnerPath?: string;
  npmCommand?: string;
  exec?: (command: string, args: string[]) => Promise<ExecResult>;
};

export type AutoUpdateResult =
  | { status: "disabled" | "skipped" | "current"; latestVersion?: string }
  | { status: "updated"; previousVersion: string; latestVersion: string }
  | { status: "failed"; error: string };

export async function maybeAutoUpdate(options: UpdateOptions): Promise<AutoUpdateResult> {
  const now = options.now ?? Date.now();
  const stateFile = options.baseDir ? join(options.baseDir, "update-state.json") : updateStatePath();
  const runtimeRoot = options.baseDir ? join(options.baseDir, "runtime") : updateRuntimeDir();
  const runner = options.runnerPath ?? (options.baseDir ? join(options.baseDir, "auto-sync-runner.mjs") : autoSyncRunnerPath());
  const execute = options.exec ?? runCommand;

  if (!(await exists(runner))) return { status: "disabled" };
  const state = await readState(stateFile);
  if (state && now - state.lastCheckedAt < AUTO_UPDATE_INTERVAL_MS) {
    return { status: "skipped", latestVersion: state.latestVersion };
  }

  await mkdir(dirname(stateFile), { recursive: true, mode: 0o700 });
  const lockFile = `${stateFile}.lock`;
  const lock = await acquireLock(lockFile, now);
  if (!lock) return { status: "skipped", latestVersion: state?.latestVersion };

  try {
    const refreshed = await readState(stateFile);
    if (refreshed && now - refreshed.lastCheckedAt < AUTO_UPDATE_INTERVAL_MS) {
      return { status: "skipped", latestVersion: refreshed.latestVersion };
    }
    const activeState = refreshed ?? state ?? undefined;
    await writeState(stateFile, { ...activeState, lastCheckedAt: now, error: undefined });
    const npmCommand = options.npmCommand ?? await resolveNpmCommand();
    const latestVersion = parseRegistryVersion((await execute(npmCommand, [
      "view", "lovtokens", "version", "--json", "--prefer-online",
    ])).stdout);
    const hasActivatedRuntime = Boolean(activeState?.installedVersion && activeState.installedExecutable && await exists(activeState.installedExecutable));
    const activatedVersion = hasActivatedRuntime ? activeState?.installedVersion ?? options.currentVersion : options.currentVersion;
    if (hasActivatedRuntime && !isNewerVersion(latestVersion, activatedVersion)) {
      await writeState(stateFile, { ...activeState, lastCheckedAt: now, latestVersion, error: undefined });
      return { status: "current", latestVersion };
    }

    const runtimeDir = join(runtimeRoot, latestVersion);
    const managedExecutable = join(runtimeDir, "node_modules", "lovtokens", "dist", "index.js");
    const packageFile = join(runtimeDir, "node_modules", "lovtokens", "package.json");
    await mkdir(runtimeRoot, { recursive: true, mode: 0o700 });
    await rm(runtimeDir, { recursive: true, force: true });
    await execute(npmCommand, [
      "install",
      "--prefix", runtimeDir,
      "--no-save",
      "--no-package-lock",
      "--ignore-scripts",
      "--omit=dev",
      `lovtokens@${latestVersion}`,
    ]);
    const installed = JSON.parse(await readFile(packageFile, "utf8")) as { version?: unknown };
    if (installed.version !== latestVersion || !(await exists(managedExecutable))) {
      throw new Error("installed package did not match the requested version");
    }
    await writeState(stateFile, {
      lastCheckedAt: now,
      latestVersion,
      installedVersion: latestVersion,
      installedExecutable: managedExecutable,
    });
    return { status: "updated", previousVersion: options.currentVersion, latestVersion };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const existing = await readState(stateFile);
    await writeState(stateFile, {
      lastCheckedAt: now,
      latestVersion: existing?.latestVersion,
      installedVersion: existing?.installedVersion,
      installedExecutable: existing?.installedExecutable,
      error: message.slice(0, 300),
    }).catch(() => undefined);
    return { status: "failed", error: message };
  } finally {
    await lock.close().catch(() => undefined);
    await rm(lockFile, { force: true }).catch(() => undefined);
  }
}

export function parseRegistryVersion(output: string) {
  let value: unknown;
  try {
    value = JSON.parse(output.trim());
  } catch {
    value = output.trim();
  }
  if (typeof value !== "string" || !versionPattern.test(value)) {
    throw new Error("npm returned an invalid lovtokens version");
  }
  return value;
}

export function isNewerVersion(candidate: string, current: string) {
  const next = numericVersion(candidate);
  const before = numericVersion(current);
  if (!next || !before) return candidate !== current;
  for (let index = 0; index < 3; index += 1) {
    const nextPart = next[index] ?? 0;
    const beforePart = before[index] ?? 0;
    if (nextPart !== beforePart) return nextPart > beforePart;
  }
  return !candidate.includes("-") && current.includes("-");
}

async function runCommand(command: string, args: string[]): Promise<ExecResult> {
  const useNode = /\.(?:c?js)$/i.test(command);
  const result = await execFileAsync(useNode ? process.execPath : command, useNode ? [command, ...args] : args, {
    timeout: 120_000,
    maxBuffer: 2 * 1024 * 1024,
    encoding: "utf8",
  });
  return { stdout: result.stdout, stderr: result.stderr };
}

async function resolveNpmCommand() {
  if (process.platform === "win32") {
    const inheritedNpm = process.env.npm_execpath;
    if (inheritedNpm && await exists(inheritedNpm)) return inheritedNpm;
    const npmCli = join(dirname(process.execPath), "node_modules", "npm", "bin", "npm-cli.js");
    if (await exists(npmCli)) return npmCli;
    const located = await execFileAsync("where.exe", ["npm.cmd"], { encoding: "utf8" }).catch(() => null);
    const npmCmd = located?.stdout.split(/\r?\n/).find(Boolean);
    if (npmCmd) {
      const pathNpmCli = join(dirname(npmCmd), "node_modules", "npm", "bin", "npm-cli.js");
      if (await exists(pathNpmCli)) return pathNpmCli;
    }
    throw new Error("npm could not be resolved; reinstall Node.js with npm");
  }
  const sibling = join(dirname(process.execPath), "npm");
  return await exists(sibling) ? sibling : "npm";
}

async function readState(path: string): Promise<UpdateState | null> {
  try {
    const value = JSON.parse(await readFile(path, "utf8")) as Partial<UpdateState>;
    return typeof value.lastCheckedAt === "number" ? value as UpdateState : null;
  } catch {
    return null;
  }
}

async function writeState(path: string, state: UpdateState) {
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(state, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, path);
}

async function acquireLock(path: string, now: number) {
  try {
    return await open(path, "wx", 0o600);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
    try {
      const info = await stat(path);
      if (now - info.mtimeMs <= LOCK_MAX_AGE_MS) return null;
      await rm(path, { force: true });
      return await open(path, "wx", 0o600);
    } catch {
      return null;
    }
  }
}

async function exists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function numericVersion(value: string): [number, number, number] | null {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(value);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}
