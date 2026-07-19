"use client";

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  GitBranch,
  FileText,
  ScrollText,
  Bot,
  ShieldCheck,
  Clock,
  Database,
  Zap,
  ArrowUpRight,
  RefreshCw,
  Filter,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/common/page-header";
import { cn } from "@/lib/utils";
import type { ActivityItem } from "@/lib/data/executive/types";
import { useExecutiveActivity } from "@/lib/data/executive/use-executive-queries";
import { LiveIndicator } from "@/app/executive/live-indicator";

interface Props {
  activity: ActivityItem[];
}

type FilterType = "vse" | "agent" | "mise" | "system" | "git" | "dokument" | "rozhodnuti";

const FILTER_BUTTONS: { key: FilterType; label: string }[] = [
  { key: "vse", label: "Vše" },
  { key: "agent", label: "Agent" },
  { key: "mise", label: "Mise" },
  { key: "system", label: "Systém" },
  { key: "git", label: "Git" },
  { key: "dokument", label: "Dokument" },
  { key: "rozhodnuti", label: "Rozhodnutí" },
];

const typeConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  git: { icon: GitBranch, color: "bg-emerald-500/10 text-emerald-500", label: "Commit" },
  document: { icon: FileText, color: "bg-primary/10 text-primary", label: "Dokument" },
  decision: { icon: ScrollText, color: "bg-amber-500/10 text-amber-500", label: "Rozhodnutí" },
  mission: { icon: Bot, color: "bg-blue-500/10 text-blue-500", label: "Mise" },
  agent: { icon: Bot, color: "bg-violet-500/10 text-violet-500", label: "Agent" },
  system: { icon: ShieldCheck, color: "bg-rose-500/10 text-rose-500", label: "Systém" },
};

function extractAgentId(item: ActivityItem): string | null {
  const match = item.id.match(/^agent:(.+)/);
  if (match) return match[1];
  if (item.type === "agent" && item.id.includes("-")) return item.id;
  return null;
}

function extractMissionId(item: ActivityItem): string | null {
  const match = item.id.match(/^mission:(.+)/);
  if (match) return match[1];
  return null;
}

function getLinkHref(item: ActivityItem): string | null {
  switch (item.type) {
    case "agent": {
      const agentId = extractAgentId(item);
      if (agentId) return `/executive/control/agents/${agentId}`;
      return "/executive/control/agents";
    }
    case "mission": {
      const missionId = extractMissionId(item);
      if (missionId) return `/executive/missions?highlight=${missionId}`;
      return "/executive/missions";
    }
    case "document":
      return "/documents";
    case "decision":
      return "/executive/decisions";
    case "git":
      return "/projects/activity";
    case "system":
      return "/executive/control";
    default:
      return null;
  }
}

function getLinkTooltip(item: ActivityItem): string {
  switch (item.type) {
    case "agent":
      return "Otevřít detail agenta";
    case "mission":
      return "Otevřít mise";
    case "document":
      return "Otevřít dokumenty";
    case "decision":
      return "Otevřít rozhodnutí";
    case "git":
      return "Otevřít aktivitu projektu";
    case "system":
      return "Otevřít Control Center";
    default:
      return "Otevřít";
  }
}

