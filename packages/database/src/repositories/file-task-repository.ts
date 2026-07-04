import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { AgentTask } from "@milo/shared";
import type { TaskRepository } from "./task-repository.js";
import { InMemoryTaskRepository } from "./task-repository.js";

export class FileTaskRepository implements TaskRepository {
  private memory = new InMemoryTaskRepository();
  private initialized = false;
  private saving = false;
  private pendingSave = false;

  constructor(private filePath: string) {}

  async findAll(options?: { status?: string; ownerId?: string; limit?: number }): Promise<AgentTask[]> {
    await this.load();
    return this.memory.findAll(options);
  }

  async findById(id: string): Promise<AgentTask | null> {
    await this.load();
    return this.memory.findById(id);
  }

  async create(task: Omit<AgentTask, "id" | "createdAt">): Promise<AgentTask> {
    await this.load();
    const created = await this.memory.create(task);
    await this.persist();
    return created;
  }

  async update(id: string, partial: Partial<AgentTask>): Promise<AgentTask> {
    await this.load();
    const updated = await this.memory.update(id, partial);
    await this.persist();
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.load();
    await this.memory.delete(id);
    await this.persist();
  }

  private async load(): Promise<void> {
    if (this.initialized) {
      return;
    }
    try {
      const data = await readFile(this.filePath, "utf-8");
      const tasks: AgentTask[] = JSON.parse(data);
      this.memory.seed(tasks);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
    this.initialized = true;
  }

  private async persist(): Promise<void> {
    if (this.saving) {
      this.pendingSave = true;
      return;
    }
    this.saving = true;
    try {
      await mkdir(dirname(this.filePath), { recursive: true });
      const tasks = await this.memory.findAll();
      await writeFile(this.filePath, JSON.stringify(tasks, null, 2));
    } finally {
      this.saving = false;
      if (this.pendingSave) {
        this.pendingSave = false;
        await this.persist();
      }
    }
  }
}
