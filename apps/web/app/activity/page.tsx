"use client";

import { useEffect, useState } from "react";
import { Activity, Bot, CheckCircle2, RefreshCw, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { getHomeData, type HomeData } from "@/lib/api/home.api";
import { formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

const typeIcons = {
  agent: Bot,
  system: Zap,
  user: CheckCircle2,
  integration: Zap,
};

export default function ActivityPage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const home = await getHomeData();
      setData(home);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Nepodařilo se načíst aktivitu"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => void load(), []);

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <EmptyState
        variant="error"
        title="Nepodařilo se načíst aktivitu"
        description={error?.message ?? "Zkuste stránku obnovit."}
        action={<Button onClick={() => void load()} className="gap-2"><RefreshCw className="h-4 w-4" /> Zkusit znovu</Button>}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Aktivita" description="Log všech akcí a událostí v systému">
        <Button onClick={() => void load()} variant="outline" className="gap-2">
          <RefreshCw className="h-4 w-4" /> Obnovit
        </Button>
      </PageHeader>

      <div className="space-y-3">
        {data.activityLog.map((item) => {
          const Icon = typeIcons[item.type] ?? Activity;
          return (
            <Card key={item.id} className="transition-colors hover:border-primary/20">
              <CardContent className="flex items-start gap-4 p-4">
                <div className={cn(
                  "rounded-md p-2",
                  item.type === "agent" && "bg-emerald-500/10 text-emerald-500",
                  item.type === "system" && "bg-blue-500/10 text-blue-500",
                  item.type === "user" && "bg-purple-500/10 text-purple-500",
                  item.type === "integration" && "bg-amber-500/10 text-amber-500",
                )}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">{formatRelative(item.timestamp)}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
