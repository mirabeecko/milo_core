import { apiClient, useMockData } from "./client";
import type {
  ActivityLogItem,
  DecisionItem,
  PriorityItem,
  SystemRecommendation,
} from "@/lib/types";
import {
  activityLog,
  briefingSnapshot,
  decisions,
  recommendation,
  todayPriorities,
} from "@/lib/mocks";

export interface BriefingSnapshot {
  unreadEmails: number;
  upcomingMeetings: number;
  newDocuments: number;
  openTasks: number;
  activeAgents: number;
}

export interface HomeData {
  priorities: PriorityItem[];
  snapshot: BriefingSnapshot;
  decisions: DecisionItem[];
  activityLog: ActivityLogItem[];
  recommendation: SystemRecommendation | null;
}

export async function getHomeData(): Promise<HomeData> {
  if (useMockData) {
    return {
      priorities: todayPriorities,
      snapshot: briefingSnapshot,
      decisions,
      activityLog,
      recommendation,
    };
  }

  return apiClient<HomeData>("/home");
}
