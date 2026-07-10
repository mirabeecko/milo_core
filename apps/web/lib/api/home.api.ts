import { apiClient } from "./client";
import type { ApiResponse } from "./types";
import type {
  CalendarEvent,
  Email,
  PriorityItem,
  DecisionItem,
  BriefingSnapshot,
  AiSummary,
  SystemRecommendation,
  WeatherData,
  ActivityLogItem,
} from "@/lib/types";

export interface HomeMeeting {
  id: string;
  summary: string;
  description: string | null;
  location: string | null;
  start: string;
  end: string;
  isAllDay: boolean;
  organizer: string | null;
  attendees: string[];
  status: string;
  aiRecommendations: string[];
}

export interface HomeCriticalDeadline {
  id: string;
  title: string;
  deadline: string;
  importance: number;
}

export interface HomeTask {
  id: string;
  title: string;
  progress: number;
  status: string;
  dueDate: string;
}

export interface HomePendingDecision {
  id: string;
  title: string;
  context: string;
  aiRecommendation: string;
}

export interface HomeOverloadedProject {
  id: string;
  name: string;
  progress: number;
  tasksOverdue: number;
}

export interface HomeAgent {
  id: string;
  name: string;
  status: string;
  currentActivity: string;
  progress: number;
  lastAction: string;
  aiRecommendation?: string;
}

export interface HomeService {
  name: string;
  connected: boolean;
  status: "connected" | "offline" | "auth_required" | "disabled";
}

export interface HomeActivity {
  id: string;
  agentId: string;
  agentName: string;
  timestamp: string;
  message: string;
  type: "task" | "error" | "info" | "warning";
}

export interface CalendarDay {
  today: Array<{ id: string; summary: string; start: string; end: string; location?: string }>;
  tomorrow: Array<{ id: string; summary: string; start: string; end: string; location?: string }>;
  week: Array<{ id: string; summary: string; start: string; end: string; location?: string }>;
}

export interface HomeData {
  meetings?: HomeMeeting[];
  criticalDeadlines?: HomeCriticalDeadline[];
  tasks?: HomeTask[];
  pendingDecisions?: HomePendingDecision[];
  unreadImportantEmails?: Email[];
  calendarConflicts?: CalendarEvent[];
  missingResponses?: Email[];
  overloadedProjects?: HomeOverloadedProject[];
  agents?: HomeAgent[];
  services?: HomeService[];
  activity?: HomeActivity[];
  calendarConnected?: boolean;
  emailConnected?: boolean;
  priorities: PriorityItem[];
  decisions: DecisionItem[];
  snapshot: BriefingSnapshot;
  aiSummary: AiSummary;
  recommendation: SystemRecommendation | null;
  weather: WeatherData;
  activityLog: ActivityLogItem[];
  calendar: CalendarDay;
  isDemo?: boolean;
  dataSource?: "live" | "demo" | "partial";
  connectedServices?: { name: string; connected: boolean; label: string }[];
  todayEvents?: CalendarEvent[];
}

export async function getHomeData(): Promise<HomeData> {
  const raw = await apiClient<Record<string, unknown>>("/home");
  const data = (raw || {}) as Record<string, unknown>;
  
  return {
    priorities: (data.priorities as PriorityItem[]) || [],
    decisions: (data.decisions as DecisionItem[]) || [],
    snapshot: (data.snapshot as BriefingSnapshot) || { unreadEmails: 0, upcomingMeetings: 0, newDocuments: 0, openTasks: 0, activeAgents: 0 },
    activityLog: (data.activityLog as ActivityLogItem[]) || [],
    recommendation: (data.recommendation as SystemRecommendation | null) || null,
    weather: (data.weather as WeatherData) || { location: "Neznámá", condition: "clear", temperature: 0, feelsLike: 0, humidity: 0, windSpeed: 0, forecast: [] },
    aiSummary: (data.aiSummary as AiSummary) || { unreadEmails: 0, emailSenders: [], siteVisits: [], totalVisits: 0, insight: "" },
    calendar: (data.calendar as CalendarDay) || { today: [], tomorrow: [], week: [] },
    
    meetings: [],
    criticalDeadlines: [],
    tasks: [],
    pendingDecisions: [],
    unreadImportantEmails: [],
    calendarConflicts: [],
    missingResponses: [],
    overloadedProjects: [],
    agents: [],
    services: [],
    activity: [],
    calendarConnected: false,
    emailConnected: false,
    connectedServices: [],
    todayEvents: ((data.calendar as CalendarDay)?.today || []) as CalendarEvent[],
  };
}
