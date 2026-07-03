import { UserNav } from "./user-nav";
import { TtsControls } from "../tts/tts-controls";

export function Header(): JSX.Element {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold">Dashboard</h1>
      </div>
      <div className="flex items-center gap-4">
        <TtsControls />
        <UserNav />
      </div>
    </header>
  );
}
