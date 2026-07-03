# MiLO_Core – Agenti

## Filozofie

Agenti v MiLO_Core nejsou chatboti. Jsou to digitální zaměstnanci – samostatné inteligentní entity, které mají vlastní cíl, nástroje, paměť a zodpovědnost.

Každý agent:

- má vlastní system prompt
- má vlastní nástroje
- má vlastní paměť
- má vlastní log
- má vlastní konfiguraci
- má vlastní frontu úkolů
- má vlastní status a health
- umí vysvětlit svou práci

## Výchozí agenti

### Chief of Staff

- **Role:** digitální ředitel kanceláře – plánuje, prioritizuje, deleguje, kontroluje, reportuje a komunikuje s uživatelem
- **Specializace:** daily briefing, prioritizace, delegace, koordinace
- **Nástroje:** Email Service, Calendar Service, Task Manager, Knowledge Service, Agent Manager, Reporting Service
- **Úkol:** každé ráno připravit briefing a koordinovat ostatní agenty
- **Stavy:** `idle → thinking → planning → delegating → working → reviewing → reporting`
- **Live explanation:** vysvětluje co dělá, proč, co zjistil, jaké nástroje používá a co bude následovat
- **Ovládání:** Start, Stop, Pause, Resume, Restart z dashboardu, detailu agenta, API i CLI

### Developer Agent

- **Role:** senior software engineer
- **Specializace:** software engineering, code review, architecture
- **Nástroje:** filesystem, github, shell, code-search
- **Úkol:** pomáhat s vývojem, refaktoringem a technickými rozhodnutími

### Research Agent

- **Role:** research analytik
- **Specializace:** information retrieval, analysis, summarization
- **Nástroje:** obsidian, drive, web-search, pdf-parser
- **Úkol:** hledat informace, analyzovat dokumenty, připravovat rešerše

### Knowledge Agent

- **Role:** správce znalostní báze
- **Specializace:** indexing, vector search, knowledge graphs
- **Nástroje:** obsidian, drive, embeddings, vector-store
- **Úkol:** indexovat dokumenty a zajišťovat vyhledávání napříč zdroji

### Legal Agent

- **Role:** právní analytik
- **Specializace:** contract analysis, legal research, compliance
- **Nástroje:** pdf-parser, obsidian, isds, web-search
- **Úkol:** analyzovat právní dokumenty, smlouvy a rizika

### Document Agent

- **Role:** zpracovatel dokumentů
- **Specializace:** document parsing, extraction, generation
- **Nástroje:** pdf-parser, markdown, obsidian, drive
- **Úkol:** extrahovat data a generovat přehledné výstupy

### Calendar Agent

- **Role:** osobní manažer času
- **Specializace:** scheduling, meeting prep, time management, focus time, deep work, conflict detection
- **Nástroje:** Calendar Service, Conflict Detector, Free Slot Finder, Suggestion Engine, Mock Provider, Google Provider (skeleton)
- **Úkol:** aktivně řídit čas uživatele – synchronizovat kalendáře, detekovat kolize, navrhovat focus time a deep work, optimalizovat den
- **Stavy:** `idle → loading_calendar → analyzing → scheduling → reviewing → reporting`
- **Provideri:** Mock Provider (připraveno), Google Calendar Provider (skeleton pro OAuth)
- **Live explanation:** vysvětluje analýzu dne, nalezené kolize, volné bloky a doporučení
- **Dashboard:** dnešní přehled, produktivní skóre, kolize, smart doporučení, nadcházející události

### Communication Agent

- **Role:** osobní komunikační manažer a sekretář
- **Specializace:** email triage, AI shrnutí, návrhy odpovědí, relationship intelligence, contact management
- **Nástroje:** Communication Service, AI Summary, Draft Generator, Task Extractor, Contact Resolver, Spam Filter
- **Úkol:** řídit příchozí i odchozí komunikaci, minimalizovat čas strávený emaily, předávat přehled Chief of Staff
- **Stavy:** `idle → loading_messages → analyzing → summarizing → drafting_reply → reviewing → reporting`
- **Provideri:** Mock Gmail, Mock WhatsApp (skeleton pro Gmail, WhatsApp, ISDS)
- **Live explanation:** vysvětluje analýzu zpráv, priority, AI shrnutí a připravované koncepty
- **Dashboard:** inbox, priority, čekající odpovědi, AI koncepty, relationship intelligence, statistiky

### Automation Agent

- **Role:** automatizační inženýr
- **Specializace:** workflow automation, scripting, integrations
- **Nástroje:** shell, n8n, home-assistant, github-actions
- **Úkol:** navrhovat a spouštět opakující se workflow

## Definice agenta

Definice agenta je čistá data – bez business logiky:

```ts
export const chiefOfStaffDefinition: AgentDefinition = {
  id: "chief-of-staff",
  name: "Chief of Staff",
  description: "...",
  role: "coordinator",
  specialization: "daily briefing, prioritization, delegation",
  priority: "critical",
  config: {
    model: "gpt-4o",
    temperature: 0.3,
    systemPrompt: "...",
    knowledge: ["daily-routine", "user-preferences"],
    tools: ["calendar", "gmail", "obsidian"],
    permissions: { canRead: [...], canWrite: [...], canExecute: [...] },
    retryPolicy: { maxRetries: 3, backoffMs: 1000 },
    timeoutMs: 120000,
  },
};
```

## Životní cyklus

Agenti se registrují v `AgentManager`, který řídí jejich životní cyklus:

```
register(definition)
  → initialize()
  → start()
  → runTask() / scheduleTask()
  → pause() / resume()
  → restart()
  → stop()
```

Každý agent implementuje jednotné rozhraní `AgentEntity`:

- `initialize()` – registrace agenta
- `start()` – spuštění do stavu `idle`
- `stop()` – přechod do stavu `offline`
- `pause()` / `resume()` – pozastavení a obnovení
- `restart()` – restart agenta (stop + start)
- `runTask(task)` – spuštění úkolu
- `cancelTask(taskId)` – zrušení úkolu
- `scheduleTask(task, when)` – naplánování úkolu
- `retry(taskId)` – retry úkolu
- `heartbeat()` – health check a metriky
- `report()` – report stavu
- `explain()` – lidsky čitelné vysvětlení práce
- `getTaskHistory()` – historie dokončených úkolů
- `getPendingQueue()` – fronta čekajících úkolů

## Transparentnost

Každý agent musí umět odpovědět:

1. Co právě dělám?
2. Proč to dělám?
3. Jaký je další krok?
4. Jaké nástroje používám?
5. Kolik práce zbývá?
6. Jak dlouho to bude trvat?
7. Co jsem právě dokončil?
8. Co potřebuji od uživatele?

Viz `AOS.md` pro detailní popis live work explanation.

## Dashboard

Agent Operating Center v dashboardu zobrazuje:

- stav každého agenta
- aktuální úkol
- live explanation
- frontu úkolů
- statistiky
- logy

## Přidání nového agenta

1. Vytvoř definici v `packages/agents/src/registry/<agent>.ts`
2. Exportuj ji z `packages/agents/src/registry/index.ts`
3. Přidej ji do `defaultAgentDefinitions`
4. Spusť simulaci: `pnpm --filter @milo/agents simulate`
