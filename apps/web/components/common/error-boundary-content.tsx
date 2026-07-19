"use client";

import { AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryContentProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export function ErrorBoundaryContent({ error, reset }: ErrorBoundaryContentProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center p-8">
      <Card className="mx-auto w-full max-w-md border-destructive/30 bg-destructive/5">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <CardTitle className="text-xl">Něco se pokazilo</CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {error.message || "Došlo k neočekávané chybě. Zkuste to prosím znovu."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pb-6">
          <Button onClick={reset} variant="outline">
            Zkusit znovu
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
