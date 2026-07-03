export interface CancellationToken {
  readonly isCancelled: boolean;
  cancel(): void;
  throwIfCancelled(): void;
}

export function createCancellationToken(): CancellationToken {
  let cancelled = false;
  return {
    get isCancelled() {
      return cancelled;
    },
    cancel(): void {
      cancelled = true;
    },
    throwIfCancelled(): void {
      if (cancelled) {
        throw new Error("Task cancelled");
      }
    },
  };
}

export interface BackgroundJob<T = unknown> {
  id: string;
  execute: (token: CancellationToken) => Promise<T>;
  timeoutMs: number;
  token: CancellationToken;
  status: "waiting" | "running" | "completed" | "failed" | "cancelled" | "timed_out";
  result?: T;
  error?: string;
  startedAt?: number;
  finishedAt?: number;
}

export class BackgroundRunner {
  private jobs = new Map<string, BackgroundJob>();
  private counter = 0;

  async run<T>(id: string, execute: (token: CancellationToken) => Promise<T>, timeoutMs: number): Promise<T> {
    const token = createCancellationToken();
    const job: BackgroundJob<T> = {
      id,
      execute,
      timeoutMs,
      token,
      status: "waiting",
    };
    this.jobs.set(id, job);

    return new Promise<T>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        token.cancel();
        job.status = "timed_out";
        job.finishedAt = Date.now();
        reject(new Error(`Task ${id} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      job.status = "running";
      job.startedAt = Date.now();

      execute(token)
        .then((result) => {
          clearTimeout(timeoutId);
          if (token.isCancelled) {
            job.status = "cancelled";
            job.finishedAt = Date.now();
            reject(new Error(`Task ${id} was cancelled`));
            return;
          }
          job.status = "completed";
          job.result = result;
          job.finishedAt = Date.now();
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          job.status = token.isCancelled ? "cancelled" : "failed";
          job.error = error instanceof Error ? error.message : String(error);
          job.finishedAt = Date.now();
          reject(error);
        });
    });
  }

  cancel(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job) return false;
    job.token.cancel();
    return true;
  }

  getJob(jobId: string): BackgroundJob | undefined {
    return this.jobs.get(jobId);
  }

  private makeId(): string {
    this.counter += 1;
    return `job-${Date.now()}-${this.counter}`;
  }
}
