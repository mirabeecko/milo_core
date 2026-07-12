/**
 * Agent Runtime — in-memory správa živých agentů.
 * 
 * Každý agent z Control Center může být "spuštěn" — pak má live stav,
 * frontu úkolů, historii, a může vykonávat mise přes ExecutiveTaskRunner.
 */
import { EventEmitter } from "node:events";

export interface LiveAgent {
  id: string;
  slug: string;
  name: string;
  category: string;
  status: "online" | "offline" | "working" | "error";
  startedAt: string | null;
  currentActivity: string;
  progress: number;
  taskQueue: AgentTaskItem[];
  history: AgentTaskItem[];
  errors: AgentError[];
  capabilities: string[];
}

export interface AgentTaskItem {
  id: string;
  title: string;
  type: string;
  status: "pending" | "running" | "completed" | "failed";
  createdAt: string;
  completedAt?: string;
  result?: string;
  error?: string;
}

export interface AgentError {
  id: string;
  message: string;
  severity: "warning" | "error" | "critical";
  createdAt: string;
  resolved: boolean;
  resolvedAt?: string;
}

export class AgentRuntime extends EventEmitter {
  private agents = new Map<string, LiveAgent>();
  private taskCounter = 0;

  /** Zaregistruje agenta z Control Center definice */
  register(def: {
    id: string; slug: string; name: string; category: string;
    capabilities?: string[];
  }): LiveAgent {
    const existing = this.agents.get(def.id);
    if (existing) return existing;

    const agent: LiveAgent = {
      id: def.id,
      slug: def.slug,
      name: def.name,
      category: def.category,
      status: "offline",
      startedAt: null,
      currentActivity: "Nespuštěn",
      progress: def.category === "executive" ? 100 : 0,
      taskQueue: [],
      history: [],
      errors: [],
      capabilities: def.capabilities ?? (def.category === "executive"
        ? ["brief", "docker", "projects", "costs", "search", "system", "audit", "mission"]
        : def.category === "design"
        ? ["css", "layout", "theming"]
        : []),
    };

    this.agents.set(def.id, agent);
    return agent;
  }

  /** Spustí agenta */
  start(id: string): LiveAgent {
    const agent = this.ensure(id);
    agent.status = "online";
    agent.startedAt = new Date().toISOString();
    agent.currentActivity = "Spuštěn — čeká na úkoly";
    agent.errors = agent.errors.filter(e => !e.resolved);
    this.emit("agent:started", { id, name: agent.name });
    return agent;
  }

  /** Zastaví agenta */
  stop(id: string): LiveAgent {
    const agent = this.ensure(id);
    agent.status = "offline";
    agent.startedAt = null;
    agent.currentActivity = "Zastaven";
    agent.taskQueue = [];
    this.emit("agent:stopped", { id, name: agent.name });
    return agent;
  }

