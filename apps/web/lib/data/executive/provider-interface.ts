import type {
  ExecutiveOverview,
  Mission,
  Department,
  Artifact,
  Decision,
  Risk,
  Blocker,
  Approval,
  ActivityItem,
} from "./types";

export interface ExecutiveDataProvider {
  getOverview(): Promise<ExecutiveOverview>;
  getMissions(): Promise<Mission[]>;
  getDepartments(): Promise<Department[]>;
  getArtifacts(): Promise<Artifact[]>;
  getDecisions(): Promise<Decision[]>;
  getRisks(): Promise<Risk[]>;
  getBlockers(): Promise<Blocker[]>;
  getApprovals(): Promise<Approval[]>;
  getActivity(): Promise<ActivityItem[]>;
}
