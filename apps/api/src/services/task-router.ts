/**
 * TaskRouter — dynamicky mapuje tasky na agenty podle:
 * 1. Kategorie tasku → kategorie agenta (primární match)
 * 2. Agent capabilities (sekundární match)
 * 3. Priorita agenta + runtime status + vytížení
 * 4. Scoring algoritmus s váhami
 */
import type { AgentSpec, AgentCapability } from "@milo/shared";

export interface TaskRoutingInput {
  title: string;
  description?: string;
  type?: string;
  priority: string;
  category?: string;
  requiredCapabilities?: string[];
  deadline?: string;
}

export interface ScoredAgent {
  agent: AgentSpec;
  score: number;
  matchReasons: string[];
}

interface AgentEnrichment {
  agent: AgentSpec;
  capabilities: AgentCapability[];
  activeTaskCount: number;
}

// Mapování kategorií task → agent
const CATEGORY_MAP: Record<string, string[]> = {
  engineering: ["engineering"],
  development: ["engineering"],
  code: ["engineering"],
  bug: ["engineering"],
  legal: ["legal"],
  law: ["legal"],
  smlouva: ["legal"],
  contract: ["legal"],
  finance: ["finance"],
  money: ["finance"],
  platba: ["finance"],
  invoice: ["finance"],
  communication: ["communication"],
  email: ["communication"],
  mail: ["communication"],
  organization: ["organization"],
  project: ["project"],
  infrastructure: ["infrastructure"],
  server: ["infrastructure"],
  hosting: ["infrastructure"],
  productivity: ["productivity"],
  calendar: ["productivity"],
  schedule: ["productivity"],
  reminder: ["productivity"],
  knowledge: ["knowledge"],
  research: ["knowledge"],
  search: ["knowledge"],
  analysis: ["knowledge"],
  observer: ["observer"],
  monitoring: ["observer"],
  watch: ["observer"],
  business: ["business"],
  customer: ["business"],
  quality: ["quality"],
  test: ["quality"],
  data: ["data"],
  coordinator: ["coordinator"],
};

// Váhy pro scoring
const WEIGHTS = {
  categoryMatch: 40,
  capabilityMatch: 30,
  agentPriority: 15,
  agentReadiness: 10,
  workloadPenalty: 5,
};

export class TaskRouter {
  private agents: AgentEnrichment[] = [];

  /**
   * Aktualizuje interní seznam agentů z control-center store.
   */
  updateAgents(
    agentSpecs: AgentSpec[],
    getCapabilities: (agentId: string) => AgentCapability[],
    getActiveTaskCount: (agentId: string) => number,
  ): void {
    this.agents = agentSpecs.map((agent) => ({
      agent,
      capabilities: getCapabilities(agent.id),
      activeTaskCount: getActiveTaskCount(agent.id),
    }));
  }

  /**
   * Najde nejvhodnějšího agenta pro daný task.
   * Vrací seřazený seznam podle skóre.
   */
  route(task: TaskRoutingInput): ScoredAgent[] {
    const scored = this.agents
      .map((enriched) => this.scoreAgent(enriched, task))
      .filter((s): s is ScoredAgent => s !== null)
      .sort((a, b) => b.score - a.score);

    return scored;
  }

  /**
   * Vrátí nejlepšího agenta nebo null.
   */
  findBest(task: TaskRoutingInput): ScoredAgent | null {
    const results = this.route(task);
    return results.length > 0 ? results[0] : null;
  }

  private scoreAgent(
    enriched: AgentEnrichment,
    task: TaskRoutingInput,
  ): ScoredAgent | null {
    const { agent, capabilities, activeTaskCount } = enriched;
    const reasons: string[] = [];
    let score = 0;

    // 1. Kategorie (40 %)
    const categoryScore = this.scoreCategory(agent, task, reasons);
    score += categoryScore;
    if (categoryScore === 0) return null; // Hard filter — agent must match category

    // 2. Capabilities (30 %)
    const capScore = this.scoreCapabilities(agent, capabilities, task, reasons);
    score += capScore;

    // 3. Priorita agenta (15 %)
    const priorityScore = this.scorePriority(agent);
    score += priorityScore;
    if (priorityScore > 0) reasons.push(`priorita: ${agent.priority}`);

    // 4. Readiness (10 %)
    const readinessScore = this.scoreReadiness(agent);
    score += readinessScore;

    // 5. Workload penalta (-5 % za každý aktivní task)
    const workloadPenalty = Math.min(activeTaskCount * WEIGHTS.workloadPenalty, 20);
    score -= workloadPenalty;
    if (activeTaskCount > 0) {
      reasons.push(`vytížení: ${activeTaskCount} aktivních tasků (-${workloadPenalty})`);
    }

    return {
      agent,
      score: Math.max(0, Math.round(score)),
      matchReasons: reasons,
    };
  }

