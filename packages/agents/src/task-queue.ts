import type { TaskJob, TaskQueue } from "./types.js";

export class InMemoryTaskQueue implements TaskQueue {
  private jobs = new Map<string, TaskJob>();
  private counter = 0;

  private makeId(): string {
    this.counter += 1;
    return `job-${this.counter}`;
  }

  async add(job: Omit<TaskJob, "id" | "status" | "progress" | "createdAt">): Promise<TaskJob> {
    const full: TaskJob = {
      ...job,
      id: this.makeId(),
      status: "waiting",
      progress: 0,
      createdAt: new Date().toISOString(),
    };
    this.jobs.set(full.id, full);
    return full;
  }

  async getJob(id: string): Promise<TaskJob | null> {
    return this.jobs.get(id) ?? null;
  }

  async updateProgress(id: string, progress: number): Promise<void> {
    const job = this.jobs.get(id);
    if (job) {
      job.progress = Math.max(0, Math.min(100, progress));
    }
  }

  async complete(id: string, result?: Record<string, unknown>): Promise<void> {
    const job = this.jobs.get(id);
    if (job) {
      job.status = "completed";
      job.progress = 100;
      job.result = result;
      job.finishedAt = new Date().toISOString();
    }
  }

  async fail(id: string, error: string): Promise<void> {
    const job = this.jobs.get(id);
    if (job) {
      job.status = "failed";
      job.error = error;
      job.finishedAt = new Date().toISOString();
    }
  }

  async getWaiting(agentId?: string): Promise<TaskJob[]> {
    return this.filterBy("waiting", agentId);
  }

  async getActive(agentId?: string): Promise<TaskJob[]> {
    return this.filterBy("active", agentId);
  }

  async getCompleted(agentId?: string): Promise<TaskJob[]> {
    return this.filterBy("completed", agentId);
  }

  async getFailed(agentId?: string): Promise<TaskJob[]> {
    return this.filterBy("failed", agentId);
  }

  private filterBy(status: TaskJob["status"], agentId?: string): TaskJob[] {
    return Array.from(this.jobs.values())
      .filter((job) => job.status === status && (agentId === undefined || job.agentId === agentId))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async close(): Promise<void> {
    this.jobs.clear();
  }
}
