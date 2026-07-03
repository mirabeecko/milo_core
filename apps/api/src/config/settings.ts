import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../data");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

interface Settings {
  obsidianVaultPath?: string;
}

let cache: Settings | null = null;

async function ensureDataDir(): Promise<void> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

export async function loadSettings(): Promise<Settings> {
  if (cache) {
    return cache;
  }

  await ensureDataDir();

  try {
    const raw = await fs.readFile(SETTINGS_FILE, "utf-8");
    cache = JSON.parse(raw) as Settings;
  } catch {
    cache = {};
  }

  return cache ?? {};
}

async function saveSettings(settings: Settings): Promise<void> {
  await ensureDataDir();
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
  cache = settings;
}

export async function getObsidianVaultPath(): Promise<string | undefined> {
  if (config.OBSIDIAN_VAULT_PATH) {
    return config.OBSIDIAN_VAULT_PATH;
  }

  const settings = await loadSettings();
  return settings.obsidianVaultPath;
}

export async function setObsidianVaultPath(vaultPath: string | undefined): Promise<void> {
  const settings = await loadSettings();
  settings.obsidianVaultPath = vaultPath;
  await saveSettings(settings);
}
