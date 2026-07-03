"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useTtsStore } from "@/stores/tts-store";

export function TtsControls(): JSX.Element | null {
  const [mounted, setMounted] = useState(false);
  const { isAvailable, autoSpeak, setAutoSpeak, stop } = useTtsStore();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  if (!isAvailable) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5">
        <Volume2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Auto číst</span>
        <Switch
          checked={autoSpeak}
          onCheckedChange={setAutoSpeak}
          aria-label="Automaticky číst odpovědi"
        />
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={stop}
        title="Zastavit přehrávání"
        aria-label="Zastavit přehrávání"
      >
        <VolumeX className="h-4 w-4" />
      </Button>
    </div>
  );
}
