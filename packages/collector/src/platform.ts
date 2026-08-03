import { execFile } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { autoSyncRunnerPath, configDir, updateStatePath } from "./config.js";

const execFileAsync = promisify(execFile);
const windowsTaskName = "LovTokens Sync";

export function openExternal(url: string) {
  const command = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  const child = execFile(command, args, () => undefined);
  child.unref();
}

export async function installAutoSync(executable: string) {
  const runner = autoSyncRunnerPath();
  await mkdir(configDir(), { recursive: true, mode: 0o700 });
  await writeFile(runner, buildAutoSyncRunner(executable), { mode: 0o700 });
  try {
    if (process.platform === "darwin") {
      const dir = join(homedir(), "Library", "LaunchAgents");
      const path = join(dir, "dev.lovtokens.sync.plist");
      await mkdir(dir, { recursive: true });
      const plist = `<?xml version="1.0" encoding="UTF-8"?>\n<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">\n<plist version="1.0"><dict><key>Label</key><string>dev.lovtokens.sync</string><key>ProgramArguments</key><array><string>${escapeXml(process.execPath)}</string><string>${escapeXml(runner)}</string></array><key>StartInterval</key><integer>3600</integer><key>RunAtLoad</key><true/></dict></plist>\n`;
      await writeFile(path, plist, { mode: 0o600 });
      await execFileAsync("launchctl", ["bootout", `gui/${process.getuid?.()}`, path]).catch(() => undefined);
      await execFileAsync("launchctl", ["bootstrap", `gui/${process.getuid?.()}`, path]);
      return path;
    }
    if (process.platform === "linux") {
      const dir = join(homedir(), ".config", "systemd", "user");
      const service = join(dir, "lovtokens-sync.service");
      const timer = join(dir, "lovtokens-sync.timer");
      await mkdir(dir, { recursive: true });
      await writeFile(service, `[Unit]\nDescription=Sync LovTokens token usage\n[Service]\nType=oneshot\nExecStart=${quoteSystemd(process.execPath)} ${quoteSystemd(runner)}\n`, { mode: 0o600 });
      await writeFile(timer, `[Unit]\nDescription=Sync LovTokens every hour\n[Timer]\nOnBootSec=2m\nOnUnitActiveSec=1h\n[Install]\nWantedBy=timers.target\n`, { mode: 0o600 });
      await execFileAsync("systemctl", ["--user", "daemon-reload"]);
      await execFileAsync("systemctl", ["--user", "enable", "--now", "lovtokens-sync.timer"]);
      return timer;
    }
    await execFileAsync("schtasks", [
      "/Create", "/F", "/SC", "HOURLY", "/MO", "1", "/TN", windowsTaskName, "/TR", `"${process.execPath}" "${runner}"`,
    ]);
    return `Windows Task Scheduler: ${windowsTaskName}`;
  } catch (error) {
    await rm(runner, { force: true }).catch(() => undefined);
    throw error;
  }
}

export async function removeAutoSync() {
  if (process.platform === "darwin") {
    const path = join(homedir(), "Library", "LaunchAgents", "dev.lovtokens.sync.plist");
    await execFileAsync("launchctl", ["bootout", `gui/${process.getuid?.()}`, path]).catch(() => undefined);
    await rm(path, { force: true });
    await rm(autoSyncRunnerPath(), { force: true });
    return;
  }
  if (process.platform === "linux") {
    const dir = join(homedir(), ".config", "systemd", "user");
    await execFileAsync("systemctl", ["--user", "disable", "--now", "lovtokens-sync.timer"]).catch(() => undefined);
    await rm(join(dir, "lovtokens-sync.service"), { force: true });
    await rm(join(dir, "lovtokens-sync.timer"), { force: true });
    await rm(autoSyncRunnerPath(), { force: true });
    await execFileAsync("systemctl", ["--user", "daemon-reload"]).catch(() => undefined);
    return;
  }
  await execFileAsync("schtasks", ["/Delete", "/F", "/TN", windowsTaskName]).catch(() => undefined);
  await rm(autoSyncRunnerPath(), { force: true });
}

export function buildAutoSyncRunner(fallbackExecutable: string) {
  return `import { existsSync, readFileSync } from "node:fs";\nimport { spawnSync } from "node:child_process";\nlet managedExecutable;\ntry { managedExecutable = JSON.parse(readFileSync(${JSON.stringify(updateStatePath())}, "utf8")).installedExecutable; } catch {}\nconst candidates = [managedExecutable, ${JSON.stringify(fallbackExecutable)}].filter((candidate) => typeof candidate === "string");\nconst target = candidates.find((candidate) => existsSync(candidate));\nif (!target) { console.error("LovTokens: no collector runtime is available. Reinstall lovtokens and run auto-sync install."); process.exit(1); }\nconst result = spawnSync(process.execPath, [target, "sync"], { stdio: "inherit" });\nif (result.error) console.error(\`LovTokens: auto-sync failed: \${result.error.message}\`);\nprocess.exit(result.status ?? 1);\n`;
}

const escapeXml = (value: string) => value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const quoteSystemd = (value: string) => `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
