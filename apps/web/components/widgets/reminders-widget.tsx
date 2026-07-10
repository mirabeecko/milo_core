"use client";

import { useEffect, useState, useCallback } from "react";
import { Bell, Loader2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ReminderItem } from "@/lib/types";
import { getTodayReminders, selectReminderOption } from "@/lib/api/notifier.api";

export function RemindersWidget(): JSX.Element {
  const [reminders, setReminders] = useState<ReminderItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectingId, setSelectingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getTodayReminders();
      setReminders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nepodařilo se načíst připomínky");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSelect = useCallback(
    async (id: string, option: string) => {
      try {
        setSelectingId(id);
        const updated = await selectReminderOption(id, option);
        setReminders((prev) =>
          prev.map((r) => (r.id === id ? updated : r)),
        );
      } catch {
        // silently fail
      } finally {
        setSelectingId(null);
      }
    },
    [],
  );

  return (
    <Card className="hud-card border-l-[var(--hud-green)]">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="rounded-none bg-[var(--hud-green)]/10 p-2 text-[var(--hud-green)]">
            <Bell className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="font-mono text-base tracking-tight">
              PŘIPOMÍNKY
            </CardTitle>
            <p className="text-xs text-[var(--hud-green)]/70 font-mono">
              {isLoading
                ? "NAČÍTÁNÍ..."
                : reminders.length === 0
                  ? "ŽÁDNÉ PŘIPOMÍNKY"
                  : `${reminders.length} AKTIVNÍ`}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="font-mono">Načítám připomínky...</span>
          </div>
        )}

        {error && (
          <div className="py-4 text-sm font-mono text-[var(--hud-red)]">
            {error}
          </div>
        )}

        {!isLoading && !error && reminders.length === 0 && (
          <div className="py-4 text-sm font-mono text-muted-foreground">
            Žádné připomínky na dnešek.
          </div>
        )}

        {!isLoading &&
          !error &&
          reminders
            .filter((r) => r.status !== "dismissed")
            .map((reminder) => (
              <div
                key={reminder.id}
                className="mb-3 border border-[var(--hud-border)] bg-card/50 p-3 last:mb-0"
              >
                <div className="mb-2 flex items-start gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-none bg-[var(--hud-blue)]/10 text-[var(--hud-blue)]">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm text-[var(--hud-blue)]">
                        {reminder.time}
                      </span>
                      {reminder.project_ref && (
                        <span className="font-mono text-xs text-muted-foreground">
                          [{reminder.project_ref}]
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm leading-relaxed">
                      {reminder.description}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {reminder.reminder_options.map((option) => {
                        const isSelected =
                          reminder.selected_options.includes(option);
                        const isLoadingThis =
                          selectingId === reminder.id;
                        return (
                          <Button
                            key={option}
                            variant="outline"
                            size="sm"
                            disabled={isLoadingThis || isSelected}
                            onClick={() => handleSelect(reminder.id, option)}
                            className={cn(
                              "h-7 rounded-none border-[var(--hud-border)] px-2 font-mono text-xs",
                              isSelected &&
                                "border-[var(--hud-green)] bg-[var(--hud-green)]/10 text-[var(--hud-green)]",
                            )}
                          >
                            {isLoadingThis && selectingId === reminder.id ? (
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                            ) : null}
                            {option}
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
      </CardContent>
    </Card>
  );
}
