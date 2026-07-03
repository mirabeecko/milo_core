import { apiClient, useMockData } from "./client";
import type {
  ActivityLogItem,
  DecisionItem,
  PriorityItem,
  SystemRecommendation,
} from "@/lib/types";
import {
  activityLog,
  aiSummary,
  briefingSnapshot,
  decisions,
  recommendation,
  todayPriorities,
  weather,
} from "@/lib/mocks";
import type { AiSummary, WeatherData } from "@/lib/types";

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
  weather: WeatherData;
  aiSummary: AiSummary;
}

export async function getHomeData(): Promise<HomeData> {
  if (useMockData) {
    return {
      priorities: todayPriorities,
      snapshot: briefingSnapshot,
      decisions,
      activityLog,
      recommendation,
      weather,
      aiSummary,
    };
  }

  return apiClient<HomeData>("/home");
}
