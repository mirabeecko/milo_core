"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="cs" className="dark">
      <body className="bg-background text-foreground" style={{ fontFamily: "system-ui, sans-serif" }}>
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
          <div className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <span className="text-primary">MiLO</span>
            <span className="text-muted-foreground font-normal">OS</span>
          </div>

          <div className="mx-auto w-full max-w-md rounded-xl border border-destructive/30 bg-destructive/5 p-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <h1 className="mb-2 text-xl font-semibold">Něco se pokazilo</h1>
            <p className="mb-6 text-sm text-muted-foreground">
              {error.message || "Došlo k neočekávané chybě. Zkuste to prosím znovu."}
            </p>
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            >
              <RefreshCw className="h-4 w-4" />
              Zkusit znovu
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            MiLO – osobn&iacute; operačn&iacute; syst&eacute;m
          </p>
        </div>
      </body>
    </html>
  );
}