  private scoreCategory(
    agent: AgentSpec,
    task: TaskRoutingInput,
    reasons: string[],
  ): number {
    const taskCategory = this.inferTaskCategory(task);
    const matchingCategories = CATEGORY_MAP[taskCategory] ?? [];

    if (matchingCategories.includes(agent.category)) {
      reasons.push(`kategorie: ${agent.category} ↔ ${taskCategory}`);
      return WEIGHTS.categoryMatch;
    }

    // Volnější match — agent kategorie obsahuje část taskové kategorie
    for (const mc of matchingCategories) {
      if (agent.category.includes(mc) || mc.includes(agent.category)) {
        reasons.push(`částečná shoda kategorie: ${agent.category} ~ ${taskCategory}`);
        return WEIGHTS.categoryMatch * 0.5;
      }
    }

    // Coordinator může dělat cokoliv
    if (agent.category === "coordinator") {
      reasons.push(`koordinátor univerzální`);
      return WEIGHTS.categoryMatch * 0.3;
    }

    return 0;
  }

  private scoreCapabilities(
    agent: AgentSpec,
    capabilities: AgentCapability[],
    task: TaskRoutingInput,
    reasons: string[],
  ): number {
    if (!task.requiredCapabilities || task.requiredCapabilities.length === 0) {
      return WEIGHTS.capabilityMatch * 0.5; // Žádné požadavky → poloviční skóre
    }

    const capCodes = new Set(capabilities.map((c) => c.capabilityCode));
    const required = task.requiredCapabilities;

    let matched = 0;
    for (const req of required) {
      if (capCodes.has(req)) {
        matched++;
      }
    }

    if (matched === 0) return 0;

    const ratio = matched / required.length;
    const score = WEIGHTS.capabilityMatch * ratio;
    if (matched > 0) {
      reasons.push(
        `capabilities: ${matched}/${required.length} (${capabilities
          .filter((c) => required.includes(c.capabilityCode))
          .map((c) => c.name)
          .join(", ")})`,
      );
    }
    return score;
  }

  private scorePriority(agent: AgentSpec): number {
    const map: Record<string, number> = {
      critical: 1.0,
      high: 0.75,
      normal: 0.5,
      low: 0.25,
    };
    return (map[agent.priority] ?? 0.5) * WEIGHTS.agentPriority;
  }

  private scoreReadiness(agent: AgentSpec): number {
    // Agent je simulovaný/aktivní → vyšší skóre
    if (agent.runtimeStatus === "simulated" || agent.runtimeStatus === "running") {
      return WEIGHTS.agentReadiness;
    }
    if (agent.runtimeStatus === "offline" || agent.runtimeStatus === "error") {
      return 0;
    }
    return WEIGHTS.agentReadiness * 0.5;
  }

  /**
   * Inferuje kategorii z názvu, popisu a typu tasku.
   */
  private inferTaskCategory(task: TaskRoutingInput): string {
    const text = [
      task.title,
      task.description,
      task.type,
      task.category,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    // Klíčová slova → kategorie
    const keywordMap: Record<string, string> = {
      bug: "engineering",
      chyba: "engineering",
      kód: "engineering",
      code: "engineering",
      implement: "engineering",
      develop: "engineering",
      refactor: "engineering",
      právní: "legal",
      legal: "legal",
      smlouva: "legal",
      contract: "legal",
      zákon: "legal",
      usnesení: "legal",
      finance: "finance",
      faktura: "finance",
      platba: "finance",
      účetnictví: "finance",
      rozpočet: "finance",
      email: "communication",
      komunikace: "communication",
      zpráva: "communication",
      kalendář: "productivity",
      schůzka: "productivity",
      meeting: "productivity",
      připomenutí: "productivity",
      připomeň: "productivity",
      server: "infrastructure",
      infrastruktura: "infrastructure",
      docker: "infrastructure",
      deployment: "infrastructure",
      výzkum: "knowledge",
      rešerše: "knowledge",
      analyzuj: "knowledge",
      search: "knowledge",
      monitor: "observer",
      sleduj: "observer",
      watch: "observer",
      nápad: "observer",
      idea: "observer",
      organizace: "organization",
      člen: "organization",
      projekt: "project",
      dotace: "project",
    };

    for (const [keyword, category] of Object.entries(keywordMap)) {
      if (text.includes(keyword)) return category;
    }

    // Default podle typu
    if (task.category) return task.category;
    if (task.type) return task.type;

    return "knowledge"; // Fallback
  }
}

// Singleton
let instance: TaskRouter | null = null;
export function getTaskRouter(): TaskRouter {
  if (!instance) instance = new TaskRouter();
  return instance;
}
