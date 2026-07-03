# MiLO_Core – Architektura

## Přehled

MiLO_Core používá **Domain Driven Design (DDD)** s čistou architekturou. Systém je rozdělen na samostatné vrstvy, které lze testovat nezávisle.

```
┌─────────────────────────────────────────────────────────────┐
│                  UI (Next.js + Design System)               │
├─────────────────────────────────────────────────────────────┤
│              API Gateway (Fastify + tRPC/REST)              │
├─────────────────────────────────────────────────────────────┤
│  Services  │  AI Runtime  │  Agent Runtime  │  Knowledge   │
├─────────────────────────────────────────────────────────────┤
│           Event Bus  │  Background Jobs  │  Cache          │
├─────────────────────────────────────────────────────────────┤
│  Database (Supabase/Postgres)  │  Vector Store  │  Object  │
├─────────────────────────────────────────────────────────────┤
│  Tools  │  Integrations  │  MCP / Plugin Runtime            │
├─────────────────────────────────────────────────────────────┤
│        Observability  │  Security  │  Local-First Sync     │
└─────────────────────────────────────────────────────────────┘
```

---

## Vrstvy

### 1. UI & Design System

- **Framework:** Next.js 15 (App Router, React Server Components)
- **Styling:** Tailwind CSS, shadcn/ui jako základ
- **Design System:** vlastní design tokens, komponenty a patterns nad shadcn/ui
- **Stav:** TanStack Query pro server state, Zustand pro lokální stav
- **Výchozí režim:** dark mode
- **Responzivita:** desktop-first s plnou mobilní podporou
- **Standard:** animace 60 fps, interakce pod 100 ms, lighthouse 90+

Zodpovídá za:

- dashboard a všechny obrazovky
- navigaci a command palette
- real-time updates přes Supabase Realtime / WebSockets
- offline-first zážitek (později)

### 2. API Gateway

- **Framework:** Fastify 5
- **Jazyk:** TypeScript
- **Typová bezpečnost:** tRPC nebo REST s generovanými typy
- **Rate limiting, CORS, helmet, request validation**

Zodpovídá za:

- routing a versioning
- autentizaci a autorizaci (RBAC)
- validaci vstupů pomocí Zod
- orchestraci služeb
- streaming odpovědí od AI

### 3. Services

Business logika rozdělená podle domén. Každá služba:

- má jasně definované rozhraní
- používá repository pattern
- nezávisí na frameworku
- publikuje a konzumuje události
- je pokrytá unit a integračními testy

Příklady: `AuthService`, `BriefingService`, `EmailService`, `CalendarService`, `DocumentService`, `KnowledgeService`, `AgentService`.

### 4. AI Runtime

Abstrakce nad LLM providery:

- `AiProvider` – OpenAI, Anthropic, Ollama, Groq, vlastní modely
- `PromptRegistry` – verzované a testovatelné prompty
- `EmbeddingService` – generování embeddings
- `VectorSearchService` – RAG s re-rankingem a citacemi
- `StreamingService` – streamování odpovědí do UI

### 5. Agent Runtime

Agenti nejsou jen prompty – jsou to spolehlivé runtime moduly:

- `Agent` – definice cíle, paměti a nástrojů
- `ToolRegistry` – bezpečné volání nástrojů s validací
- `Memory` – krátkodobá a dlouhodobá paměť
- `Planner` – plánování kroků a reflexe
- `ExecutionEngine` – spouštění agentů synchronně i asynchronně
- `AgentLogs` – audit trail všech rozhodnutí

Každý agent má vlastní prompt, tools, paměť, logy a nastavení.

### 6. Text-to-Speech (TTS)

MiLO podporuje hlasový výstup odpovědí jako volitelnou funkci. Vstup zůstává přes chat / dashboard / CLI.

- `TtsProvider` – abstrakce nad TTS providery
- `TtsRegistry` – vybere první dostupný provider, aplikace nesmí spadnout
- Provideri:
  - `SayTtsProvider` – macOS `say` (lokální)
  - `WebSpeechTtsProvider` – Web Speech API v prohlížeči
  - `ElevenLabsTtsProvider` – cloud (později)
  - `OpenAiTtsProvider` – cloud (později)

