import { TtsProvider, TtsOptions } from "../types/index.js";

export class TtsRegistry {
  private providers = new Map<string, TtsProvider>();
  private defaultProviderId: string | null = null;

  register(provider: TtsProvider, isDefault = false): void {
    this.providers.set(provider.id, provider);
    if (isDefault || this.defaultProviderId === null) {
      this.defaultProviderId = provider.id;
    }
  }

  get(id: string): TtsProvider {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new Error(`TTS provider '${id}' not found`);
    }
    return provider;
  }

  getDefault(): TtsProvider | null {
    return this.defaultProviderId ? this.get(this.defaultProviderId) : null;
  }

  list(): TtsProvider[] {
    return Array.from(this.providers.values());
  }

  async getFirstAvailable(): Promise<TtsProvider | null> {
    for (const provider of Array.from(this.providers.values())) {
      if (await provider.isAvailable()) {
        return provider;
      }
    }
    return null;
  }

  async speak(text: string, options?: TtsOptions): Promise<void> {
    const provider = await this.getFirstAvailable();
    if (!provider) {
      // TTS není dostupné – aplikace nesmí spadnout, jen tiše přeskočíme
      return;
    }
    await provider.speak(text, options);
  }

  async stop(): Promise<void> {
    for (const provider of Array.from(this.providers.values())) {
      if (await provider.isAvailable()) {
        await provider.stop();
      }
    }
  }
}
