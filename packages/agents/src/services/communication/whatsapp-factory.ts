import { DisabledWhatsAppProvider } from "./disabled-whatsapp-provider.js";
import { MockWhatsAppProvider } from "./mock-provider.js";
import type { CommunicationProvider } from "./types.js";

export type WhatsAppMode = "disabled" | "mock" | "kapso" | "meta" | "twilio";

export function createWhatsAppProvider(
  mode: WhatsAppMode = resolveWhatsAppMode(),
): CommunicationProvider {
  switch (mode) {
    case "mock":
      return new MockWhatsAppProvider();
    case "kapso":
      throw new Error(
        "WhatsApp provider 'kapso' zatím není implementován. " +
        "Použij env COMMUNICATION_WHATSAPP_MODE=mock pro demo, " +
        "nebo implementuj KapsoWhatsAppProvider."
      );
    case "meta":
      throw new Error(
        "WhatsApp provider 'meta' zatím není implementován. " +
        "Použij env COMMUNICATION_WHATSAPP_MODE=mock pro demo, " +
        "nebo implementuj MetaWhatsAppProvider."
      );
    case "twilio":
      throw new Error(
        "WhatsApp provider 'twilio' zatím není implementován. " +
        "Použij env COMMUNICATION_WHATSAPP_MODE=mock pro demo, " +
        "nebo implementuj TwilioWhatsAppProvider."
      );
    case "disabled":
    default:
      if (mode !== "disabled") {
        console.warn(
          `WhatsApp factory: neznámý mód "${mode}". Používám "disabled". ` +
          `Platné hodnoty: disabled, mock, kapso, meta, twilio.`
        );
      }
      return new DisabledWhatsAppProvider();
  }
}

function resolveWhatsAppMode(): WhatsAppMode {
  const env = typeof process !== "undefined" && process.env;
  if (!env) return "disabled";

  const raw = (env.COMMUNICATION_WHATSAPP_MODE ?? "").trim().toLowerCase();
  const valid: WhatsAppMode[] = ["disabled", "mock", "kapso", "meta", "twilio"];

  if (valid.includes(raw as WhatsAppMode)) {
    return raw as WhatsAppMode;
  }

  if (raw) {
    console.warn(
      `Neznámý COMMUNICATION_WHATSAPP_MODE="${raw}". ` +
      `Platné hodnoty: ${valid.join(", ")}. Používám "disabled".`
    );
  }

  return "disabled";
}

export function resolveWhatsAppModeLabel(): string {
  const mode = resolveWhatsAppMode();
  switch (mode) {
    case "disabled": return "disabled (nenakonfigurováno — nastav COMMUNICATION_WHATSAPP_MODE)";
    case "mock": return "demo/mock (simulovaná data, ne reálný WhatsApp)";
    default: return `${mode} (není implementováno)`;
  }
}
