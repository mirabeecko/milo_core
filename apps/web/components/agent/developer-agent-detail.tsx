"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Code2,
  GitBranch,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Terminal,
  Bug,
  Shield,
  Activity,
  FileCode,
  Layers,
  Package,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAgentDeveloperState, syncAgentDeveloper } from "@/lib/api/agents.api";
import type { Agent, DeveloperAgentState, ProjectIssue, CodeReviewFinding, GitCommit } from "@/lib/types";
import { formatDuration, formatRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

interface DeveloperAgentDetailProps {
  agent: Agent;
}

export function DeveloperAgentDetail({ agent }: DeveloperAgentDetailProps): JSX.Element {
  const [state, setState] = useState<DeveloperAgentState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const data = await getAgentDeveloperState(agent.id);
      setState(data);
    } catch {
      setState(null);
    } finally {
      setIsLoading(false);
    }
  }, [agent.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSync(): Promise<void> {
    const result = await syncAgentDeveloper(agent.id);
    setState(result.state);
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Načítám stav vývojáře...</p>;
  }

  if (!state) {
    return <p className="text-sm text-muted-foreground">Nepodařilo se načíst stav Developer Agenta.</p>;
  }

  const stats = state.stats;
  const score = state.architectureScore;
  const git = state.git;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Developer Agent</h3>
          <p className="text-sm text-muted-foreground">
            {stats ? `${stats.totalFiles} souborů · ${stats.totalLines.toLocaleString()} řádků` : "Analýza neproběhla"}
            {" · "}Poslední sync: {state.lastSyncedAt ? formatRelative(state.lastSyncedAt) : "nikdy"}
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => void handleSync()}>
          <RefreshCw className="h-4 w-4" /> Synchronizovat
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={<FileCode className="h-4 w-4" />} label="Souborů" value={stats?.totalFiles ?? 0} />
        <MetricCard icon={<Layers className="h-4 w-4" />} label="Řádků kódu" value={stats?.codeLines.toLocaleString() ?? 0} />
        <MetricCard icon={<Bug className="h-4 w-4" />} label="Technický dluh" value={state.technicalDebt} />
        <MetricCard icon={<Shield className="h-4 w-4" />} label="Architektura" value={`${score?.overall ?? 0}/100`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <BuildStatusCard title="Lint" result={state.lint} icon={<Terminal className="h-4 w-4" />} />
        <BuildStatusCard title="Build" result={state.build} icon={<Activity className="h-4 w-4" />} />
        <BuildStatusCard title="Testy" result={state.tests} icon={<CheckCircle className="h-4 w-4" />} />
      </div>

      {score && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="h-4 w-4" />
              Architektonické skóre
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span>Celkové skóre</span>
              <span className="font-semibold">{score.overall} / 100</span>
            </div>
            <Progress value={score.overall} className="h-2" />
            <div className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
              <ScoreRow label="Clean Architecture" value={score.cleanArchitecture} />
              <ScoreRow label="DRY" value={score.dry} />
              <ScoreRow label="SOLID" value={score.solid} />
              <ScoreRow label="Type Safety" value={score.typeSafety} />
              <ScoreRow label="Naming" value={score.naming} />
              <ScoreRow label="Performance" value={score.performance} />
              <ScoreRow label="Security" value={score.security} />
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="issues">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="issues" className="gap-2">
            <AlertTriangle className="h-4 w-4" /> Problémy
          </TabsTrigger>
          <TabsTrigger value="findings" className="gap-2">
            <Code2 className="h-4 w-4" /> Nálezy
          </TabsTrigger>
          <TabsTrigger value="git" className="gap-2">
            <GitBranch className="h-4 w-4" /> Git
          </TabsTrigger>
          <TabsTrigger value="languages" className="gap-2">
            <Package className="h-4 w-4" /> Jazyky
          </TabsTrigger>
          <TabsTrigger value="packages" className="gap-2">
            <Layers className="h-4 w-4" /> Balíčky
          </TabsTrigger>
        </TabsList>
        <TabsContent value="issues">
          <IssuesList issues={state.issues} />
        </TabsContent>
        <TabsContent value="findings">
          <FindingsList findings={state.findings} />
        </TabsContent>
        <TabsContent value="git">
          <GitInfoCard git={git} />
        </TabsContent>
        <TabsContent value="languages">
          <LanguagesCard languages={stats?.languages ?? {}} />
        </TabsContent>
        <TabsContent value="packages">
          <PackagesCard packages={stats?.packages ?? []} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function MetricCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }): JSX.Element {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 p-4">
        <div className="text-muted-foreground">{icon}</div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="font-semibold">{value}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreRow({ label, value }: { label: string; value: number }): JSX.Element {
  return (
    <div className="flex items-center justify-between rounded-md border p-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={cn("font-medium", value < 60 && "text-rose-500", value >= 80 && "text-emerald-500")}>{value}</span>
    </div>
  );
}

function BuildStatusCard({
  title,
  result,
  icon,
}: {
  title: string;
  result?: DeveloperAgentState["build"] | DeveloperAgentState["lint"] | DeveloperAgentState["tests"];
  icon: React.ReactNode;
}): JSX.Element {
  const status = result?.status ?? "unknown";
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="text-muted-foreground">{icon}</div>
          <div>
            <div className="text-xs text-muted-foreground">{title}</div>
            <div className="font-semibold">{statusLabel(status)}</div>
          </div>
        </div>
        {status === "success" && <CheckCircle className="h-5 w-5 text-emerald-500" />}
        {status === "failure" && <XCircle className="h-5 w-5 text-rose-500" />}
        {status === "running" && <Activity className="h-5 w-5 text-amber-500 animate-pulse" />}
        {status === "unknown" && <Terminal className="h-5 w-5 text-slate-500" />}
      </CardContent>
      {result && "durationMs" in result && result.durationMs !== undefined && (
        <div className="border-t px-4 py-2 text-xs text-muted-foreground">
          Trvání: {formatDuration(result.durationMs)}
        </div>
      )}
    </Card>
  );
}

