"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  Sparkles,
  Cog,
  FileCode,
  Bot,
  Workflow,
  GitBranch,
  BookOpen,
  TestTube,
  Rocket,
  RefreshCw,
  FileText,
  Download,
  Activity,
  Terminal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/common/page-header";

const configStatus = [
  {
    label: "Framework detekován",
    value: "Node.js/TypeScript",
    status: "configured" as const,
    icon: FileCode,
  },
  {
    label: "Jazyk",
    value: "TypeScript",
    status: "configured" as const,
    icon: Terminal,
  },
  {
    label: "Coding assistant",
    value: "Kilocode",
    status: "configured" as const,
    icon: Bot,
  },
  {
    label: "Editor setup",
    value: "VS Code / Cursor",
    status: "configured" as const,
    icon: Cog,
  },
  {
    label: "MCP servery",
    value: "3 nakonfigurováno",
    status: "configured" as const,
    icon: Workflow,
  },
  {
    label: "Dostupné nástroje",
    value: "12 nástrojů",
    status: "configured" as const,
    icon: GitBranch,
  },
];

const agentMatrix = [
  {
    agent: "Chief of Staff",
    frameworkConfig: true,
    toolsSetup: true,
    documentation: true,
    status: "Aktivní",
    statusVariant: "default" as const,
  },
  {
    agent: "Developer",
    frameworkConfig: true,
    toolsSetup: true,
    documentation: true,
    status: "Aktivní",
    statusVariant: "default" as const,
  },
  {
    agent: "Research",
    frameworkConfig: true,
    toolsSetup: false,
    documentation: true,
    status: "Aktivní",
    statusVariant: "default" as const,
  },
  {
    agent: "Knowledge",
    frameworkConfig: true,
    toolsSetup: true,
    documentation: true,
    status: "Aktivní",
    statusVariant: "default" as const,
  },
  {
    agent: "Legal",
    frameworkConfig: true,
    toolsSetup: true,
    documentation: false,
    status: "Aktivní",
    statusVariant: "default" as const,
  },
  {
    agent: "Document",
    frameworkConfig: true,
    toolsSetup: true,
    documentation: true,
    status: "Aktivní",
    statusVariant: "default" as const,
  },
  {
    agent: "Calendar",
    frameworkConfig: true,
    toolsSetup: false,
    documentation: true,
    status: "Aktivní",
    statusVariant: "default" as const,
  },
  {
    agent: "Communication",
    frameworkConfig: true,
    toolsSetup: true,
    documentation: true,
    status: "Aktivní",
    statusVariant: "default" as const,
  },
  {
    agent: "Automation",
    frameworkConfig: true,
    toolsSetup: false,
    documentation: false,
    status: "Aktivní",
    statusVariant: "default" as const,
  },
];

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

interface IntegrationEvent {
  event: string;
  timestamp: string;
}


interface AgentActionStatus {
  label: string;
  status: "configured" | "not-configured";
  icon: React.ComponentType<{ className?: string }>;
  value: string;
}

function StatusCard({ item }: { item: AgentActionStatus }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
      <item.icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{item.label}</p>
        <p className="text-sm font-medium truncate">{item.value}</p>
      </div>
      {item.status === "configured" ? (
        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground/40 shrink-0" />
      )}
    </div>
  );
}

export default function BetterAgentsPage() {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = (action: string) => {
    setActionLoading(action);
    setTimeout(() => setActionLoading(null), 1500);
  };

  const integrationLog: IntegrationEvent[] = [
    {
      event: "Better Agents konfigurace načtena",
      timestamp: new Date(Date.now() - 120000).toISOString(),
    },
    {
      event: "Agenti registrováni",
      timestamp: new Date(Date.now() - 60000).toISOString(),
    },
    {
      event: "MCP servery inicializovány",
      timestamp: new Date(Date.now() - 30000).toISOString(),
    },
    {
      event: "Dokumentace vygenerována",
      timestamp: new Date(Date.now() - 15000).toISOString(),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Better Agents"
        description="Integrace frameworku Better Agents pro vylepšenou konfiguraci a správu agentů"
      >
        <Badge variant="outline" className="gap-1.5">
          <Sparkles className="h-3 w-3 text-amber-400" />
          v0.1.23
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
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 bg-background/50">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              Better Agents
            </div>
            <span className="hidden sm:inline text-lg">→</span>
            <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 bg-background/50">
              <Cog className="h-3.5 w-3.5 text-muted-foreground" />
              konfigurace
            </div>
            <span className="hidden sm:inline text-lg">→</span>
            <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1.5 bg-background/50">
              <Bot className="h-3.5 w-3.5 text-muted-foreground" />
              MiLO agenti
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuration Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle>Stav konfigurace</CardTitle>
          </div>
          <CardDescription>
            Přehled aktuálního stavu Better Agents konfigurace v MiLO prostředí
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {configStatus.map((item) => (
              <StatusCard key={item.label} item={item} />
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
            Přehled konfigurace MiLO agentů prostřednictvím Better Agents frameworku
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Agent</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Framework</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Nástroje</th>
                  <th className="text-center py-3 px-4 font-medium text-muted-foreground">Dokumentace</th>
                  <th className="text-right py-3 px-4 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {agentMatrix.map((row) => (
                  <tr
                    key={row.agent}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium">{row.agent}</td>
                    <td className="py-3 px-4 text-center">
                      {row.frameworkConfig ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.toolsSetup ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {row.documentation ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto" />
                      ) : (
                        <Circle className="h-4 w-4 text-muted-foreground/40 mx-auto" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Badge variant={row.statusVariant} className="text-xs">
                        {row.status}
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

      {/* Integration Log */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            <CardTitle>Integrační log</CardTitle>
          </div>
          <CardDescription>
            Poslední integrační události Better Agents v MiLO{" "}
            <Badge variant="outline" className="ml-1 text-[10px] px-1.5 py-0">
              demo
            </Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {integrationLog.map((entry, i) => (
              <div key={i}>
                <div className="flex items-center justify-between py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>{entry.event}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {new Date(entry.timestamp).toLocaleTimeString("cs-CZ", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </span>
                </div>
                {i < integrationLog.length - 1 && <Separator />}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Data nejsou k dispozici — integrační log je v demo režimu. Pro ostrá data spusťte{" "}
              <code className="text-xs bg-amber-500/10 px-1 py-0.5 rounded">
                better-agents init
              </code>{" "}
              v adresáři MiLO_Core.
            </p>
          </div>
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
              onClick={() => handleAction("init")}
              disabled={actionLoading === "init"}
            >
              {actionLoading === "init" ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              Inicializovat Better Agents
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => handleAction("update-config")}
              disabled={actionLoading === "update-config"}
            >
              {actionLoading === "update-config" ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Aktualizovat konfiguraci
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => handleAction("generate-docs")}
              disabled={actionLoading === "generate-docs"}
            >
              {actionLoading === "generate-docs" ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              Vygenerovat dokumentaci
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={() => handleAction("run-tests")}
              disabled={actionLoading === "run-tests"}
            >
              {actionLoading === "run-tests" ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              Spustit testy agentů
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
