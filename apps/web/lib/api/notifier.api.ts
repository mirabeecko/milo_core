import { apiClient } from "./client";
import type { ReminderItem } from "@/lib/types";

export async function getTodayReminders(): Promise<ReminderItem[]> {
  return apiClient<ReminderItem[]>("/notifier/today");
}

export async function selectReminderOption(id: string, option: string): Promise<ReminderItem> {
  return apiClient<ReminderItem>(`/notifier/${id}/select`, {
    method: "POST",
    body: JSON.stringify({ option }),
  });
}

export async function dismissReminder(id: string): Promise<ReminderItem> {
  return apiClient<ReminderItem>(`/notifier/${id}/dismiss`, {
    method: "POST",
  });
}
