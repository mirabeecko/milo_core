/**
 * Docker Monitor — C-014 capability.
 * Skenuje běžící kontejnery a detekuje pády.
 */
import { execSync } from "node:child_process";
import { logExecutiveEvent } from "./event-logger.js";

interface ContainerStatus {
  name: string;
  status: string;
  uptime: string;
  ports: string[];
  healthy: boolean;
}

export function dockerStatus(): { containers: ContainerStatus[]; total: number; healthy: number; unhealthy: number; available: boolean } {
  try {
    const raw = execSync("docker ps --format '{{json .}}' --no-trunc 2>/dev/null", {
      encoding: "utf-8", timeout: 5000,
    }).trim();

    if (!raw) return { containers: [], total: 0, healthy: 0, unhealthy: 0, available: false };

    const lines = raw.split("\n").filter(Boolean);
    const containers: ContainerStatus[] = lines.map((line) => {
      const c = JSON.parse(line);
      const healthy = !c.Status?.toLowerCase().includes("unhealthy") && !c.Status?.toLowerCase().includes("restarting");
      return {
        name: c.Names,
        status: c.Status || "unknown",
        uptime: c.RunningFor || "",
        ports: c.Ports ? c.Ports.split(", ") : [],
        healthy,
      };
    });

    const unhealthy = containers.filter((c) => !c.healthy);
    if (unhealthy.length > 0) {
      logExecutiveEvent("mission_blocked", {
        mission_id: "C-014",
        summary: `Docker: ${unhealthy.length} unhealthy containers: ${unhealthy.map((c) => c.name).join(", ")}`,
      });
    }

    return {
      containers,
      total: containers.length,
      healthy: containers.filter((c) => c.healthy).length,
      unhealthy: unhealthy.length,
      available: true,
    };
  } catch (e: any) {
    return { containers: [], total: 0, healthy: 0, unhealthy: 0, available: false };
  }
}
