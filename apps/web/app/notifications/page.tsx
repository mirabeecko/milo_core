"use client";

import { useEffect, useState } from "react";
import { Bell, Check, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { getTodayReminders, dismissReminder, selectReminderOption } from "@/lib/api/notifier.api";
import type { ReminderItem } from "@/lib/types";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getTodayReminders();
      setReminders(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Nepodařilo se načíst notifikace"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => void load(), []);

  const handleDismiss = async (id: string) => {
    try {
      await dismissReminder(id);
      setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, status: "dismissed" as const } : r)));
    } catch {
      // ignore
    }
  };

  const handleSelect = async (id: string, option: string) => {
    try {
      await selectReminderOption(id, option);
      setReminders((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, selected_options: [...r.selected_options, option] }
            : r,
        ),
      );
    } catch {
      // ignore
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        variant="error"
        title="Nepodařilo se načíst notifikace"
        description={error.message}
        action={<Button onClick={() => void load()} className="gap-2"><RefreshCw className="h-4 w-4" /> Zkusit znovu</Button>}
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Notifikace" description="Připomínky, upozornění a systémové notifikace">
        <Button onClick={() => void load()} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Obnovit
        </Button>
      </PageHeader>

      {reminders.length === 0 ? (
        <EmptyState
          title="Žádné notifikace"
          description="Momentálně nemáš žádné připomínky ani notifikace."
        />
      ) : (
        <div className="space-y-3">
          {reminders.map((reminder) => (
            <Card
              key={reminder.id}
              className={cn(
                "transition-colors",
                reminder.status === "dismissed" && "opacity-50",
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{reminder.time}</span>
                      <Badge variant="outline" className="text-xs">{reminder.source}</Badge>
                      {reminder.status === "dismissed" && (
                        <Badge variant="outline" className="text-xs border-slate-500/30 text-slate-500">Odloženo</Badge>
                      )}
                    </div>
                    <p className="mt-2 font-medium">{reminder.description}</p>
                    {reminder.reminder_options.length > 0 && reminder.status !== "dismissed" && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {reminder.reminder_options.map((option) => (
                          <Button
                            key={option}
                            variant="outline"
                            size="sm"
                            onClick={() => handleSelect(reminder.id, option)}
                            disabled={reminder.selected_options.includes(option)}
                          >
                            <Check className="mr-1 h-3.5 w-3.5" />
                            {option}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                  {reminder.status !== "dismissed" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDismiss(reminder.id)}
                      className="shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
