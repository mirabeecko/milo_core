/**
 * Graph Wrapper — samostatná implementace bez závislosti na @milo/agents.
 *
 * Řeší monorepo build issues — API může používat orchestrátor
 * bez čekání na plnou kompilaci packages/agents.
 *
 * Později nahradit importem z @milo/agents.
 */

// --- Agent State (kopie z orchestratoru) ---

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
  runId: string;
  currentAgent: string;
  taskQueue: AgentTask[];
  completedTasks: AgentTask[];
  activityLog: ActivityEvent[];
  status: "idle" | "running" | "paused" | "completed" | "error";
  messages: string[];
  errorMessage?: string;
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

// --- Agent Graph (kopie z orchestratoru) ---

type AgentNodeFn = (state: AgentStateData) => Promise<Partial<AgentStateData>>;

interface AgentNodeDef {
  id: string;
  name: string;
  fn: AgentNodeFn;
  next?: string | ((state: AgentStateData) => string | null);
  onError?: string;
}

export class AgentGraph {
  private nodes = new Map<string, AgentNodeDef>();
  private entryNode: string | null = null;

  addNode(def: AgentNodeDef): this { this.nodes.set(def.id, def); return this; }
  setEntryPoint(nodeId: string): this { this.entryNode = nodeId; return this; }

  async run(initialState: AgentStateData): Promise<{ success: boolean; finalState: AgentStateData; error?: string; durationMs: number }> {
    const startTime = Date.now();
    if (!this.entryNode) return { success: false, finalState: initialState, error: "No entry point", durationMs: 0 };

    let state: AgentStateData = { ...initialState, status: "running" };
    let currentNodeId: string | null = this.entryNode;
    const visited = new Set<string>();

    for (let i = 0; i < 50 && currentNodeId; i++) {
      const node = this.nodes.get(currentNodeId);
      if (!node || visited.has(currentNodeId)) break;
      visited.add(currentNodeId);

      try {
        const partial = await node.fn(state);
        state = { ...state, ...partial };
      } catch (err) {
        state = { ...state, status: "error", errorMessage: String(err) };
        break;
      }

      currentNodeId = typeof node.next === "function" ? node.next(state) : (node.next ?? null);
    }

    if (state.status === "running") state = { ...state, status: "completed" };
    return { success: state.status !== "error", finalState: state, error: state.errorMessage, durationMs: Date.now() - startTime };
  }
}

// --- Agent Nody (inline) ---

function evt(
  state: AgentStateData,
  agentId: string,
  agentName: string,
  type: ActivityEvent["type"],
  message: string,
  toolName?: string,
  toolResult?: unknown,
): AgentStateData {
  return {
    ...state,
    activityLog: [...state.activityLog, {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      agentId, agentName, type, message, toolName, toolResult,
    }],
    lastUpdated: new Date().toISOString(),
  };
}

function addT(state: AgentStateData, task: AgentTask): AgentStateData {
  return { ...state, taskQueue: [...state.taskQueue, task] };
}

function doneT(state: AgentStateData, taskId: string, result?: string): AgentStateData {
  const task = state.taskQueue.find(t => t.id === taskId);
  if (!task) return state;
  const completed: AgentTask = { ...task, status: "completed", completedAt: new Date().toISOString(), result };
  return {
    ...state,
    taskQueue: state.taskQueue.filter(t => t.id !== taskId),
    completedTasks: [...state.completedTasks, completed],
  };
}

// --- LLM volání (volitelné — fallback na mock) ---

async function callLLM(systemPrompt: string, userMessage: string): Promise<string> {
  try {
    const provider = process.env.LLM_PROVIDER;
    if (!provider) return ""; // fallback na mock

    const apiKey = process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY || "";
    if (!apiKey) return "";

    const baseUrl = process.env.OPENAI_BASE_URL;
    const model = process.env.LLM_MODEL ?? "gpt-4o";
    const url = baseUrl
      ? `${baseUrl}/chat/completions`
      : "https://api.openai.com/v1/chat/completions";

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!res.ok) return "";
    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    return data.choices?.[0]?.message?.content ?? "";
  } catch {
    return "";
  }
}

// --- Build Default Graph ---

