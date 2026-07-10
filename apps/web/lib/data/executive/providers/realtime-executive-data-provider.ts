import type { ExecutiveDataProvider } from "../provider-interface";
import type { ActivityItem, Mission, Approval, Risk, Blocker } from "../types";

export type StreamCallback = {
  onActivity: (event: ActivityItem) => void;
  onMissionUpdate: (mission: Mission) => void;
  onApprovalUpdate: (approval: Approval) => void;
  onRiskUpdate: (risk: Risk) => void;
  onError: (error: Error) => void;
};

export interface RealtimeExecutiveDataProvider extends ExecutiveDataProvider {
  readonly transport: "supabase-realtime" | "sse" | "websocket";

  connect(): Promise<void>;

  disconnect(): void;

  readonly isConnected: boolean;

  subscribe(callbacks: Partial<StreamCallback>): () => void;
}
