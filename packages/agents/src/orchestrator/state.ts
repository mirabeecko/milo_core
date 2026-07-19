/**
 * MiLO Agent State — centrální stav procházející grafem agentů.
 *
 * Každý uzel (agent) čte a modifikuje tento stav.
 * Stav je immutable — každý uzel vrací nový stav.
 */

export interface ActivityEvent {
  id: string;
  timestamp: string;
  agentId: string;
  agentName: string;
  type: "agent:started" | "agent:thinking" | "agent:tool_call" | "agent:tool_result" | "agent:completed" | "agent:error" | "hermes:tool_call" | "hermes:tool_result";
  message: string;
  toolName?: string;
  toolResult?: unknown;
  error?: string;
}

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "critical";
  assignedTo: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  result?: string;
}

export interface AgentStateData {
  /** ID aktuálního běhu workflow */
  runId: string;
  /** Který agent je právě aktivní */
  currentAgent: string;
  /** Fronta úkolů k provedení */
  taskQueue: AgentTask[];
  /** Dokončené úkoly */
  completedTasks: AgentTask[];
  /** Log aktivity */
  activityLog: ActivityEvent[];
  /** Celkový stav workflow */
  status: "idle" | "running" | "paused" | "completed" | "error";
  /** Zprávy mezi agenty */
  messages: string[];
  /** Chybová zpráva pokud status=error */
  errorMessage?: string;
  /** Časové razítko poslední změny */
  lastUpdated: string;
}

export function createInitialState(runId?: string): AgentStateData {
  return {
    runId: runId ?? `run-${Date.now()}`,
    currentAgent: "chief-of-staff",
    taskQueue: [],
    completedTasks: [],
    activityLog: [],
    status: "idle",
    messages: [],
    lastUpdated: new Date().toISOString(),
  };
}

export function addActivity(
  state: AgentStateData,
  event: Omit<ActivityEvent, "id" | "timestamp">
): AgentStateData {
  const activityEvent: ActivityEvent = {
    ...event,
    id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  };

  return {
    ...state,
    activityLog: [...state.activityLog, activityEvent],
    lastUpdated: new Date().toISOString(),
  };
}

export function addTask(state: AgentStateData, task: AgentTask): AgentStateData {
  return {
    ...state,
    taskQueue: [...state.taskQueue, task],
    lastUpdated: new Date().toISOString(),
  };
}

export function completeTask(state: AgentStateData, taskId: string, result?: string): AgentStateData {
  const task = state.taskQueue.find((t) => t.id === taskId);
  if (!task) return state;

  const completed: AgentTask = {
    ...task,
    status: "completed",
    completedAt: new Date().toISOString(),
    result,
  };

  return {
    ...state,
    taskQueue: state.taskQueue.filter((t) => t.id !== taskId),
    completedTasks: [...state.completedTasks, completed],
    lastUpdated: new Date().toISOString(),
  };
}
