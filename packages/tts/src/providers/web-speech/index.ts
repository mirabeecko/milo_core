import { TtsProvider, TtsVoice, TtsOptions } from "../../types/index.js";

/**
 * TTS provider pro prohlížeč pomocí Web Speech API.
 * Dostupný pouze v browseru.
 */
export class WebSpeechTtsProvider implements TtsProvider {
  readonly id = "web-speech";
  readonly name = "Web Speech API";
  readonly isLocal = true;

  isAvailable(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  getVoices(): TtsVoice[] {
    if (!this.isAvailable()) {
      return [];
    }
    return window.speechSynthesis.getVoices().map((voice) => ({
      id: voice.voiceURI,
      name: voice.name,
      language: voice.lang,
    }));
  }

  speak(text: string, options?: TtsOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isAvailable()) {
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);

      if (options?.voice) {
        const voice = window.speechSynthesis
          .getVoices()
          .find((v) => v.voiceURI === options.voice || v.name === options.voice);
        if (voice) {
          utterance.voice = voice;
        }
      }

      if (options?.rate !== undefined) {
        utterance.rate = options.rate;
      }

      if (options?.pitch !== undefined) {
        utterance.pitch = options.pitch;
      }

      if (options?.volume !== undefined) {
        utterance.volume = options.volume;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (event) => reject(new Error(event.error));

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    });
  }

  stop(): void {
    if (this.isAvailable()) {
      window.speechSynthesis.cancel();
    }
  }
}
