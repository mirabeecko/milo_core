"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2, Circle, Sparkles, Cog, Bot, Workflow,
  GitBranch, BookOpen, TestTube, Rocket, RefreshCw,
  FileText, Download, Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/common/page-header";
import { Skeleton } from "@/components/ui/skeleton";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface ControlAgent {
  id: string;
  slug: string;
  name: string;
  description: string;
  purpose: string;
  category: string;
  owner: string;
  status: string;
  lifecycle_status: string;
  risk_level: string;
  priority: string;
  implementation_progress: number;
  runtime_status: string;
  created_at: string;
  updated_at: string;
}

/* ------------------------------------------------------------------ */
/*  Status indicators                                                  */
/* ------------------------------------------------------------------ */

function agentStatusLabel(agent: ControlAgent): string {
  const p = agent.implementation_progress;
  if (p >= 100) return "Dokončeno";
  if (p >= 60) return "Implementuje se";
  if (p >= 30) return "Ve vývoji";
  if (p > 0) return "Zahájeno";
  return "Specifikováno";
}

function agentStatusVariant(agent: ControlAgent): "default" | "secondary" | "outline" {
  const p = agent.implementation_progress;
  if (p >= 100) return "default";
  if (p >= 60) return "default";
  return "outline";
}

function hasConfig(agent: ControlAgent): boolean {
  return agent.lifecycle_status !== "specified" || agent.implementation_progress > 0;
}

function hasTools(agent: ControlAgent): boolean {
  return agent.implementation_progress >= 50;
}

function hasDocs(agent: ControlAgent): boolean {
  return agent.implementation_progress >= 30;
}

const principles = [
  {
    title: "Deterministická konfigurace",
    description:
      "Každý agent má předvídatelnou a replikovatelnou konfiguraci, která je definována deklarativně a verzována.",
    icon: Cog,
  },
  {
    title: "Automatická dokumentace",
    description:
      "Dokumentace agentů je generována automaticky z jejich definic – AGENTS.md, CLAUDE.md a .cursorrules.",
    icon: FileText,
  },
  {
    title: "Standardizované nástroje",
    description:
      "Všichni agenti používají jednotné rozhraní nástrojů a MCP serverů, což zajišťuje konzistenci napříč celým systémem.",
    icon: Workflow,
  },
  {
    title: "Verzování konfigurací",
    description:
      "Konfigurace agentů, včetně promptů, je verzována v gitu pro týmovou spolupráci a auditovatelnost.",
    icon: GitBranch,
  },
  {
    title: "Testovatelnost agentů",
    description:
      "Každý agent podporuje unit testy, evaluace a scenario testy podle Agent Testing Pyramid metodiky.",
    icon: TestTube,
  },
];

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function BetterAgentsPage() {
  const [agents, setAgents] = useState<ControlAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("http://127.0.0.1:4000/executive/control/agents");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setAgents(data.agents || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Nepodařilo se načíst agenty");
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, []);

  const configStatus = [
    { label: "Agentů celkem", value: `${agents.length}`, status: "configured" as const, icon: Bot },
    { label: "Výkonných", value: `${agents.filter((a) => a.category === "executive").length}`, status: "configured" as const, icon: Cog },
    { label: "Design", value: `${agents.filter((a) => a.category === "design").length}`, status: "configured" as const, icon: Workflow },
    { label: "Dokončeno", value: `${agents.filter((a) => a.implementation_progress >= 100).length}`, status: "configured" as const, icon: CheckCircle2 },
    { label: "Ve vývoji", value: `${agents.filter((a) => a.implementation_progress > 0 && a.implementation_progress < 100).length}`, status: "configured" as const, icon: GitBranch },
    { label: "Specifikováno", value: `${agents.filter((a) => a.implementation_progress === 0).length}`, status: "configured" as const, icon: BookOpen },
  ];

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <PageHeader
          title="Better Agents"
          description="Integrace frameworku Better Agents pro vylepšenou konfiguraci a správu agentů"
        />
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline" className="gap-2">
              <RefreshCw className="h-4 w-4" /> Zkusit znovu
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Better Agents"
        description="Integrace frameworku Better Agents pro vylepšenou konfiguraci a správu agentů"
      >
        <Badge variant="outline" className="gap-1.5">
          <Sparkles className="h-3 w-3 text-amber-400" />
          v0.2.0
        </Badge>
      </PageHeader>

      {/* What is Better Agents */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle>Co je Better Agents</CardTitle>
          </div>
          <CardDescription>
            Better Agents je CLI nástroj a sada standardů pro tvorbu produkčních AI agentů.
            Poskytuje automatickou konfiguraci, generování dokumentace a nastavení nástrojů
            včetně MCP serverů. V rámci MiLO zajišťuje, že každý agent má konzistentní
            a profesionální vývojové prostředí.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle>Stav konfigurace</CardTitle>
          </div>
          <CardDescription>
            Přehled aktuálního stavu agentů v MiLO Control Center
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {configStatus.map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <p className="text-sm font-medium truncate">{item.value}</p>
                </div>
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Agent Configuration Matrix */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <CardTitle>Agent Configuration Matrix</CardTitle>
          </div>
          <CardDescription>
            Přehled konfigurace {agents.length} MiLO agentů — reálná data z Control Center
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Agent</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Konfigurace</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Nástroje</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Dokumentace</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {agents.map((agent) => (
                  <tr
                    key={agent.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium">
                      <div>
                        <span>{agent.name}</span>
                        <span className="ml-2 text-[10px] text-muted-foreground font-mono">
                          {agent.category}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {hasConfig(agent) ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {hasTools(agent) ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {hasDocs(agent) ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant={agentStatusVariant(agent)} className="text-xs">
                        {agentStatusLabel(agent)}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Better Agents Principles */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <CardTitle>Principy Better Agents</CardTitle>
          </div>
          <CardDescription>
            Klíčové principy, na kterých je Better Agents framework postaven
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {principles.map((principle) => (
            <div key={principle.title} className="flex gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <principle.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h4 className="text-sm font-medium">{principle.title}</h4>
                <p className="text-xs text-muted-foreground mt-0.5">{principle.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-primary" />
            <CardTitle>Akce</CardTitle>
          </div>
          <CardDescription>
            Spusťte Better Agents operace pro správu konfigurace agentů
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              className="w-full gap-2"
              onClick={async () => {
                try {
                  await fetch("http://127.0.0.1:4000/executive/control/audit/start", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ agent_id: agents[0]?.id || "", scope: "full" }),
                  });
                } catch { /* ignore */ }
              }}
            >
              <Sparkles className="h-4 w-4" />
              Spustit audit
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4" />
              Aktualizovat data
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
            >
              <FileText className="h-4 w-4" />
              Vygenerovat dokumentaci
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
            >
              <TestTube className="h-4 w-4" />
              Spustit testy agentů
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
