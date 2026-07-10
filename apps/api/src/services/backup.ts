import { existsSync, mkdirSync, readdirSync, readFileSync, cpSync, rmSync, statSync } from "fs";
import { join, resolve } from "path";
import { createHash } from "crypto";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../../data");
const BACKUP_DIR = resolve(__dirname, "../../backups");
const MAX_DAILY_BACKUPS = 5;

function getHash(filePath: string): string {
  if (!existsSync(filePath)) return "";
  const content = readFileSync(filePath);
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

function getAllFiles(dirPath: string): string[] {
  const files: string[] = [];
  function walk(current: string): void {
    const entries = readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(current, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }
  walk(dirPath);
  return files;
}

function getDirHash(dirPath: string): string {
  if (!existsSync(dirPath)) return "";
  const hashes: string[] = [];
  const files = getAllFiles(dirPath).sort();
  for (const file of files) {
    const relativePath = file.slice(dirPath.length + 1);
    hashes.push(`${relativePath}:${getHash(file)}`);
  }
  return createHash("sha256").update(hashes.join("|")).digest("hex").slice(0, 16);
}

function pruneDailyBackups(): void {
  if (!existsSync(BACKUP_DIR)) return;

  const entries = readdirSync(BACKUP_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
    .map((e) => ({
      name: e.name,
      path: join(BACKUP_DIR, e.name),
      hash: getDirHash(join(BACKUP_DIR, e.name)),
      date: e.name,
    }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const uniqueBackups: typeof entries = [];
  const seenHashes = new Set<string>();

  for (const entry of entries) {
    if (!seenHashes.has(entry.hash)) {
      uniqueBackups.push(entry);
      seenHashes.add(entry.hash);
    }
  }

  const toKeep = uniqueBackups.slice(0, MAX_DAILY_BACKUPS);
  const keepNames = new Set(toKeep.map((e) => e.name));

  for (const entry of entries) {
    if (!keepNames.has(entry.name)) {
      rmSync(entry.path, { recursive: true, force: true });
    }
  }
}

export async function runBackup(): Promise<{
  message: string;
  backupPath?: string;
  hash?: string;
  isDuplicate?: boolean;
}> {
  if (!existsSync(DATA_DIR)) {
    return { message: "No data directory to backup" };
  }

  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10);
  const backupPath = join(BACKUP_DIR, dateStr);

  const currentHash = getDirHash(DATA_DIR);

  if (existsSync(backupPath)) {
    const existingHash = getDirHash(backupPath);
    if (existingHash === currentHash) {
      return {
        message: "Backup skipped – no changes since last backup today",
        hash: currentHash,
        isDuplicate: true,
      };
    }
  }

  if (existsSync(backupPath)) {
    rmSync(backupPath, { recursive: true, force: true });
  }

  cpSync(DATA_DIR, backupPath, { recursive: true });

  pruneDailyBackups();

  return {
    message: `Backup created at ${backupPath}`,
    backupPath,
    hash: currentHash,
    isDuplicate: false,
  };
}

export function listBackups(): { name: string; date: string; size: number; isWeekly: boolean }[] {
  if (!existsSync(BACKUP_DIR)) return [];

  const date = new Date();
  const weekAgo = new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000);

  return readdirSync(BACKUP_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(e.name))
    .map((e) => {
      const path = join(BACKUP_DIR, e.name);
      let size = 0;
      try {
        const files = getAllFiles(path);
        for (const file of files) {
          size += statSync(file).size;
        }
      } catch (err) {
        console.error(`Failed to stat backup ${path}:`, err);
      }

      return {
        name: e.name,
        date: e.name,
        size,
        isWeekly: e.name <= weekAgo.toISOString().slice(0, 10),
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}
