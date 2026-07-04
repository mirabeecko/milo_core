import { describe, expect, it } from "vitest";
import {
  InMemoryAgentEventRepository,
  InMemoryAgentLogRepository,
  InMemoryAgentMemoryRepository,
  InMemoryAgentMetricsRepository,
  InMemoryAgentRepository,
  InMemoryMissionRepository,
  InMemoryTaskRepository,
} from "@milo/database";
import { AgentManager } from "./agent-manager.js";
import { chiefOfStaffDefinition } from "./registry/chief-of-staff.js";

function createManager() {
  return new AgentManager({
    repositories: {
      agents: new InMemoryAgentRepository(),
      tasks: new InMemoryTaskRepository(),
      missions: new InMemoryMissionRepository(),
      logs: new InMemoryAgentLogRepository(),
      memory: new InMemoryAgentMemoryRepository(),
      metrics: new InMemoryAgentMetricsRepository(),
      events: new InMemoryAgentEventRepository(),
    },
  });
}

describe("AgentManager", () => {
  it("registers an agent", async () => {
    const manager = createManager();
    const agent = await manager.register(chiefOfStaffDefinition);
    expect(agent.id).toBe("chief-of-staff");
    expect(manager.listAgents()).toHaveLength(1);
  });

  it("starts and stops an agent", async () => {
    const manager = createManager();
    await manager.register(chiefOfStaffDefinition);
    await manager.start("chief-of-staff");
    let state = manager.getAgent("chief-of-staff")?.getState();
    expect(state?.status).toBe("idle");
    await manager.stop("chief-of-staff");
    state = manager.getAgent("chief-of-staff")?.getState();
    expect(state?.status).toBe("offline");
  });

  it("delegates a task and completes it", async () => {
    const manager = createManager();
    await manager.register(chiefOfStaffDefinition);
    await manager.start("chief-of-staff");
    const task = await manager.delegate({
      title: "Test task",
      description: "A simple test task",
      priority: "normal",
      status: "pending",
      ownerId: "chief-of-staff",
      ownerType: "agent",
      source: "test",
      log: [],
      toolsUsed: [],
      citations: [],
      retryCount: 0,
      estimateMs: 100,
    });
    expect(task.id).toBeDefined();
    // allow simulated work to finish
    await new Promise((resolve) => setTimeout(resolve, 300));
    const logs = await manager.getLogs("chief-of-staff");
    expect(logs.length).toBeGreaterThan(0);
    await manager.close();
  });
});
