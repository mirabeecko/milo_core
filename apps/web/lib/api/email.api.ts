import { apiClient } from "./client";
import type { ApiResponse } from "./types";

export interface Email {
  id: string;
  subject: string;
  from: string;
  date: string;
  body: string;
  isUnread: boolean;
  importance: "low" | "normal" | "high" | "critical";
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

export interface EmailResponse {
  emails: Email[];
  demo?: boolean;
}

export async function getUnreadEmails(): Promise<ApiResponse<Email[]>> {
  const response = await apiClient<ApiResponse<Email[]>>("/email/unread");
  return response;
}

export async function getEmailById(id: string): Promise<ApiResponse<Email>> {
  const response = await apiClient<ApiResponse<Email>>(`/email/${id}`);
  return response;
}

export async function markEmailAsRead(id: string): Promise<void> {
  await apiClient<void>("/email/read", {
    method: "POST",
    body: JSON.stringify({ emailId: id }),
  });
}

export async function replyToEmail(id: string, reply: string): Promise<void> {
  await apiClient<void>("/email/reply", {
    method: "POST",
    body: JSON.stringify({ emailId: id, reply }),
  });
}

export async function delegateEmail(id: string, agentId: string): Promise<void> {
  await apiClient<void>("/email/delegate", {
    method: "POST",
    body: JSON.stringify({ emailId: id, agentId }),
  });
}

export async function scheduleEmail(id: string, date: string): Promise<void> {
  await apiClient<void>("/email/schedule", {
    method: "POST",
    body: JSON.stringify({ emailId: id, date }),
  });
}

export async function addToProject(id: string, projectId: string): Promise<void> {
  await apiClient<void>("/email/project", {
    method: "POST",
    body: JSON.stringify({ emailId: id, projectId }),
  });
}

export async function addTaskFromEmail(id: string, taskTitle: string): Promise<void> {
  await apiClient<void>("/email/task", {
    method: "POST",
    body: JSON.stringify({ emailId: id, taskTitle }),
  });
}
