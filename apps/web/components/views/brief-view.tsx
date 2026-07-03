"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TtsPlayButton } from "@/components/tts/tts-play-button";
import { useTtsStore } from "@/stores/tts-store";

export function BriefView(): JSX.Element {
  const [briefing, setBriefing] = useState<string | null>(null);
  const { autoSpeak, speak } = useTtsStore();

  const generateBriefing = async (): Promise<void> => {
    // TODO: napojit na Agent Runtime přes API
    const text = `Dobré ráno. Dnes je ${new Date().toLocaleDateString("cs-CZ")}. Nemáte žádné naléhavé schůzky. Doporučuji začít s hlavní prioritou dne.`;
    setBriefing(text);

    if (autoSpeak) {
      await speak(text);
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
        <Button onClick={generateBriefing} className="gap-2">
          <Sparkles className="h-4 w-4" />
          Generovat briefing
        </Button>
      </div>

      {briefing ? (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <p className="text-lg leading-relaxed whitespace-pre-line">{briefing}</p>
          <div className="mt-4">
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
