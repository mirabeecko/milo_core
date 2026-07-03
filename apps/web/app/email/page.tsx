"use client";

import { useEffect, useState } from "react";
import { Mail, MailOpen } from "lucide-react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";

interface Email {
  id: string;
  subject: string;
  from: string;
  date: string;
  snippet: string;
  isUnread: boolean;
}

export default function EmailPage(): JSX.Element {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchEmails(): Promise<void> {
      try {
        const response = await fetch("/api/email", {
          headers: { Authorization: "Bearer demo-token" },
        });

        if (!response.ok) {
          throw new Error("Nepodařilo se načíst emaily");
        }

        const data = (await response.json()) as { emails: Email[] };
        setEmails(data.emails);
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchEmails();
  }, []);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Email</h2>
            <p className="text-muted-foreground">Přehled nepřečtených emailů z Gmailu.</p>
          </div>
          <Button variant="outline">Připojit Gmail</Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Načítám emaily...</p>
        ) : emails.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
            <p className="text-muted-foreground">Žádné emaily k zobrazení.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {emails.map((email) => (
              <div
                key={email.id}
                className={`flex items-start gap-4 rounded-xl border border-border bg-card p-4 shadow-sm ${
                  email.isUnread ? "border-l-4 border-l-primary" : ""
                }`}
              >
                <div className="mt-1">
                  {email.isUnread ? (
                    <Mail className="h-5 w-5 text-primary" />
                  ) : (
                    <MailOpen className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold ${email.isUnread ? "text-foreground" : "text-muted-foreground"}`}>
                      {email.subject}
                    </h3>
                    <span className="text-xs text-muted-foreground">
                      {new Date(email.date).toLocaleString("cs-CZ")}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{email.from}</p>
                  <p className="text-sm">{email.snippet}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