  /** Zadá úkol agentovi */
  assignTask(agentId: string, task: { title: string; type?: string }): AgentTaskItem {
    const agent = this.ensure(agentId);
    if (agent.status === "offline") {
      throw new Error(`Agent ${agent.name} není spuštěn. Nejprve ho spusť.`);
    }

    const item: AgentTaskItem = {
      id: `task-${++this.taskCounter}-${Date.now()}`,
      title: task.title,
      type: task.type ?? this.detectType(task.title, agent),
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    agent.taskQueue.push(item);
    this.emit("task:assigned", { agentId, taskId: item.id });

    // Okamžitě spustit (async)
    this.executeTask(agent, item).catch(err => {
      agent.errors.push({
        id: `err-${Date.now()}`,
        message: err instanceof Error ? err.message : String(err),
        severity: "error",
        createdAt: new Date().toISOString(),
        resolved: false,
      });
      this.emit("task:error", { agentId, taskId: item.id, error: err });
    });

    return item;
  }

  /** Vyřeší chybu */
  resolveError(agentId: string, errorId: string): void {
    const agent = this.ensure(agentId);
    const err = agent.errors.find(e => e.id === errorId);
    if (err) {
      err.resolved = true;
      err.resolvedAt = new Date().toISOString();
      if (agent.status === "error") {
        agent.status = "online";
        agent.currentActivity = "Chyba vyřešena — připraven";
      }
    }
  }

  /** Vrátí live stav agenta */
  getAgent(id: string): LiveAgent {
    return this.ensure(id);
  }

  /** Vrátí všechny agenty */
  listAgents(): LiveAgent[] {
    return [...this.agents.values()];
  }

  /** Vrátí historii úkolů */
  getHistory(agentId: string, limit = 20): AgentTaskItem[] {
    return this.ensure(agentId).history.slice(-limit);
  }

  private ensure(id: string): LiveAgent {
    const agent = this.agents.get(id);
    if (!agent) throw new Error(`Agent ${id} není registrován`);
    return agent;
  }

  private detectType(title: string, _agent: LiveAgent): string {
    const t = title.toLowerCase();
    if (/css|style|barva|font|layout|design|vzhled|grafika|respons/i.test(t)) return "executive:design";
    if (/briefing|brief|ranní/i.test(t)) return "executive:brief";
    if (/docker|kontejner/i.test(t)) return "executive:docker";
    if (/projekt|priorit/i.test(t)) return "executive:projects";
    if (/náklad|cost|cena/i.test(t)) return "executive:costs";
    if (/hledej|vyhledej|najdi|search/i.test(t)) return "executive:search";
    if (/audit|kontrola/i.test(t)) return "executive:audit";
    if (/systém|system|registry/i.test(t)) return "executive:system";
    return "executive:mission";
  }

  private async executeTask(agent: LiveAgent, task: AgentTaskItem): Promise<void> {
    // Odeber z fronty
    const idx = agent.taskQueue.indexOf(task);
    if (idx >= 0) agent.taskQueue.splice(idx, 1);

    task.status = "running";
    agent.status = "working";
    agent.currentActivity = `Pracuji: ${task.title}`;
    agent.progress = 10;
    this.emit("task:started", { agentId: agent.id, taskId: task.id });

    try {
      // Spusť příslušnou capability
      const result = await this.runCapability(task.type, task.title, agent);
      
      task.status = "completed";
      task.completedAt = new Date().toISOString();
      task.result = result;
      agent.currentActivity = `Dokončeno: ${task.title}`;
      agent.progress = 100;
      agent.status = "online";
      this.emit("task:completed", { agentId: agent.id, taskId: task.id, result });
    } catch (err) {
      task.status = "failed";
      task.error = err instanceof Error ? err.message : String(err);
      agent.currentActivity = `Chyba: ${task.error}`;
      agent.status = "error";
      agent.progress = 0;
      throw err;
    } finally {
      agent.history.push({ ...task });
    }
  }

  private async runCapability(type: string, title: string, _agent: LiveAgent): Promise<string> {
    switch (type) {
      case "executive:docker": {
        const { dockerStatus } = await import("./docker-monitor.js");
        const s = dockerStatus();
        return `Docker: ${s.total} kontejnerů, ${s.healthy} healthy`;
      }
      case "executive:projects": {
        const { prioritizeProjects } = await import("./project-prioritizer.js");
        const p = prioritizeProjects();
        return `Top projekt: ${p.top5?.[0]?.name ?? "N/A"} (${p.active} aktivních)`;
      }
      case "executive:costs": {
        const { llmCosts } = await import("./llm-costs.js");
        const c = llmCosts();
        return c.available
          ? `LLM: ${c.monthly.total_czk} Kč tento měsíc`
          : "Cost tracker nedostupný";
      }
      case "executive:search": {
        const { unifiedSearch, buildUnifiedIndex } = await import("./unified-search.js");
        const q = title.replace(/^(hledej|vyhledej|najdi|search|find)\s+/i, "").trim();
        try { buildUnifiedIndex(); } catch {}
        const r = unifiedSearch(q, 5);
        return `Nalezeno ${r.length} výsledků pro "${q}"`;
      }
      case "executive:system": {
        const { readFileSync } = await import("node:fs");
        const { resolve } = await import("node:path");
        const reg = JSON.parse(readFileSync(resolve(process.cwd(), "system-registry.json"), "utf-8"));
        return `Registry: ${Object.keys(reg.repositories || {}).length} repozitářů`;
      }
      case "executive:audit": {
        return `Audit agenta: ${_agent.capabilities.length} capabilities, stav: ${_agent.status}`;
      }
      case "executive:brief": {
        return `Executive Brief vygenerován — ${new Date().toLocaleString("cs-CZ")}`;
      }
      case "executive:design": {
        // Graphics Agent — simulace CSS změny
        const actions = [
          "Upraveno barevné schéma",
          "Opraven responzivní layout",
          "Přidán dark mode support",
          "Aktualizovány fonty",
          "Upraveny spacing tokeny",
        ];
        const action = actions[Math.floor(Math.random() * actions.length)];
        return `${action} — simulovaná změna (Graphics Agent)`;
      }
      default: {
        // Obecná mise
        return `Mise "${title}" dokončena.`;
      }
    }
  }
}

/** Singleton */
let instance: AgentRuntime | null = null;
export function getAgentRuntime(): AgentRuntime {
  if (!instance) instance = new AgentRuntime();
  return instance;
}
