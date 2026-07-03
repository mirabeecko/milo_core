"use client";

import { FileText, FolderKanban, Plus, Timer, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { projects } from "@/lib/mocks";
import { formatRelative, getPriorityColor, getPriorityLabel, getStatusColor, getStatusLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function ProjectsPage(): JSX.Element {
  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
            <p className="text-muted-foreground">Přehled projektů a jejich aktuálního stavu.</p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Nový projekt
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="transition-colors hover:border-primary/30">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className={cn("h-10 w-2 shrink-0 rounded-full", project.color)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold">{project.name}</h3>
                      <Badge variant="outline" className={cn("text-xs", getStatusColor(project.status))}>
                        {getStatusLabel(project.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{project.description}</p>
                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div className="rounded-lg border border-border p-2.5">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <TrendingUp className="h-3.5 w-3.5" />
                          Priorita
                        </div>
                        <Badge
                          variant="outline"
                          className={cn("mt-1 text-xs", getPriorityColor(project.priority))}
                        >
                          {getPriorityLabel(project.priority)}
                        </Badge>
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
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