export function ActivityView({ activity: initialActivity }: Props) {
  const { data: activity = initialActivity, isFetching, isStale, dataUpdatedAt } = useExecutiveActivity(initialActivity);
  const [filter, setFilter] = useState<FilterType>("vse");
  const [newCount, setNewCount] = useState(0);
  const prevIdsRef = useRef<Set<string>>(new Set(initialActivity.map((a) => a.id)));
  const loadedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    const currentIds = new Set(activity.map((a) => a.id));
    const added = [...currentIds].filter((id) => !prevIdsRef.current.has(id)).length;
    if (added > 0) {
      setNewCount((prev) => prev + added);
    }
    prevIdsRef.current = currentIds;
  }, [activity]);

  const handleResetCounter = useCallback(() => {
    setNewCount(0);
    loadedAtRef.current = Date.now();
    prevIdsRef.current = new Set(activity.map((a) => a.id));
  }, [activity]);

  const filtered = useMemo(() => {
    if (filter === "vse") return activity;
    switch (filter) {
      case "agent":
        return activity.filter((a) => a.type === "agent");
      case "mise":
        return activity.filter((a) => a.type === "mission");
      case "system":
        return activity.filter((a) => a.type === "system");
      case "git":
        return activity.filter((a) => a.type === "git");
      case "dokument":
        return activity.filter((a) => a.type === "document");
      case "rozhodnuti":
        return activity.filter((a) => a.type === "decision");
      default:
        return activity;
    }
  }, [activity, filter]);

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
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base">Poslední aktivita</CardTitle>
              <CardDescription>
                {filtered.length} záznamů · Zdroj: git log + analýza dokumentů
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {newCount > 0 && (
                <Badge
                  variant="outline"
                  className="cursor-pointer border-emerald-500/30 bg-emerald-500/10 text-emerald-400 gap-1 hover:bg-emerald-500/20 transition-colors"
                  onClick={handleResetCounter}
                  title="Kliknutím resetovat počítadlo"
                >
                  <RefreshCw className="h-3 w-3" />
                  {newCount} nových událostí od načtení
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleResetCounter}
                className="text-xs gap-1"
                title="Resetovat počítadlo nových událostí"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reset
              </Button>
            </div>
          </div>
        </CardHeader>

        <div className="px-6 pb-2">
          <div className="flex gap-1.5 flex-wrap items-center">
            <Filter className="h-3.5 w-3.5 text-muted-foreground mr-1" />
            {FILTER_BUTTONS.map((btn) => (
              <Button
                key={btn.key}
                variant={filter === btn.key ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter(btn.key)}
                className="text-xs h-7 px-2.5"
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </div>

        <CardContent>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="rounded-full bg-muted p-4 text-muted-foreground">
                <Clock className="h-8 w-8" />
              </div>
              <p className="text-lg font-medium">Žádná aktivita</p>
              <p className="text-sm text-muted-foreground max-w-md text-center">
                {filter !== "vse"
                  ? `Žádné položky pro filtr "${FILTER_BUTTONS.find((b) => b.key === filter)?.label}".`
                  : "Data o aktivitě nejsou k dispozici. Aktivita bude načítána z gitu a dokumentů."}
              </p>
            </div>
          )}

          <div className="space-y-0">
            {filtered.map((item) => {
              const config = typeConfig[item.type] ?? typeConfig.system;
              const Icon = config.icon;
              const href = getLinkHref(item);
              const tooltip = getLinkTooltip(item);

              const content = (
                <div className="timeline-item group">
                  <div className={`timeline-dot flex items-center justify-center ${config.color.split(" ")[0]}`}>
                    <Icon className="h-2.5 w-2.5" />
                  </div>
                  <div className={cn(
                    "min-w-0 flex-1 rounded-md p-2 hover:bg-accent/30 transition-colors",
                    href && "cursor-pointer",
                  )}>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <Badge variant="outline" className="text-[10px]">{config.label}</Badge>
                      {href && (
                        <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-muted-foreground">{item.actor}</span>
                      {item.department && (
                        <Badge variant="secondary" className="text-[10px] h-4">{item.department}</Badge>
                      )}
                      <span className="text-[9px] text-muted-foreground ml-auto">{formatTimelineDate(item.timestamp)}</span>
                    </div>
                  </div>
                </div>
              );

              if (href) {
                return (
                  <Link key={item.id} href={href} title={tooltip} className="block">
                    {content}
                  </Link>
                );
              }

              return <div key={item.id}>{content}</div>;
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Database className="h-4 w-4 text-muted-foreground" />
              Zdroje dat
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <div className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Executive Event Log (JSONL) — živá telemetrie</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Git log (posledních 20 commitů)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Aktivita agentů — live Agent Manager</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-2 w-2 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Sledování změn dokumentů</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Zap className="h-4 w-4 text-muted-foreground" />
              Chybějící telemetrie
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

function formatTimelineDate(iso: string): string {
  try {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const diffHrs = Math.floor(diffMs / 3600000);
    if (diffHrs < 1) return `před ${Math.floor(diffMs / 60000)}m`;
    if (diffHrs < 24) return `před ${diffHrs}h`;
    if (diffHrs < 48) return "včera";
    return d.toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" });
  } catch { return iso; }
}
