import { ObsidianClient, type ObsidianNote } from "@milo/tools";
import { config } from "../../config/index.js";

export class KnowledgeService {
  private obsidian: ObsidianClient | null = null;

  constructor() {
    if (config.OBSIDIAN_VAULT_PATH) {
      this.obsidian = new ObsidianClient({ vaultPath: config.OBSIDIAN_VAULT_PATH });
    }
  }

  isConfigured(): boolean {
    return Boolean(config.OBSIDIAN_VAULT_PATH);
  }

  isDemo(): boolean {
    return config.DEMO_MODE || !this.isConfigured();
  }

  async listObsidianNotes(maxResults = 20): Promise<ObsidianNote[]> {
    if (this.isDemo()) {
      return this.generateDemoNotes();
    }

    if (!this.obsidian) {
      return this.generateDemoNotes();
    }

    try {
      const notes = await this.obsidian.listNotes({ maxResults });
      if (notes.length === 0) {
        return this.generateDemoNotes();
      }
      return notes;
    } catch (error) {
      console.error(error);
      return this.generateDemoNotes();
    }
  }

  generateDemoNotes(): ObsidianNote[] {
    return [
      {
        id: "demo-obsidian-1",
        title: "Welcome to MiLO",
        path: "welcome.md",
        content: "# Welcome to MiLO\n\nToto je demo poznámka z Obsidianu.\n\n#milo #setup",
        modifiedAt: new Date(),
        tags: ["#milo", "#setup"],
      },
      {
        id: "demo-obsidian-2",
        title: "Daily Notes Template",
        path: "templates/daily.md",
        content: "# {{date}}\n\n## Priority\n- [ ] Hlavní úkol\n\n## Poznámky\n\n#daily",
        modifiedAt: new Date(Date.now() - 86400_000),
        tags: ["#daily"],
      },
    ];
  }
}
