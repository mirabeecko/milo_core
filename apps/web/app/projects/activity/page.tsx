"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  GitCommit, GitBranch, FolderKanban, Clock,
  Activity, Bot, FileText, CheckCircle2, ArrowRight,
  RefreshCw, Terminal, Code2, User, Layers, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card, CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { getProjects } from "@/lib/api/projects.api";
import { getActivityLogs, type ActivityLog } from "@/lib/api/activity.api";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatRelative, getStatusLabel, getStatusColor } from "@/lib/format";

type RangeFilter = "today" | "week" | "month" | "all";

type ActivityEntryType =
  | "commit"
  | "status_change"
  | "new_document"
  | "task_completed"
  | "agent_activity"
  | "project_update";

interface ActivityEntry {
  id: string;
  type: ActivityEntryType;
  timestamp: string;
  projectId?: string;
  projectName?: string;
  projectColor?: string;
  title: string;
  description: string;
  metadata?: {
    hash?: string;
    author?: string;
    agentName?: string;
    status?: string;
  };
  isProjectEntry?: boolean;
}

interface StatCardData {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

interface ProjectChangeSummary {
  project: Project;
  lastCommitMessage: string;
  lastCommitAuthor: string;
  timeSinceChange: string;
}

interface DateGroup {
  label: string;
  entries: ActivityEntry[];
}

const TYPE_CONFIG: Record<
  ActivityEntryType,
  { icon: React.ElementType; label: string; color: string }
> = {
  commit: {
    icon: GitCommit,
    label: "Commit",
    color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  },
  status_change: {
    icon: GitBranch,
    label: "Změna stavu",
    color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  },
  new_document: {
    icon: FileText,
    label: "Dokument",
    color: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  },
  task_completed: {
    icon: CheckCircle2,
    label: "Úkol",
    color: "text-purple-500 bg-purple-500/10 border-purple-500/20",
  },
  agent_activity: {
    icon: Bot,
    label: "Agent",
    color: "text-cyan-500 bg-cyan-500/10 border-cyan-500/20",
  },
  project_update: {
    icon: Activity,
    label: "Aktivita",
    color: "text-muted-foreground bg-muted border-border",
  },
};

function getRangeStart(range: RangeFilter): Date {
  const now = new Date();
  switch (range) {
    case "today": {
      const d = new Date(now);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - 7);
      return d;
    }
    case "month": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 1);
      return d;
    }
    case "all":
      return new Date(0);
  }
}

