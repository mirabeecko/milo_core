import type { FastifyInstance } from "fastify";

export async function controlUseCasesRoutes(app: FastifyInstance) {
  app.get("/executive/control/use-cases", async (req, reply) => {
    const { getUseCases } = await import("@milo/database");
    const q = req.query as any;
    const useCases = await getUseCases(q);
    return reply.send({ count: useCases.length, useCases });
  });
  app.post("/executive/control/use-cases", async (req, reply) => {
    const { createUseCase } = await import("@milo/database");
    const input = req.body as any;
    if (!input.agent_id || !input.slug || !input.name) return reply.status(400).send({ error: "agent_id, slug, name required" });
    const uc = await createUseCase(input);
    return reply.status(201).send(uc);
  });
  app.get("/executive/control/use-cases/:id", async (req, reply) => {
    const { getUseCaseById } = await import("@milo/database");
    try {
      const uc = await getUseCaseById((req.params as any).id);
      return reply.send(uc);
    } catch { return reply.status(404).send({ error: "Not found" }); }
  });
  app.patch("/executive/control/use-cases/:id", async (req, reply) => {
    const { updateUseCase } = await import("@milo/database");
    try {
      const uc = await updateUseCase((req.params as any).id, req.body as any);
      return reply.send(uc);
    } catch { return reply.status(404).send({ error: "Update failed" }); }
  });
}
