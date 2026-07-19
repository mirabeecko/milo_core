/**
 * Activity Routes — SSE stream a historie aktivity agentů.
 */

import type { FastifyInstance } from "fastify";
import { SSEManager } from "./sse-manager.js";

// Inline importy — obejití monorepo build issues
// V produkci se použije @milo/agents
import { AgentGraph, createInitialState, buildDefaultGraph } from "./graph-wrapper.js";

// --- Globální stav ---
const sseManager = SSEManager.getInstance();

// Workflow history (in-memory pro MVP, později Supabase)
const workflowHistory: Array<{
  id: string;
  status: string;
  agentCount: number;
  durationMs: number;
  timestamp: string;
}> = [];

// --- Routes ---
export async function activityRoutes(app: FastifyInstance): Promise<void> {
  // SSE stream — dashboard se připojuje sem
  app.get("/api/activity/stream", async (request, reply) => {
    sseManager.register(reply);

    // Keep-alive heartbeat každých 15s
    const heartbeat = setInterval(() => {
      try {
        reply.raw.write(`:heartbeat\n\n`);
      } catch {
        clearInterval(heartbeat);
      }
    }, 15000);

    request.raw.on("close", () => {
      clearInterval(heartbeat);
    });

    // Neukončovat — SSE je dlouhodobé spojení
    await new Promise(() => {});
  });

  // Historie aktivity
  app.get("/api/activity/history", async () => {
    return { history: workflowHistory };
  });

  // Spuštění workflow
  app.post("/api/agents/run", async () => {
    const state = createInitialState();
    const graph = buildDefaultGraph();

    // Spustit asynchronně
    const runPromise = graph.run(state);
    runPromise.then((result) => {
      workflowHistory.push({
        id: result.finalState.runId,
        status: result.success ? "completed" : "error",
        agentCount: new Set(result.finalState.activityLog.map((e) => e.agentId)).size,
        durationMs: result.durationMs,
        timestamp: new Date().toISOString(),
      });

      // Broadcast všech událostí
      for (const event of result.finalState.activityLog) {
        sseManager.broadcast(event);
      }

      // Finální event
      sseManager.broadcast({
        id: `evt-final-${Date.now()}`,
        timestamp: new Date().toISOString(),
        agentId: "orchestrator",
        agentName: "Orchestrator",
        type: "agent:completed",
        message: `Workflow ${result.success ? "dokončen" : "selhal"} — ${result.durationMs}ms`,
      });
    });

    return { status: "started", runId: state.runId };
  });

  // Stav workflow
  app.get("/api/agents/status", async () => {
    return {
      connectedClients: sseManager.connectedCount,
      historyCount: workflowHistory.length,
      recentHistory: workflowHistory.slice(-5),
    };
  });
}
