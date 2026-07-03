"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Inbox,
  Mail,
  AlertCircle,
  Clock,
  RefreshCw,
  User,
  Sparkles,
  Send,
  Archive,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getAgentCommunicationState, syncAgentCommunication } from "@/lib/api/agents.api";
import type { Agent, CommunicationAgentState, CommMessage, CommContact, DraftReply } from "@/lib/types";
import { formatRelative, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CommunicationAgentDetailProps {
  agent: Agent;
}

export function CommunicationAgentDetail({ agent }: CommunicationAgentDetailProps): JSX.Element {
  const [state, setState] = useState<CommunicationAgentState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const data = await getAgentCommunicationState(agent.id);
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
    const result = await syncAgentCommunication(agent.id);
    setState(result.state);
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Načítám komunikaci...</p>;
  }

  if (!state) {
    return <p className="text-sm text-muted-foreground">Nepodařilo se načíst stav komunikace.</p>;
  }

  const stats = state.stats;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Communication Agent</h3>
          <p className="text-sm text-muted-foreground">
            {state.messages.length} zpráv · Poslední sync: {state.lastSyncedAt ? formatRelative(state.lastSyncedAt) : "nikdy"}
          </p>
        </div>
        <Button variant="outline" className="gap-2" onClick={() => void handleSync()}>
          <RefreshCw className="h-4 w-4" /> Synchronizovat
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard icon={<Mail className="h-4 w-4" />} label="Nové zprávy" value={stats.newMessages} />
        <MetricCard icon={<Clock className="h-4 w-4" />} label="Čeká na odpověď" value={stats.waitingForReply} />
        <MetricCard icon={<Sparkles className="h-4 w-4" />} label="AI konceptů" value={stats.aiSuggestionsGenerated} />
        <MetricCard icon={<AlertCircle className="h-4 w-4" />} label="Spam" value={stats.spam} />
      </div>

      <Tabs defaultValue="inbox">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="inbox" className="gap-2">
            <Inbox className="h-4 w-4" /> Inbox
          </TabsTrigger>
          <TabsTrigger value="waiting" className="gap-2">
            <Clock className="h-4 w-4" /> Čeká
          </TabsTrigger>
          <TabsTrigger value="drafts" className="gap-2">
            <Send className="h-4 w-4" /> Koncepty
          </TabsTrigger>
          <TabsTrigger value="contacts" className="gap-2">
            <User className="h-4 w-4" /> Kontakty
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2">
            <MessageSquare className="h-4 w-4" /> Statistiky
          </TabsTrigger>
        </TabsList>
        <TabsContent value="inbox">
          <InboxList messages={state.messages} summaries={state.summaries} />
        </TabsContent>
        <TabsContent value="waiting">
          <WaitingList messages={state.waitingForReply} />
        </TabsContent>
        <TabsContent value="drafts">
          <DraftsList drafts={state.drafts} />
        </TabsContent>
        <TabsContent value="contacts">
          <ContactsList contacts={state.contacts} />
        </TabsContent>
        <TabsContent value="stats">
          <StatsCard stats={stats} />
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

function InboxList({ messages, summaries }: { messages: CommMessage[]; summaries: Record<string, import("@/lib/types").MessageSummary> }): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Inbox</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Žádné zprávy.</p>
        ) : (
          messages.filter((m) => !m.isSpam).map((message) => (
            <MessageCard key={message.id} message={message} summary={summaries[message.id]} />
          ))
        )}
      </CardContent>
    </Card>
  );
}

