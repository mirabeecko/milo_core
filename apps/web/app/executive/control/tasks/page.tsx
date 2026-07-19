"use client";

import { useEffect, useState } from "react";
import { ListTodo } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getControlTasks } from "@/lib/api/control-center.api";

export default function TasksPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getControlTasks().then(setTasks).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="space-y-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Vývojové úkoly</h2>
        <p className="text-muted-foreground mt-1">{tasks.length} úkolů — backlog implementace</p>
      </div>

      {tasks.length === 0 ? (
        <Card><CardContent className="p-6 text-center text-muted-foreground">Žádné vývojové úkoly. Spusťte dopadovou analýzu pro vygenerování úkolů.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <Card key={t.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.description || t.technical_context}</p>
                </div>
                <div className="flex gap-1">
                  <Badge variant="outline" className="text-xs">{t.status}</Badge>
                  <Badge variant="outline" className="text-xs">{t.priority}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
