import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { DriveClient } from "@milo/tools";
import type { JobData } from "../infrastructure/queue.js";
import { JobName } from "../infrastructure/queue.js";
import { getGoogleTokens } from "../config/google-tokens.js";
import { config } from "../config/index.js";
import { updateSyncState } from "./sync-state.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../data");
const DRIVE_FILE = path.join(DATA_DIR, "synced-drive-files.json");

interface StoredDriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink: string | null;
  modifiedAt: string;
  size: number | null;
  owners: string[];
  isFolder: boolean;
  syncedAt: string;
}

function isConfigured(): boolean {
  return Boolean(config.GOOGLE_CLIENT_ID && config.GOOGLE_CLIENT_SECRET && config.GOOGLE_REDIRECT_URI);
}

export async function syncDriveJob(data: JobData[JobName.SYNC_DRIVE]): Promise<{ count: number }> {
  const { userId } = data;

  console.log(`[job:sync:drive] Starting Drive sync for user ${userId}`);

  if (!isConfigured()) {
    console.log("[job:sync:drive] Google OAuth not configured, skipping sync");
    return { count: 0 };
  }

  const tokens = await getGoogleTokens(userId, "drive");
  if (!tokens) {
    console.log(`[job:sync:drive] No Google tokens for user ${userId}, skipping sync`);
    return { count: 0 };
  }

  const client = new DriveClient({
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
  });

  const files = await client.listFiles({ maxResults: 100 });

  const stored: StoredDriveFile[] = files.map((file) => ({
    id: file.id,
    name: file.name,
    mimeType: file.mimeType,
    webViewLink: file.webViewLink,
    modifiedAt: file.modifiedAt instanceof Date ? file.modifiedAt.toISOString() : String(file.modifiedAt),
    size: file.size,
    owners: file.owners,
    isFolder: file.isFolder,
    syncedAt: new Date().toISOString(),
  }));

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DRIVE_FILE, JSON.stringify(stored, null, 2), "utf-8");

  await updateSyncState(userId, "drive", stored.length);

  console.log(`[job:sync:drive] Synced ${stored.length} files for user ${userId}`);
  return { count: stored.length };
}

export async function getSyncedDriveFiles(): Promise<StoredDriveFile[]> {
  try {
    const raw = await fs.readFile(DRIVE_FILE, "utf-8");
    return JSON.parse(raw) as StoredDriveFile[];
  } catch {
    return [];
  }
}
