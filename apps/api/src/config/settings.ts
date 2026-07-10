import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "./index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, "../../data");
const SETTINGS_FILE = path.join(DATA_DIR, "settings.json");

export type TaskComplexity = "simple" | "standard" | "complex";

export interface ModelConfig {
  provider: string;
  model: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface AiSettings {
  defaultProvider?: string;
  models?: Record<TaskComplexity, ModelConfig>;
}

interface Settings {
  obsidianVaultPath?: string;
  aiProvider?: string;
  aiModel?: string;
  openaiApiKey?: string;
  openaiBaseUrl?: string;
  defaultProvider?: string;
  models?: Record<TaskComplexity, ModelConfig>;
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

const defaultModels: Record<TaskComplexity, ModelConfig> = {
  simple: { provider: "openai", model: "gpt-4o-mini" },
  standard: { provider: "openai", model: "gpt-4o" },
  complex: { provider: "openai", model: "gpt-4o" },
};

export async function getAiSettings(): Promise<AiSettings> {
  const settings = await loadSettings();

  // zpětná kompatibilita se starým formátem
  if (settings.aiProvider && !settings.models) {
    const legacyConfig: ModelConfig = {
      provider: settings.aiProvider,
      model: settings.aiModel ?? "gpt-4o",
      apiKey: settings.openaiApiKey,
      baseUrl: settings.openaiBaseUrl,
    };
    return {
      defaultProvider: settings.aiProvider,
      models: {
        simple: legacyConfig,
        standard: legacyConfig,
        complex: legacyConfig,
      },
    };
  }

  return {
    defaultProvider: settings.defaultProvider ?? "openai",
    models: {
      ...defaultModels,
      ...settings.models,
    },
  };
}

export async function setAiSettings(input: AiSettings): Promise<void> {
  const settings = await loadSettings();
  settings.defaultProvider = input.defaultProvider;
  settings.models = input.models;
  // vyčistit staré pole, pokud existují
  settings.aiProvider = undefined;
  settings.aiModel = undefined;
  settings.openaiApiKey = undefined;
  settings.openaiBaseUrl = undefined;
  await saveSettings(settings);
}

export async function resolveModelForComplexity(
  complexity: TaskComplexity,
): Promise<ModelConfig | undefined> {
  const settings = await getAiSettings();
  return settings.models?.[complexity];
}
