"use client";

import { ArrowDownRight, ArrowUpRight, Mail, Sparkles, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { AiSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

export function AiSummaryWidget({ summary }: { summary: AiSummary }): JSX.Element {
  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>AI souhrn</CardTitle>
              <div className="text-sm text-muted-foreground">
                Za posledních 24 hodin
              </div>
            </div>
          </div>
          <Badge variant="outline" className="gap-1.5">
            <TrendingUp className="h-3 w-3" />
            {summary.totalVisits.toLocaleString("cs-CZ")} návštěv
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Emails */}
        <div className="flex items-start gap-4 rounded-xl border border-border bg-card/50 p-4">
          <div className="rounded-lg bg-rose-500/10 p-2 text-rose-500">
            <Mail className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">{summary.unreadEmails} nové e-maily</h4>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Od: {summary.emailSenders.join(", ")}
            </p>
          </div>
        </div>

        {/* GA4 sites */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">
            Návštěvy z webů (GA4)
          </h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {summary.siteVisits.map((site) => (
              <div
                key={site.site}
                className="flex items-center justify-between rounded-xl border border-border bg-card/50 p-3"
              >
                <div>
                  <div className="font-medium">{site.site}</div>
                  <div className="text-xs text-muted-foreground">
                    {site.uniqueVisitors.toLocaleString("cs-CZ")} unikátních
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {site.visits.toLocaleString("cs-CZ")}
                  </div>
                  <div
                    className={cn(
                      "flex items-center justify-end text-xs font-medium",
                      site.changePercent >= 0 ? "text-emerald-500" : "text-rose-500"
                    )}
                  >
                    {site.changePercent >= 0 ? (
                      <ArrowUpRight className="h-3 w-3" />
                    ) : (
                      <ArrowDownRight className="h-3 w-3" />
                    )}
                    {Math.abs(site.changePercent)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Insight */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
          <span className="font-medium text-primary">💡 Insight:</span>{" "}
          <span className="text-muted-foreground">{summary.insight}</span>
        </div>
      </CardContent>
    </Card>
  );
}
