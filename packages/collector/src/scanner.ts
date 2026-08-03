import { homedir } from "node:os";
import { join } from "node:path";
import { scanClaude } from "./claude.js";
import { scanCodex } from "./codex.js";
import { scanWorkBuddy } from "./workbuddy.js";

export async function scanAll() {
  const codexHome = process.env.CODEX_HOME || join(homedir(), ".codex");
  const claudeHome = process.env.CLAUDE_CONFIG_DIR || join(homedir(), ".claude");
  const workBuddyHome = process.env.WORKBUDDY_HOME || join(homedir(), ".workbuddy");
  const [codex, claude, workbuddy] = await Promise.all([
    scanCodex([join(codexHome, "sessions"), join(codexHome, "archived_sessions")]),
    scanClaude([join(claudeHome, "projects"), join(homedir(), ".config", "claude", "projects")]),
    scanWorkBuddy([join(workBuddyHome, "projects")]),
  ]);
  return {
    buckets: [...codex.buckets, ...claude.buckets, ...workbuddy.buckets],
    sources: { codex, "claude-code": claude, workbuddy },
  };
}
