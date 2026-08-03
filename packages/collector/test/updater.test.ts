import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AUTO_UPDATE_INTERVAL_MS, isNewerVersion, maybeAutoUpdate, parseRegistryVersion } from "../src/updater.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((path) => rm(path, { recursive: true, force: true })));
});

async function makeBaseDir() {
  const path = await mkdtemp(join(tmpdir(), "lovtokens-updater-"));
  temporaryDirectories.push(path);
  return path;
}

describe("automatic updates", () => {
  it("accepts npm JSON versions and compares stable semver values", () => {
    expect(parseRegistryVersion('"0.1.4"\n')).toBe("0.1.4");
    expect(parseRegistryVersion("0.1.4")).toBe("0.1.4");
    expect(() => parseRegistryVersion("latest")).toThrow("invalid lovtokens version");
    expect(isNewerVersion("0.1.4", "0.1.3")).toBe(true);
    expect(isNewerVersion("0.1.2", "0.1.3")).toBe(false);
    expect(isNewerVersion("0.1.3-beta.1", "0.1.3")).toBe(false);
  });

  it("does not check npm until auto sync is installed", async () => {
    const baseDir = await makeBaseDir();
    const execute = vi.fn();
    await expect(maybeAutoUpdate({ currentVersion: "0.1.3", baseDir, exec: execute })).resolves.toEqual({ status: "disabled" });
    expect(execute).not.toHaveBeenCalled();
  });

  it("checks at most once per day when the installed version is current", async () => {
    const baseDir = await makeBaseDir();
    await writeFile(join(baseDir, "auto-sync-runner.mjs"), "");
    const now = Date.UTC(2026, 7, 3);
    const installedExecutable = join(baseDir, "runtime", "0.1.3", "node_modules", "lovtokens", "dist", "index.js");
    await mkdir(join(baseDir, "runtime", "0.1.3", "node_modules", "lovtokens", "dist"), { recursive: true });
    await writeFile(installedExecutable, "");
    await writeFile(join(baseDir, "update-state.json"), JSON.stringify({
      lastCheckedAt: now - AUTO_UPDATE_INTERVAL_MS,
      latestVersion: "0.1.3",
      installedVersion: "0.1.3",
      installedExecutable,
    }));
    const execute = vi.fn().mockResolvedValue({ stdout: '"0.1.3"' });

    await expect(maybeAutoUpdate({ currentVersion: "0.1.3", baseDir, now, exec: execute })).resolves.toEqual({
      status: "current",
      latestVersion: "0.1.3",
    });
    await expect(maybeAutoUpdate({ currentVersion: "0.1.3", baseDir, now: now + AUTO_UPDATE_INTERVAL_MS - 1, exec: execute })).resolves.toEqual({
      status: "skipped",
      latestVersion: "0.1.3",
    });
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it("bootstraps a stable managed runtime even when npm latest equals the current CLI", async () => {
    const baseDir = await makeBaseDir();
    await writeFile(join(baseDir, "auto-sync-runner.mjs"), "");
    const execute = vi.fn(async (_command: string, args: string[]) => {
      if (args[0] === "view") return { stdout: '"0.1.3"' };
      const prefix = args[args.indexOf("--prefix") + 1];
      if (!prefix) throw new Error("missing test install prefix");
      const packageDir = join(prefix, "node_modules", "lovtokens");
      await mkdir(join(packageDir, "dist"), { recursive: true });
      await writeFile(join(packageDir, "package.json"), JSON.stringify({ version: "0.1.3" }));
      await writeFile(join(packageDir, "dist", "index.js"), "");
      return { stdout: "" };
    });

    await expect(maybeAutoUpdate({ currentVersion: "0.1.3", baseDir, exec: execute })).resolves.toEqual({
      status: "updated",
      previousVersion: "0.1.3",
      latestVersion: "0.1.3",
    });
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it("installs an exact version and atomically activates it for the next run", async () => {
    const baseDir = await makeBaseDir();
    await writeFile(join(baseDir, "auto-sync-runner.mjs"), "");
    const execute = vi.fn(async (_command: string, args: string[]) => {
      if (args[0] === "view") return { stdout: '"0.1.4"' };
      const prefix = args[args.indexOf("--prefix") + 1];
      if (!prefix) throw new Error("missing test install prefix");
      const packageDir = join(prefix, "node_modules", "lovtokens");
      await mkdir(join(packageDir, "dist"), { recursive: true });
      await writeFile(join(packageDir, "package.json"), JSON.stringify({ version: "0.1.4" }));
      await writeFile(join(packageDir, "dist", "index.js"), "");
      return { stdout: "" };
    });

    await expect(maybeAutoUpdate({ currentVersion: "0.1.3", baseDir, exec: execute })).resolves.toEqual({
      status: "updated",
      previousVersion: "0.1.3",
      latestVersion: "0.1.4",
    });
    const installArgs = execute.mock.calls[1]?.[1] as string[];
    expect(installArgs).toContain("lovtokens@0.1.4");
    expect(installArgs).toContain("--ignore-scripts");
    const state = JSON.parse(await readFile(join(baseDir, "update-state.json"), "utf8")) as { installedExecutable: string };
    expect(state.installedExecutable).toBe(join(baseDir, "runtime", "0.1.4", "node_modules", "lovtokens", "dist", "index.js"));
  });

  it("records an update error without rejecting the sync", async () => {
    const baseDir = await makeBaseDir();
    await writeFile(join(baseDir, "auto-sync-runner.mjs"), "");
    const installedExecutable = join(baseDir, "runtime", "0.1.3", "node_modules", "lovtokens", "dist", "index.js");
    await writeFile(join(baseDir, "update-state.json"), JSON.stringify({
      lastCheckedAt: 1,
      latestVersion: "0.1.3",
      installedVersion: "0.1.3",
      installedExecutable,
    }));
    const execute = vi.fn().mockRejectedValue(new Error("registry unavailable"));
    await expect(maybeAutoUpdate({ currentVersion: "0.1.3", baseDir, now: AUTO_UPDATE_INTERVAL_MS + 1, exec: execute })).resolves.toEqual({
      status: "failed",
      error: "registry unavailable",
    });
    const state = JSON.parse(await readFile(join(baseDir, "update-state.json"), "utf8")) as { installedExecutable: string };
    expect(state.installedExecutable).toBe(installedExecutable);
  });
});
