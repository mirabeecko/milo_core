"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): JSX.Element {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="rounded-2xl bg-destructive/10 p-4 text-destructive">
        <AlertCircle className="h-10 w-10" />
      </div>
      <div className="max-w-md space-y-2">
        <h1 className="text-2xl font-bold">Něco se pokazilo</h1>
        <p className="text-muted-foreground">
          {error.message || "Aplikace narazila na neočekávanou chybu. Zkus ji načíst znovu."}
        </p>
      </div>
      <Button onClick={() => reset()} className="gap-2">
        <RefreshCw className="h-4 w-4" />
        Zkusit znovu
      </Button>
    </div>
  );
}
