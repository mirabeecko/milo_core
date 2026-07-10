"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { getAiSettings, saveAiSettings, type AiSettings, type TaskComplexity } from "@/lib/api/settings.api";

const complexities: TaskComplexity[] = ["simple", "standard", "complex"];

const complexityLabels: Record<TaskComplexity, string> = {
  simple: "Jednoduché úkoly",
  standard: "Standardní úkoly",
  complex: "Komplexní úkoly",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<AiSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  useEffect(() => void load(), []);

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
    </div>
  );
}