function MessageCard({ message, summary }: { message: CommMessage; summary?: import("@/lib/types").MessageSummary }): JSX.Element {
  return (
    <div className="rounded-lg border p-3 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{message.sender.name}</span>
            <Badge variant="outline" className={priorityColor(message.priority)}>{priorityLabel(message.priority)}</Badge>
            <Badge variant="outline">{message.channel}</Badge>
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">{message.subject}</div>
        </div>
        <span className="text-xs text-muted-foreground">{formatRelative(message.receivedAt)}</span>
      </div>
      {summary && (
        <div className="mt-2 rounded-md bg-muted/50 p-2 text-xs">
          <div className="font-medium">🤖 AI shrnutí</div>
          <p className="text-muted-foreground">{summary.summary}</p>
          {summary.deadlines.length > 0 && (
            <p className="mt-1">📅 {summary.deadlines.join(", ")}</p>
          )}
          {summary.amounts.length > 0 && (
            <p className="mt-1">💰 {summary.amounts.join(", ")}</p>
          )}
          {summary.suggestedNextSteps.length > 0 && (
            <p className="mt-1">➡ {summary.suggestedNextSteps.join(" · ")}</p>
          )}
        </div>
      )}
      {message.extractedTasks.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {message.extractedTasks.map((task) => (
            <Badge key={task} variant="secondary" className="text-xs">{task}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function WaitingList({ messages }: { messages: CommMessage[] }): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Čeká na odpověď</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Žádné zprávy čekají na odpověď.</p>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="flex items-start justify-between rounded-lg border p-3 text-sm">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{message.sender.name}</span>
                  <Badge variant="outline" className={priorityColor(message.priority)}>{priorityLabel(message.priority)}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">{message.subject}</div>
                {message.replyDueAt && (
                  <div className="mt-1 text-xs text-rose-500">⏰ Termín: {formatTime(message.replyDueAt)}</div>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{formatRelative(message.receivedAt)}</span>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function DraftsList({ drafts }: { drafts: DraftReply[] }): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">AI koncepty odpovědí</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {drafts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Žádné koncepty.</p>
        ) : (
          drafts.map((draft) => (
            <div key={draft.id} className="rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between">
                <Badge variant="outline">{toneLabel(draft.tone)}</Badge>
                <span className="text-xs text-muted-foreground">{formatRelative(draft.generatedAt)}</span>
              </div>
              <p className="mt-2 whitespace-pre-line text-muted-foreground">{draft.content}</p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function ContactsList({ contacts }: { contacts: CommContact[] }): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Relationship Intelligence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {contacts.length === 0 ? (
          <p className="text-sm text-muted-foreground">Žádné kontakty.</p>
        ) : (
          contacts.map((contact) => (
            <div key={contact.id} className="rounded-lg border p-3 text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{contact.name}</div>
                  <div className="text-xs text-muted-foreground">{contact.email ?? contact.phone}</div>
                </div>
                <Badge variant="outline" className={escalationColor(contact.escalationRisk)}>{escalationLabel(contact.escalationRisk)}</Badge>
              </div>
              <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                <div>
                  <span className="text-muted-foreground">Projekty: </span>
                  {contact.projects.join(", ") || "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Otevřené úkoly: </span>
                  {contact.openTasks}
                </div>
                <div>
                  <span className="text-muted-foreground">Témata: </span>
                  {contact.recentTopics.join(", ") || "—"}
                </div>
                <div>
                  <span className="text-muted-foreground">Doporučený tón: </span>
                  {toneLabel(contact.recommendedTone)}
                </div>
              </div>
              {contact.openCommitments.length > 0 && (
                <div className="mt-2 text-xs">
                  <span className="text-muted-foreground">Otevřené závazky: </span>
                  {contact.openCommitments.join(" · ")}
                </div>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function StatsCard({ stats }: { stats: import("@/lib/types").CommunicationStats }): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Statistiky</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
        <StatRow label="Nové zprávy" value={stats.newMessages} />
        <StatRow label="Nepřečtené" value={stats.unreadMessages} />
        <StatRow label="Čeká na odpověď" value={stats.waitingForReply} />
        <StatRow label="Koncepty" value={stats.drafts} />
        <StatRow label="Spam" value={stats.spam} />
        <StatRow label="Odpovězeno dnes" value={stats.repliedToday} />
        <StatRow label="AI návrhy" value={stats.aiSuggestionsGenerated} />
        <StatRow label="Průměrná doba odpovědi" value={stats.averageResponseTimeHours ? `${stats.averageResponseTimeHours} h` : "—"} />
      </CardContent>
    </Card>
  );
}

function StatRow({ label, value }: { label: string; value: string | number }): JSX.Element {
  return (
    <div className="flex items-center justify-between rounded-md border p-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function priorityLabel(priority: CommMessage["priority"]): string {
  switch (priority) {
    case "critical":
      return "Kritická";
    case "important":
      return "Důležitá";
    case "normal":
      return "Běžná";
    case "low":
      return "Ke čtení";
    case "spam":
      return "Spam";
    default:
      return priority;
  }
}

function priorityColor(priority: CommMessage["priority"]): string {
  switch (priority) {
    case "critical":
      return "border-rose-500/30 bg-rose-500/10 text-rose-500";
    case "important":
      return "border-amber-500/30 bg-amber-500/10 text-amber-500";
    case "normal":
      return "border-blue-500/30 bg-blue-500/10 text-blue-500";
    case "low":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-500";
    case "spam":
      return "border-slate-500/30 bg-slate-500/10 text-slate-500";
    default:
      return "border-border";
  }
}

function toneLabel(tone: string): string {
  switch (tone) {
    case "short":
      return "Krátká";
    case "formal":
      return "Formální";
    case "friendly":
      return "Přátelská";
    case "legal":
      return "Právní";
    case "business":
      return "Obchodní";
    case "casual":
      return "Neformální";
    default:
      return tone;
  }
}

function escalationLabel(risk: CommContact["escalationRisk"]): string {
  switch (risk) {
    case "high":
      return "Eskalace";
    case "medium":
      return "Pozor";
    case "low":
      return "V pořádku";
    default:
      return risk;
  }
}

function escalationColor(risk: CommContact["escalationRisk"]): string {
  switch (risk) {
    case "high":
      return "border-rose-500/30 bg-rose-500/10 text-rose-500";
    case "medium":
      return "border-amber-500/30 bg-amber-500/10 text-amber-500";
    case "low":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-500";
    default:
      return "border-border";
  }
}
