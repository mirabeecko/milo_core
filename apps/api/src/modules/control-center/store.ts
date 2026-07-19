import type {
  AgentSpec,
  AgentSpecVersion,
  UseCase,
  UseCaseVersion,
  AgentCapability,
  Tool,
  AgentTool,
  Integration,
  DevTask,
  TaskDependency,
  ChangeRequest,
  DevMission,
  DevelopmentRun,
  AuditRun,
  TestCase,
  TestRun,
  Approval,
  Deployment,
  RuntimeRun,
  ActivityLogEntry,
  ImplComponent,
  AgentWithRelations,
  UseCaseWithRelations,
  AgentReadinessMatrix,
  ImpactAnalysis,
  SpecDiff,
} from "@milo/shared";

let counter = 0;
function uid(prefix: string): string {
  counter++;
  return `${prefix}-${counter}-${Date.now().toString(36)}`;
}

export interface ControlCenterStore {
  // Agents
  getAgents(): AgentSpec[];
  getAgent(id: string): AgentSpec | null;
  getAgentWithRelations(id: string): AgentWithRelations | null;
  upsertAgent(spec: AgentSpec): AgentSpec;

  // Agent Versions
  getAgentVersions(agentId: string): AgentSpecVersion[];
  getAgentVersion(id: string): AgentSpecVersion | null;
  createAgentVersion(version: Omit<AgentSpecVersion, "id" | "createdAt">): AgentSpecVersion;

  // Use Cases
  getUseCases(agentId?: string): UseCase[];
  getUseCase(id: string): UseCase | null;
  getUseCaseWithRelations(id: string): UseCaseWithRelations | null;
  upsertUseCase(uc: UseCase): UseCase;

  // Use Case Versions
  getUseCaseVersions(useCaseId: string): UseCaseVersion[];
  getUseCaseVersion(id: string): UseCaseVersion | null;
  createUseCaseVersion(version: Omit<UseCaseVersion, "id" | "createdAt">): UseCaseVersion;

  // Capabilities
  getCapabilities(): AgentCapability[];
  getCapability(id: string): AgentCapability | null;
  upsertCapability(c: AgentCapability): AgentCapability;
  getAgentCapabilities(agentId: string): AgentCapability[];

  // Tools
  getTools(): Tool[];
  getTool(id: string): Tool | null;
  upsertTool(t: Tool): Tool;
  getAgentTools(agentId: string): (Tool & { agentTool: AgentTool })[];

  // Integrations
  getIntegrations(): Integration[];
  getIntegration(id: string): Integration | null;
  upsertIntegration(i: Integration): Integration;

  // Development Tasks
  getDevTasks(filters?: { agentId?: string; useCaseId?: string; status?: string }): DevTask[];
  getDevTask(id: string): DevTask | null;
  createDevTask(task: Omit<DevTask, "id" | "createdAt" | "updatedAt">): DevTask;
  updateDevTask(id: string, partial: Partial<DevTask>): DevTask;

  // Implementation Components
  getImplComponents(agentId?: string, useCaseId?: string): ImplComponent[];
  upsertImplComponent(c: Omit<ImplComponent, "id" | "createdAt">): ImplComponent;

  // Missions
  getMissions(filters?: { agentId?: string; status?: string }): DevMission[];
  getMission(id: string): DevMission | null;
  createMission(m: Omit<DevMission, "id" | "createdAt">): DevMission;
  updateMission(id: string, partial: Partial<DevMission>): DevMission;

  // Activity Log
  getActivityLog(filters?: { entityType?: string; entityId?: string; limit?: number }): ActivityLogEntry[];
  logActivity(entry: Omit<ActivityLogEntry, "id" | "createdAt">): ActivityLogEntry;

  // Change Requests
  createChangeRequest(cr: Omit<ChangeRequest, "id" | "createdAt">): ChangeRequest;

