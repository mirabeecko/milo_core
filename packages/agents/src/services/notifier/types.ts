export interface ReminderItem {
  id: string;
  time: string;
  description: string;
  project_ref?: string;
  reminder_options: string[];
  selected_options: string[];
  status: "pending" | "notified" | "dismissed";
  source: "calendar" | "task" | "email";
  source_id?: string;
  priority?: "urgent" | "normal" | "low";
}

export interface NotifierAgentState {
  reminders: ReminderItem[];
  todayDate: string;
  lastCheckAt?: string;
  taskProgress: number;
}

export interface NotifierCheckResult {
  triggered: ReminderItem[];
  skipped: ReminderItem[];
  checkTime: string;
}
