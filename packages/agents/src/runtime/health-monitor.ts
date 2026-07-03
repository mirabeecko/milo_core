import type { AgentHealth, AgentHealthStatus, AgentRuntimeConfig } from "@milo/shared";

export interface HealthSnapshot {
  agentId: string;
  status: AgentHealthStatus;
  lastHeartbeatAt: number;
  consecutiveErrors: number;
  message?: string;
}

export class HealthMonitor {
  private snapshots = new Map<string, HealthSnapshot>();

  constructor(private config: Pick<AgentRuntimeConfig, "healthThresholdMs" | "maxConsecutiveErrors">) {}

  heartbeat(agentId: string): void {
    const snapshot = this.getOrCreate(agentId);
    snapshot.lastHeartbeatAt = Date.now();
    snapshot.consecutiveErrors = 0;
    snapshot.status = "healthy";
    snapshot.message = undefined;
  }

  recordError(agentId: string, message: string): void {
    const snapshot = this.getOrCreate(agentId);
    snapshot.consecutiveErrors += 1;
    snapshot.message = message;
    if (snapshot.consecutiveErrors >= this.config.maxConsecutiveErrors) {
      snapshot.status = "unhealthy";
    } else if (snapshot.status === "healthy") {
      snapshot.status = "degraded";
    }
  }

  check(agentId: string): AgentHealth {
    const snapshot = this.getOrCreate(agentId);
    const now = Date.now();
    const sinceLastHeartbeat = now - snapshot.lastHeartbeatAt;

    if (sinceLastHeartbeat > this.config.healthThresholdMs && snapshot.status === "healthy") {
      snapshot.status = "degraded";
      snapshot.message = `No heartbeat for ${sinceLastHeartbeat}ms`;
    }

    return {
      status: snapshot.status,
      lastHeartbeat: new Date(snapshot.lastHeartbeatAt).toISOString(),
      message: snapshot.message,
    };
  }

  getSnapshot(agentId: string): HealthSnapshot {
    return this.getOrCreate(agentId);
  }

  private getOrCreate(agentId: string): HealthSnapshot {
    let snapshot = this.snapshots.get(agentId);
    if (!snapshot) {
      snapshot = {
        agentId,
        status: "healthy",
        lastHeartbeatAt: Date.now(),
        consecutiveErrors: 0,
      };
      this.snapshots.set(agentId, snapshot);
    }
    return snapshot;
  }
}
