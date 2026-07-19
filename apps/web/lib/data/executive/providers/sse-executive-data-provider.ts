"use client";

import type { ExecutiveDataProvider } from "../provider-interface";
import type {
  RealtimeExecutiveDataProvider,
  StreamCallback,
} from "./realtime-executive-data-provider";
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
} from "../types";
import { ApiExecutiveDataProvider } from "./api-executive-data-provider";

interface SseEvent {
  type: string;
  agentId?: string;
  missionId?: string;
  timestamp?: string;
  payload: {
    title?: string;
    description?: string;
    status?: string;
    department?: string;
    priority?: string;
    ownerId?: string;
    ownerName?: string;
    summary?: string;
    error?: string;
    [key: string]: unknown;
  };
}

const INITIAL_RECONNECT_DELAY = 1000;
const MAX_RECONNECT_DELAY = 30_000;

export class SseExecutiveDataProvider implements RealtimeExecutiveDataProvider {
  readonly transport = "sse" as const;

  private apiProvider: ApiExecutiveDataProvider;
  private eventSource: EventSource | null = null;
  private _isConnected = false;
  private callbacks: Partial<StreamCallback> = {};
  private reconnectDelay = INITIAL_RECONNECT_DELAY;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private activity: ActivityItem[] = [];
  private missions: Mission[] = [];
  private approvals: Approval[] = [];

  constructor() {
    this.apiProvider = new ApiExecutiveDataProvider();
  }

  get isConnected(): boolean {
    return this._isConnected;
  }

  async connect(): Promise<void> {
    if (this.eventSource) return;

    try {
      const token = typeof localStorage !== "undefined"
        ? localStorage.getItem("milo:accessToken") ?? "demo-token"
        : "demo-token";

      this.eventSource = new EventSource(
        `/api/events/stream?token=${encodeURIComponent(token)}`,
      );

      this.eventSource.onopen = () => {
        this._isConnected = true;
        this.reconnectDelay = INITIAL_RECONNECT_DELAY;
      };

      this.eventSource.onmessage = (evt: MessageEvent) => {
        try {
          const event: SseEvent = JSON.parse(evt.data as string);
          if (event.type === "connection") return;
          this.handleEvent(event);
        } catch { /* ignore malformed events */ }
      };

      this.eventSource.onerror = () => {
        this._isConnected = false;
        this.eventSource?.close();
        this.eventSource = null;
        this.scheduleReconnect();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  disconnect(): void {
    this.eventSource?.close();
    this.eventSource = null;
    this._isConnected = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectDelay = INITIAL_RECONNECT_DELAY;
  }

  subscribe(callbacks: Partial<StreamCallback>): () => void {
    this.callbacks = callbacks;
    return () => {
      this.callbacks = {};
    };
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY);
    }, this.reconnectDelay);
  }

  private handleEvent(event: SseEvent): void {
    const ts = event.timestamp ?? new Date().toISOString();

    const activityItem: ActivityItem = {
      id: `sse-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: this.mapEventType(event.type),
      title: event.payload?.title ?? event.type.replace(/_/g, " "),
      description: event.payload?.summary ?? event.payload?.description ?? "",
      timestamp: ts,
      actor: event.agentId ?? event.payload?.ownerId ?? event.payload?.ownerName ?? "System",
      department: event.payload?.department,
    };

    this.activity.unshift(activityItem);
    if (this.activity.length > 50) this.activity.pop();

    this.callbacks.onActivity?.(activityItem);
    this.callbacks.onMissionUpdate?.(activityItem as unknown as Mission);
    this.callbacks.onError?.(
      new Error(event.payload?.error ?? event.payload?.summary ?? "Unknown event"),
    );
  }

  private mapEventType(type: string): ActivityItem["type"] {
    if (type.includes("mission")) return "mission";
    if (type.includes("agent")) return "agent";
    if (type.includes("task")) return "system";
    if (type.includes("artifact")) return "document";
    if (type.includes("decision")) return "decision";
    return "system";
  }

  async getOverview(): Promise<ExecutiveOverview> {
    return this.apiProvider.getOverview();
  }

  async getMissions(): Promise<Mission[]> {
    try {
      const apiMissions = await this.apiProvider.getMissions();
      if (apiMissions.length > 0) {
        this.missions = apiMissions;
        return apiMissions;
      }
    } catch { /* fall through to cached */ }
    return this.missions;
  }

  async getDepartments(): Promise<Department[]> {
    return this.apiProvider.getDepartments();
  }

  async getArtifacts(): Promise<Artifact[]> {
    return this.apiProvider.getArtifacts();
  }

  async getDecisions(): Promise<Decision[]> {
    return this.apiProvider.getDecisions();
  }

  async getRisks(): Promise<Risk[]> {
    return this.apiProvider.getRisks();
  }

  async getBlockers(): Promise<Blocker[]> {
    return this.apiProvider.getBlockers();
  }

  async getApprovals(): Promise<Approval[]> {
    try {
      const apiApprovals = await this.apiProvider.getApprovals();
      if (apiApprovals.length > 0) {
        this.approvals = apiApprovals;
        return apiApprovals;
      }
    } catch { /* fall through to cached */ }
    return this.approvals;
  }

  async getActivity(): Promise<ActivityItem[]> {
    try {
      const apiActivity = await this.apiProvider.getActivity();
      return [...this.activity, ...apiActivity].slice(0, 30);
    } catch {
      return this.activity;
    }
  }
}