Použití:

- UI: tlačítko „Přehrát odpověď“, přepínač „Automaticky číst odpovědi“, nastavení hlasu / rychlosti
- CLI: `milo brief --speak`, `milo ask "otázka" --speak`

### 7. Knowledge

Centrální nervový systém MiLO:

- ingestace z Gmail, Drive, Obsidian, ISDS, GitHub, poznámek
- chunking, embeddings, metadata extrakce
- vector search s filtry a hybridním vyhledáváním
- knowledge graph pro vztahy mezi entitami
- každá odpověď obsahuje zdroj

### 8. Database & Storage

- **Supabase Postgres** – primární transakční data
- **pgvector** – vector search
- **Redis** – cache, sessions, rate limiting, pub/sub
- **S3-compatible object storage** – soubory, attachments, velké dokumenty

### 9. Event Bus & Background Jobs

- **Redis pub/sub** nebo **NATS** pro event bus
- **BullMQ** pro spolehlivé background jobs
- event sourcing pro kritické domény (agent runs, user actions)

Použití:

- sync emailů, kalendáře, souborů
- generování embeddings
- spouštění agentů na pozadí
- notifikace

### 10. Tools & Integrations

Adaptery pro externí systémy:

- Gmail, Google Calendar, Google Drive
- Obsidian (lokální i cloud)
- WhatsApp, Home Assistant, ISDS, GitHub (později)

Každý tool:

- má vlastní adapter
- konfigurovatelný OAuth
- oddělený od business logiky
- podporuje MCP (Model Context Protocol)

### 11. Plugin / MCP Runtime

MiLO je platforma, ne jen uzavřená aplikace:

- podpora MCP serverů pro externí nástroje
- vlastní plugin API pro komunitní rozšíření
- sandboxované spouštění pluginů

### 12. Observability & Reliability

- **OpenTelemetry** – tracing, metrics
- **Sentry** – error tracking
- **Structured logging** (Pino)
- **Health checks, readiness, liveness probes**
- **Circuit breakers a retry policies** pro externí volání

### 13. Security

- Autentizace přes Supabase Auth (OAuth, magic link, passkeys)
- JWT tokeny s krátkou platností, refresh tokeny
- RBAC a oprávnění na úrovni zdrojů
- API rate limiting
- Validace vstupů pomocí Zod
- Šifrování citlivých tokenů (AES-256)
- Audit log
- Žádné secrets v kódu

---

## Struktura projektu

```
MiLO_Core/
├── README.md
├── ARCHITECTURE.md
├── ROADMAP.md
├── TASKS.md
├── .env.example
├── docker-compose.yml
├── .dockerignore
├── .github/
│   └── workflows/
│       └── ci.yml
├── apps/
│   ├── web/                        # Next.js frontend
│   │   ├── app/
│   │   ├── components/
│   │   │   ├── ui/                 # shadcn/ui komponenty
│   │   │   └── milo/               # vlastní MiLO komponenty
│   │   ├── lib/
│   │   ├── hooks/
│   │   ├── stores/                 # Zustand stores
│   │   ├── queries/                # TanStack Query
│   │   ├── styles/
│   │   ├── types/
│   │   ├── public/
│   │   ├── package.json
│   │   ├── next.config.js
│   │   └── tailwind.config.ts
│   ├── api/                        # Fastify backend
│   └── cli/                        # MiLO CLI
│       ├── src/
│       │   ├── config/
│       │   ├── modules/
│       │   │   ├── auth/
│       │   │   ├── briefing/
│       │   │   ├── email/
│       │   │   ├── calendar/
│       │   │   ├── documents/
│       │   │   ├── knowledge/
│       │   │   ├── agents/
│       │   │   └── integrations/
│       │   ├── shared/
│       │   ├── infrastructure/     # Redis, event bus, jobs, observability
│       │   └── server.ts
│       ├── tests/
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── shared/                     # sdílené typy, utils, schema
│   ├── ai/                         # AI runtime, prompts, embeddings
│   ├── tts/                        # text-to-speech abstrakce a providery
│   ├── database/                   # Supabase klient, repository, migrations
│   ├── tools/                      # integrace s externími službami
│   ├── agents/                     # agent runtime a definice agentů
│   └── design-system/              # design tokens, theme
├── docker/
│   ├── postgres/
│   ├── redis/
│   └── ollama/
└── docs/
    ├── reviews/                    # Architecture Review výstupy
    └── decisions/                  # ADRs (Architecture Decision Records)
```