  // Computed
  calculateAgentReadiness(agentId: string): AgentReadinessMatrix;
  computeSpecDiff(oldSpec: Record<string, unknown>, newSpec: Record<string, unknown>): SpecDiff;
  computeImpactAnalysis(agentId: string, diff: SpecDiff): ImpactAnalysis;

  // Seed
  seed(data: ControlCenterSeedData): void;
}

export interface ControlCenterSeedData {
  agents: AgentSpec[];
  agentVersions: Omit<AgentSpecVersion, "id" | "createdAt">[];
  useCases: UseCase[];
  useCaseVersions: Omit<UseCaseVersion, "id" | "createdAt">[];
  capabilities: AgentCapability[];
  agentCapabilities: { agentId: string; capabilityId: string }[];
  tools: Tool[];
  agentTools: AgentTool[];
  integrations: Integration[];
  developmentTasks?: Omit<DevTask, "id" | "createdAt" | "updatedAt">[];
  implementationComponents?: Omit<ImplComponent, "id" | "createdAt">[];
}

export function createControlCenterStore(): ControlCenterStore {
  const agents = new Map<string, AgentSpec>();
  const agentVersions = new Map<string, AgentSpecVersion>();
  const useCases = new Map<string, UseCase>();
  const useCaseVersions = new Map<string, UseCaseVersion>();
  const capabilities = new Map<string, AgentCapability>();
  const agentCapabilities = new Map<string, Set<string>>();
  const tools = new Map<string, Tool>();
  const agentTools = new Map<string, Map<string, AgentTool>>();
  const integrations = new Map<string, Integration>();
  const devTasks = new Map<string, DevTask>();
  const implComponents = new Map<string, ImplComponent>();
  const missions = new Map<string, DevMission>();
  const activityLog: ActivityLogEntry[] = [];

  const store: ControlCenterStore = {
    getAgents: () =>
      Array.from(agents.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),

    getAgent: (id: string) => agents.get(id) ?? null,

    updateAgentTags(id: string, tags: string[]): AgentSpec | null {
      const agent = agents.get(id);
      if (!agent) return null;
      agent.tags = tags;
      agent.updatedAt = new Date().toISOString();
      agents.set(id, agent);
      return agent;
    },

    getAgentWithRelations(id: string): AgentWithRelations | null {
      const agent = agents.get(id);
      if (!agent) return null;
      return {
        ...agent,
        useCases: store.getUseCases(id),
        versions: store.getAgentVersions(id),
        capabilities: store.getAgentCapabilities(id),
        developmentTasks: store.getDevTasks({ agentId: id }),
        implementationComponents: store.getImplComponents(id),
        tools: store.getAgentTools(id),
      };
    },

    upsertAgent(spec: AgentSpec): AgentSpec {
      const existing = agents.get(spec.id);
      const now = new Date().toISOString();
      const updated: AgentSpec = {
        ...spec,
        updatedAt: now,
        createdAt: existing?.createdAt ?? spec.createdAt ?? now,
      };
      agents.set(spec.id, updated);
      return updated;
    },

    // Agent Versions
    getAgentVersions(agentId: string): AgentSpecVersion[] {
      return Array.from(agentVersions.values())
        .filter((v) => v.agentId === agentId)
        .sort((a, b) => b.versionNumber - a.versionNumber);
    },

    getAgentVersion(id: string): AgentSpecVersion | null {
      return agentVersions.get(id) ?? null;
    },

    createAgentVersion(version: Omit<AgentSpecVersion, "id" | "createdAt">): AgentSpecVersion {
      const id = uid("av");
      const now = new Date().toISOString();
      const full: AgentSpecVersion = { ...version, id, createdAt: now };
      agentVersions.set(id, full);
      return full;
    },

    // Use Cases
    getUseCases(agentId?: string): UseCase[] {
      let items = Array.from(useCases.values());
      if (agentId) items = items.filter((uc) => uc.agentId === agentId);
      return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    getUseCase(id: string): UseCase | null {
      return useCases.get(id) ?? null;
    },

    getUseCaseWithRelations(id: string): UseCaseWithRelations | null {
      const uc = useCases.get(id);
      if (!uc) return null;
      return {
        ...uc,
        versions: store.getUseCaseVersions(id),
        capabilities: [],
        developmentTasks: store.getDevTasks({ useCaseId: id }),
        testCases: [],
      };
    },

    upsertUseCase(uc: UseCase): UseCase {
      const existing = useCases.get(uc.id);
      const now = new Date().toISOString();
      const updated: UseCase = { ...uc, updatedAt: now, createdAt: existing?.createdAt ?? uc.createdAt ?? now };
      useCases.set(uc.id, updated);
      return updated;
    },

    // Use Case Versions
    getUseCaseVersions(useCaseId: string): UseCaseVersion[] {
      return Array.from(useCaseVersions.values())
        .filter((v) => v.useCaseId === useCaseId)
        .sort((a, b) => b.versionNumber - a.versionNumber);
    },

    getUseCaseVersion(id: string): UseCaseVersion | null {
      return useCaseVersions.get(id) ?? null;
    },

    createUseCaseVersion(version: Omit<UseCaseVersion, "id" | "createdAt">): UseCaseVersion {
      const id = uid("ucv");
      const now = new Date().toISOString();
      const full: UseCaseVersion = { ...version, id, createdAt: now };
      useCaseVersions.set(id, full);
      return full;
    },

    // Capabilities
    getCapabilities: () =>
      Array.from(capabilities.values()).sort((a, b) => a.capabilityCode.localeCompare(b.capabilityCode)),

    getCapability(id: string): AgentCapability | null {
      return capabilities.get(id) ?? null;
    },

    upsertCapability(c: AgentCapability): AgentCapability {
      const now = new Date().toISOString();
      const updated: AgentCapability = { ...c, updatedAt: now };
      capabilities.set(c.id, updated);
      return updated;
    },

    getAgentCapabilities(agentId: string): AgentCapability[] {
      const capIds = agentCapabilities.get(agentId);
      if (!capIds) return [];
      return Array.from(capIds)
        .map((id) => capabilities.get(id))
        .filter(Boolean) as AgentCapability[];
    },

    // Tools
    getTools: () => Array.from(tools.values()),

    getTool(id: string): Tool | null {
      return tools.get(id) ?? null;
    },

    upsertTool(t: Tool): Tool {
      tools.set(t.id, t);
      return t;
    },

    getAgentTools(agentId: string): (Tool & { agentTool: AgentTool })[] {
      const agentToolMap = agentTools.get(agentId);
      if (!agentToolMap) return [];
      return Array.from(agentToolMap.entries())
        .map(([toolId, at]) => {
          const tool = tools.get(toolId);
          if (!tool) return null;
          return { ...tool, agentTool: at };
        })
        .filter(Boolean) as (Tool & { agentTool: AgentTool })[];
    },

    // Integrations
    getIntegrations: () => Array.from(integrations.values()),

    getIntegration(id: string): Integration | null {
      return integrations.get(id) ?? null;
    },

    upsertIntegration(i: Integration): Integration {
      integrations.set(i.id, i);
      return i;
    },

    // Development Tasks
    getDevTasks(
      filters?: { agentId?: string; useCaseId?: string; status?: string },
    ): DevTask[] {
      let items = Array.from(devTasks.values());
      if (filters?.agentId) items = items.filter((t) => t.agentId === filters.agentId);
      if (filters?.useCaseId) items = items.filter((t) => t.useCaseId === filters.useCaseId);
      if (filters?.status) items = items.filter((t) => t.status === filters.status);
      return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    getDevTask(id: string): DevTask | null {
      return devTasks.get(id) ?? null;
    },

    createDevTask(task: Omit<DevTask, "id" | "createdAt" | "updatedAt">): DevTask {
      const id = uid("dt");
      const now = new Date().toISOString();
      const full: DevTask = { ...task, id, createdAt: now, updatedAt: now };
      devTasks.set(id, full);
      return full;
    },

    updateDevTask(id: string, partial: Partial<DevTask>): DevTask {
      const existing = devTasks.get(id);
      if (!existing) throw new Error(`DevTask ${id} not found`);
      const updated: DevTask = { ...existing, ...partial, id: existing.id, updatedAt: new Date().toISOString() };
      devTasks.set(id, updated);
      return updated;
    },

    // Implementation Components
    getImplComponents(agentId?: string, useCaseId?: string): ImplComponent[] {
      let items = Array.from(implComponents.values());
      if (agentId) items = items.filter((c) => c.agentId === agentId);
      if (useCaseId) items = items.filter((c) => c.useCaseId === useCaseId);
      return items;
    },

    upsertImplComponent(c: Omit<ImplComponent, "id" | "createdAt">): ImplComponent {
      const id = uid("ic");
      const now = new Date().toISOString();
      const full: ImplComponent = { ...c, id, createdAt: now };
      implComponents.set(id, full);
      return full;
    },

    // Missions
    getMissions(filters?: { agentId?: string; status?: string }): DevMission[] {
      let items = Array.from(missions.values());
      if (filters?.agentId) items = items.filter((m) => m.agentId === filters.agentId);
      if (filters?.status) items = items.filter((m) => m.status === filters.status);
      return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },

    getMission(id: string): DevMission | null {
      return missions.get(id) ?? null;
    },

    createMission(m: Omit<DevMission, "id" | "createdAt">): DevMission {
      const id = uid("m");
      const now = new Date().toISOString();
      const full: DevMission = { ...m, id, createdAt: now };
      missions.set(id, full);
      return full;
    },

    updateMission(id: string, partial: Partial<DevMission>): DevMission {
      const existing = missions.get(id);
      if (!existing) throw new Error(`DevMission ${id} not found`);
      const updated: DevMission = { ...existing, ...partial, id: existing.id };
      missions.set(id, updated);
      return updated;
    },

    // Activity Log
    getActivityLog(
      filters?: { entityType?: string; entityId?: string; limit?: number },
    ): ActivityLogEntry[] {
      let items = [...activityLog];
      if (filters?.entityType) items = items.filter((e) => e.entityType === filters.entityType);
      if (filters?.entityId) items = items.filter((e) => e.entityId === filters.entityId);
      items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      if (filters?.limit) items = items.slice(0, filters.limit);
      return items;
    },

    logActivity(entry: Omit<ActivityLogEntry, "id" | "createdAt">): ActivityLogEntry {
      const id = uid("al");
      const now = new Date().toISOString();
      const full: ActivityLogEntry = { ...entry, id, createdAt: now };
      activityLog.push(full);
      return full;
    },

    // Change Requests
    createChangeRequest(cr: Omit<ChangeRequest, "id" | "createdAt">): ChangeRequest {
      const id = uid("cr");
      const now = new Date().toISOString();
      const full: ChangeRequest = { ...cr, id, createdAt: now };
      return full;
    },

    // Computed
    calculateAgentReadiness(agentId: string): AgentReadinessMatrix {
      const tasks = store.getDevTasks({ agentId });
      const comps = store.getImplComponents(agentId);
      const ucList = store.getUseCases(agentId);
      const capList = store.getAgentCapabilities(agentId);

      const completedTasks = tasks.filter((t) => t.status === "completed" || t.status === "verified").length;
      const totalTasks = tasks.length || 1;

      const prodComps = comps.filter((c) => c.implementationStatus === "deployed" || c.implementationStatus === "operational").length;
      const totalComps = comps.length || 1;

      const ucReady = ucList.filter((uc) => uc.implementationStatus === "deployed" || uc.implementationStatus === "operational").length;
      const totalUc = ucList.length || 1;

      const capReady = capList.filter((c) => c.maturityLevel === "production").length;
      const totalCap = capList.length || 1;

      const overall = Math.min(
        100,
        Math.round(
          (completedTasks / totalTasks) * 30 +
          (prodComps / totalComps) * 30 +
          (ucReady / totalUc) * 25 +
          (capReady / totalCap) * 15,
        ),
      );

      return {
        specification: ucReady > 0 ? Math.round((ucReady / totalUc) * 100) : totalUc === 0 ? 100 : 0,
        architecture: 100,
        dataModel: 100,
        backend: Math.round((prodComps / totalComps) * 100),
        frontend: Math.round((prodComps / totalComps) * 100),
        integrations: capReady > 0 ? Math.round((capReady / totalCap) * 100) : totalCap === 0 ? 100 : 0,
        prompts: Math.round((completedTasks / totalTasks) * 100),
        tests: Math.round((completedTasks / totalTasks) * 100),
        security: 50,
        deployment: Math.round((prodComps / totalComps) * 100),
        monitoring: 50,
        overall,
      };
    },

    computeSpecDiff(oldSpec: Record<string, unknown>, newSpec: Record<string, unknown>): SpecDiff {
      const changes: SpecDiff["changedSections"] = [];
      for (const key of Object.keys(newSpec)) {
        if (!(key in oldSpec)) {
          changes.push({ section: key, changeType: "added", oldValue: null, newValue: newSpec[key] });
        } else if (JSON.stringify(oldSpec[key]) !== JSON.stringify(newSpec[key])) {
          changes.push({ section: key, changeType: "modified", oldValue: oldSpec[key], newValue: newSpec[key] });
        }
      }
      for (const key of Object.keys(oldSpec)) {
        if (!(key in newSpec)) {
          changes.push({ section: key, changeType: "removed", oldValue: oldSpec[key], newValue: null });
        }
      }
      return { changedSections: changes };
    },

    computeImpactAnalysis(agentId: string, diff: SpecDiff): ImpactAnalysis {
      const comps = store.getImplComponents(agentId);
      const tasks = store.getDevTasks({ agentId });
      return {
        changedSections: diff.changedSections,
        affectedComponents: comps,
        newDevelopmentTasks: [],
        modifiedDevelopmentTasks: tasks.map((t) => t.id),
        obsoleteDevelopmentTasks: [],
        risks: [`Změna ovlivňuje ${comps.length} komponent a ${tasks.length} vývojových úkolů`],
        regressionRisks: [],
        recommendedOrder: [],
        blockers: [],
        requiredMigrations: [],
        requiredTests: [],
      };
    },

    // Seed
    seed(data: ControlCenterSeedData): void {
      for (const a of data.agents) store.upsertAgent(a);
      for (const v of data.agentVersions) store.createAgentVersion(v);
      for (const uc of data.useCases) store.upsertUseCase(uc);
      for (const v of data.useCaseVersions) store.createUseCaseVersion(v);
      for (const c of data.capabilities) store.upsertCapability(c);
      for (const ac of data.agentCapabilities) {
        if (!agentCapabilities.has(ac.agentId)) agentCapabilities.set(ac.agentId, new Set());
        agentCapabilities.get(ac.agentId)!.add(ac.capabilityId);
      }
      for (const t of data.tools) store.upsertTool(t);
      for (const at of data.agentTools) {
        if (!agentTools.has(at.agentId)) agentTools.set(at.agentId, new Map());
        agentTools.get(at.agentId)!.set(at.toolId, at);
      }
      for (const i of data.integrations) store.upsertIntegration(i);
      if (data.developmentTasks) {
        for (const dt of data.developmentTasks) store.createDevTask(dt);
      }
      if (data.implementationComponents) {
        for (const ic of data.implementationComponents) store.upsertImplComponent(ic);
      }
    },
  };

  return store;
}

export const controlCenterStore = createControlCenterStore();
