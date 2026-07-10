import type {
  SpecStatus,
  ImplementationStatus,
  UseCaseStatus,
  DevTaskStatus,
  MissionType,
  ApprovalMode,
  RiskLevel,
  MaturityLevel,
  ComponentType,
} from "./spec-status.js";

// ─── Agent Spec ───────────────────────────────────────────────

export interface AgentSpec {
  id: string;
  slug: string;
  name: string;
  description: string;
  purpose: string;
  category: string;
  owner: string;
  status: SpecStatus;
  lifecycleStatus: string;
  priority: string;
  riskLevel: RiskLevel;
  activeVersionId: string | null;
  deployedVersionId: string | null;
  implementationStatus: ImplementationStatus;
  runtimeStatus: string;
  progressPercent: number;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
}

export interface AgentVersion {
  id: string;
  agentId: string;
  versionNumber: number;
  versionLabel: string | null;
  specification: Record<string, unknown>;
  changeSummary: string | null;
  changeReason: string | null;
  createdBy: string | null;
  createdAt: string;
  parentVersionId: string | null;
  status: string;
  approvedAt: string | null;
  deployedAt: string | null;
}

// ─── Use Case ─────────────────────────────────────────────────

export interface UseCase {
  id: string;
  agentId: string;
  slug: string;
  name: string;
  description: string;
  purpose: string;
  triggerDescription: string | null;
  category: string | null;
  priority: string;
  riskLevel: RiskLevel;
  status: UseCaseStatus;
  implementationStatus: ImplementationStatus;
  progressPercent: number;
  activeVersionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UseCaseVersion {
  id: string;
  useCaseId: string;
  versionNumber: number;
  versionLabel: string | null;
  purpose: string | null;
  triggerDescription: string | null;
  inputs: unknown[];
  preconditions: unknown[];
  workflowSteps: unknown[];
  decisionRules: unknown[];
  tools: unknown[];
  integrations: unknown[];
  outputs: unknown[];
  persistenceRules: string | null;
  approvalRules: Record<string, unknown>;
  securityRules: Record<string, unknown>;
  failureStates: unknown[];
  fallbackBehavior: string | null;
  testScenarios: unknown[];
  definitionOfDone: unknown[];
  observabilityRequirements: Record<string, unknown>;
  specification: Record<string, unknown>;
  changeSummary: string | null;
  createdBy: string | null;
  createdAt: string;
  status: string;
}

// ─── Capability ───────────────────────────────────────────────

export interface Capability {
  id: string;
  capabilityCode: string;
  name: string;
  description: string;
  inputs: unknown[];
  outputs: unknown[];
  apiInterface: string | null;
  dependencies: string[];
  status: string;
  maturityLevel: MaturityLevel;
  owner: string | null;
  activeVersion: string | null;
  progressPercent: number;
  createdAt: string;
  updatedAt: string;
}

// ─── Tool ─────────────────────────────────────────────────────

export interface Tool {
  id: string;
  name: string;
  type: string;
  provider: string | null;
  description: string | null;
  configurationSchema: unknown;
  secretReference: string | null;
  availabilityStatus: string;
  healthStatus: string;
  riskLevel: RiskLevel;
  createdAt: string;
}

export interface AgentTool {
  agentId: string;
  toolId: string;
  allowedActions: string[];
  approvalRequiredActions: string[];
  configuration: Record<string, unknown>;
  enabled: boolean;
}

// ─── Integration ──────────────────────────────────────────────

export interface Integration {
  id: string;
  slug: string;
  name: string;
  type: string;
  provider: string | null;
  description: string | null;
  configSchema: unknown;
  status: string;
  healthStatus: string;
  createdAt: string;
}

// ─── Development Task ─────────────────────────────────────────

export interface DevelopmentTask {
  id: string;
  agentId: string | null;
  useCaseId: string | null;
  capabilityId: string | null;
  changeRequestId: string | null;
  title: string;
  description: string | null;
  technicalContext: string | null;
  source: string;
  taskType: string;
  priority: string;
  riskLevel: RiskLevel;
  status: DevTaskStatus;
  assignedWorker: string | null;
  assignedModel: string | null;
  reviewer: string | null;
  acceptanceCriteria: unknown;
  definitionOfDone: unknown;
  estimatedComplexity: string | null;
  createdFromSpecDiff: boolean;
  blockedReason: string | null;
  startedAt: string | null;
  completedAt: string | null;
  verifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDependency {
  taskId: string;
  dependsOnTaskId: string;
  dependencyType: string;
}

// ─── Change Request ───────────────────────────────────────────

export interface ChangeRequest {
  id: string;
  entityType: string;
  entityId: string;
  fromVersionId: string | null;
  toVersionId: string | null;
  requestedBy: string | null;
  changeSummary: string | null;
  specificationDiff: unknown;
  impactAnalysis: unknown;
  status: string;
  createdAt: string;
  approvedAt: string | null;
  executedAt: string | null;
}

// ─── Mission ──────────────────────────────────────────────────

export interface Mission {
  id: string;
  title: string;
  description: string | null;
  missionType: MissionType;
  agentId: string | null;
  specificationVersionId: string | null;
  status: string;
  priority: string;
  worker: string | null;
  reviewer: string | null;
  approvalMode: ApprovalMode;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
}

// ─── Development Run ──────────────────────────────────────────

export interface DevelopmentRun {
  id: string;
  agentId: string | null;
  taskId: string | null;
  missionId: string | null;
  worker: string | null;
  model: string | null;
  promptSnapshot: string | null;
  specificationVersionId: string | null;
  repositoryCommitBefore: string | null;
  repositoryCommitAfter: string | null;
  status: string;
  logs: unknown[];
  summary: string | null;
  startedAt: string;
  completedAt: string | null;
  tokenUsage: number | null;
  cost: number | null;
}

// ─── Audit Run ────────────────────────────────────────────────

export interface AuditRun {
  id: string;
  developmentRunId: string | null;
  auditor: string | null;
  model: string | null;
  auditType: string;
  status: string;
  findings: unknown[];
  severity: string | null;
  verdict: string | null;
  requiredFixes: unknown;
  startedAt: string;
  completedAt: string | null;
}

// ─── Test Case ────────────────────────────────────────────────

export interface TestCase {
  id: string;
  agentId: string | null;
  useCaseId: string | null;
  name: string;
  description: string | null;
  testType: string;
  inputFixture: unknown;
  expectedOutput: unknown;
  approvalRequirement: boolean;
  status: string;
  createdAt: string;
}

export interface TestRun {
  id: string;
  testCaseId: string;
  implementationVersion: string | null;
  status: string;
  actualOutput: unknown;
  error: string | null;
  durationMs: number | null;
  runAt: string;
}

// ─── Approval ─────────────────────────────────────────────────

export interface Approval {
  id: string;
  resourceType: string;
  resourceId: string;
  action: string;
  requestedBy: string | null;
  requestedAt: string;
  approver: string | null;
  status: string;
  decisionReason: string | null;
  decidedAt: string | null;
}

// ─── Deployment ───────────────────────────────────────────────

export interface Deployment {
  id: string;
  agentId: string | null;
  versionId: string | null;
  environment: string;
  commitHash: string | null;
  status: string;
  deployedBy: string | null;
  deployedAt: string;
  rollbackReference: string | null;
}

// ─── Runtime Run ──────────────────────────────────────────────

export interface RuntimeRun {
  id: string;
  agentId: string | null;
  useCaseId: string | null;
  triggerType: string | null;
  input: unknown;
  output: unknown;
  status: string;
  error: string | null;
  startedAt: string;
  completedAt: string | null;
  toolsUsed: unknown;
  cost: number | null;
  approvalState: string | null;
}

// ─── Activity Log ─────────────────────────────────────────────

export interface ActivityLogEntry {
  id: string;
  actor: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValue: unknown;
  newValue: unknown;
  missionId: string | null;
  ipAddress: string | null;
  result: string | null;
  createdAt: string;
}

// ─── Implementation Component ─────────────────────────────────

export interface ImplementationComponent {
  id: string;
  agentId: string | null;
  useCaseId: string | null;
  capabilityId: string | null;
  componentType: ComponentType;
  name: string;
  repository: string | null;
  filePath: string | null;
  moduleName: string | null;
  apiEndpoint: string | null;
  implementationStatus: ImplementationStatus;
  testStatus: string;
  deployedStatus: string;
  lastVerifiedAt: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ─── Aggregated views ─────────────────────────────────────────

export interface AgentWithRelations extends AgentSpec {
  useCases?: UseCase[];
  versions?: AgentVersion[];
  capabilities?: Capability[];
  developmentTasks?: DevelopmentTask[];
  implementationComponents?: ImplementationComponent[];
  tools?: (Tool & { agentTool: AgentTool })[];
}

export interface UseCaseWithRelations extends UseCase {
  versions?: UseCaseVersion[];
  capabilities?: Capability[];
  developmentTasks?: DevelopmentTask[];
  testCases?: TestCase[];
}

// ─── Completion / Development ─────────────────────────────────

export interface AgentReadinessMatrix {
  specification: number;
  architecture: number;
  dataModel: number;
  backend: number;
  frontend: number;
  integrations: number;
  prompts: number;
  tests: number;
  security: number;
  deployment: number;
  monitoring: number;
  overall: number;
}

export interface ImpactAnalysis {
  changedSections: Array<{
    section: string;
    changeType: "added" | "removed" | "modified";
    oldValue: unknown;
    newValue: unknown;
  }>;
  affectedComponents: ImplementationComponent[];
  newDevelopmentTasks: string[];
  modifiedDevelopmentTasks: string[];
  obsoleteDevelopmentTasks: string[];
  risks: string[];
  regressionRisks: string[];
  recommendedOrder: string[];
  blockers: string[];
  requiredMigrations: string[];
  requiredTests: string[];
}

export interface SpecDiff {
  changedSections: Array<{
    section: string;
    changeType: "added" | "removed" | "modified";
    oldValue: unknown;
    newValue: unknown;
  }>;
}

// ─── Developer Prompt ─────────────────────────────────────────

export interface DeveloperPromptContext {
  agentName: string;
  specificationVersion: string;
  deployedVersion: string | null;
  completeSpecification: Record<string, unknown>;
  latestChanges: SpecDiff | null;
  impactAnalysis: ImpactAnalysis | null;
  implementationComponents: ImplementationComponent[];
  selectedTasks: DevelopmentTask[];
  taskDependencies: TaskDependency[];
  repositoryInfo: Record<string, unknown>;
  relevantFiles: string[];
  technicalConstraints: string[];
  securityRules: string[];
  approvalRules: Record<string, unknown>;
  testScenarios: unknown[];
  definitionOfDone: unknown[];
}
