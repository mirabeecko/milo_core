#!/usr/bin/env node
import { program } from "commander";
import dotenv from "dotenv";
import { TtsRegistry } from "@milo/tts";
import { SayTtsProvider } from "@milo/tts/say";

dotenv.config();

function createTtsRegistry(): TtsRegistry {
  const registry = new TtsRegistry();
  registry.register(new SayTtsProvider(), true);
  return registry;
}

async function speakIfRequested(text: string, speak: boolean): Promise<void> {
  if (!speak) {
    return;
  }

  const registry = createTtsRegistry();
  const provider = await registry.getFirstAvailable();

  if (!provider) {
    console.error("TTS není dostupné. Odpověď byla vypsána pouze jako text.");
    return;
  }

  await registry.speak(text, { rate: 1.0 });
}

program
  .name("milo")
  .description("MiLO_Core CLI")
  .version("0.1.0");

program
  .command("brief")
  .description("Vygeneruj ranní briefing")
  .option("-s, --speak", "Přečti odpověď nahlas", false)
  .action(async (options: { speak: boolean }) => {
    const briefing = `Dobré ráno. Dnes je ${new Date().toLocaleDateString("cs-CZ")}. Nemáte žádné naléhavé schůzky. Doporučuji začít s hlavní prioritou dne.`;

    console.log(briefing);
    await speakIfRequested(briefing, options.speak);
  });

program
  .command("ask")
  .description("Zeptej se MiLO")
  .argument("<question>", "Otázka pro MiLO")
  .option("-s, --speak", "Přečti odpověď nahlas", false)
  .action(async (question: string, options: { speak: boolean }) => {
    // TODO: napojit na Agent Runtime a AI provider
    const answer = `Odpověď na '${question}' bude dostupná po napojení AI providera.`;

    console.log(answer);
    await speakIfRequested(answer, options.speak);
  });

program.parse();