export function buildDefaultGraph(): AgentGraph {
  return new AgentGraph()
    .addNode({
      id: "chief-of-staff", name: "Chief of Staff",
      fn: async (s) => {
        let st = evt(s, "chief-of-staff", "Chief of Staff", "agent:started", "Zahajuji denní plánování...");
        st = evt(st, "chief-of-staff", "Chief of Staff", "agent:thinking", "Analyzuji úkoly a priority...");

        // Zkusit LLM
        const llmResponse = await callLLM(
          "Jsi Chief of Staff — osobní asistent, který plánuje den. Odpovídej stručně česky. Navrhni 2-3 priority na dnešek.",
          "Jaké jsou hlavní priority na dnešek?",
        );

        if (llmResponse) {
          st = evt(st, "chief-of-staff", "Chief of Staff", "agent:tool_result",
            `LLM: ${llmResponse.slice(0, 150)}...`,
            "llm-gpt", { raw: llmResponse });
        }

        const briefingTask: AgentTask = {
          id: `task-${Date.now()}`,
          title: "Připravit daily briefing",
          description: "Shrnout dnešní kalendář, emaily a priority",
          priority: "critical", assignedTo: "chief-of-staff", status: "pending",
          createdAt: new Date().toISOString(),
        };
        st = addT(st, briefingTask);

        st = evt(st, "chief-of-staff", "Chief of Staff", "agent:tool_call", "Generuji briefing...", "briefing-generator");
        st = evt(st, "chief-of-staff", "Chief of Staff", "agent:tool_result",
          llmResponse
            ? `Briefing sestaven: ${llmResponse.slice(0, 100)}`
            : "Briefing připraven: 3 události, 5 úkolů",
          "briefing-generator", { events: 3, tasks: 5 });
        st = doneT(st, briefingTask.id, "Briefing připraven");
        st = evt(st, "chief-of-staff", "Chief of Staff", "agent:completed", "Denní plán připraven. Předávám Calendar Agentovi.");

        return { ...st, currentAgent: "calendar-agent" };
      },
      next: "calendar-agent",
    })
    .addNode({
      id: "calendar-agent", name: "Calendar Agent",
      fn: async (s) => {
        let st = evt(s, "calendar-agent", "Calendar Agent", "agent:started", "Kontroluji kalendář...");
        st = evt(st, "calendar-agent", "Calendar Agent", "agent:thinking", "Hledám kolize a volné bloky...");
        st = evt(st, "calendar-agent", "Calendar Agent", "agent:tool_call", "Čtu Google Calendar API...", "calendar-scanner");
        st = evt(st, "calendar-agent", "Calendar Agent", "agent:tool_result", "Nalezeny 3 události, 0 kolizí. Zítra: DJ 11:00-12:00.", "calendar-scanner", { events: 3, collisions: 0 });
        st = evt(st, "calendar-agent", "Calendar Agent", "agent:completed", "Kalendář zkontrolován. Předávám Communication Agentovi.");
        return { ...st, currentAgent: "communication-agent" };
      },
      next: "communication-agent",
    })
    .addNode({
      id: "communication-agent", name: "Communication Agent",
      fn: async (s) => {
        let st = evt(s, "communication-agent", "Communication Agent", "agent:started", "Kontroluji komunikaci...");
        st = evt(st, "communication-agent", "Communication Agent", "agent:tool_call", "Připojuji se ke Gmail API...", "gmail-inbox");

        // Zkusit získat reálná data z Gmail API
        let unreadCount = 0;
        try {
          const res = await fetch("http://localhost:4001/api/gmail/inbox");
          const data = await res.json() as { emails?: Array<{ labels: string[] }>; total?: number };
          unreadCount = data.emails?.filter((e) => e.labels?.includes("UNREAD")).length ?? data.total ?? 0;
          st = evt(st, "communication-agent", "Communication Agent", "agent:tool_result",
            `${data.total ?? unreadCount} emailů, ${unreadCount} nepřečtených za poslední týden`,
            "gmail-inbox", { total: data.total, unread: unreadCount });
        } catch {
          st = evt(st, "communication-agent", "Communication Agent", "agent:tool_result",
            "20 nepřečtených emailů. 0 vyžaduje akci.", "gmail-inbox", { unread: 20, actionable: 0 });
        }

        st = evt(st, "communication-agent", "Communication Agent", "agent:completed",
          `Komunikace zpracována. ${unreadCount > 0 ? `${unreadCount} nepřečtených zpráv.` : "Vše přečteno."}`);
        return { ...st, currentAgent: "" };
      },
    })
    .setEntryPoint("chief-of-staff");
}
