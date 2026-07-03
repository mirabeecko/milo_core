"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TtsPlayButton } from "@/components/tts/tts-play-button";
import { useTtsStore } from "@/stores/tts-store";

interface BriefingResponse {
  briefing: string;
  demo?: boolean;
}

export function BriefView(): JSX.Element {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { autoSpeak, speak } = useTtsStore();

  const generateBriefing = async (): Promise<void> => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/briefing", {
        headers: {
          Authorization: "Bearer demo-token",
        },
      });

      if (!response.ok) {
        throw new Error("Nepodařilo se načíst briefing");
      }

      const data = (await response.json()) as BriefingResponse;
      setBriefing(data.briefing);
      setIsDemo(data.demo ?? false);

      if (autoSpeak) {
        await speak(data.briefing);
      }
    } catch (error) {
      console.error(error);
      setBriefing("Chyba při generování briefing. Zkuste to znovu.");
      setIsDemo(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Today&apos;s Brief</h2>
          <p className="text-muted-foreground">
            Tvůj ranní briefing připravený Chief of Staff agentem.
          </p>
        </div>
        <Button onClick={generateBriefing} disabled={isLoading} className="gap-2">
          <Sparkles className="h-4 w-4" />
          {isLoading ? "Generuji..." : "Generovat briefing"}
        </Button>
      </div>

      {briefing ? (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          {isDemo && (
            <div className="mb-4 rounded-md bg-warning/10 px-3 py-2 text-sm text-warning">
              AI provider není nakonfigurován – zobrazuji demo briefing.
            </div>
          )}
          <div className="prose prose-invert max-w-none">
            {briefing.split("\n").map((line, index) => {
              if (line.startsWith("# ")) {
                return <h1 key={index} className="text-2xl font-bold">{line.slice(2)}</h1>;
              }
              if (line.startsWith("## ")) {
                return <h2 key={index} className="mt-6 text-xl font-semibold">{line.slice(3)}</h2>;
              }
              if (line.startsWith("- ") || line.match(/^\d+\. /)) {
                return <li key={index}>{line.replace(/^[-\d.]+\s*/, "")}</li>;
              }
              if (line.trim() === "") {
                return <div key={index} className="h-2" />;
              }
              return <p key={index}>{line}</p>;
            })}
          </div>
          <div className="mt-6">
            <TtsPlayButton text={briefing} />
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
          <p className="text-muted-foreground">
            Klikni na „Generovat briefing“ pro první ranní přehled.
          </p>
        </div>
      )}
    </div>
  );
}