---

## Design principy

- **Dependency Injection** – žádné globální závislosti.
- **Repository Pattern** – abstrakce nad databází.
- **Feature-based folders** – každá doména má vlastní složku.
- **Strict TypeScript** – `strict: true` na frontendu i backendu.
- **Clean Architecture** – UI a API nezávisí na implementaci služeb.

---

## Komunikace mezi vrstvami

```
┌─────┐    HTTP/tRPC/WS    ┌─────┐    DI/events    ┌──────────┐
│ UI  │◀──────────────────▶│ API │◀───────────────▶│ Services │
└─────┘                    └─────┘                 └────┬─────┘
                                                        │
                       ┌──────────────┬────────────────┼──────────────┐
                       │              │                │              │
                       ▼              ▼                ▼              ▼
                   Database       AI Runtime    Agent Runtime   Tools/Plugins
                       │
                       ▼
               Event Bus / Jobs / Cache / Vector Store / Object Storage
```

Services publikují události přes Event Bus. Background Jobs zpracovávají dlouhotrvající operace. Cache a Object Storage snižují zátěž na primární databázi.

---

## Premium standard

Aby MiLO obstál vedle Notion, Linear, Cursor nebo ChatGPT, platí tyto nevyjednatelné požadavky:

1. **Rychlost** – první vykreslení pod 1 s, interakce pod 100 ms.
2. **Spolehlivost** – background jobs s retry, dead-letter queue, idempotence.
3. **UX polish** – konzistentní design system, plynulé animace, dark mode, command palette, klávesové zkratky.
4. **AI quality** – streaming, citace zdrojů, multi-provider fallback, prompty pod kontrolou verzí.
5. **Security** – encryption at rest, audit log, RBAC, bezpečné OAuth.
6. **Extensibility** – MCP / plugin runtime od první verze.
7. **Observability** – tracing, metrics, error tracking od prvního dne.
8. **Data ownership** – možnost exportu dat, lokální vault pro Obsidian, transparentní sync.

---

## Bezpečnost

- Autentizace přes Supabase Auth (OAuth, magic link, passkeys)
- JWT tokeny s krátkou platností, refresh tokeny
- RBAC a oprávnění na úrovni zdrojů
- API rate limiting
- Validace vstupů pomocí Zod
- Šifrování citlivých tokenů (AES-256)
- Audit log
- Žádné secrets v kódu

---

## Governance a Architecture Reviewer

Po dokončení každého milestone probíhá **Architecture Review**. Reviewer není nový kód – je to role v rámci workflow, která ověřuje:

1. **Architektura**
   - Jsou dodrženy vrstvy UI / API / Services / AI Runtime / Agent Runtime / Knowledge / Database / Storage / Event Bus / Jobs / Tools / Plugins?
   - Nejsou porušeny hranice mezi vrstvami?
   - Je kód modulární a testovatelný?
   - Odpovídá implementace Premium standardu?

2. **Technický dluh**
   - Nejsou v kódu dočasná řešení bez ticketu?
   - Jsou dodrženy principy SOLID, KISS, DRY?
   - Je code coverage dostatečné?
   - Je dokumentace aktuální?

3. **Bezpečnost**
   - Nejsou secrets v kódu?
   - Jsou validovány všechny vstupy?
   - Jsou správně nastavena oprávnění?
   - Jsou citlivá data šifrována?
   - Jsou externí volání zabezpečená?

### Výstup review

- `docs/reviews/MILESTONE_X_REVIEW.md`
- Stav: **APPROVED** / **CHANGES_REQUESTED**
- Seznam nálezů a akcí
- Až po schválení se pokračuje dalším milestone

### Role

- **Architecture Reviewer** je funkční role v rámci vývoje.
- Review provádí zkušený vývojář nebo AI v režimu kritického hodnocení.
- Reviewer nemění kód – pouze hodnotí a navrhuje změny.
