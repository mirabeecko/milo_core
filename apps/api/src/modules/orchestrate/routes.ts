import { FastifyInstance, FastifyPluginOptions } from "fastify";
import type { MissionInput } from "../../services/orchestrator.js";
import { getOrchestrator } from "../../services/orchestrator.js";
import { getAgentManager } from "../agents/manager.js";
import { controlCenterStore } from "../control-center/store.js";

export async function orchestrateRoutes(
  app: FastifyInstance,
  _options: FastifyPluginOptions,
): Promise<void> {
  // Inicializace Orchestratoru s reálnými dependencies
  const manager = await getAgentManager();
  const orchestrator = getOrchestrator({
    store: controlCenterStore,
    delegateTask: (task) => manager.delegate(task),
    updateTask: (id, update) => manager.updateTask(id, update),
    completeTask: (id, result) => manager.completeTask(id, result),
  });

  // Vytvořit novou misi (dekomponovat na tasky, přiřadit agenty)
  app.post<{ Body: MissionInput }>(
    "/",
    async (request, reply) => {
      try {
        const mission = await orchestrator.createMission(request.body);
        return reply.status(201).send(mission);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(400).send({ error: message });
      }
    },
  );

  // Seznam všech misí
  app.get("/", async (_request, reply) => {
    const missions = orchestrator.listMissions();
    return reply.send(missions);
  });

  // Detail mise
  app.get<{ Params: { id: string } }>(
    "/:id",
    async (request, reply) => {
      const mission = orchestrator.getMission(request.params.id);
      if (!mission) {
        return reply.status(404).send({ error: "Mise nenalezena" });
      }
      return reply.send(mission);
    },
  );

  // Posunout stav tasku
  app.post<{
    Params: { missionId: string; taskId: string };
    Body: { status: string; result?: string };
  }>(
    "/:missionId/tasks/:taskId/advance",
    async (request, reply) => {
      try {
        const task = await orchestrator.advanceTask(
          request.params.missionId,
          request.params.taskId,
          request.body.status as any,
          request.body.result,
        );
        if (!task) {
          return reply.status(404).send({ error: "Task nenalezen" });
        }
        return reply.send(task);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return reply.status(400).send({ error: message });
      }
    },
  );

  // Manuální přiřazení agenta
  app.post<{
    Params: { missionId: string; taskId: string };
    Body: { agentId: string };
  }>(
    "/:missionId/tasks/:taskId/assign",
    async (request, reply) => {
      const task = orchestrator.assignAgent(
        request.params.missionId,
        request.params.taskId,
        request.body.agentId,
      );
      if (!task) {
        return reply.status(404).send({ error: "Mise nebo task nenalezen" });
      }
      return reply.send(task);
    },
  );

  // Rychlý náhled — simulace routingu bez vytvoření tasků
  app.post<{ Body: MissionInput }>(
    "/preview",
    async (request, reply) => {
      const { getTaskRouter } = await import("../../services/task-router.js");
      const router = getTaskRouter();

      // Sync agentů
      const agents = controlCenterStore.getAgents();
      router.updateAgents(
        agents,
        (agentId) => controlCenterStore.getAgentCapabilities(agentId),
        () => 0,
      );

      const preview = request.body.tasks.map((task) => {
        const results = router.route({
          title: task.title,
          description: task.description,
          type: task.type,
          priority: task.priority ?? request.body.priority ?? "normal",
          requiredCapabilities: task.requiredCapabilities,
        });
        return {
          task: task.title,
          candidates: results.slice(0, 3).map((r) => ({
            agent: r.agent.name,
            score: r.score,
            reasons: r.matchReasons,
          })),
        };
      });

      return reply.send({ preview });
    },
  );
}
