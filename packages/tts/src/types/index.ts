export interface TtsVoice {
  id: string;
  name: string;
  language?: string;
  gender?: "male" | "female" | "neutral";
}

export interface TtsOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface TtsProvider {
  readonly id: string;
  readonly name: string;
  readonly isLocal: boolean;

  isAvailable(): Promise<boolean> | boolean;
  getVoices(): Promise<TtsVoice[]> | TtsVoice[];
  speak(text: string, options?: TtsOptions): Promise<void>;
  stop(): Promise<void> | void;
}

export class TtsError extends Error {
  constructor(
    message: string,
    public readonly providerId: string,
  ) {
    super(message);
    this.name = "TtsError";
  }
}
