"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Bot,
  Calendar,
  Copy,
  ExternalLink,
  FileText,
  Mail,
  RefreshCw,
  Sparkles,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useTtsStore } from "@/stores/tts-store";
import { generateBriefing, type BriefingResponse } from "@/lib/api/briefing.api";
import { getHomeData, type HomeData } from "@/lib/api/home.api";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/common/page-header";
import { EmptyState } from "@/components/common/empty-state";
import { cn } from "@/lib/utils";

export function BriefView(): JSX.Element {
  const [briefing, setBriefing] = useState<BriefingResponse | null>(null);
  const [homeData, setHomeData] = useState<HomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [copied, setCopied] = useState(false);
  const { autoSpeak, speak } = useTtsStore();

  useEffect(() => {
    async function init(): Promise<void> {
      setIsLoading(true);
      setError(null);
      try {
        const [briefingResponse, home] = await Promise.all([
          generateBriefing(),
          getHomeData(),
        ]);
        setBriefing(briefingResponse);
        setHomeData(home);
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

  const handleRegenerate = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await generateBriefing();
      setBriefing(response);
      if (autoSpeak) await speak(response.briefing);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Nepodařilo se vygenerovat briefing"));
    } finally {
      setIsLoading(false);
    }
  };

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

  if (error || !briefing) {
    return (
      <EmptyState
        variant="error"
        title="Nepodařilo se načíst briefing"
        description={error?.message ?? "Zkuste stránku obnovit."}
        action={
          <Button onClick={handleRegenerate} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Zkusit znovu
          </Button>
        }
      />
    );
  }

  const calendarEvents = homeData?.calendar?.today || [];
  const calendarTomorrow = homeData?.calendar?.tomorrow || [];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Today's Brief"
        description="Denní přehled připravený Chief of Staff agentem."
      >
        <Button
          variant="outline"
          onClick={() => speak(briefing.briefing)}
          disabled={!briefing.briefing}
          className="gap-2"
        >
          <Volume2 className="h-4 w-4" />
          <span className="hidden sm:inline">Přehrát</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => void copyAsMarkdown()}
          disabled={!briefing.briefing}
          className="gap-2"
        >
          <Copy className="h-4 w-4" />
          {copied ? "Zkopírováno" : <span className="hidden sm:inline">Kopírovat</span>}
        </Button>
        <Button onClick={handleRegenerate} disabled={isLoading} className="gap-2">
          <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          <span className="hidden sm:inline">Regenerovat</span>
        </Button>
      </PageHeader>

      {/* Status badge - subtle */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {briefing.demo ? (
          <Badge variant="outline" className="gap-1.5 text-xs">
            <Sparkles className="h-3 w-3" />
            Vygenerováno z dat
          </Badge>
        ) : (
          <Badge variant="outline" className="gap-1.5 text-xs border-primary/30 text-primary">
            <Sparkles className="h-3 w-3" />
            AI generované
          </Badge>
        )}
        <span>· {formatDate(new Date())}</span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main briefing */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="prose prose-invert max-w-none prose-headings:scroll-mt-20 prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
              {briefing.briefing.split("\n").map((line, index) => renderBriefLine(line, index, { homeData }))}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Quick links */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Rychlé odkazy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <QuickLink icon={Mail} href="https://mail.google.com" label="Otevřít Gmail" external />
              <QuickLink icon={Calendar} href="https://calendar.google.com" label="Otevřít Kalendář" external />
              <QuickLink icon={Bot} href="/agents" label="Agenti" />
              <QuickLink icon={FileText} href="/projects" label="Všechny projekty" />
              <QuickLink icon={Sparkles} href="/settings" label="Nastavit AI" />
            </CardContent>
          </Card>

          {/* Today's events */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Dnešní události</CardTitle>
                <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
                  <Link href="/calendar">
                    Vše <ArrowUpRight className="ml-1 h-3 w-3" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {calendarEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-1">Žádné události na dnešek.</p>
              ) : (
                calendarEvents.slice(0, 4).map((event) => (
                  <div key={event.id} className="text-sm rounded-lg border border-border p-2.5">
                    <p className="font-medium truncate">{event.summary}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatEventTime(event.start)} · {eventTimeRange(event)}
                    </p>
                    {event.location && (
                      <p className="text-xs text-muted-foreground truncate">{event.location}</p>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Tomorrow preview */}
          {calendarTomorrow.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Zítra</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {calendarTomorrow.slice(0, 3).map((event) => (
                  <div key={event.id} className="text-sm rounded-lg border border-border p-2.5">
                    <p className="font-medium truncate">{event.summary}</p>
                    <p className="text-xs text-muted-foreground">{formatEventTime(event.start)}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Priorities summary */}
          {homeData && homeData.priorities.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Priority</CardTitle>
                  <Button variant="ghost" size="sm" className="text-xs h-7" asChild>
                    <Link href="/projects">
                      Vše <ArrowUpRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {homeData.priorities.map((p, i) => {
                  const critical = p.priority === "critical";
                  return (
                    <div key={p.id} className="flex items-center gap-2 text-sm">
                      <div
                        className={cn(
                          "h-2 w-2 rounded-full shrink-0",
                          critical ? "bg-rose-500" : p.priority === "important" ? "bg-amber-500" : "bg-emerald-500",
                        )}
                      />
                      <span className="truncate">{p.title}</span>
                      {p.project && (
                        <Link
                          href={`/projects?id=${encodeURIComponent(p.project)}`}
                          className="text-xs text-muted-foreground hover:text-primary shrink-0 ml-auto"
                        >
                          {p.project}
                        </Link>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function QuickLink({
  icon: Icon,
  href,
  label,
  external,
}: {
  icon: React.ElementType;
  href: string;
  label: string;
  external?: boolean;
}): JSX.Element {
  const content = (
    <div className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent transition-colors group">
      <div className="rounded-md bg-primary/10 p-1.5 text-primary">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <span className="flex-1">{label}</span>
      {external ? (
        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      ) : (
        <ArrowUpRight className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      )}
    </div>
  );

  if (external) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return <Link href={href}>{content}</Link>;
}

function formatEventTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

function eventTimeRange(event: { start: string; end: string }): string {
  try {
    const diff = (new Date(event.end).getTime() - new Date(event.start).getTime()) / 60000;
    if (diff >= 60) return `${Math.round(diff / 60)}h`;
    return `${diff}min`;
  } catch {
    return "";
  }
}

function renderBriefLine(
  line: string,
  index: number,
  _ctx: { homeData: HomeData | null },
): JSX.Element {
  if (line.startsWith("# ")) {
    return (
      <h1 key={index} className="mb-4 text-2xl font-bold">
        {line.slice(2)}
      </h1>
    );
  }
  if (line.startsWith("## ")) {
    return (
      <h2 key={index} className="mb-3 mt-6 text-xl font-semibold border-b border-border pb-2">
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

  // Render markdown links as proper Link components for internal routes
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const hasLinks = linkRegex.test(line);

  if (hasLinks && (line.startsWith("- ") || /^\d+\. /.test(line) || line.startsWith("> "))) {
    linkRegex.lastIndex = 0;
    let cleanLine = line;
    if (line.startsWith("- ")) cleanLine = line.slice(2);
    else if (/^\d+\. /.test(line)) cleanLine = line.replace(/^\d+\.\s*/, "");
    else if (line.startsWith("> ")) cleanLine = line.slice(2);

    const parts: Array<{ type: "text" | "link"; content: string; href?: string; external?: boolean }> = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = linkRegex.exec(cleanLine)) !== null) {
      if (match.index > lastIndex) {
        parts.push({ type: "text", content: cleanLine.slice(lastIndex, match.index) });
      }
      const href = match[2];
      parts.push({
        type: "link",
        content: match[1],
        href,
        external: href.startsWith("http"),
      });
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < cleanLine.length) {
      parts.push({ type: "text", content: cleanLine.slice(lastIndex) });
    }

    const prefix = line.startsWith("- ") ? "• " : line.startsWith("> ") ? "" : "";

    return (
      <p key={index} className={line.startsWith("> ") ? "border-l-2 border-primary/30 pl-3 py-1 my-2 text-muted-foreground italic" : "ml-0"}>
        {prefix}
        {parts.map((part, i) =>
          part.type === "link" && part.href ? (
            part.external ? (
              <a key={i} href={part.href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                {part.content}
              </a>
            ) : (
              <Link key={i} href={part.href} className="text-primary hover:underline">
                {part.content}
              </Link>
            )
          ) : (
            <span key={i}>{part.content}</span>
          ),
        )}
      </p>
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
