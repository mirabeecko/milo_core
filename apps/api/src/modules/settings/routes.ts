import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { z } from "zod";
import { getAiSettings, setAiSettings, type ModelConfig, type TaskComplexity } from "../../config/settings.js";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";

const modelConfigSchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  apiKey: z.string().optional(),
  baseUrl: z.string().url().optional().or(z.literal("")),
});

const aiSettingsSchema = z.object({
  defaultProvider: z.string().min(1).optional(),
  models: z.record(z.enum(["simple", "standard", "complex"]), modelConfigSchema).optional(),
});

function maskConfig(config: ModelConfig | undefined): ModelConfig | undefined {
  if (!config) return undefined;
  return {
    ...config,
    apiKey: config.apiKey ? "••••••••" : "",
  };
}

function maskResponse(settings: Awaited<ReturnType<typeof getAiSettings>>) {
  const masked: Record<TaskComplexity, ModelConfig | undefined> = {
    simple: maskConfig(settings.models?.simple),
    standard: maskConfig(settings.models?.standard),
    complex: maskConfig(settings.models?.complex),
  };
  return {
    defaultProvider: settings.defaultProvider ?? "openai",
    models: masked,
  };
}

export async function settingsRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  app.get(
    "/ai",
    { preHandler: authMiddleware },
    async (_request: AuthenticatedRequest, reply) => {
      try {
        const settings = await getAiSettings();
        return reply.send(maskResponse(settings));
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: "Failed to fetch AI settings" });
      }
    },
  );

  app.post(
    "/ai",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const parsed = aiSettingsSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid input", details: parsed.error.format() });
      }

      try {
        const current = await getAiSettings();
        const incomingModels = parsed.data.models ?? {};

        const mergeModel = (complexity: TaskComplexity): ModelConfig => {
          const existing = current.models?.[complexity];
          const incoming = incomingModels[complexity];
          const config: ModelConfig = {
            provider: incoming?.provider ?? existing?.provider ?? "openai",
            model: incoming?.model ?? existing?.model ?? "gpt-4o",
            apiKey: incoming?.apiKey ?? existing?.apiKey,
            baseUrl: incoming?.baseUrl ?? existing?.baseUrl,
          };
          // Zachovat existující API klíč, pokud frontend poslal masku (prázdný řetězec).
          if (incoming && incoming.apiKey === "" && existing?.apiKey) {
            config.apiKey = existing.apiKey;
          }
          return config;
        };

        const mergedModels: Record<TaskComplexity, ModelConfig> = {
          simple: mergeModel("simple"),
          standard: mergeModel("standard"),
          complex: mergeModel("complex"),
        };

        await setAiSettings({
          defaultProvider: parsed.data.defaultProvider ?? current.defaultProvider ?? "openai",
          models: mergedModels,
        });
        const settings = await getAiSettings();
        return reply.send(maskResponse(settings));
      } catch (error) {
        app.log.error(error);
        return reply.status(500).send({ error: "Failed to save AI settings" });
      }
    },
  );
}
