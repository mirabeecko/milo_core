"use client";

import { useEffect, useState } from "react";
import { Calendar, Copy, FileText, Mail, RefreshCw, Sparkles, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useTtsStore } from "@/stores/tts-store";
import { decisions, documents, todayPriorities } from "@/lib/mocks";
import { formatDate, getPriorityColor, getPriorityLabel } from "@/lib/format";
import { cn } from "@/lib/utils";

interface BriefingResponse {
  briefing: string;
  demo?: boolean;
}

const demoBriefing = `# Briefing pro ${formatDate(new Date())}

## Shrnutí dne
Dnes je klidný den bez naléhavých schůzek. Doporučuji se zaměřit na hlavní prioritu – dokončení smlouvy pro TJ Krupka.

## Top 3 priority
1. Dokončit návrh smlouvy pro TJ Krupka
2. Projít feedback k MiLO_Core dashboardu
3. Připravit nabídku pro Komárku

## Důležité schůzky
- 10:00 – Review projektů (Google Meet)
- 14:00 – Call s Komárka

## Co vyžaduje pozornost
- 4 nepřečtené e-maily
- 2 položky čekají na rozhodnutí
- 7 nových dokumentů v Knowledge base

## Doporučené kroky
1. Vyřeš kritickou prioritu do 12:00.
2. Projdi e-maily po obědě.
3. Nech Research Agenta aktualizovat poznámky z Obsidianu.`;

export function BriefView(): JSX.Element {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { autoSpeak, speak } = useTtsStore();

  const generateBriefing = async (): Promise<void> => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/briefing", {
        headers: {
          Authorization: "Bearer demo-token",
        },
      });

      if (!response.ok) {
        throw new Error("Nepodařilo se načíst briefing");
      }

      const data = (await response.json()) as BriefingResponse;
      const text = data.briefing || demoBriefing;
      setBriefing(text);
      setIsDemo(data.demo ?? false);

      if (autoSpeak) {
        await speak(text);
      }
    } catch (error) {
      console.error(error);
      setBriefing(demoBriefing);
      setIsDemo(true);
    } finally {
      setIsLoading(false);
    }
  };

  const copyAsMarkdown = async (): Promise<void> => {
    if (!briefing) return;
    await navigator.clipboard.writeText(briefing);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    void generateBriefing();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold tracking-tight">Today&apos;s Brief</h2>
          <p className="text-muted-foreground">
            Denní přehled připravený Chief of Staff agentem.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => briefing && speak(briefing)}
            disabled={!briefing || isLoading}
            className="gap-2"
          >
            <Volume2 className="h-4 w-4" />
            Přehrát briefing
          </Button>
          <Button
            variant="outline"
            onClick={copyAsMarkdown}
            disabled={!briefing || isLoading}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            {copied ? "Zkopírováno" : "Zkopírovat Markdown"}
          </Button>
          <Button onClick={generateBriefing} disabled={isLoading} className="gap-2">
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            {isLoading ? "Generuji..." : "Regenerovat briefing"}
          </Button>
        </div>
      </div>

      {isLoading && !briefing ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      ) : (
        <>
          {isDemo && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
              AI provider není nakonfigurován – zobrazuji demo briefing.
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Main briefing */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <CardTitle>Briefing</CardTitle>
                </div>
                <CardDescription>Generováno {formatDate(new Date())}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-invert max-w-none">
                  {(briefing ?? demoBriefing).split("\n").map((line, index) => renderBriefLine(line, index))}
                </div>
              </CardContent>
            </Card>

            {/* Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <CardTitle>Kalendář dne</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="rounded-lg border border-border p-3">
                    <p className="font-medium">10:00 – Review projektů</p>
                    <p className="text-xs text-muted-foreground">Google Meet · 30 min</p>
                  </div>
                  <div className="rounded-lg border border-border p-3">
                    <p className="font-medium">14:00 – Call s Komárka</p>
                    <p className="text-xs text-muted-foreground">Telefon · 45 min</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    <CardTitle>Důležité zprávy</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-sm">
                    <p className="font-medium">Re: Poptávka webu Komárka</p>
                    <p className="text-xs text-muted-foreground">od Jana Nováka · dnes 8:15</p>
                  </div>
                  <Separator />
                  <div className="text-sm">
                    <p className="font-medium">Faktura 2026-07-001</p>
                    <p className="text-xs text-muted-foreground">od Účetní · včera</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle>Nové dokumenty</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {documents.slice(0, 3).map((doc) => (
                    <div key={doc.id} className="text-sm">
                      <p className="font-medium">{doc.title}</p>
                      <p className="text-xs text-muted-foreground">{doc.project}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Priorities & decisions */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Priority dne</CardTitle>
                <CardDescription>Nejdůležitější úkoly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {todayPriorities.map((priority) => (
                  <div
                    key={priority.id}
                    className="flex items-start justify-between rounded-lg border border-border p-3"
                  >
                    <div>
                      <p className="font-medium">{priority.title}</p>
                      <p className="text-xs text-muted-foreground">{priority.project}</p>
                    </div>
                    <Badge variant="outline" className={cn("text-xs", getPriorityColor(priority.priority))}>
                      {getPriorityLabel(priority.priority)}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Doporučené kroky</CardTitle>
                <CardDescription>Co udělat jako další</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {decisions.map((decision) => (
                  <div key={decision.id} className="rounded-lg border border-border p-3">
                    <p className="font-medium">{decision.title}</p>
                    <p className="text-sm text-muted-foreground">{decision.description}</p>
                  </div>
                ))}
                <div className="rounded-lg border border-border p-3">
                  <p className="font-medium">Projdi 4 nepřečtené e-maily</p>
                  <p className="text-sm text-muted-foreground">
                    Chief of Staff označil 2 jako potenciálně důležité.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function renderBriefLine(line: string, index: number): JSX.Element {
  if (line.startsWith("# ")) {
    return <h1 key={index} className="mb-4 text-2xl font-bold">{line.slice(2)}</h1>;
  }
  if (line.startsWith("## ")) {
    return <h2 key={index} className="mb-3 mt-6 text-xl font-semibold">{line.slice(3)}</h2>;
  }
  if (line.startsWith("### ")) {
    return <h3 key={index} className="mb-2 mt-4 text-lg font-medium">{line.slice(4)}</h3>;
  }
  if (line.startsWith("- ") || /^\d+\. /.test(line)) {
    return (
      <li key={index} className="ml-4">
        {line.replace(/^[-\d.]+\s*/, "")}
      </li>
    );
  }
  if (line.trim() === "") {
    return <div key={index} className="h-2" />;
  }
  return <p key={index}>{line}</p>;
}
