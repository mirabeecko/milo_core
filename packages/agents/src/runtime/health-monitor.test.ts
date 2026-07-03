import { describe, expect, it } from "vitest";
import { HealthMonitor } from "./health-monitor.js";

describe("HealthMonitor", () => {
  it("reports healthy after heartbeat", () => {
    const monitor = new HealthMonitor({ healthThresholdMs: 1000, maxConsecutiveErrors: 3 });
    monitor.heartbeat("a1");
    const health = monitor.check("a1");
    expect(health.status).toBe("healthy");
  });

  it("degrades when heartbeat is missing", async () => {
    const monitor = new HealthMonitor({ healthThresholdMs: 50, maxConsecutiveErrors: 3 });
    monitor.heartbeat("a1");
    await new Promise((resolve) => setTimeout(resolve, 100));
    const health = monitor.check("a1");
    expect(health.status).toBe("degraded");
  });

  it("becomes unhealthy after too many errors", () => {
    const monitor = new HealthMonitor({ healthThresholdMs: 1000, maxConsecutiveErrors: 2 });
    monitor.recordError("a1", "e1");
    monitor.recordError("a1", "e2");
    const health = monitor.check("a1");
    expect(health.status).toBe("unhealthy");
  });
});
