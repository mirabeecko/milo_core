import type { FastifyInstance } from "fastify";

export async function controlCapabilitiesRoutes(app: FastifyInstance) {
  app.get("/executive/control/capabilities", async (_req, reply) => {
    const { getCapabilities } = await import("@milo/database");
    const caps = await getCapabilities();
    return reply.send({ count: caps.length, capabilities: caps });
  });
  app.post("/executive/control/capabilities", async (req, reply) => {
    const { createCapability } = await import("@milo/database");
    const input = req.body as any;
    if (!input.capability_code || !input.name) return reply.status(400).send({ error: "capability_code and name required" });
    const cap = await createCapability(input);
    return reply.status(201).send(cap);
  });
  app.get("/executive/control/components", async (req, reply) => {
    const { getComponents } = await import("@milo/database");
    const q = req.query as any;
    const components = await getComponents(q);
    return reply.send({ count: components.length, components });
  });
  app.post("/executive/control/components", async (req, reply) => {
    const { createComponent } = await import("@milo/database");
    const input = req.body as any;
    if (!input.name || !input.component_type) return reply.status(400).send({ error: "name and component_type required" });
    const comp = await createComponent(input);
    return reply.status(201).send(comp);
  });
  app.get("/executive/control/tasks", async (req, reply) => {
    const { getTasks } = await import("@milo/database");
    const q = req.query as any;
    const tasks = await getTasks(q);
    return reply.send({ count: tasks.length, tasks });
  });
  app.post("/executive/control/tasks", async (req, reply) => {
    const { createTask } = await import("@milo/database");
    const input = req.body as any;
    if (!input.title) return reply.status(400).send({ error: "title required" });
    const task = await createTask(input);
    return reply.status(201).send(task);
  });
  app.patch("/executive/control/tasks/:id", async (req, reply) => {
    const { updateTask } = await import("@milo/database");
    try {
      const task = await updateTask((req.params as any).id, req.body as any);
      return reply.send(task);
    } catch { return reply.status(404).send({ error: "Update failed" }); }
  });
}
