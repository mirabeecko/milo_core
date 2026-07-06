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

export interface HomeData {
  meetings: HomeMeeting[];
  criticalDeadlines: HomeCriticalDeadline[];
  tasks: HomeTask[];
  pendingDecisions: HomePendingDecision[];
  unreadImportantEmails: Email[];
  calendarConflicts: CalendarEvent[];
  missingResponses: Email[];
  overloadedProjects: HomeOverloadedProject[];
  agents: HomeAgent[];
  services: HomeService[];
  activity: HomeActivity[];
  calendarConnected: boolean;
  emailConnected: boolean;
}
