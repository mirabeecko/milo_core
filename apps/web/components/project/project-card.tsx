"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FolderKanban,
  FileText,
  GitCommit,
  Clock,
  TrendingUp,
  ChevronDown,
  ExternalLink,
  Pencil,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { formatRelative } from "@/lib/format";
import type { Project } from "@/lib/types";

interface ProjectCardProps {
  project: Project;
  onDelete?: (id: string) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps): JSX.Element {
  const [expanded, setExpanded] = useState(false);

  const statusColors: Record<string, string> = {
    active: "text-emerald-500 border-emerald-500/30 bg-emerald-500/5",
    paused: "text-amber-500 border-amber-500/30 bg-amber-500/5",
    on_hold: "text-amber-500 border-amber-500/30 bg-amber-500/5",
    completed: "text-blue-500 border-blue-500/30 bg-blue-500/5",
    done: "text-blue-500 border-blue-500/30 bg-blue-500/5",
    archived: "text-muted-foreground border-border",
  };

  const priorityColors: Record<string, string> = {
    critical: "text-rose-500",
    important: "text-amber-500",
    normal: "text-blue-500",
    low: "text-muted-foreground",
  };

  const statusLabel: Record<string, string> = {
    active: "Aktivní",
    paused: "Pozastaveno",
    on_hold: "Pozastaveno",
    completed: "Dokončeno",
    done: "Dokončeno",
    archived: "Archivováno",
  };

  const priorityLabel: Record<string, string> = {
    critical: "Kritická",
    important: "Důležitá",
    normal: "Normální",
    low: "Nízká",
  };

  const progress = project.time_estimate_hours
    ? Math.round(((project.time_spent_hours || 0) / project.time_estimate_hours) * 100)
    : (project.commit_count || 0) > 0
      ? Math.min(Math.round((project.commit_count || 0) / 5), 100)
      : 0;

  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all hover:shadow-md",
        expanded && "ring-1 ring-primary/20",
      )}
    >
      {/* Color bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1.5"
        style={{ backgroundColor: project.color || "hsl(var(--primary))" }}
      />

      <CardContent className="p-4 pl-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-semibold truncate">{project.name}</h3>
              {project.github_url && (
                <Link
                  href={project.github_url}
                  target="_blank"
                  className="text-muted-foreground hover:text-primary shrink-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              )}
            </div>
            {project.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {project.description}
              </p>
            )}
          </div>
          <Badge
            variant="outline"
            className={cn("text-xs shrink-0", statusColors[project.status] || statusColors.active)}
          >
            {statusLabel[project.status] || project.status}
          </Badge>
        </div>

        {/* Goal */}
        {project.goal && (
          <div className="rounded-lg border border-border bg-accent/30 p-2.5 mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-0.5">
              Cíl
            </p>
            <p className="text-sm">{project.goal}</p>
          </div>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <StatBadge
            icon={GitCommit}
            label="Commitů"
            value={(project.commit_count || 0).toLocaleString("cs-CZ")}
          />
          <StatBadge
            icon={Clock}
            label="Čas"
            value={`${project.time_spent_hours || 0}h`}
          />
          <StatBadge
            icon={FolderKanban}
            label="Úkoly"
            value={String(project.openTasks || 0)}
          />
        </div>

        {/* Progress */}
        <div className="space-y-1 mb-3">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progress</span>
            <span>{Math.min(progress, 100)}%</span>
          </div>
          <Progress value={Math.min(progress, 100)} className="h-1.5" />
        </div>

        {/* Tags row */}
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <Badge
            variant="outline"
            className={cn("text-xs", priorityColors[project.priority] || "text-muted-foreground")}
          >
            {priorityLabel[project.priority] || project.priority}
          </Badge>
          {project.lastActivity && (
            <span className="text-xs text-muted-foreground">
              {formatRelative(project.lastActivity)}
            </span>
          )}
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-border space-y-3 animate-in slide-in-from-top-2">
            {project.done_summary && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Hotovo
                </p>
                <p className="text-sm mt-0.5">{project.done_summary}</p>
              </div>
            )}
            {project.remaining_summary && (
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Zbývá
                </p>
                <p className="text-sm mt-0.5">{project.remaining_summary}</p>
              </div>
            )}
            {project.last_commit && (
              <div className="rounded-lg border border-border bg-accent/30 p-2.5">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Poslední commit
                </p>
                <p className="text-sm font-medium mt-0.5 truncate">
                  {project.last_commit.message}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {project.last_commit.author} · {formatRelative(project.last_commit.date)}
                </p>
              </div>
            )}
            {project.cost_spent && project.cost_spent > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Náklady:</span>
                <span className="font-medium">{project.cost_spent} Kč</span>
                {project.cost_estimate && project.cost_estimate > 0 && (
                  <span className="text-muted-foreground">
                    / {project.cost_estimate} Kč odhad
                  </span>
                )}
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1" asChild>
                <Link href={`/projects?id=${encodeURIComponent(project.id)}`}>
                  <Pencil className="h-3 w-3" />
                  Detail
                </Link>
              </Button>
              {onDelete && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1 text-destructive hover:bg-destructive/10"
                  onClick={() => onDelete(project.id)}
                >
                  <Trash2 className="h-3 w-3" />
                  Smazat
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Expand toggle */}
        {(project.done_summary || project.remaining_summary || project.last_commit) && (
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-2 h-7 text-xs text-muted-foreground"
            onClick={() => setExpanded(!expanded)}
          >
            <ChevronDown
              className={cn("h-3 w-3 mr-1 transition-transform", expanded && "rotate-180")}
            />
            {expanded ? "Méně" : "Více informací"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function StatBadge({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}): JSX.Element {
  return (
    <div className="flex flex-col items-center rounded-lg border border-border bg-accent/30 p-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mb-0.5" />
      <span className="text-sm font-semibold">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