function isToday(date: Date): boolean {
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function isThisWeek(date: Date): boolean {
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  return date >= weekAgo;
}

function getDateGroupLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round(
    (today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Dnes";
  if (diffDays === 1) return "Včera";
  if (diffDays < 7)
    return `Před ${diffDays} dny`;
  if (diffDays < 14) return "Minulý týden";
  if (diffDays < 30) return "Před 2 týdny";
  return "Starší";
}

function shortHash(hash: string): string {
  return hash.slice(0, 7);
}

const RANGE_OPTIONS: { key: RangeFilter; label: string }[] = [
  { key: "today", label: "Dnes" },
  { key: "week", label: "Týden" },
  { key: "month", label: "Měsíc" },
  { key: "all", label: "Vše" },
];

export default function ProjectsActivityPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [rangeFilter, setRangeFilter] = useState<RangeFilter>("all");

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [projectsData, activityResponse] = await Promise.all([
        getProjects(),
        getActivityLogs(100),
      ]);
      setProjects(projectsData);
      const logsData = activityResponse && typeof activityResponse === "object" && "data" in activityResponse
        ? (activityResponse as unknown as { data: ActivityLog[] }).data
        : (activityResponse as unknown as ActivityLog[]);
      setActivityLogs(Array.isArray(logsData) ? logsData : []);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Nepodařilo se načíst aktivitu"),
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const allEntries = useMemo<ActivityEntry[]>(() => {
    const entries: ActivityEntry[] = [];

    for (const project of projects) {
      if (project.last_commit) {
        entries.push({
          id: `commit-${project.id}-${project.last_commit.hash}`,
          type: "commit",
          timestamp: project.last_commit.date,
          projectId: project.id,
          projectName: project.name,
          projectColor: project.color,
          title: project.last_commit.message,
          description: `${project.last_commit.author} · ${shortHash(project.last_commit.hash)}`,
          metadata: {
            hash: project.last_commit.hash,
            author: project.last_commit.author,
          },
          isProjectEntry: true,
        });
      }
    }

    for (const log of activityLogs) {
      const entryType: ActivityEntryType =
        log.type === "task"
          ? "task_completed"
          : log.type === "error" || log.type === "warning"
            ? "project_update"
            : "agent_activity";

      entries.push({
        id: `activity-${log.id}`,
        type: entryType,
        timestamp: log.timestamp,
        title: log.agentName,
        description: log.message,
        metadata: {
          agentName: log.agentName,
        },
        isProjectEntry: false,
      });
    }

    entries.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    return entries;
  }, [projects, activityLogs]);

  const filteredEntries = useMemo(() => {
    if (rangeFilter === "all") return allEntries;
    const start = getRangeStart(rangeFilter);
    return allEntries.filter(
      (e) => new Date(e.timestamp) >= start,
    );
  }, [allEntries, rangeFilter]);

  const stats = useMemo<StatCardData[]>(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayCount = allEntries.filter(
      (e) => new Date(e.timestamp) >= todayStart,
    ).length;

    const activeProjectsCount = projects.filter(
      (p) => p.status === "active",
    ).length;

    const weekCommits = allEntries
      .filter((e) => e.type === "commit" && isThisWeek(new Date(e.timestamp)))
      .length;

    const lastChange = allEntries.length > 0 ? allEntries[0].timestamp : null;

    return [
      {
        label: "Změn dnes",
        value: todayCount,
        icon: Zap,
        color: "text-amber-500",
      },
      {
        label: "Aktivních projektů",
        value: activeProjectsCount,
        icon: FolderKanban,
        color: "text-emerald-500",
      },
      {
        label: "Commitů tento týden",
        value: weekCommits,
        icon: GitCommit,
        color: "text-blue-500",
      },
      {
        label: "Naposledy změněno",
        value: lastChange ? formatRelative(lastChange) : "—",
        icon: Clock,
        color: "text-purple-500",
      },
    ];
  }, [allEntries, projects]);

  const projectChangeSummaries = useMemo<ProjectChangeSummary[]>(() => {
    return projects
      .filter((p) => p.last_commit)
      .sort(
        (a, b) =>
          new Date(b.last_commit!.date).getTime() -
          new Date(a.last_commit!.date).getTime(),
      )
      .slice(0, 6)
      .map((p) => ({
        project: p,
        lastCommitMessage: p.last_commit!.message,
        lastCommitAuthor: p.last_commit!.author,
        timeSinceChange: formatRelative(p.last_commit!.date),
      }));
  }, [projects]);

  const recentCommits = useMemo<{ project: Project; commit: NonNullable<Project["last_commit"]> }[]>(() => {
    return projects
      .filter((p) => p.last_commit)
      .flatMap((p) =>
        p.last_commit
          ? [{ project: p, commit: p.last_commit }]
          : [],
      )
      .sort(
        (a, b) =>
          new Date(b.commit.date).getTime() -
          new Date(a.commit.date).getTime(),
      )
      .slice(0, 20);
  }, [projects]);

  const dateGroups = useMemo<DateGroup[]>(() => {
    const groups = new Map<string, ActivityEntry[]>();
    for (const entry of filteredEntries) {
      const label = getDateGroupLabel(new Date(entry.timestamp));
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(entry);
    }

    const order = ["Dnes", "Včera", "Před 2 dny", "Před 3 dny", "Před 4 dny", "Před 5 dny", "Před 6 dny", "Minulý týden", "Před 2 týdny", "Starší"];
    return order
      .filter((l) => groups.has(l))
      .map((l) => ({ label: l, entries: groups.get(l)! }));
  }, [filteredEntries]);

  if (isLoading) {
    return <ActivitySkeleton />;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <EmptyState
          variant="error"
          title="Nepodařilo se načíst aktivitu"
          description={error.message}
          action={
            <Button onClick={() => void load()} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Zkusit znovu
            </Button>
          }
        />
      </div>
    );
  }

  if (allEntries.length === 0 && projects.length === 0) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          title="Aktivita projektů"
          description="Poslední změny a souhrn práce napříč všemi projekty"
        />
        <EmptyState
          title="Žádná nedávná aktivita"
          description="Zatím nejsou žádné záznamy o aktivitě. Spusťte sken projektů nebo počkejte na první změny."
          icon={<Activity className="h-10 w-10 text-muted-foreground" />}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <PageHeader
        title="Aktivita projektů"
        description="Poslední změny a souhrn práce napříč všemi projekty"
      >
        <Button
          onClick={() => void load()}
          variant="outline"
          size="sm"
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" /> Obnovit
        </Button>
      </PageHeader>

      {/* Range filter */}
      <div className="flex items-center gap-1 rounded-lg bg-muted/50 p-1 w-fit">
        {RANGE_OPTIONS.map((opt) => (
          <Button
            key={opt.key}
            variant={rangeFilter === opt.key ? "default" : "ghost"}
            size="sm"
            onClick={() => setRangeFilter(opt.key)}
            className="h-8 text-xs"
          >
            {opt.label}
          </Button>
        ))}
      </div>

      {/* Stats Summary */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="rounded-xl">
              <CardContent className="p-4 flex items-center gap-4">
                <div
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border",
                    stat.color.replace("text-", "bg-").replace(/-\d+$/, "/10"),
                  )}
                >
                  <Icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="text-xl font-bold truncate">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Activity Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Časová osa aktivity</h3>
          </div>

          {dateGroups.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <Activity className="h-10 w-10 text-muted-foreground" />
                <div>
                  <p className="font-medium">Žádná aktivita v tomto období</p>
                  <p className="text-sm text-muted-foreground">
                    Zkuste změnit filtr nebo počkejte na nové změny.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {dateGroups.map((group) => (
                <div key={group.label}>
                  <div className="flex items-center gap-3 mb-4">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      {group.label}
                    </h4>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  <div className="relative pl-8 space-y-0">
                    <div className="absolute left-[11px] top-2 bottom-2 w-px bg-border" />

                    {group.entries.map((entry) => {
                      const config = TYPE_CONFIG[entry.type];
                      const Icon = config.icon;

                      return (
                        <div key={entry.id} className="relative pb-5">
                          {/* Timeline dot */}
                          <div
                            className={cn(
                              "absolute -left-[21px] top-1 z-10 flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-background",
                              config.color
                                .split(" ")
                                .find((c) => c.startsWith("bg-")) ?? "bg-muted",
                            )}
                          >
                            <Icon className="h-3 w-3 text-background" />
                          </div>

                          {/* Entry card */}
                          <Card className="rounded-lg transition-colors hover:border-primary/20">
                            <CardContent className="p-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap mb-1">
                                    {entry.projectName && (
                                      <Link
                                        href={`/projects/${encodeURIComponent(entry.projectId ?? "")}`}
                                        className="text-xs font-semibold hover:text-primary transition-colors"
                                      >
                                        {entry.projectName}
                                      </Link>
                                    )}
                                    <span className="text-[10px] text-muted-foreground">
                                      {formatRelative(entry.timestamp)}
                                    </span>
                                  </div>
                                  <p className="text-sm leading-relaxed">
                                    {entry.description}
                                  </p>
                                </div>
                                {entry.metadata?.hash && (
                                  <code className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[11px] font-mono text-muted-foreground">
                                    {shortHash(entry.metadata.hash)}
                                  </code>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar: Project Changes Summary */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Změny projektů</h3>
          </div>

          {projectChangeSummaries.length === 0 ? (
            <Card className="rounded-xl">
              <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
                <GitCommit className="h-8 w-8 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">Žádné commity</p>
                  <p className="text-xs text-muted-foreground">
                    Projekty zatím nemají žádné záznamy o změnách.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {projectChangeSummaries.map((item) => (
                <Link
                  key={item.project.id}
                  href={`/projects/${encodeURIComponent(item.project.id)}`}
                  className="block"
                >
                  <Card className="rounded-xl transition-colors hover:border-primary/20 group">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="h-3 w-3 rounded-full shrink-0"
                            style={{ backgroundColor: item.project.color || "hsl(var(--primary))" }}
                          />
                          <span className="font-semibold text-sm truncate">
                            {item.project.name}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn("text-[10px] shrink-0", getStatusColor(item.project.status))}
                        >
                          {getStatusLabel(item.project.status)}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {item.lastCommitMessage}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <User className="h-3 w-3" />
                          <span>{item.lastCommitAuthor}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          {item.project.commit_count != null && (
                            <span className="flex items-center gap-1">
                              <GitCommit className="h-3 w-3" />
                              {item.project.commit_count}
                            </span>
                          )}
                          <span className="flex items-center gap-1 group-hover:text-primary transition-colors">
                            {item.timeSinceChange}
                            <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs gap-1"
                asChild
              >
                <Link href="/projects">
                  Všechny projekty
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          )}

          <Separator />

          {/* Recent Commits - Terminal style */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Terminal className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Poslední commity</h3>
            </div>

            {recentCommits.length === 0 ? (
              <Card className="rounded-xl">
                <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                  <Terminal className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Žádné commity</p>
                    <p className="text-xs text-muted-foreground">
                      Projekty zatím nemají commit historii.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="rounded-xl bg-black/50 border border-border font-mono text-xs overflow-hidden">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-black/70 border-b border-border/50">
                  <div className="h-2.5 w-2.5 rounded-full bg-rose-500/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
                  <span className="ml-2 text-[10px] text-muted-foreground">
                    git log --oneline
                  </span>
                </div>
                <div className="divide-y divide-border/30">
                  {recentCommits.slice(0, 12).map(({ project, commit }) => (
                    <div
                      key={`${project.id}-${commit.hash}`}
                      className="flex items-start gap-2 px-3 py-2 hover:bg-white/[0.03] transition-colors"
                    >
                      <span className="text-amber-400 shrink-0">
                        {shortHash(commit.hash)}
                      </span>
                      <Link
                        href={`/projects/${encodeURIComponent(project.id)}`}
                        className="shrink-0 rounded bg-accent/50 px-1 text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {project.name}
                      </Link>
                      <span className="text-emerald-300/80 truncate flex-1 min-w-0">
                        {commit.message}
                      </span>
                      <span className="text-muted-foreground shrink-0 text-[10px]">
                        {formatRelative(commit.date)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* File Changes (if available via commit info) */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Code2 className="h-5 w-5 text-muted-foreground" />
              <h3 className="text-lg font-semibold">Změny souborů</h3>
            </div>

            {projects.filter((p) => p.last_commit).length === 0 ? (
              <Card className="rounded-xl">
                <CardContent className="flex flex-col items-center gap-3 py-8 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Žádné změny souborů</p>
                    <p className="text-xs text-muted-foreground">
                      Nejsou dostupné informace o změněných souborech.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {projects
                  .filter((p) => p.last_commit)
                  .slice(0, 5)
                  .map((project) => (
                    <Card key={project.id} className="rounded-lg">
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: project.color || "hsl(var(--primary))" }}
                          />
                          <Link
                            href={`/projects/${encodeURIComponent(project.id)}`}
                            className="text-xs font-semibold hover:text-primary transition-colors"
                          >
                            {project.name}
                          </Link>
                          <span className="text-[10px] text-muted-foreground">
                            {formatRelative(project.lastActivity)}
                          </span>
                        </div>
                        {project.last_commit && (
                          <div className="rounded-md bg-accent/30 border border-border/50 p-2 font-mono text-[11px] text-muted-foreground space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-emerald-400">+</span>
                              <span className="text-emerald-300/70">
                                commit {shortHash(project.last_commit.hash)}
                              </span>
                            </div>
                            <div className="pl-4 text-muted-foreground/70">
                              {project.last_commit.message}
                            </div>
                            <div className="pl-4 text-[10px] text-muted-foreground/50">
                              {project.last_commit.author} ·{" "}
                              {new Date(project.last_commit.date).toLocaleDateString("cs-CZ")}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-12">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-5 w-96" />
        </div>
      </div>

      <Skeleton className="h-9 w-48 rounded-lg" />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-6 w-48" />
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                <Skeleton className="h-20 flex-1 rounded-lg" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-6 w-40" />
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}