function IssuesList({ issues }: { issues: ProjectIssue[] }): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Architektonické problémy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {issues.length === 0 ? (
          <p className="text-sm text-muted-foreground">Žádné problémy nebyly detekovány.</p>
        ) : (
          issues.map((issue) => (
            <div key={issue.id} className="rounded-lg border p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="font-medium">{issue.title}</div>
                <Badge variant="outline" className={severityColor(issue.severity)}>{severityLabel(issue.severity)}</Badge>
              </div>
              <p className="mt-1 text-muted-foreground">{issue.description}</p>
              {issue.suggestedFix && <p className="mt-1 text-xs">💡 {issue.suggestedFix}</p>}
              <div className="mt-2 text-xs text-muted-foreground">Kategorie: {issue.category}</div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function FindingsList({ findings }: { findings: CodeReviewFinding[] }): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Code review nálezy</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {findings.length === 0 ? (
          <p className="text-sm text-muted-foreground">Žádné nálezy z code review.</p>
        ) : (
          findings.slice(0, 50).map((finding) => (
            <div key={finding.id} className="rounded-lg border p-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="font-medium">{finding.rule}</div>
                <Badge variant="outline" className={severityColor(finding.severity)}>{severityLabel(finding.severity)}</Badge>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{finding.filePath}</p>
              <p className="mt-1">{finding.message}</p>
              <p className="mt-1 text-xs">💡 {finding.suggestion}</p>
              <div className="mt-2 text-xs text-muted-foreground">Kategorie: {finding.category}</div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function GitInfoCard({ git }: { git?: DeveloperAgentState["git"] }): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Git informace</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!git ? (
          <p className="text-sm text-muted-foreground">Git informace nejsou dostupné.</p>
        ) : (
          <>
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <div className="text-xs text-muted-foreground">Aktivní branch</div>
                <div className="font-medium">{git.branch}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Počet commitů</div>
                <div className="font-medium">{git.commitCount}</div>
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Poslední commit</div>
              <CommitRow commit={git.lastCommit} />
            </div>
            {git.lastMerge && (
              <div>
                <div className="text-xs text-muted-foreground">Poslední merge</div>
                <CommitRow commit={git.lastMerge} />
              </div>
            )}
            <div>
              <div className="text-xs text-muted-foreground">Nedávné commity</div>
              <div className="mt-2 space-y-2">
                {git.recentCommits.slice(1, 6).map((commit) => (
                  <CommitRow key={commit.hash} commit={commit} />
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function CommitRow({ commit }: { commit: GitCommit }): JSX.Element {
  return (
    <div className="rounded-md border p-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs text-muted-foreground">{commit.hash.slice(0, 7)}</span>
        <span className="text-xs text-muted-foreground">{commit.author}</span>
      </div>
      <p className="mt-0.5">{commit.message}</p>
      <p className="text-xs text-muted-foreground">{commit.date ? formatRelative(commit.date) : "—"}</p>
    </div>
  );
}

function LanguagesCard({ languages }: { languages: Record<string, number> }): JSX.Element {
  const entries = Object.entries(languages).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, lines]) => sum + lines, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Jazyky</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">Žádné jazykové statistiky.</p>
        ) : (
          entries.map(([language, lines]) => (
            <div key={language} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <span>{language}</span>
                <span className="text-muted-foreground">{lines.toLocaleString()} řádků ({total > 0 ? Math.round((lines / total) * 100) : 0}%)</span>
              </div>
              <Progress value={total > 0 ? (lines / total) * 100 : 0} className="h-1.5" />
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function PackagesCard({ packages }: { packages: string[] }): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Balíčky</CardTitle>
      </CardHeader>
      <CardContent>
        {packages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Žádné balíčky nebyly nalezeny.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {packages.map((pkg) => (
              <Badge key={pkg} variant="secondary">{pkg}</Badge>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case "success":
      return "Úspěšné";
    case "failure":
      return "Selhalo";
    case "running":
      return "Běží";
    default:
      return "Neznámé";
  }
}

function severityLabel(severity: ProjectIssue["severity"]): string {
  switch (severity) {
    case "critical":
      return "Kritické";
    case "high":
      return "Vysoké";
    case "medium":
      return "Střední";
    case "low":
      return "Nízké";
    default:
      return severity;
  }
}

function severityColor(severity: ProjectIssue["severity"]): string {
  switch (severity) {
    case "critical":
      return "border-rose-500/30 bg-rose-500/10 text-rose-500";
    case "high":
      return "border-amber-500/30 bg-amber-500/10 text-amber-500";
    case "medium":
      return "border-blue-500/30 bg-blue-500/10 text-blue-500";
    case "low":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-500";
    default:
      return "border-border";
  }
}
