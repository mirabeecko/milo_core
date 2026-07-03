import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  API_PORT: z.coerce.number().default(4000),
  API_HOST: z.string().default("0.0.0.0"),
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  JWT_SECRET: z.string().min(32).optional(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().url().optional(),
  OBSIDIAN_VAULT_PATH: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const config = parsed.data;
