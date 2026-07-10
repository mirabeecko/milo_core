"use client";

import {
  GitBranch,
  FileText,
  ScrollText,
  Bot,
  ShieldCheck,
  Clock,
  CheckCircle2,
  Database,
  Users,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/page-header";
import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/lib/data/executive/types";
import { useExecutiveActivity } from "@/lib/data/executive/use-executive-queries";
import { LiveIndicator } from "@/app/executive/live-indicator";

interface Props {
  activity: ActivityItem[];
}

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  git: { icon: GitBranch, color: "bg-emerald-500/10 text-emerald-500", label: "Commit" },
  document: { icon: FileText, color: "bg-primary/10 text-primary", label: "Dokument" },
  decision: { icon: ScrollText, color: "bg-amber-500/10 text-amber-500", label: "Rozhodnutí" },
  mission: { icon: Bot, color: "bg-blue-500/10 text-blue-500", label: "Mise" },
  agent: { icon: Bot, color: "bg-violet-500/10 text-violet-500", label: "Agent" },
  system: { icon: ShieldCheck, color: "bg-rose-500/10 text-rose-500", label: "Systém" },
};

export function ActivityView({ activity: initialActivity }: Props) {
  const { data: activity = initialActivity, isFetching, isStale, dataUpdatedAt } = useExecutiveActivity(initialActivity);
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader
        title="Activity Timeline"
        description="Nedávná aktivita — git historie, dokumenty, rozhodnutí"
      >
        <LiveIndicator isFetching={isFetching} isStale={isStale} isError={false} dataUpdatedAt={dataUpdatedAt} />
      </PageHeader>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Poslední aktivita</CardTitle>
          <CardDescription>
            {activity.length} záznamů · Zdroj: git log + analýza dokumentů
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activity.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="rounded-full bg-muted p-4 text-muted-foreground">
                <Clock className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium">Žádná aktivita</p>
              <p className="text-sm text-muted-foreground max-w-md text-center">
                Data o aktivitě nejsou k dispozici. Aktivita bude načítána z gitu a dokumentů.
              </p>
            </div>
          )}

          <div className="space-y-1">
            {activity.map((item) => {
              const config = typeConfig[item.type] ?? typeConfig.system;
              const Icon = config.icon;
              return (
                <div
                  key={item.id}
                  className="flex gap-3 rounded-lg p-3 hover:bg-accent/50 transition-colors"
                >
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${config.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <Badge variant="outline" className="text-[10px]">{config.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">{item.actor}</span>
                      {item.department && (
                        <Badge variant="secondary" className="text-[10px] h-4">{item.department}</Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(item.timestamp).toLocaleString("cs-CZ", {
                          day: "numeric",
                          month: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              Data sources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Git log (posledních 20 commitů)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Analýza dokumentů (ROADMAP.md, CHANGELOG.md)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Live telemetrie (není k dispozici)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              Chybějící telemetrie pro live verzi
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="text-xs text-muted-foreground">Pro live verzi bude potřeba:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Agent state events z AgentManager event bus</li>
              <li>Mission lifecycle events (start, progress, complete)</li>
              <li>Task lifecycle events</li>
              <li>Git webhook integrace</li>
              <li>Document change tracking</li>
              <li>Department status update stream</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Zdroj: git log + analýza souborů — ne live data
      </p>
    </div>
  );
}
