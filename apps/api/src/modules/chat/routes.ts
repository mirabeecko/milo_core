import { FastifyInstance, FastifyPluginOptions } from "fastify";
import { z } from "zod";
import { ModelRouter } from "@milo/ai";
import { ChatService } from "./service.js";
import { AuthenticatedRequest, authMiddleware } from "../auth/middleware.js";
import { getAgentManager } from "../agents/manager.js";
import { config } from "../../config/index.js";

const chatRequestSchema = z.object({
  message: z.string().min(1),
  conversationId: z.string().optional(),
});

function createModelRouter(): ModelRouter | undefined {
  const hasOpenAi = Boolean(config.OPENAI_API_KEY);

  if (!hasOpenAi) return undefined;

  return new ModelRouter({
    openai: {
      apiKey: config.OPENAI_API_KEY!,
      baseURL: config.OPENAI_BASE_URL,
      defaultModel: "gpt-4o-mini",
    },
    ollama: {
      host: "http://localhost:11434",
      defaultModel: "llama3.1",
    },
    defaultProvider: "openai",
    taskPreferences: { chat: "openai", default: "openai" },
  });
}

export async function chatRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  const manager = await getAgentManager();
  const modelRouter = createModelRouter();
  const chatService = new ChatService(manager, modelRouter);

  app.post(
    "/",
    { preHandler: authMiddleware },
    async (request: AuthenticatedRequest, reply) => {
      const parsed = chatRequestSchema.safeParse(request.body);

      if (!parsed.success) {
        return reply.status(400).send({ error: "Invalid input", details: parsed.error.format() });
      }

      try {
        const userId = request.user?.id ?? "demo";
        const response = await chatService.sendMessage(userId, parsed.data);
        return reply.send(response);
      } catch (error) {
        request.log.error(error);
        return reply.status(500).send({ error: "Failed to process message" });
      }
    },
  );
}
