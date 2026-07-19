"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Mail,
  MailOpen,
  AlertTriangle,
  Sparkles,
  Users,
  RefreshCw,
} from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────

interface Email {
  id: string;
  from: string;
  subject: string;
  date: string;
  snippet: string;
  labels?: string[];
}

interface InboxSummary {
  unread: number;
  important: number;
  total: number;
  topSenders: string[];
  aiSummary: string;
}

interface InboxResponse {
  emails: Email[];
  total: number;
  summary: InboxSummary;
}

interface ApiError {
  error: string;
  detail?: string;
}

// ─── API ────────────────────────────────────────────────────────

const API_BASE = "http://localhost:4000";

async function fetchInbox(): Promise<InboxResponse> {
  const res = await fetch(`${API_BASE}/email/inbox`);
  const json = await res.json();

  // API vrací { error: "...", detail: "..." } při selhání
  if (!res.ok || (json as ApiError).error) {
    const err = json as ApiError;
    throw new Error(err.detail || err.error || `HTTP ${res.status}`);
  }

  return json as InboxResponse;
}

// ─── Helpers ────────────────────────────────────────────────────

function formatEmailDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return d.toLocaleTimeString("cs-CZ", { hour: "2-digit", minute: "2-digit" });
    }
    if (diffDays === 1) return "Včera";
    if (diffDays < 7) {
      return d.toLocaleDateString("cs-CZ", { weekday: "long" });
    }
    return d.toLocaleDateString("cs-CZ", { day: "numeric", month: "numeric" });
  } catch {
    return dateStr;
  }
}

function isUnread(email: Email): boolean {
  return email.labels?.includes("UNREAD") ?? false;
}

function isImportant(email: Email): boolean {
  return email.labels?.includes("IMPORTANT") ?? false;
}

// ─── Component ──────────────────────────────────────────────────

export default function EmailPage() {
  const [data, setData] = useState<InboxResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadInbox = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const inbox = await fetchInbox();
      setData(inbox);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Nepodařilo se načíst emaily");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadInbox();
  }, []);

  // ─── Loading ──────────────────────────────────────────────

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 p-6">
        <Skeleton className="h-8 w-40" />
        <Card className="border-border/50 bg-card/50">
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-4 pt-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
          </CardContent>
        </Card>
        {[1, 2, 3, 4, 5].map((i) => (
          <Card key={i} className="border-border/50 bg-card/50">
            <CardContent className="py-4">
              <Skeleton className="mb-2 h-5 w-2/3" />
              <Skeleton className="mb-1 h-4 w-1/3" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // ─── Error ────────────────────────────────────────────────

  if (error) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <Card className="border-rose-500/30 bg-rose-500/5">
          <CardContent className="flex flex-col items-center gap-3 py-10">
            <AlertTriangle className="h-10 w-10 text-rose-400" />
            <p className="text-center text-rose-300">{error}</p>
            <button
              onClick={() => loadInbox(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-rose-500/10 px-4 py-2 text-sm text-rose-300 transition hover:bg-rose-500/20"
            >
              <RefreshCw className="h-4 w-4" />
              Zkusit znovu
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { emails, total, summary } = data!;

  // ─── Empty state ──────────────────────────────────────────

  if (!emails || emails.length === 0) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">📧 Emaily</h1>
          <button
            onClick={() => loadInbox(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-muted"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Obnovit
          </button>
        </div>
        <Card className="border-border/50 bg-card/50">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <Mail className="h-10 w-10 opacity-30" />
            <p>Žádné emaily k zobrazení</p>
            <p className="text-xs">
              {summary?.aiSummary || "Připojte Gmail účet nebo zkontrolujte bridge."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ─── Normal state ─────────────────────────────────────────

  const unreadCount = summary?.unread ?? emails.filter(isUnread).length;
  const importantCount = summary?.important ?? emails.filter(isImportant).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">📧 Emaily</h1>
        <button
          onClick={() => loadInbox(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-muted hover:text-foreground"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
          Obnovit
        </button>
      </div>

      {/* AI Summary Card */}
      <Card className="border-purple-500/20 bg-purple-500/5">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-purple-400">
            <Sparkles className="h-4 w-4" />
            AI Shrnutí
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {summary?.aiSummary || `${total} emailů v inboxu.`}
          </p>

          {/* Top senders */}
          {summary?.topSenders && summary.topSenders.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" />
              <span>Nejaktivnější: {summary.topSenders.slice(0, 5).join(", ")}</span>
            </div>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-3 pt-1">
            <Badge variant="secondary" className="text-xs">
              {total} celkem
            </Badge>
            <Badge
              variant="secondary"
              className={cn("text-xs", unreadCount > 0 && "border-blue-500/30 bg-blue-500/10 text-blue-400")}
            >
              {unreadCount} nepřečtených
            </Badge>
            <Badge
              variant="secondary"
              className={cn("text-xs", importantCount > 0 && "border-amber-500/30 bg-amber-500/10 text-amber-400")}
            >
              {importantCount} důležitých
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Email list */}
      <div>
        <h2 className="mb-3 text-sm font-medium text-muted-foreground">
          Doručená pošta ({emails.length})
        </h2>
        <div className="space-y-2">
          {emails.map((email) => {
            const unread = isUnread(email);
            const important = isImportant(email);

            return (
              <Card
                key={email.id}
                className={cn(
                  "cursor-pointer border-border/40 bg-card/60 transition hover:border-border/60 hover:bg-card/80",
                  unread && "border-l-2 border-l-blue-400 bg-card/80",
                  !unread && "opacity-70",
                )}
              >
                <CardContent className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {unread ? (
                          <Mail className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                        ) : (
                          <MailOpen className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" />
                        )}
                        <span
                          className={cn(
                            "truncate text-sm font-medium",
                            unread ? "text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {email.subject || "(bez předmětu)"}
                        </span>
                        {important && (
                          <Badge
                            variant="outline"
                            className="shrink-0 border-amber-500/30 bg-amber-500/10 px-1.5 py-0 text-[10px] text-amber-400"
                          >
                            Důležité
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-xs text-purple-400/70">
                        {email.from}
                      </p>
                      <p className="mt-1 line-clamp-1 text-xs text-muted-foreground">
                        {email.snippet}
                      </p>
                    </div>
                    <span className="shrink-0 pt-0.5 text-[11px] text-muted-foreground">
                      {formatEmailDate(email.date)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
