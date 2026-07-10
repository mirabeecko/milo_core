export type { ExecutiveDataProvider } from "./provider-interface";

export { getExecutiveProvider, getExecutiveProviderAsync, getExecutiveProviderMode, setExecutiveProviderOverride, clearExecutiveProviderCache } from "./provider-factory";
export type { ProviderMode } from "./provider-factory";

export { useExecutiveDataProvider, ExecutiveProviderProvider } from "./executive-provider-context";

export {
  useExecutiveOverview,
  useExecutiveMissions,
  useExecutiveDepartments,
  useExecutiveApprovals,
  useExecutiveRisks,
  useExecutiveBlockers,
  useExecutiveDecisions,
  useExecutiveArtifacts,
  useExecutiveActivity,
} from "./use-executive-queries";

export {
  MockExecutiveDataProvider,
  mockExecutiveDataProvider,
  ApiExecutiveDataProvider,
  createApiExecutiveDataProvider,
} from "./providers";
export type { RealtimeExecutiveDataProvider, StreamCallback } from "./providers";

export type {
  ExecutiveOverview,
  Mission,
  Department,
  Artifact,
  Decision,
  Risk,
  Blocker,
  Approval,
  ActivityItem,
  DataSourceInfo,
} from "./types";
