export type EmailImportance = "low" | "normal" | "high" | "critical";

export interface Email {
  id: string;
  subject: string;
  from: string;
  date: string;
  body: string;
  isUnread: boolean;
  importance: EmailImportance;
  deadline: string | null;
  aiSummary: string;
  suggestedReply: string | null;
  tags: string[];
  relatedTasks: string[];
  relatedProjects: string[];
  relatedEvents: string[];
  actions?: {
    id: string;
    label: string;
  }[];
}

export interface EmailAction {
  id: string;
  label: string;
  icon?: string;
}
