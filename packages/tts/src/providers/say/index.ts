import { spawn } from "node:child_process";
import { platform } from "node:process";
import { TtsProvider, TtsVoice, TtsOptions, TtsError } from "../../types/index.js";

/**
 * TTS provider pro macOS pomocí vestavěného příkazu `say`.
 * Vyžaduje macOS. Na Linuxu / Windowsu není dostupný.
 */
export class SayTtsProvider implements TtsProvider {
  readonly id = "say";
  readonly name = "macOS Say";
  readonly isLocal = true;

  private activeProcess: ReturnType<typeof spawn> | null = null;

  isAvailable(): boolean {
    return platform === "darwin";
  }

  getVoices(): TtsVoice[] {
    if (!this.isAvailable()) {
      return [];
    }
    return [
      { id: "Zuzana", name: "Zuzana", language: "cs-CZ", gender: "female" },
      { id: "Samantha", name: "Samantha", language: "en-US", gender: "female" },
      { id: "Daniel", name: "Daniel", language: "en-GB", gender: "male" },
    ];
  }

  speak(text: string, options?: TtsOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isAvailable()) {
        resolve();
        return;
      }

      const args: string[] = [];

      if (options?.voice) {
        args.push("-v", options.voice);
      }

      if (options?.rate !== undefined && options.rate > 0) {
        // `say` používá slova za minutu; zrychlení 1.0 = 175 WPM
        const wordsPerMinute = Math.round(175 * options.rate);
        args.push("-r", String(wordsPerMinute));
      }

      args.push(text);

      this.activeProcess = spawn("say", args, { stdio: "ignore" });

      this.activeProcess.on("error", (error) => {
        this.activeProcess = null;
        reject(new TtsError(error.message, this.id));
      });

      this.activeProcess.on("close", (code) => {
        this.activeProcess = null;
        if (code === 0 || code === null) {
          resolve();
        } else {
          reject(new TtsError(`say exited with code ${code}`, this.id));
        }
      });
    });
  }

  stop(): void {
    if (this.activeProcess && !this.activeProcess.killed) {
      this.activeProcess.kill("SIGTERM");
      this.activeProcess = null;
    }
  }
}
