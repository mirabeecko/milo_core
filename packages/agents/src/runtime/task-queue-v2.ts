import type { AgentTask, TaskPriority, TaskStatus } from "@milo/shared";

export interface QueuedTask {
  id: string;
  task: AgentTask;
  priority: TaskPriority;
  deadline?: number;
  retryCount: number;
  maxRetries: number;
  status: TaskStatus;
  progress: number;
  startedAt?: number;
  completedAt?: number;
  result?: Record<string, unknown>;
  error?: string;
  cancelled: boolean;
}

export interface EnqueueOptions {
  priority?: TaskPriority;
  deadline?: Date | number;
  maxRetries?: number;
}

const PRIORITY_WEIGHT: Record<TaskPriority, number> = {
  critical: 4,
  high: 3,
  normal: 2,
  low: 1,
};

export class PriorityTaskQueue {
  private tasks = new Map<string, QueuedTask>();
  private counter = 0;

  enqueue(task: AgentTask, options: EnqueueOptions = {}): QueuedTask {
    const id = task.id;
    const queued: QueuedTask = {
      id,
      task,
      priority: options.priority ?? task.priority,
      deadline: options.deadline ? (typeof options.deadline === "number" ? options.deadline : options.deadline.getTime()) : undefined,
      retryCount: 0,
      maxRetries: options.maxRetries ?? task.retryCount,
      status: "pending",
      progress: 0,
      cancelled: false,
    };
    this.tasks.set(id, queued);
    return queued;
  }

  dequeue(): QueuedTask | undefined {
    const waiting = this.getWaiting();
    if (waiting.length === 0) return undefined;

    waiting.sort((a, b) => {
      const priorityDiff = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      if (a.deadline && b.deadline) return a.deadline - b.deadline;
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return new Date(a.task.createdAt).getTime() - new Date(b.task.createdAt).getTime();
    });

    const next = waiting[0];
    if (!next) return undefined;

    next.status = "running";
    next.startedAt = Date.now();
    return next;
  }

  updateProgress(taskId: string, progress: number): void {
    const queued = this.tasks.get(taskId);
    if (queued) {
      queued.progress = Math.max(0, Math.min(100, progress));
    }
  }

  complete(taskId: string, result?: Record<string, unknown>): void {
    const queued = this.tasks.get(taskId);
    if (!queued) return;
    queued.status = "completed";
    queued.progress = 100;
    queued.result = result;
    queued.completedAt = Date.now();
  }

  fail(taskId: string, error: string): void {
    const queued = this.tasks.get(taskId);
    if (!queued) return;

    if (queued.retryCount < queued.maxRetries) {
      queued.retryCount += 1;
      queued.status = "pending";
      queued.progress = 0;
      queued.startedAt = undefined;
      queued.error = `${error} (retry ${queued.retryCount}/${queued.maxRetries})`;
    } else {
      queued.status = "failed";
      queued.error = error;
      queued.completedAt = Date.now();
    }
  }

  cancel(taskId: string): boolean {
    const queued = this.tasks.get(taskId);
    if (!queued) return false;
    queued.cancelled = true;
    queued.status = "cancelled";
    queued.completedAt = Date.now();
    return true;
  }

  retry(taskId: string): boolean {
    const queued = this.tasks.get(taskId);
    if (!queued) return false;
    if (queued.retryCount >= queued.maxRetries) return false;
    queued.retryCount += 1;
    queued.status = "pending";
    queued.progress = 0;
    queued.startedAt = undefined;
    queued.completedAt = undefined;
    return true;
  }

  get(taskId: string): QueuedTask | undefined {
    return this.tasks.get(taskId);
  }

  getWaiting(): QueuedTask[] {
    return this.filterBy("pending");
  }

  getRunning(): QueuedTask[] {
    return this.filterBy("running");
  }

  getCompleted(): QueuedTask[] {
    return this.filterBy("completed");
  }

  getFailed(): QueuedTask[] {
    return this.filterBy("failed");
  }

  getCancelled(): QueuedTask[] {
    return this.filterBy("cancelled");
  }

  getAll(): QueuedTask[] {
    return Array.from(this.tasks.values()).sort(
      (a, b) => new Date(b.task.createdAt).getTime() - new Date(a.task.createdAt).getTime(),
    );
  }

  checkDeadlines(): QueuedTask[] {
    const now = Date.now();
    const missed: QueuedTask[] = [];
    for (const queued of this.tasks.values()) {
      if (queued.deadline && (queued.status === "pending" || queued.status === "running") && queued.deadline < now) {
        this.fail(queued.id, "Deadline missed");
        missed.push(queued);
      }
    }
    return missed;
  }

  private filterBy(status: TaskStatus): QueuedTask[] {
    return Array.from(this.tasks.values())
      .filter((queued) => queued.status === status)
      .sort((a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority]);
  }

  private makeId(): string {
    this.counter += 1;
    return `qtask-${Date.now()}-${this.counter}`;
  }
}
