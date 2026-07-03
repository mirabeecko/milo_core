export type ScheduledJobHandler = () => void | Promise<void>;

export interface ScheduledJob {
  id: string;
  type: "once" | "interval";
  nextRunAt: number;
  intervalMs?: number;
  handler: ScheduledJobHandler;
  running: boolean;
}

export class AgentScheduler {
  private jobs = new Map<string, ScheduledJob>();
  private counter = 0;
  private intervalId?: ReturnType<typeof setInterval>;
  private running = false;
  private tickMs: number;

  constructor(tickMs = 1000) {
    this.tickMs = tickMs;
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.intervalId = setInterval(() => {
      void this.tick();
    }, this.tickMs);
  }

  stop(): void {
    this.running = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }
  }

  scheduleAt(when: Date | number, handler: ScheduledJobHandler): string {
    const id = this.makeId();
    const nextRunAt = typeof when === "number" ? when : when.getTime();
    const job: ScheduledJob = {
      id,
      type: "once",
      nextRunAt,
      handler,
      running: false,
    };
    this.jobs.set(id, job);
    return id;
  }

  scheduleInterval(intervalMs: number, handler: ScheduledJobHandler, firstRunDelayMs = 0): string {
    const id = this.makeId();
    const job: ScheduledJob = {
      id,
      type: "interval",
      nextRunAt: Date.now() + firstRunDelayMs,
      intervalMs,
      handler,
      running: false,
    };
    this.jobs.set(id, job);
    return id;
  }

  cancel(jobId: string): boolean {
    return this.jobs.delete(jobId);
  }

  list(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }

  private async tick(): Promise<void> {
    const now = Date.now();
    for (const job of this.jobs.values()) {
      if (job.running || job.nextRunAt > now) continue;

      job.running = true;
      try {
        await job.handler();
      } catch (error) {
        console.error(`[AgentScheduler] Job ${job.id} failed:`, error);
      } finally {
        if (job.type === "interval" && job.intervalMs !== undefined) {
          job.nextRunAt = now + job.intervalMs;
          job.running = false;
        } else {
          this.jobs.delete(job.id);
        }
      }
    }
  }

  private makeId(): string {
    this.counter += 1;
    return `sched-${Date.now()}-${this.counter}`;
  }
}
