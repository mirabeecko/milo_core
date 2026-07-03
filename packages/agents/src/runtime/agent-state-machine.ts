import type { AgentStatus } from "@milo/shared";

const OPERATIONAL_STATUSES: AgentStatus[] = [
  "thinking",
  "planning",
  "delegating",
  "working",
  "waiting",
  "reviewing",
  "reporting",
  "loading_calendar",
  "loading_messages",
  "analyzing",
  "scheduling",
  "summarizing",
  "drafting_reply",
  "reading_code",
  "implementing",
  "testing",
  "building",
  "deploying",
];

const NON_OPERATIONAL_TARGETS: AgentStatus[] = ["idle", "paused", "stopping", "error"];

function buildTransitions(): Record<AgentStatus, AgentStatus[]> {
  const map = new Map<AgentStatus, AgentStatus[]>();

  map.set("offline", ["starting"]);
  map.set("starting", ["idle", "error"]);
  map.set("idle", [...OPERATIONAL_STATUSES, ...NON_OPERATIONAL_TARGETS]);
  map.set("paused", [...OPERATIONAL_STATUSES, ...NON_OPERATIONAL_TARGETS]);
  map.set("stopping", ["offline", "error"]);
  map.set("recovering", ["idle", "error", "offline"]);
  map.set("error", ["recovering", "stopping", "offline"]);

  for (const status of OPERATIONAL_STATUSES) {
    map.set(status, [...OPERATIONAL_STATUSES, ...NON_OPERATIONAL_TARGETS]);
  }

  return Object.fromEntries(map) as Record<AgentStatus, AgentStatus[]>;
}

export class AgentStateMachine {
  private static readonly transitions: Record<AgentStatus, AgentStatus[]> = buildTransitions();

  static canTransition(from: AgentStatus, to: AgentStatus): boolean {
    if (from === to) return true;
    return this.transitions[from]?.includes(to) ?? false;
  }

  static getOperationalStatuses(): AgentStatus[] {
    return [...OPERATIONAL_STATUSES];
  }

  static isOperational(status: AgentStatus): boolean {
    return this.getOperationalStatuses().includes(status);
  }

  static isTerminal(status: AgentStatus): boolean {
    return status === "offline" || status === "error";
  }
}
