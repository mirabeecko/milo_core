import { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function healthRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  app.get("/health", async () => {
    return { status: "ok", timestamp: new Date().toISOString() };
  });

  app.get("/ready", async () => {
    // TODO: přidat kontrolu databáze a dalších závislostí
    return { status: "ready" };
  });
}
