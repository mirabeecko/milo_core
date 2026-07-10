export type SpecStatus =
  | "draft"
  | "specified"
  | "planned"
  | "in_development"
  | "partially_operational"
  | "operational"
  | "degraded"
  | "blocked"
  | "deprecated"
  | "archived";

export type ImplementationStatus =
  | "not_started"
  | "partial"
  | "unverified"
  | "implemented"
  | "tested"
  | "deployed"
  | "operational"
  | "blocked"
  | "obsolete";

export type UseCaseStatus =
  | "draft"
  | "ready_for_planning"
  | "planned"
  | "in_development"
  | "in_review"
  | "implemented"
  | "tested"
  | "deployed"
  | "operational"
  | "blocked"
  | "obsolete";

export type DevTaskStatus =
  | "planned"
  | "ready"
  | "in_progress"
  | "waiting_for_agent"
  | "waiting_for_user"
  | "blocked"
  | "in_review"
  | "changes_requested"
  | "failed"
  | "completed"
  | "verified"
  | "obsolete"
  | "cancelled";

export type MissionType =
  | "implementation"
  | "bug_fix"
  | "audit"
  | "testing"
  | "refactor"
  | "migration"
  | "deployment"
  | "specification_alignment"
  | "capability_delivery";

export type ApprovalMode = "auto" | "always_ask" | "high_risk_only";

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type MaturityLevel = "concept" | "prototype" | "beta" | "production" | "deprecated";

export type ComponentType =
  | "frontend"
  | "backend"
  | "database"
  | "workflow"
  | "prompt"
  | "tool"
  | "integration"
  | "test"
  | "infrastructure"
  | "documentation"
  | "monitoring";
