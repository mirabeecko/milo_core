import type { Agent, AgentTask, TaskStatus } from "@milo/shared";
import type { AgentEventBus, TaskQueue, TaskRunner, TaskRunnerCallbacks } from "./types.js";

export interface TaskRunnerDeps {
  queue: TaskQueue;
  eventBus: AgentEventBus;
}

export class DefaultTaskRunner implements TaskRunner {
  constructor(private deps: TaskRunnerDeps) {}

  async execute(
    task: AgentTask,
    agent: Agent,
    callbacks?: TaskRunnerCallbacks,
  ): Promise<Record<string, unknown>> {
    const job = await this.deps.queue.add({
      taskId: task.id,
      agentId: agent.id,
      type: task.title,
      data: { description: task.description, priority: task.priority },
    });

    await this.deps.eventBus.publish({
      type: "agent:task:started",
      agentId: agent.id,
      timestamp: new Date().toISOString(),
      payload: { taskId: task.id, jobId: job.id },
    });

    try {
      await this.simulateWork(task, job.id, callbacks);
      const result: Record<string, unknown> = {
        taskId: task.id,
        status: "completed" as TaskStatus,
        output: `Simulated completion of: ${task.title}`,
      };
      await this.deps.queue.complete(job.id, result);
      await this.deps.eventBus.publish({
        type: "agent:task:completed",
        agentId: agent.id,
        timestamp: new Date().toISOString(),
        payload: { taskId: task.id, jobId: job.id, result },
      });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.deps.queue.fail(job.id, message);
      await this.deps.eventBus.publish({
        type: "agent:task:failed",
        agentId: agent.id,
        timestamp: new Date().toISOString(),
        payload: { taskId: task.id, jobId: job.id, error: message },
      });
      throw error;
    }
  }

  private async simulateWork(task: AgentTask, jobId: string, callbacks?: TaskRunnerCallbacks): Promise<void> {
    const steps = 5;
    const duration = Math.max(500, task.estimateMs ?? 2000);
    for (let i = 1; i <= steps; i++) {
      await sleep(duration / steps);
      const progress = Math.round((i / steps) * 100);
      await this.deps.queue.updateProgress(jobId, progress);
      callbacks?.onProgress?.(progress);
      callbacks?.onLog?.({
        timestamp: new Date().toISOString(),
        level: "info",
        message: `Simulated step ${i}/${steps}`,
      });
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
