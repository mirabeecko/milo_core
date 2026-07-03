"use client";

import { useEffect, useState } from "react";
import { Calendar, Copy, FileText, Mail, RefreshCw, Sparkles, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useTtsStore } from "@/stores/tts-store";
import { generateBriefing, type BriefingResponse } from "@/lib/api/briefing.api";
import { getHomeData, type HomeData } from "@/lib/api/home.api";
import { getDocuments } from "@/lib/api/documents.api";
import { formatDate } from "@/lib/format";
import { PriorityRow } from "@/components/priority/priority-row";
import { DecisionRow } from "@/components/decision/decision-row";
import { DocumentRow } from "@/components/document/document-row";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import type { Document } from "@/lib/types";
import { cn } from "@/lib/utils";

export function BriefView(): JSX.Element {
  const [briefing, setBriefing] = useState<BriefingResponse | null>(null);
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [copied, setCopied] = useState(false);
  const { autoSpeak, speak } = useTtsStore();

  const loadBriefing = async (): Promise<void> => {
    try {
      setError(null);
      const response = await generateBriefing();
      setBriefing(response);
      if (autoSpeak) {
        await speak(response.briefing);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Nepodařilo se načíst briefing"));
    }
  };

  useEffect(() => {
    async function init(): Promise<void> {
      setIsLoading(true);
      setError(null);
      try {
        const [briefingResponse, home, docs] = await Promise.all([
          generateBriefing(),
          getHomeData(),
          getDocuments(),
        ]);
        setBriefing(briefingResponse);
        setHomeData(home);
        setDocuments(docs.slice(0, 3));
        if (autoSpeak) {
          await speak(briefingResponse.briefing);
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Nepodařilo se načíst briefing"));
      } finally {
        setIsLoading(false);
      }
    }
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copyAsMarkdown = async (): Promise<void> => {
    if (!briefing?.briefing) return;
    await navigator.clipboard.writeText(briefing.briefing);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (error || !briefing || !homeData) {
    return (
      <EmptyState
        variant="error"
        title="Nepodařilo se načíst briefing"
        description={error?.message ?? "Zkuste stránku obnovit."}
        action={
          <Button onClick={() => void loadBriefing()} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Zkusit znovu
          </Button>
        }
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader title="Today's Brief" description="Denní přehled připravený Chief of Staff agentem.">
        <Button
          variant="outline"
          onClick={() => speak(briefing.briefing)}
          disabled={!briefing.briefing}
          className="gap-2"
        >
          <Volume2 className="h-4 w-4" />
          Přehrát briefing
        </Button>
        <Button
          variant="outline"
          onClick={() => void copyAsMarkdown()}
          disabled={!briefing.briefing}
          className="gap-2"
        >
          <Copy className="h-4 w-4" />
          {copied ? "Zkopírováno" : "Zkopírovat Markdown"}
        </Button>
        <Button onClick={() => void loadBriefing()} disabled={isLoading} className="gap-2">
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          {isLoading ? "Generuji..." : "Regenerovat briefing"}
        </Button>
      </PageHeader>

      {briefing.demo && (
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
              {briefing.briefing.split("\n").map((line, index) => renderBriefLine(line, index))}
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
              {documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Žádné dokumenty.</p>
              ) : (
                documents.map((doc) => <DocumentRow key={doc.id} document={doc} />)
              )}
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
            {homeData.priorities.map((priority) => (
              <PriorityRow key={priority.id} priority={priority} />
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Doporučené kroky</CardTitle>
            <CardDescription>Co udělat jako další</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {homeData.decisions.map((decision) => (
              <DecisionRow key={decision.id} decision={decision} />
            ))}
            <div className="rounded-lg border border-border p-3">
              <p className="font-medium">Projdi {homeData.snapshot.unreadEmails} nepřečtené e-maily</p>
              <p className="text-sm text-muted-foreground">
                Chief of Staff označil 2 jako potenciálně důležité.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function renderBriefLine(line: string, index: number): JSX.Element {
  if (line.startsWith("# ")) {
    return (
      <h1 key={index} className="mb-4 text-2xl font-bold">
        {line.slice(2)}
      </h1>
    );
  }
  if (line.startsWith("## ")) {
    return (
      <h2 key={index} className="mb-3 mt-6 text-xl font-semibold">
        {line.slice(3)}
      </h2>
    );
  }
  if (line.startsWith("### ")) {
    return (
      <h3 key={index} className="mb-2 mt-4 text-lg font-medium">
        {line.slice(4)}
      </h3>
    );
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
