"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  FolderKanban,
  GitCommit,
  Github,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Target,
  DollarSign,
  Timer,
  FileText,
  ExternalLink,
  Calendar,
  BarChart3,
  Zap,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { StatusBadge } from "@/components/common/status-badge";
import { getProject } from "@/lib/api/projects.api";
import type { Project } from "@/lib/types";
import { cn } from "@/lib/utils";
import { formatDate, formatRelative } from "@/lib/format";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [notFound, setNotFound] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      setError(null);
      setNotFound(false);
      const data = await getProject(id);
      setProject(data);
    } catch (err: unknown) {
      const apiErr = err as { status?: number };
      if (apiErr?.status === 404) {
        setNotFound(true);
      } else {
        setError(
          err instanceof Error
            ? err
            : new Error("Nepodařilo se načíst projekt"),
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [id]);

  if (isLoading) return <ProjectDetailSkeleton />;

  if (notFound) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Button variant="ghost" size="sm" className="gap-2" asChild>
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" /> Zpět na projekty
          </Link>
        </Button>
        <EmptyState
          variant="error"
          title="Projekt nenalezen"
          description="Projekt s tímto ID neexistuje nebo byl smazán."
          action={
            <Button asChild>
              <Link href="/projects">Zpět na projekty</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Button variant="ghost" size="sm" className="gap-2" asChild>
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" /> Zpět na projekty
          </Link>
        </Button>
        <EmptyState
          variant="error"
          title="Nepodařilo se načíst projekt"
          description={error?.message || "Neznámá chyba"}
          action={
            <Button onClick={load} className="gap-2">
              <RefreshCw className="h-4 w-4" /> Zkusit znovu
            </Button>
          }
        />
      </div>
    );
  }

  const timeProgress = project.time_estimate_hours
    ? Math.round(
        ((project.time_spent_hours || 0) / project.time_estimate_hours) * 100,
      )
    : 0;

  const costProgress = project.cost_estimate
    ? Math.round(((project.cost_spent || 0) / project.cost_estimate) * 100)
    : 0;

  const completionProgress =
    project.status === "completed"
      ? 100
      : timeProgress > 0
        ? timeProgress
        : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-2" asChild>
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" /> Zpět na projekty
          </Link>
        </Button>
      </div>

      <PageHeader title={project.name} description={project.description}>
        <div className="flex items-center gap-2">
          <StatusBadge value={project.status} variant="status" />
          <StatusBadge value={project.priority} variant="priority" />
          {project.github_url && (
            <Button variant="outline" size="sm" className="gap-1.5" asChild>
              <Link
                href={project.github_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="h-4 w-4" /> GitHub
              </Link>
            </Button>
          )}
        </div>
      </PageHeader>

      {project.color && (
        <div
          className="h-1.5 rounded-full"
          style={{ backgroundColor: project.color }}
        />
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FolderKanban}
          title="Otevřené úkoly"
          value={project.openTasks}
          subtitle="aktivních úkolů"
        />
        <StatCard
          icon={FileText}
          title="Dokumenty"
          value={project.documents}
          subtitle="dokumentů"
        />
        <StatCard
          icon={GitCommit}
          title="Commitů"
          value={project.commit_count || 0}
          subtitle="změn"
        />
        <StatCard
          icon={Clock}
          title="Poslední aktivita"
          value={formatRelative(project.lastActivity)}
          subtitle={formatDate(project.lastActivity)}
          isTextValue
        />
      </div>

      {project.goal && (
        <Card
          className="rounded-xl border-l-4"
          style={{
            borderLeftColor: project.color || "hsl(var(--primary))",
          }}
        >
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="h-4 w-4" /> Cíl projektu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed">{project.goal}</p>
          </CardContent>
        </Card>
      )}

      <Card className="rounded-xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BarChart3 className="h-4 w-4" /> Progress
          </CardTitle>
          <CardDescription>Celkový postup projektu</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>{completionProgress}% dokončeno</span>
            <span className="text-muted-foreground">
              {project.status === "completed" ? "Dokončeno" : "V průběhu"}
            </span>
          </div>
          <Progress value={completionProgress} className="h-2.5" />
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="w-full max-w-md">
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="h-4 w-4" /> Přehled
          </TabsTrigger>
          <TabsTrigger value="activity" className="gap-1.5">
            <GitCommit className="h-4 w-4" /> Aktivita
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5">
            <FileText className="h-4 w-4" /> Dokumenty
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          {project.done_summary && (
            <Card className="rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Co
                  je hotovo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {project.done_summary}
                </div>
              </CardContent>
            </Card>
          )}

          {project.remaining_summary && (
            <Card className="rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4 text-amber-500" /> Co
                  zbývá
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm leading-relaxed whitespace-pre-wrap">
                  {project.remaining_summary}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {(project.time_spent_hours != null ||
              project.time_estimate_hours != null) && (
              <Card className="rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Timer className="h-4 w-4" /> Čas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold">
                      {project.time_spent_hours || 0}h
                    </span>
                    <span className="text-sm text-muted-foreground">
                      z {project.time_estimate_hours || "?"}h odhadu
                    </span>
                  </div>
                  {project.time_estimate_hours ? (
                    <>
                      <Progress value={timeProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {timeProgress}% vyčerpáno
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Časový odhad není nastaven
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {(project.cost_spent != null ||
              project.cost_estimate != null) && (
              <Card className="rounded-xl">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <DollarSign className="h-4 w-4" /> Náklady
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-baseline justify-between">
                    <span className="text-2xl font-bold">
                      {new Intl.NumberFormat("cs-CZ").format(
                        project.cost_spent || 0,
                      )}{" "}
                      Kč
                    </span>
                    <span className="text-sm text-muted-foreground">
                      z{" "}
                      {project.cost_estimate
                        ? `${new Intl.NumberFormat("cs-CZ").format(project.cost_estimate)} Kč`
                        : "?"}{" "}
                      rozpočtu
                    </span>
                  </div>
                  {project.cost_estimate ? (
                    <>
                      <Progress value={costProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground">
                        {costProgress}% vyčerpáno
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Rozpočet není nastaven
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {(project.last_commit ||
            project.github_url ||
            project.commit_count != null) && (
            <Card className="rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <GitCommit className="h-4 w-4" /> Git informace
                </CardTitle>
                <CardDescription>
                  {project.commit_count != null &&
                    `${project.commit_count} commitů`}
                  {project.github_url && (
                    <Link
                      href={project.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 inline-flex items-center gap-1 text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3" /> repozitář
                    </Link>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {project.last_commit ? (
                  <div className="rounded-lg bg-black/50 border border-border p-4 font-mono text-sm space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-400 shrink-0 mt-0.5">
                        commit
                      </span>
                      <span className="text-amber-300">
                        {project.last_commit.hash}
                      </span>
                    </div>
                    <div className="text-emerald-300 leading-relaxed">
                      {project.last_commit.message}
                    </div>
                    <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                      <span>
                        Author:{" "}
                        <span className="text-blue-400">
                          {project.last_commit.author}
                        </span>
                      </span>
                      <span>
                        Date:{" "}
                        <span className="text-purple-400">
                          {formatDate(project.last_commit.date)}
                        </span>
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Žádné informace o commitech
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" /> Poslední aktivita
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {formatDate(project.lastActivity)}{" "}
                <span className="text-muted-foreground">
                  ({formatRelative(project.lastActivity)})
                </span>
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6 mt-6">
          {project.last_commit ? (
            <Card className="rounded-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <GitCommit className="h-4 w-4" /> Poslední commit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg bg-black/50 border border-border p-4 font-mono text-sm space-y-2">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 shrink-0 mt-0.5">
                      commit
                    </span>
                    <span className="text-amber-300">
                      {project.last_commit.hash}
                    </span>
                  </div>
                  <div className="text-emerald-300 leading-relaxed">
                    {project.last_commit.message}
                  </div>
                  <div className="flex flex-wrap gap-x-4 text-xs text-muted-foreground">
                    <span>
                      Author:{" "}
                      <span className="text-blue-400">
                        {project.last_commit.author}
                      </span>
                    </span>
                    <span>
                      Date:{" "}
                      <span className="text-purple-400">
                        {formatDate(project.last_commit.date)}
                      </span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <EmptyState
              title="Žádná aktivita"
              description="Pro tento projekt nejsou dostupné informace o commitech."
              icon={<GitCommit className="h-10 w-10 text-muted-foreground" />}
            />
          )}

          {project.commit_count != null && project.commit_count > 0 && (
            <Card className="rounded-xl">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-4 w-4" /> Statistiky commitů
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold">
                      {project.commit_count}
                    </p>
                    <p className="text-xs text-muted-foreground">commitů</p>
                  </div>
                  {project.github_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      asChild
                    >
                      <Link
                        href={project.github_url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Github className="h-4 w-4" /> Zobrazit na GitHubu
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="rounded-xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" /> Poslední aktivita projektu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">
                {formatDate(project.lastActivity)}{" "}
                <span className="text-muted-foreground">
                  ({formatRelative(project.lastActivity)})
                </span>
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents" className="space-y-6 mt-6">
          <Card className="rounded-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" /> Dokumenty projektu
              </CardTitle>
              <CardDescription>
                Dokumenty přiřazené k tomuto projektu
              </CardDescription>
            </CardHeader>
            <CardContent>
              {project.documents > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-accent/50 border border-border">
                      <FileText className="h-7 w-7 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">
                        {project.documents}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        dokumentů celkem
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <p className="text-sm text-muted-foreground">
                    Dokumenty pocházejí z propojených zdrojů (Obsidian, Google
                    Drive, ISDS, uploady). Kompletní přehled a vyhledávání
                    najdete v sekci{" "}
                    <Link
                      href="/documents"
                      className="text-primary hover:underline"
                    >
                      Dokumenty
                    </Link>
                    .
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Žádné dokumenty</p>
                    <p className="text-sm text-muted-foreground">
                      K tomuto projektu zatím nejsou přiřazeny žádné dokumenty.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProjectDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Skeleton className="h-8 w-32" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
      <Skeleton className="h-1.5 w-full rounded-full" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-10 w-64 rounded-md" />
      <div className="grid gap-6 md:grid-cols-2">
        <Skeleton className="h-36 rounded-xl" />
        <Skeleton className="h-36 rounded-xl" />
      </div>
      <Skeleton className="h-40 rounded-xl" />
    </div>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  subtitle,
  isTextValue = false,
}: {
  icon: React.ElementType;
  title: string;
  value: string | number;
  subtitle: string;
  isTextValue?: boolean;
}) {
  return (
    <Card className="rounded-xl">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/50 border border-border">
          <Icon className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{title}</p>
          <p
            className={cn(
              "font-bold truncate",
              isTextValue ? "text-sm" : "text-xl",
            )}
          >
            {value}
          </p>
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  );
}
