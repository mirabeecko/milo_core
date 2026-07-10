"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { generateBriefing } from "@/lib/api/briefing.api";

interface VoiceControlsProps {
  briefingText?: string;
  onTranscription?: (text: string) => void;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function VoiceControls({
  briefingText,
  onTranscription,
}: VoiceControlsProps): JSX.Element {
  const [speaking, setSpeaking] = useState(false);
  const [speakError, setSpeakError] = useState<string | null>(null);
  const [listening, setListening] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const recognitionRef = useRef<unknown>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        (recognitionRef.current as any)?.stop();
      }
      window.speechSynthesis?.cancel();
    };
  }, []);

  const getCsVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (typeof window === "undefined" || !window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    return voices.find((v) => v.lang.startsWith("cs")) ?? null;
  }, []);

  const speakBriefing = useCallback(async () => {
    setSpeakError(null);

    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSpeakError("SpeechSynthesis není podporován");
      return;
    }

    let text = briefingText;
    if (!text) {
      try {
        const res = await generateBriefing();
        text = res.briefing;
      } catch {
        setSpeakError("Nepodařilo se načíst briefing");
        return;
      }
    }

    const plainText = text.replace(/[#*_`>-]/g, "").replace(/\n+/g, ". ").trim();
    if (!plainText) {
      setSpeakError("Prázdný text k přečtení");
      return;
    }

    const voice = getCsVoice();
    if (!voice) {
      setSpeakError("Český hlas není k dispozici");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.lang = "cs-CZ";
    utterance.voice = voice;
    utterance.rate = 1.0;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => {
      setSpeaking(false);
      setSpeakError("Přehrávání selhalo");
    };

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [briefingText, getCsVoice]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (listening) {
      (recognitionRef.current as any)?.stop();
      setListening(false);
      return;
    }

    setMicError(null);
    const SpeechRecognitionCtor =
      window.SpeechRecognition ?? window.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      setMicError("Mikrofon vyžaduje HTTPS nebo localhost");
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "cs-CZ";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => {
      setListening(false);
      setMicError("Mikrofon není dostupný");
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) {
        if (onTranscription) {
          onTranscription(transcript);
        } else {
          window.location.href = `/chat?prompt=${encodeURIComponent(transcript)}`;
        }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [listening, onTranscription]);

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={speaking ? stopSpeaking : () => void speakBriefing()}
        title={speaking ? "Zastavit přehrávání" : "Přečíst briefing nahlas"}
        aria-label={speaking ? "Zastavit přehrávání" : "Přečíst briefing nahlas"}
        className={cn(
          "h-8 w-8 rounded-none border border-[var(--hud-border)] text-muted-foreground hover:border-[var(--hud-green)] hover:text-[var(--hud-green)]",
          speaking && "border-[var(--hud-green)] text-[var(--hud-green)]",
        )}
      >
        {speaking ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={toggleListening}
        title={listening ? "Zastavit nahrávání" : "Hlasový vstup"}
        aria-label={listening ? "Zastavit nahrávání" : "Hlasový vstup"}
        className={cn(
          "h-8 w-8 rounded-none border border-[var(--hud-border)] text-muted-foreground hover:border-[var(--hud-blue)] hover:text-[var(--hud-blue)]",
          listening && "border-[var(--hud-blue)] text-[var(--hud-blue)] animate-pulse",
        )}
      >
        {listening ? (
          <MicOff className="h-4 w-4" />
        ) : (
          <Mic className="h-4 w-4" />
        )}
      </Button>

      {(speaking || listening || speakError || micError) && (
        <div className="flex flex-col gap-0.5 text-xs">
          {speaking && (
            <span className="font-mono text-[var(--hud-green)]">Playing...</span>
          )}
          {listening && (
            <span className="font-mono text-[var(--hud-blue)]">Listening...</span>
          )}
          {speakError && (
            <span className="font-mono text-[var(--hud-red)]">{speakError}</span>
          )}
          {micError && (
            <span className="font-mono text-[var(--hud-amber)]">{micError}</span>
          )}
        </div>
      )}
    </div>
  );
}
