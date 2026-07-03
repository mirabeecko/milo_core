import { create } from "zustand";
import { TtsRegistry, TtsOptions } from "@milo/tts";
import { WebSpeechTtsProvider } from "@milo/tts/web-speech";

interface TtsState {
  isAvailable: boolean;
  autoSpeak: boolean;
  registry: TtsRegistry;
  setAutoSpeak: (value: boolean) => void;
  speak: (text: string, options?: TtsOptions) => Promise<void>;
  stop: () => void;
  refreshAvailability: () => Promise<void>;
}

function createRegistry(): TtsRegistry {
  const registry = new TtsRegistry();
  registry.register(new WebSpeechTtsProvider(), true);
  return registry;
}

export const useTtsStore = create<TtsState>((set, get) => {
  const registry = createRegistry();

  const refreshAvailability = async (): Promise<void> => {
    const provider = await registry.getFirstAvailable();
    set({ isAvailable: provider !== null });
  };

  return {
    isAvailable: false,
    autoSpeak: false,
    registry,
    setAutoSpeak: (value) => set({ autoSpeak: value }),
    speak: async (text, options) => {
      const firstAvailable = await get().registry.getFirstAvailable();
      if (!firstAvailable) {
        return;
      }
      await firstAvailable.speak(text, options);
    },
    stop: () => {
      get().registry.stop();
    },
    refreshAvailability,
  };
});
