import { createReadStream } from "node:fs";
import { lstat, readdir, realpath } from "node:fs/promises";
import { createInterface } from "node:readline";
import { resolve, sep } from "node:path";

export const MAX_FILE_BYTES = 64 * 1024 * 1024;
export const MAX_FILES_PER_SOURCE = 20_000;

export async function discoverJsonlFiles(roots: string[]): Promise<string[]> {
  const files: string[] = [];
  for (const configuredRoot of roots) {
    if (files.length >= MAX_FILES_PER_SOURCE) break;
    let root: string;
    try {
      root = await realpath(configuredRoot);
    } catch {
      continue;
    }
    const queue = [root];
    while (queue.length > 0 && files.length < MAX_FILES_PER_SOURCE) {
      const current = queue.shift()!;
      let entries;
      try {
        entries = await readdir(current, { withFileTypes: true });
      } catch {
        continue;
      }
      for (const entry of entries) {
        if (entry.isSymbolicLink()) continue;
        const candidate = resolve(current, entry.name);
        if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) continue;
        if (entry.isDirectory()) queue.push(candidate);
        if (entry.isFile() && entry.name.endsWith(".jsonl")) files.push(candidate);
      }
    }
  }
  return [...new Set(files)].sort();
}

export async function canReadSessionFile(path: string): Promise<boolean> {
  try {
    const stat = await lstat(path);
    return stat.isFile() && !stat.isSymbolicLink() && stat.size <= MAX_FILE_BYTES;
  } catch {
    return false;
  }
}

export async function forEachLine(path: string, callback: (line: string) => void | Promise<void>) {
  const input = createReadStream(path, { encoding: "utf8" });
  const reader = createInterface({ input, crlfDelay: Infinity });
  for await (const line of reader) await callback(line);
}
