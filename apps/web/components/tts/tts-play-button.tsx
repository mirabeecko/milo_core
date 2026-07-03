"use client";

import { Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTtsStore } from "@/stores/tts-store";

interface TtsPlayButtonProps {
  text: string;
}

export function TtsPlayButton({ text }: TtsPlayButtonProps): JSX.Element | null {
  const { isAvailable, speak } = useTtsStore();

  if (!isAvailable) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => speak(text)}
      className="gap-2"
      aria-label="Přehrát odpověď"
    >
      <Volume2 className="h-4 w-4" />
      Přehrát odpověď
    </Button>
  );
}
