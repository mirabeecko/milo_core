import type { AgentTask } from "@milo/shared";

export interface TaskRepository {
  findAll(options?: { status?: string; ownerId?: string; missionId?: string; limit?: number }): Promise<AgentTask[]>;
  findById(id: string): Promise<AgentTask | null>;
  create(task: Omit<AgentTask, "id" | "createdAt">): Promise<AgentTask>;
  update(id: string, partial: Partial<AgentTask>): Promise<AgentTask>;
  delete(id: string): Promise<void>;
}

export class InMemoryTaskRepository implements TaskRepository {
  private tasks = new Map<string, AgentTask>();
  private counter = 0;

  async findAll(options?: { status?: string; ownerId?: string; missionId?: string; limit?: number }): Promise<AgentTask[]> {
    let items = Array.from(this.tasks.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    if (options?.status) {
      items = items.filter((t) => t.status === options.status);
    }
    if (options?.ownerId) {
      items = items.filter((t) => t.ownerId === options.ownerId);
    }
    if (options?.missionId) {
      items = items.filter((t) => t.missionId === options.missionId);
    }
    if (options?.limit) {
      items = items.slice(0, options.limit);
    }
    return items;
  }

  async findById(id: string): Promise<AgentTask | null> {
    return this.tasks.get(id) ?? null;
  }

  async create(task: Omit<AgentTask, "id" | "createdAt">): Promise<AgentTask> {
    this.counter += 1;
    const full: AgentTask = {
      type: "custom",
      toolCalls: [],
      ...task,
      id: `task-${this.counter}`,
      createdAt: new Date().toISOString(),
    };
    this.tasks.set(full.id, full);
    return full;
  }

  async update(id: string, partial: Partial<AgentTask>): Promise<AgentTask> {
    const existing = this.tasks.get(id);
    if (!existing) {
      throw new Error(`Task ${id} not found`);
    }
    const updated: AgentTask = { ...existing, ...partial, id: existing.id };
    this.tasks.set(id, updated);
    return updated;
  }

  async delete(id: string): Promise<void> {
    this.tasks.delete(id);
  }

  seed(tasks: AgentTask[]): void {
    for (const task of tasks) {
      this.tasks.set(task.id, task);
      const numericId = Number(task.id.replace("task-", ""));
      if (!Number.isNaN(numericId) && numericId > this.counter) {
        this.counter = numericId;
      }
    }
  }
}
