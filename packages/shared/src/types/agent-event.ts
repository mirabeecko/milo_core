export type AgentEventType =
  | "agent:registered"
  | "agent:status"
  | "agent:heartbeat"
  | "agent:log"
  | "agent:explanation"
  | "agent:task:created"
  | "agent:task:started"
  | "agent:task:completed"
  | "agent:task:failed"
  | "agent:task:cancelled"
  | "agent:task:delegated"
  | "agent:mission:completed"
  | "agent:mission:failed"
  | "agent:error";

export interface AgentEvent {
  id: string;
  type: AgentEventType;
  agentId: string;
  timestamp: string;
  payload: Record<string, unknown>;
}

export interface AgentMessage {
  id: string;
  fromAgentId: string;
  toAgentId: string;
  taskId?: string;
  type: "delegate" | "response" | "notify";
  content: string;
  timestamp: string;
}
