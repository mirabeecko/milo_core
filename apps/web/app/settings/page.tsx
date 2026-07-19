"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Settings2, Download, Server, Link2, Unlink2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { getAiSettings, saveAiSettings, type AiSettings, type TaskComplexity } from "@/lib/api/settings.api";
import {
  getMcpServers,
  connectMcpServer,
  disconnectMcpServer,
  reloadMcpServers,
  type McpServerState,
} from "@/lib/api/mcp.api";
import { downloadExport } from "@/lib/api/export.api";

const complexities: TaskComplexity[] = ["simple", "standard", "complex"];

const complexityLabels: Record<TaskComplexity, string> = {
  simple: "Jednoduché úkoly",
  standard: "Standardní úkoly",
  complex: "Komplexní úkoly",
};

const statusVariant: Record<McpServerState["status"], "default" | "secondary" | "destructive" | "outline"> = {
  connected: "default",
  connecting: "secondary",
  disconnected: "outline",
  error: "destructive",
};

const statusLabel: Record<McpServerState["status"], string> = {
  connected: "Připojeno",
  connecting: "Připojování...",
  disconnected: "Odpojeno",
  error: "Chyba",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [mcpServers, setMcpServers] = useState<McpServerState[]>([]);
  const [mcpLoading, setMcpLoading] = useState(true);
  const [mcpError, setMcpError] = useState<Error | null>(null);
  const [connectingServer, setConnectingServer] = useState<string | null>(null);

  const load = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getAiSettings();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Nepodařilo se načíst nastavení"));
    } finally {
      setIsLoading(false);
    }
  };

  const loadMcp = async () => {
    try {
      setMcpLoading(true);
      setMcpError(null);
      const data = await getMcpServers();
      setMcpServers(data.servers);
    } catch (err) {
      setMcpError(err instanceof Error ? err : new Error("Nepodařilo se načíst MCP servery"));
    } finally {
      setMcpLoading(false);
    }
  };

  useEffect(() => {
    void load();
    void loadMcp();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    try {
      const result = await saveAiSettings(settings);
      setSettings(result);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleConnect = async (name: string) => {
    setConnectingServer(name);
    try {
      await connectMcpServer(name);
      await loadMcp();
    } catch {
      // ignore
    } finally {
      setConnectingServer(null);
    }
  };

  const handleDisconnect = async (name: string) => {
    setConnectingServer(name);
    try {
      await disconnectMcpServer(name);
      await loadMcp();
    } catch {
      // ignore
    } finally {
      setConnectingServer(null);
    }
  };

  const handleReload = async () => {
    setMcpLoading(true);
    try {
      await reloadMcpServers();
      await loadMcp();
    } catch {
      // ignore
    } finally {
      setMcpLoading(false);
    }
  };

  const updateModel = (complexity: TaskComplexity, field: string, value: string) => {
    if (!settings) return;
    setSettings({
      ...settings,
      models: {
        ...settings.models,
        [complexity]: {
          ...settings.models[complexity],
          [field]: value,
        },
      },
    });
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        variant="error"
        title="Nepodařilo se načíst nastavení"
        description={error.message}
        action={<Button onClick={() => void load()} className="gap-2"><RefreshCw className="h-4 w-4" /> Zkusit znovu</Button>}
      />
    );
  }

  if (!settings) return null;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Nastavení" description="Konfigurace AI modelů a systému">
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saved ? "Uloženo" : saving ? "Ukládám..." : "Uložit změny"}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-primary" />
            <CardTitle>AI Modely</CardTitle>
          </div>
          <CardDescription>
            Nastavení AI providerů a modelů pro různé úrovně složitosti úkolů.
            Výchozí provider: <Badge variant="outline">{settings.defaultProvider}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {complexities.map((complexity) => (
            <div key={complexity} className="space-y-3 rounded-lg border border-border p-4">
              <h3 className="font-medium">{complexityLabels[complexity]}</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground">Provider</label>
                  <Input
                    value={settings.models[complexity].provider}
                    onChange={(e) => updateModel(complexity, "provider", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Model</label>
                  <Input
                    value={settings.models[complexity].model}
                    onChange={(e) => updateModel(complexity, "model", e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">API Key</label>
                  <Input
                    type="password"
                    value={settings.models[complexity].apiKey}
                    onChange={(e) => updateModel(complexity, "apiKey", e.target.value)}
                    className="mt-1"
                    placeholder="sk-..."
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Base URL</label>
                  <Input
                    value={settings.models[complexity].baseUrl}
                    onChange={(e) => updateModel(complexity, "baseUrl", e.target.value)}
                    className="mt-1"
                    placeholder="https://api.openai.com/v1"
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-primary" />
            <CardTitle>MCP Servery</CardTitle>
          </div>
          <CardDescription>
            Model Context Protocol – externí nástroje dostupné agentům přes MCP protokol.
            Servery jsou definovány v <code className="px-1.5 py-0.5 rounded bg-muted text-xs">mcp-servers.json</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void handleReload()}
              disabled={mcpLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${mcpLoading ? "animate-spin" : ""}`} />
              Znovu načíst
            </Button>
          </div>

          {mcpLoading && (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          )}

          {mcpError && (
            <EmptyState
              variant="error"
              title="Chyba při načítání MCP serverů"
              description={mcpError.message}
              action={
                <Button onClick={() => void loadMcp()} className="gap-2">
                  <RefreshCw className="h-4 w-4" /> Zkusit znovu
                </Button>
              }
            />
          )}

          {!mcpLoading && !mcpError && mcpServers.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Žádné MCP servery nejsou nakonfigurovány. Přidejte je do souboru{" "}
              <code className="text-xs">mcp-servers.json</code>.
            </p>
          )}

          {!mcpLoading &&
            mcpServers.map((server) => (
              <div
                key={server.name}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="flex items-start gap-3">
                  <Server className="mt-0.5 h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{server.name}</span>
                      <Badge variant={statusVariant[server.status]} className="text-xs">
                        {statusLabel[server.status]}
                      </Badge>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Wrench className="h-3 w-3" />
                        {server.toolsCount} nástrojů
                      </div>
                      {server.tools.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {server.tools.map((tool) => (
                            <span
                              key={tool.name}
                              className="rounded bg-muted px-1.5 py-0.5 text-xs"
                              title={tool.description}
                            >
                              {tool.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {server.error && (
                      <p className="mt-1 text-xs text-destructive">{server.error}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {server.status === "disconnected" || server.status === "error" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleConnect(server.name)}
                      disabled={connectingServer === server.name}
                      className="gap-1.5"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      Připojit
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void handleDisconnect(server.name)}
                      disabled={connectingServer === server.name}
                      className="gap-1.5"
                    >
                      <Unlink2 className="h-3.5 w-3.5" />
                      Odpojit
                    </Button>
                  )}
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="h-5 w-5 text-primary" />
            <CardTitle>Export dat</CardTitle>
          </div>
          <CardDescription>
            Exportuj všechna data MiLO v otevřeném formátu (JSON nebo Markdown). Podle Ústavy MiLO, kapitola 4.4: Znalosti patří vlastníkovi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="gap-2" onClick={() => downloadExport("all", "json")}>
              <Download className="h-4 w-4" /> Exportovat vše (JSON)
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => downloadExport("all", "markdown")}>
              <Download className="h-4 w-4" /> Exportovat vše (Markdown)
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => downloadExport("agents", "json")}>
              <Download className="h-4 w-4" /> Exportovat agenty (JSON)
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => downloadExport("missions", "json")}>
              <Download className="h-4 w-4" /> Exportovat mise (JSON)
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => downloadExport("knowledge", "json")}>
              <Download className="h-4 w-4" /> Exportovat znalosti (JSON)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
