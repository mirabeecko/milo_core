import { readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { NotifierCheckResult, ReminderItem } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REMINDERS_FILE = resolve(__dirname, "../../../../../apps/api/data/reminders.json");

function todayDateString(): string {
  return new Date().toISOString().split("T")[0]!;
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

async function readReminders(): Promise<ReminderItem[]> {
  try {
    const raw = await readFile(REMINDERS_FILE, "utf-8");
    return JSON.parse(raw) as ReminderItem[];
  } catch {
    return [];
  }
}

async function writeReminders(reminders: ReminderItem[]): Promise<void> {
  await writeFile(REMINDERS_FILE, JSON.stringify(reminders, null, 2), "utf-8");
}

const ALL_CHECKPOINTS = ["1h_before", "13:00", "18:00", "21:00"];

export class DefaultNotifierService {
  private reminders: ReminderItem[] = [];

  async load(): Promise<void> {
    this.reminders = await readReminders();
  }

  async save(): Promise<void> {
    await writeReminders(this.reminders);
  }

  async syncReminders(
    calendarEvents: { id: string; title: string; start: string; end: string }[],
    tasks: { id: string; title: string; dueDate?: string; projectRef?: string }[],
    emails: { id: string; subject: string; isPriority: boolean }[],
  ): Promise<ReminderItem[]> {
    await this.load();
    const today = todayDateString();
    const newReminders: ReminderItem[] = [];

    let idx = 0;

    for (const event of calendarEvents) {
      const eventDate = event.start.split("T")[0] ?? "";
      if (eventDate !== today) continue;

      const hour = event.start.split("T")[1]?.slice(0, 5) ?? "00:00";
      const id = `cal-${event.id}-${idx++}`;
      const existing = this.reminders.find((r) => r.id === id);

      newReminders.push({
        id,
        time: hour,
        description: `Kalendář: ${event.title}`,
        reminder_options: [...ALL_CHECKPOINTS],
        selected_options: existing?.selected_options ?? [],
        status: existing?.status ?? "pending",
        source: "calendar",
        source_id: event.id,
      });
    }

    for (const task of tasks) {
      if (!task.dueDate) continue;
      const taskDate = task.dueDate.split("T")[0] ?? "";
      if (taskDate !== today) continue;

      const hour = task.dueDate.split("T")[1]?.slice(0, 5) ?? "23:59";
      const id = `task-${task.id}-${idx++}`;
      const existing = this.reminders.find((r) => r.id === id);

      newReminders.push({
        id,
        time: hour,
        description: `Úkol: ${task.title}`,
        project_ref: task.projectRef,
        reminder_options: [...ALL_CHECKPOINTS],
        selected_options: existing?.selected_options ?? [],
        status: existing?.status ?? "pending",
        source: "task",
        source_id: task.id,
      });
    }

    for (const email of emails) {
      if (!email.isPriority) continue;

      const id = `email-${email.id}-${idx++}`;
      const existing = this.reminders.find((r) => r.id === id);

      newReminders.push({
        id,
        time: "23:59",
        description: `Email: ${email.subject}`,
        reminder_options: [...ALL_CHECKPOINTS],
        selected_options: existing?.selected_options ?? [],
        status: existing?.status ?? "pending",
        source: "email",
        source_id: email.id,
      });
    }

    this.reminders = newReminders;
    await this.save();
    return this.reminders;
  }

  getTodayReminders(): ReminderItem[] {
    return this.reminders.filter((r) => r.status !== "dismissed");
  }

  getAllReminders(): ReminderItem[] {
    return [...this.reminders];
  }

  async selectReminderOption(id: string, option: string): Promise<ReminderItem | null> {
    const reminder = this.reminders.find((r) => r.id === id);
    if (!reminder) return null;

    if (!reminder.reminder_options.includes(option)) return reminder;

    if (!reminder.selected_options.includes(option)) {
      reminder.selected_options.push(option);
      await this.save();
    }

    return reminder;
  }

  async dismissReminder(id: string): Promise<ReminderItem | null> {
    const reminder = this.reminders.find((r) => r.id === id);
    if (!reminder) return null;

    reminder.status = "dismissed";
    await this.save();
    return reminder;
  }

  checkReminders(now: Date): NotifierCheckResult {
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${String(currentHour).padStart(2, "0")}:${String(currentMinute).padStart(2, "0")}`;

    const triggered: ReminderItem[] = [];
    const skipped: ReminderItem[] = [];

    for (const reminder of this.reminders) {
      if (reminder.status !== "pending") {
        skipped.push(reminder);
        continue;
      }

      const eventMinutes = timeToMinutes(reminder.time);
      const oneHourBefore = eventMinutes - 60;
      const oneHourBeforeTime = minutesToTime(oneHourBefore >= 0 ? oneHourBefore : 0);

      if (reminder.selected_options.length > 0) {
        if (reminder.selected_options.includes(currentTime)) {
          triggered.push(reminder);
        } else {
          skipped.push(reminder);
        }
      } else {
        const shouldTrigger: boolean[] = [];

        if (currentTime === oneHourBeforeTime) {
          shouldTrigger.push(true);
        }

        for (const checkpoint of ["13:00", "18:00", "21:00"]) {
          if (currentTime === checkpoint) {
            if (timeToMinutes(checkpoint) < eventMinutes) {
              shouldTrigger.push(true);
            }
          }
        }

        if (shouldTrigger.length > 0) {
          triggered.push(reminder);
        } else {
          skipped.push(reminder);
        }
      }
    }

    return {
      triggered,
      skipped,
      checkTime: now.toISOString(),
    };
  }
}
