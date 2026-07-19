import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../data");
const SYNC_STATE_FILE = path.join(DATA_DIR, "sync-state.json");

export interface SyncEntry {
  userId: string;
  service: "email" | "calendar" | "drive" | "embeddings";
  lastSyncAt: string;
  itemCount: number;
  error?: string;
}

export async function getSyncState(
  userId: string,
  service: SyncEntry["service"],
): Promise<SyncEntry | undefined> {
  try {
    const raw = await fs.readFile(SYNC_STATE_FILE, "utf-8");
    const entries = JSON.parse(raw) as SyncEntry[];
    return entries.find((e) => e.userId === userId && e.service === service);
  } catch {
    return undefined;
  }
}

export async function updateSyncState(
  userId: string,
  service: SyncEntry["service"],
  itemCount = 0,
  error?: string,
): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });

  let entries: SyncEntry[] = [];
  try {
    const raw = await fs.readFile(SYNC_STATE_FILE, "utf-8");
    entries = JSON.parse(raw) as SyncEntry[];
  } catch {
    // file doesn't exist yet
  }

  const idx = entries.findIndex((e) => e.userId === userId && e.service === service);
  const entry: SyncEntry = {
    userId,
    service,
    lastSyncAt: new Date().toISOString(),
    itemCount,
    error,
  };

  if (idx >= 0) {
    entries[idx] = entry;
  } else {
    entries.push(entry);
  }

  await fs.writeFile(SYNC_STATE_FILE, JSON.stringify(entries, null, 2), "utf-8");
}

export async function getAllSyncStates(): Promise<SyncEntry[]> {
  try {
    const raw = await fs.readFile(SYNC_STATE_FILE, "utf-8");
    return JSON.parse(raw) as SyncEntry[];
  } catch {
    return [];
  }
}
