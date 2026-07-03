import { describe, expect, it } from "vitest";
import type { AgentTask } from "@milo/shared";
import { PriorityTaskQueue } from "./task-queue-v2.js";

function makeTask(id: string, priority: AgentTask["priority"]): AgentTask {
  return {
    id,
    title: `Task ${id}`,
    priority,
    status: "pending",
    ownerId: "test",
    ownerType: "agent",
    source: "test",
    createdAt: new Date().toISOString(),
    log: [],
    toolsUsed: [],
    citations: [],
    retryCount: 0,
  };
}

describe("PriorityTaskQueue", () => {
  it("dequeues by priority", () => {
    const queue = new PriorityTaskQueue();
    queue.enqueue(makeTask("low", "low"));
    queue.enqueue(makeTask("high", "high"));
    queue.enqueue(makeTask("critical", "critical"));

    const next = queue.dequeue();
    expect(next?.task.id).toBe("critical");
  });

  it("tracks task lifecycle", () => {
    const queue = new PriorityTaskQueue();
    const task = makeTask("t1", "normal");
    queue.enqueue(task);
    const dequeued = queue.dequeue();
    expect(dequeued?.status).toBe("running");
    queue.complete(task.id, { ok: true });
    expect(queue.getCompleted()[0]?.task.id).toBe("t1");
  });

  it("retries failed tasks up to maxRetries", () => {
    const queue = new PriorityTaskQueue();
    const task = makeTask("t1", "normal");
    queue.enqueue(task, { maxRetries: 2 });
    queue.dequeue();
    queue.fail(task.id, "error");
    expect(queue.getWaiting()[0]?.retryCount).toBe(1);
    queue.dequeue();
    queue.fail(task.id, "error again");
    expect(queue.getWaiting()[0]?.retryCount).toBe(2);
    queue.dequeue();
    queue.fail(task.id, "final error");
    expect(queue.getFailed()[0]?.task.id).toBe("t1");
  });

  it("cancels tasks", () => {
    const queue = new PriorityTaskQueue();
    const task = makeTask("t1", "normal");
    queue.enqueue(task);
    expect(queue.cancel(task.id)).toBe(true);
    expect(queue.getCancelled()[0]?.task.id).toBe("t1");
  });

  it("detects missed deadlines", () => {
    const queue = new PriorityTaskQueue();
    const task = makeTask("t1", "normal");
    queue.enqueue(task, { deadline: Date.now() - 100 });
    const missed = queue.checkDeadlines();
    expect(missed.length).toBe(1);
    expect(queue.getFailed()[0]?.error).toContain("Deadline");
  });
});
