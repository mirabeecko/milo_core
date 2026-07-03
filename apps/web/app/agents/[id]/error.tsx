"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layout/dashboard-layout";

interface AgentDetailErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AgentDetailError({ error, reset }: AgentDetailErrorProps): JSX.Element {
  useEffect(() => {
    console.error("Agent detail error:", error);
  }, [error]);

  return (
    <DashboardLayout>
      <div className="mx-auto flex max-w-xl flex-col items-center justify-center gap-6 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10">
          <AlertTriangle className="h-8 w-8 text-rose-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">Nepodařilo se načíst detail agenta</h1>
          <p className="text-muted-foreground">
            {error.message || "Zkuste stránku obnovit nebo se vraťte zpět na seznam agentů."}
          </p>
        </div>
        <Button onClick={reset} className="gap-2">
          <RotateCcw className="h-4 w-4" />
          Zkusit znovu
        </Button>
      </div>
    </DashboardLayout>
  );
}
