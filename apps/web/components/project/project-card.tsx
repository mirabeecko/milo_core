import { FileText, FolderKanban, Timer, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  formatRelative,
  getPriorityColor,
  getPriorityLabel,
  getStatusColor,
  getStatusLabel,
} from "@/lib/format";
import type { Project } from "@/lib/types";
import { StatusBadge } from "@/components/common/status-badge";
import { cn } from "@/lib/utils";

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps): JSX.Element {
  return (
    <Card className="transition-colors hover:border-primary/30">
      <CardContent className="p-5">
        <div className="flex items-start gap-4">
          <div className={cn("h-10 w-2 shrink-0 rounded-full", project.color)} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-lg font-semibold">{project.name}</h3>
              <StatusBadge value={project.status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-2.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <TrendingUp className="h-3.5 w-3.5" />
                  Priorita
                </div>
                <StatusBadge value={project.priority} variant="priority" className="mt-1" />
              </div>
              <div className="rounded-lg border border-border p-2.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Timer className="h-3.5 w-3.5" />
                  Poslední aktivita
                </div>
                <p className="mt-1 text-xs font-medium">{formatRelative(project.lastActivity)}</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <FolderKanban className="h-4 w-4" />
                {project.openTasks} úkolů
              </span>
              <span className="flex items-center gap-1.5">
                <FileText className="h-4 w-4" />
                {project.documents} dokumentů
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
