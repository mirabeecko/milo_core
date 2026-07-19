import { FastifyInstance, FastifyPluginOptions } from "fastify";

export async function healthRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  app.get("/health", async () => {
    // Kontrola workspace serveru
    let workspaceStatus = "unknown";
    try {
      const res = await fetch("http://localhost:4002/workspace/health");
      if (res.ok) {
        const data = await res.json() as any;
        workspaceStatus = data.status === "ok" ? "ok" : "degraded";
      } else {
        workspaceStatus = "error";
      }
    } catch {
      workspaceStatus = "offline";
    }

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      workspace: { status: workspaceStatus, port: 4002 },
    };
  });

  app.get("/ready", async () => {
    // TODO: přidat kontrolu databáze a dalších závislostí
    return { status: "ready" };
  });

  // Workspace health proxy — dostupný pod /health/workspace
  app.get("/health/workspace", async () => {
    try {
      const res = await fetch("http://localhost:4002/workspace/health");
      if (res.ok) return await res.json();
      return { status: "error", detail: `HTTP ${res.status}` };
    } catch (err: any) {
      return { status: "offline", detail: err.message };
    }
  });
}
