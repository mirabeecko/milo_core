"use client";

import { useState } from "react";
import {
  Bot,
  Brain,
  Calendar,
  Database,
  FolderOpen,
  Mail,
  MessageSquare,
  Save,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useTtsStore } from "@/stores/tts-store";

export default function SettingsPage(): JSX.Element {
  const { isAvailable, autoSpeak, setAutoSpeak } = useTtsStore();
  const [aiProvider, setAiProvider] = useState("openai");
  const [aiModel, setAiModel] = useState("gpt-4o");
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [obsidianPath, setObsidianPath] = useState("~/Documents/Obsidian/MiLO");

  const integrations = [
    { id: "gmail", name: "Gmail", icon: Mail, enabled: false, soon: true },
    { id: "calendar", name: "Google Calendar", icon: Calendar, enabled: false, soon: true },
    { id: "drive", name: "Google Drive", icon: FolderOpen, enabled: false, soon: true },
    { id: "supabase", name: "Supabase", icon: Database, enabled: false, soon: true },
    { id: "ollama", name: "Ollama", icon: Bot, enabled: false, soon: true },
    { id: "chat", name: "Chat / Messages", icon: MessageSquare, enabled: false, soon: true },
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Nastavení MiLO, AI providera, TTS a integrací.</p>
        </div>

        {/* AI Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle>AI Provider</CardTitle>
            </div>
            <CardDescription>Vyber providera a model pro generování odpovědí.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Provider</label>
                <select
                  value={aiProvider}
                  onChange={(event) => setAiProvider(event.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="openai">OpenAI</option>
                  <option value="anthropic">Anthropic</option>
                  <option value="ollama">Ollama</option>
                  <option value="groq">Groq</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Model</label>
                <Input
                  value={aiModel}
                  onChange={(event) => setAiModel(event.target.value)}
                  placeholder="např. gpt-4o"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">API klíč / Base URL</label>
              <Input type="password" placeholder="Zadej API klíč nebo nech prázdné pro demo režim" />
              <p className="text-xs text-muted-foreground">
                Klíče se ukládají pouze lokálně v .env souboru, nikdy ne do kódu.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* TTS Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Volume2 className="h-5 w-5 text-primary" />
              <CardTitle>Hlasový výstup (TTS)</CardTitle>
            </div>
            <CardDescription>Nastavení přehrávání odpovědí.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium">Povolit TTS</p>
                <p className="text-sm text-muted-foreground">
                  {isAvailable
                    ? "TTS je dostupné."
                    : "TTS není dostupné v tomto prohlížeči."}
                </p>
              </div>
              <Switch checked={ttsEnabled} onCheckedChange={setTtsEnabled} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium">Automaticky číst odpovědi</p>
                <p className="text-sm text-muted-foreground">
                  Po každé odpovědi MiLO ji automaticky přečte nahlas.
                </p>
              </div>
              <Switch checked={autoSpeak} onCheckedChange={setAutoSpeak} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Hlas</label>
                <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                  <option>Default</option>
                  <option>Zuzana</option>
                  <option>Samantha</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Rychlost</label>
                <Input type="number" min="0.5" max="2" step="0.1" defaultValue="1" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Obsidian */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              <CardTitle>Obsidian</CardTitle>
            </div>
            <CardDescription>Cesta k lokálnímu Obsidian vaultu.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Vault path</label>
              <Input
                value={obsidianPath}
                onChange={(event) => setObsidianPath(event.target.value)}
                placeholder="~/Documents/Obsidian/MiLO"
              />
            </div>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card>
          <CardHeader>
            <CardTitle>Integrace</CardTitle>
            <CardDescription>Budoucí napojení na externí služby.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {integrations.map((integration) => (
              <div
                key={integration.id}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-3">
                  <integration.icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{integration.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {integration.enabled ? "Připojeno" : "Nepřipojeno"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {integration.soon && (
                    <Badge variant="secondary" className="text-xs">
                      Připravujeme
                    </Badge>
                  )}
                  <Switch checked={integration.enabled} disabled={integration.soon} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Separator />

        <div className="flex justify-end">
          <Button className="gap-2">
            <Save className="h-4 w-4" />
            Uložit nastavení
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
