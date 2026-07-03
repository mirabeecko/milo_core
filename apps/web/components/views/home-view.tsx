import { TtsPlayButton } from "@/components/tts/tts-play-button";

export function HomeView(): JSX.Element {
  const welcomeText = "Vítej v MiLO. Tvůj osobní operační systém je připraven.";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Home</h2>
        <p className="text-muted-foreground">
          Přehled dne, priorit a aktivity na jednom místě.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <p className="text-lg">{welcomeText}</p>
        <div className="mt-4">
          <TtsPlayButton text={welcomeText} />
        </div>
      </div>
    </div>
  );
}
