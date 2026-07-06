import { apiClient } from "./client";
import type { ApiResponse } from "./types";

export interface CalendarEvent {
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
  travelTime: number;
  requiredDocuments: string[];
  relatedEmails: string[];
  relatedTasks: string[];
  relatedProjects: string[];
  aiRecommendations: string[];
}

export interface CalendarResponse {
  events: CalendarEvent[];
  demo?: boolean;
}

export async function getCalendarEvents(): Promise<ApiResponse<CalendarEvent[]>> {
  const response = await apiClient<ApiResponse<CalendarEvent[]>>("/calendar");
  return response;
}

export async function getCalendarEventsForWeek(weekStart: string): Promise<ApiResponse<CalendarEvent[]>> {
  const response = await apiClient<ApiResponse<CalendarEvent[]>>("/calendar/week", {
    method: "POST",
    body: JSON.stringify({ weekStart }),
  });
  return response;
}

export async function getCalendarConflicts(): Promise<ApiResponse<CalendarEvent[]>> {
  const response = await apiClient<ApiResponse<CalendarEvent[]>>("/calendar/conflicts");
  return response;
}

export async function getCalendarTravel(): Promise<ApiResponse<CalendarEvent[]>> {
  const response = await apiClient<ApiResponse<CalendarEvent[]>>("/calendar/travel");
  return response;
}

export async function getCalendarFreeBlocks(): Promise<ApiResponse<CalendarEvent[]>> {
  const response = await apiClient<ApiResponse<CalendarEvent[]>>("/calendar/free-blocks");
  return response;
}

export async function getCalendarEventsForToday(): Promise<ApiResponse<CalendarEvent[]>> {
  const response = await apiClient<ApiResponse<CalendarEvent[]>>("/calendar/today");
  return response;
}
