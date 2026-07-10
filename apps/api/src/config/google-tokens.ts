import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { GoogleService, GoogleTokens } from "@milo/tools";

export type { GoogleService, GoogleTokens };

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../data");
const TOKENS_FILE = path.join(DATA_DIR, "google-tokens.json");

interface StoredToken extends GoogleTokens {
  userId: string;
  service: GoogleService;
  connectedAt: string;
}

async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

async function loadTokens(): Promise<StoredToken[]> {
  await ensureDataDir();

  try {
    const raw = await fs.readFile(TOKENS_FILE, "utf-8");
    const parsed = JSON.parse(raw) as StoredToken[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function saveTokens(tokens: StoredToken[]): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(TOKENS_FILE, JSON.stringify(tokens, null, 2), "utf-8");
}

export async function getGoogleTokens(
  userId: string,
  service: GoogleService,
): Promise<GoogleTokens | undefined> {
  const tokens = await loadTokens();
  return tokens.find((t) => t.userId === userId && t.service === service);
}

export async function setGoogleTokens(
  userId: string,
  service: GoogleService,
  tokens: GoogleTokens,
): Promise<void> {
  const all = await loadTokens();
  const existingIndex = all.findIndex((t) => t.userId === userId && t.service === service);

  const stored: StoredToken = {
    userId,
    service,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiryDate: tokens.expiryDate,
    connectedAt: new Date().toISOString(),
  };

  if (existingIndex >= 0) {
    all[existingIndex] = stored;
  } else {
    all.push(stored);
  }

  await saveTokens(all);
}

export async function deleteGoogleTokens(userId: string, service: GoogleService): Promise<void> {
  const all = await loadTokens();
  const filtered = all.filter((t) => !(t.userId === userId && t.service === service));
  await saveTokens(filtered);
}
