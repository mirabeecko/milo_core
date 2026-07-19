import { z } from "zod";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../../../.env") });
export const TASKS_FILE_PATH = resolve(__dirname, "../../data/tasks.json");
export const REMINDERS_FILE_PATH = resolve(__dirname, "../../data/reminders.json");

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PORT: z.coerce.number().default(4000),
  API_HOST: z.string().default("0.0.0.0"),
  DEMO_MODE: z.preprocess((value) => {
    if (value !== undefined) return value;
    const nodeEnv = process.env.NODE_ENV ?? "development";
    return nodeEnv === "development" ? "true" : "false";
  }, z.enum(["true", "false"])).transform((value) => value === "true"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  JWT_SECRET: z.string().min(32).optional(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
  APP_URL: z.string().url().default(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
  OBSIDIAN_VAULT_PATH: z.string().optional(),
  MILO_PROJECT_PATH: z.string().optional(),
  MILO_DEV_ROOT: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;

if (!config.DEMO_MODE && (!config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY)) {
  console.warn(
    "⚠ DEMO_MODE=false but SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY are missing. " +
    "Falling back to demo mode. Auth will only accept demo-token.",
  );
}
