import { existsSync, readFileSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = resolve(__dirname, "../../data");
const CONFIG_FILE = join(DATA_DIR, "config.json");

export interface MiLOConfig {
  monthly_budget_total: number;
  monthly_budget_per_project: Record<string, number>;
  approval_digest_time: string;
  focus_until: string | null;
  focus_mode: boolean;
  diff_line_limit: number;
  weekly_summary_time: string;
  critical_paths: string[];
  website_checks: string[];
  eisenhower_keywords: {
    urgent_keywords: string[];
    important_senders: string[];
    important_projects: string[];
  };
}

const DEFAULT_CONFIG: MiLOConfig = {
  monthly_budget_total: 500,
  monthly_budget_per_project: {},
  approval_digest_time: "18:00",
  focus_until: null,
  focus_mode: false,
  diff_line_limit: 20,
  weekly_summary_time: "20:00",
  critical_paths: [],
  website_checks: ["tjkrupka.cz", "sheskates.cz", "webdo24.cz", "ninja-tyden.cz"],
  eisenhower_keywords: {
    urgent_keywords: ["deadline", "termín", "platba", "faktura", "soud", "právní"],
    important_senders: ["ucetni", "klient", "pravnik"],
    important_projects: ["webdo24", "tjkrupka", "kauza"],
  },
};

let cached: MiLOConfig | null = null;
let cacheTime = 0;
const CACHE_TTL = 5000;

export function getConfig(): MiLOConfig {
  const now = Date.now();
  if (cached && now - cacheTime < CACHE_TTL) return cached;

  try {
    if (existsSync(CONFIG_FILE)) {
      const raw = readFileSync(CONFIG_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      cached = { ...DEFAULT_CONFIG, ...parsed };
    } else {
      cached = { ...DEFAULT_CONFIG };
      writeFileSync(CONFIG_FILE, JSON.stringify(DEFAULT_CONFIG, null, 2));
    }
  } catch {
    cached = { ...DEFAULT_CONFIG };
  }

  cacheTime = now;
  return cached ?? { ...DEFAULT_CONFIG };
}

export function saveConfig(updates: Partial<MiLOConfig>): MiLOConfig {
  const current = getConfig();
  const next = { ...current, ...updates };
  writeFileSync(CONFIG_FILE, JSON.stringify(next, null, 2));
  cached = next;
  cacheTime = Date.now();
  return next;
}

export function isFocusActive(): boolean {
  const cfg = getConfig();
  if (!cfg.focus_until) return false;
  return new Date(cfg.focus_until).getTime() > Date.now();
}
