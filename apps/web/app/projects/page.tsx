"use client";

import { useEffect, useState } from "react";
import { Plus, RefreshCw, Search, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectCard } from "@/components/project/project-card";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { getProjects, scanProjects } from "@/lib/api/projects.api";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";

const statuses = ["all", "active", "on_hold", "completed", "archived"] as const;

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [filtered, setFiltered] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [scanning, setScanning] = useState(false);

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getProjects();
      setProjects(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Nepodařilo se načíst projekty"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => void load(), []);

  useEffect(() => {
    let result = projects;
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (search.trim()) {
      const lower = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.description.toLowerCase().includes(lower),
      );
    }
    setFiltered(result);
  }, [projects, search, statusFilter]);

  const handleScan = async () => {
    setScanning(true);
    try {
      await scanProjects();
      await load();
    } catch {
      // ignore
    } finally {
      setScanning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        variant="error"
        title="Nepodařilo se načíst projekty"
        description={error.message}
        action={
          <Button onClick={() => void load()} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Zkusit znovu
          </Button>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <PageHeader title="Projekty" description="Všechny projekty a jejich stav">
        <Button onClick={handleScan} disabled={scanning} variant="outline" className="gap-2">
          <RefreshCw className={cn("h-4 w-4", scanning && "animate-spin")} />
          {scanning ? "Skenuji..." : "Skenovat projekty"}
        </Button>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Nový projekt
        </Button>
      </PageHeader>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Hledat projekty..."
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {statuses.map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
            >
              {s === "all" ? "Vše" : s === "on_hold" ? "Pozastavené" : s === "completed" ? "Dokončené" : s === "archived" ? "Archivované" : "Aktivní"}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="Žádné projekty"
          description={search ? "Zkuste upravit filtr nebo hledání." : "Zatím nejsou žádné projekty."}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
