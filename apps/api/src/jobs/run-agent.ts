import type { JobData } from "../infrastructure/queue.js";
import { JobName } from "../infrastructure/queue.js";
import { getAgentManager } from "../modules/agents/manager.js";

export async function runAgentJob(data: JobData[JobName.RUN_AGENT]): Promise<{
  agentId: string;
  taskId: string;
  status: string;
}> {
  const { agentId, userId, input } = data;

  console.log(`[job:run:agent] Running agent ${agentId} for user ${userId}: ${input}`);

  const manager = await getAgentManager();
  const agent = manager.getAgent(agentId);
  if (!agent) {
    throw new Error(`Agent ${agentId} not found`);
  }

  if (agent.agent.status === "offline") {
    await agent.start();
  }

  const task = await manager.delegate({
    title: input,
    description: `Background job for agent ${agentId}`,
    type: "custom",
    priority: "normal",
    status: "pending",
    ownerId: agentId,
    ownerType: "agent",
    source: "bullmq-job",
    log: [],
    toolsUsed: agent.agent.config.tools.slice(0, 5),
    citations: [],
    retryCount: 0,
  });

  console.log(`[job:run:agent] Created task ${task.id} for agent ${agentId}`);
  return { agentId, taskId: task.id, status: task.status };
}
