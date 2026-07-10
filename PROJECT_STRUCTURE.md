# MiLO_Core – Struktura projektu

> Aktuální přehled složek a souborů v repozitáři `MiLO_Core`.
> Verze: `0.1.0` | Monorepo řízené přes `pnpm` workspaces.

---

## 1. Přehled

MiLO_Core je osobní operační systém postavený jako **pnpm monorepo**.

- **Frontend:** Next.js 14 aplikace (`apps/web`)
- **Backend:** Fastify 5 API (`apps/api`)
- **CLI:** Node.js CLI nástroj (`apps/cli`)
- **Knihovny:** sdílené balíčky v `packages/*`
- **Infrastruktura:** Docker Compose pro Postgres, Redis a Ollama

Projekt je ve fázi funkčního MVP s mock daty – reálné OAuth integrace a background sync jsou naplánovány na další milestone.

---

## 2. Kořenová úroveň

```
MiLO_Core/
├── README.md                       # Hlavní popis projektu
├── ARCHITECTURE.md                 # Architektura, vrstvy, design principy
├── AOS.md                          # Agent Operating System
├── AGENTS.md                       # Agenti a jejich role
├── TASK_MODEL.md                   # Model úkolů
├── ROADMAP.md                      # Plán vývoje a milestones
├── TASKS.md                        # Aktuální úkoly
├── CHANGELOG.md                    # Historie změn
├── AUDIT.md                        # Auditní záznamy
├── NEXT_MILESTONE.md               # Příprava dalšího milestone
├── REFACTOR_PLAN.md                # Plán refaktoringu
├── OBSIDIAN_SYNC_PLAN.md           # Plán syncu Obsidianu
├── AGENT_RUNTIME.md                # Runtime agentů
├── AGENT_RUNTIME_BUGFIX.md         # Bugfixy runtime
├── AGENT_SAFETY_RULES.md           # Bezpečnostní pravidla agentů
├── package.json                    # Kořenový manifest monorepa
├── pnpm-workspace.yaml             # Definice pnpm workspaces
├── pnpm-lock.yaml                  # Lockfile závislostí
├── eslint.config.js                # Konfigurace ESLint
├── docker-compose.yml              # Lokální infrastruktura
├── .env / .env.example             # Prostředí
├── .gitignore / .dockerignore
├── .github/workflows/ci.yml        # CI pipeline
└── vercel.json                     # Vercel konfigurace
```

### Hlavní skripty (root)

```bash
pnpm dev        # spustí všechny appky paralelně
pnpm build      # sestaví všechny balíčky
pnpm lint       # lint všeho
pnpm test       # testy všech balíčků
pnpm typecheck  # TypeScript kontrola
pnpm clean      # vyčistí dist složky
```

---

## 3. Aplikace (`apps/`)

### 3.1 `apps/web` – Next.js frontend

**Balíček:** `@milo/web`
**Framework:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS

```
apps/web/
├── app/                            # App Router stránky
│   ├── page.tsx                    # Dashboard / Home
│   ├── layout.tsx                  # Root layout
│   ├── error.tsx                   # Globální error boundary
│   ├── globals.css                 # Globální styly
│   ├── login/page.tsx              # Přihlášení
│   ├── brief/page.tsx              # Dnešní briefing
│   ├── chat/page.tsx               # Chat s MiLO
│   ├── agents/page.tsx             # Seznam agentů
│   ├── agents/[id]/page.tsx        # Detail agenta
│   ├── calendar/page.tsx           # Kalendář
│   ├── email/page.tsx              # Email
│   ├── documents/page.tsx          # Dokumenty
│   ├── knowledge/page.tsx          # Znalostní báze
│   ├── projects/page.tsx           # Projekty
│   ├── tasks/page.tsx              # Úkoly
│   ├── activity/page.tsx           # Aktivita
│   ├── notifications/page.tsx      # Notifikace
│   └── settings/page.tsx           # Nastavení
├── components/
│   ├── agent/                      # Komponenty pro agenty
│   │   ├── agent-card.tsx
│   │   ├── agent-card.test.tsx
│   │   ├── calendar-agent-detail.tsx
│   │   ├── communication-agent-detail.tsx
│   │   └── developer-agent-detail.tsx
│   ├── auth/                       # Autentizace
│   │   └── auth-provider.tsx
│   ├── common/                     # Společné komponenty
│   │   ├── empty-state.tsx
│   │   ├── loading-state.tsx
│   │   ├── markdown.tsx
│   │   ├── page-header.tsx
│   │   └── status-badge.tsx
│   ├── decision/                   # Rozhodnutí
│   ├── document/                   # Dokumenty
│   ├── layout/                     # Layout aplikace
│   │   ├── dashboard-layout.tsx
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── user-nav.tsx
│   ├── priority/                   # Priority
│   ├── project/                    # Projekty
│   ├── tts/                        # Text-to-Speech ovládání
│   │   ├── tts-controls.tsx
│   │   └── tts-play-button.tsx
│   ├── ui/                         # shadcn/ui komponenty
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── progress.tsx
│   │   ├── separator.tsx
│   │   ├── skeleton.tsx
│   │   ├── switch.tsx
│   │   ├── tabs.tsx
│   │   └── textarea.tsx
│   ├── views/                      # Hlavní pohledy
│   │   ├── brief-view.tsx
│   │   └── home-view.tsx
│   ├── widgets/                    # Widgety dashboardu
│   │   ├── ai-summary-widget.tsx
│   │   ├── live-clock.tsx
│   │   └── weather-widget.tsx
│   ├── query-provider.tsx          # TanStack Query provider
│   └── theme-provider.tsx          # Dark mode provider
├── lib/
│   ├── api/                        # API klienti
│   │   ├── client.ts               # Základní HTTP klient
│   │   ├── types.ts                # API typy
│   │   ├── index.ts
│   │   ├── activity.api.ts
│   │   ├── agents.api.ts
│   │   ├── agents.api.test.ts
│   │   ├── briefing.api.ts
│   │   ├── calendar.api.ts
│   │   ├── chat.api.ts
│   │   ├── documents.api.ts
│   │   ├── email.api.ts
│   │   ├── home.api.ts
│   │   ├── knowledge.api.ts
│   │   ├── projects.api.ts
│   │   ├── services.api.ts
│   │   ├── settings.api.ts
│   │   └── tasks.api.ts
│   ├── mocks/                      # Mock data pro UI
│   │   ├── chat.ts
│   │   └── index.ts
│   ├── supabase/
│   │   └── client.ts               # Supabase klient
│   ├── types/                      # Lokální TypeScript typy
│   │   ├── calendar.ts
│   │   ├── email.ts
│   │   ├── home.ts
│   │   └── index.ts
│   ├── format.ts                   # Formátovací utility
│   ├── google-oauth.ts             # Google OAuth pomocníci
│   └── utils.ts                    # Obecné utility
├── stores/
│   └── tts-store.ts                # Zustand store pro TTS
├── middleware.ts                   # Next.js middleware
├── next.config.js                  # Next.js konfigurace
├── tailwind.config.ts              # Tailwind konfigurace
├── postcss.config.mjs              # PostCSS konfigurace
├── vitest.config.ts / vitest.setup.ts
└── package.json
```

### 3.2 `apps/api` – Fastify backend

**Balíček:** `@milo/api`
**Framework:** Fastify 5, TypeScript

```
apps/api/
├── src/
│   ├── server.ts                   # Vstupní bod serveru
│   ├── config/
│   │   ├── index.ts
│   │   ├── settings.ts
│   │   └── google-tokens.ts
│   ├── infrastructure/
│   │   ├── redis.ts                # Redis připojení
│   │   └── queue.ts                # BullMQ fronty
│   └── modules/                    # Doménové moduly
│       ├── agents/                 # Agenti – manager, routes
│       │   ├── manager.ts
│       │   └── routes.ts
│       ├── auth/                   # Autentizace
│       │   ├── middleware.ts
│       │   ├── routes.ts
│       │   └── service.ts
│       ├── briefing/               # Ranní briefing
│       │   ├── routes.ts
│       │   └── service.ts
│       ├── calendar/               # Kalendář
│       │   ├── routes.ts
│       │   └── service.ts
│       ├── chat/                   # Chat
│       │   ├── command-processor.ts
│       │   ├── routes.ts
│       │   ├── service.ts
│       │   └── types.ts
│       ├── documents/              # Dokumenty
│       │   ├── routes.ts
│       │   └── service.ts
│       ├── email/                  # Email
│       │   ├── routes.ts
│       │   └── service.ts
│       ├── events/                 # SSE events stream
│       │   └── routes.ts
│       ├── health/                 # Health check
│       │   └── routes.ts
│       ├── home/                   # Home dashboard data
│       │   └── routes.ts
│       ├── knowledge/              # Znalostní báze
│       │   ├── routes.ts
│       │   └── service.ts
│       ├── missions/               # Mise
│       │   └── routes.ts
│       ├── projects/               # Projekty
│       │   ├── routes.ts
│       │   └── service.ts
│       ├── settings/               # Nastavení
│       │   └── routes.ts
│       └── tasks/                  # Úkoly
│           └── routes.ts
├── data/                           # Lokální JSON data (dev fallback)
│   ├── .gitignore
│   ├── google-tokens.json
│   ├── missions.json
│   ├── obsidian-index.json
│   ├── projects.json
│   ├── settings.json
│   └── tasks.json
├── tests/
│   └── health.test.ts
├── Dockerfile
├── .prettierrc
├── tsconfig.json
└── package.json
```

### 3.3 `apps/cli` – MiLO CLI

**Balíček:** `@milo/cli`
**Binárka:** `milo`

```
apps/cli/
├── src/
│   └── bin.ts                      # Vstupní bod CLI (Commander)
├── tsconfig.json
├── vitest.config.ts
└── package.json
```

Příkazy:

```bash
milo brief                        # Vygeneruje ranní briefing
milo brief --speak                # Přečte briefing nahlas
milo ask "Jaký je můj program?"   # Zeptá se MiLO
milo ask "..." --speak            # Přečte odpověď nahlas
milo agent list/start/stop/status/logs
milo task list/run/cancel
```

### 3.4 `apps/data` – Statická data

```
apps/data/
└── missions.json                   # Definice misí / cílů
```

---

## 4. Balíčky (`packages/`)

### 4.1 `packages/shared` – Sdílené typy a utility

**Balíček:** `@milo/shared`
**Závisí na:** `zod`

```
packages/shared/
└── src/
    ├── index.ts
    ├── schema/
    │   └── index.ts                # Zod schémata
    ├── types/
    │   ├── index.ts
    │   ├── agent.ts                # Typy agentů
    │   ├── agent-event.ts          # Události agentů
    │   ├── mission.ts              # Typy misí
    │   └── task.ts                 # Typy úkolů
    └── utils/
        └── index.ts                # Sdílené utility
```

### 4.2 `packages/agents` – Agent Operating System (AOS)

**Balíček:** `@milo/agents`
**Závisí na:** `@milo/ai`, `@milo/database`, `@milo/shared`, `@milo/tools`, `bullmq`, `ioredis`

Hlavní framework pro běh digitálních zaměstnanců.

```
packages/agents/
└── src/
    ├── index.ts                    # Veřejný export balíčku
    ├── simulation.ts               # Mock simulace všech agentů
    ├── agent.ts                    # Základní agent entita
    ├── agent-manager.ts            # Centrální řízení agentů
    ├── agent-manager.test.ts
    ├── agent/
    │   └── index.ts
    ├── agents/                     # Konkrétní agent implementace
    │   ├── chief-of-staff.ts
    │   ├── calendar.ts
    │   ├── communication.ts
    │   ├── developer.ts
    │   └── research.ts
    ├── chief-of-staff/
    │   └── index.ts
    ├── registry/                   # Definice výchozích agentů
    │   ├── index.ts
    │   ├── automation.ts
    │   ├── calendar.ts
    │   ├── chief-of-staff.ts
    │   ├── communication.ts
    │   ├── developer.ts
    │   ├── document.ts
    │   ├── knowledge.ts
    │   ├── legal.ts
    │   └── research.ts
    ├── runtime/                    # Runtime komponenty
    │   ├── index.ts
    │   ├── agent-scheduler.ts
    │   ├── agent-scheduler.test.ts
    │   ├── agent-state-machine.ts
    │   ├── agent-state-machine.test.ts
    │   ├── background-runner.ts
    │   ├── background-runner.test.ts
    │   ├── execution-task-runner.ts
    │   ├── health-monitor.ts
    │   ├── health-monitor.test.ts
    │   ├── task-queue-v2.ts
    │   └── task-queue-v2.test.ts
    ├── services/                   # Doménové služby agentů
    │   ├── calendar/
    │   │   ├── calendar-service.ts
    │   │   ├── google-provider.ts
    │   │   ├── mock-provider.ts
    │   │   ├── types.ts
    │   │   └── index.ts
    │   ├── communication/
    │   │   ├── communication-service.ts
    │   │   ├── google-provider.ts
    │   │   ├── mock-provider.ts
    │   │   ├── types.ts
    │   │   └── index.ts
    │   └── developer/
    │       ├── build-runner.ts
    │       ├── code-reviewer.ts
    │       ├── git-reader.ts
    │       ├── project-analyzer.ts
    │       ├── types.ts
    │       └── index.ts
    ├── memory/                     # Agent paměť
    │   ├── index.ts
    │   ├── service.ts
    │   ├── service.test.ts
    │   ├── storage.ts
    │   └── types.ts
    ├── event-bus.ts                # Event bus pro agenty
    ├── task-queue.ts               # Fronta úkolů
    ├── task-runner.ts              # Spouštěč úkolů
    └── types.ts                    # Lokální typy AOS
```

### 4.3 `packages/ai` – AI runtime

**Balíček:** `@milo/ai`
**Závisí na:** `openai`, `zod`

```
packages/ai/
└── src/
    ├── index.ts
    ├── embeddings/
    │   └── index.ts                # Generování embeddings
    ├── prompts/
    │   └── index.ts                # Verzované prompty
    ├── provider/
    │   └── index.ts                # Abstrakce AI providera
    └── providers/
        └── openai/
            └── index.ts            # OpenAI provider
```

### 4.4 `packages/database` – Databázové repository

**Balíček:** `@milo/database`
**Závisí na:** `@milo/shared`, `@supabase/supabase-js`, `ws`

```
packages/database/
├── migrations/
│   └── 001_agent_os.sql            # SQL migrace
└── src/
    ├── index.ts
    ├── client/
    │   └── index.ts                # Supabase / DB klient
    └── repositories/
        ├── index.ts
        ├── agent-repository.ts
        ├── agent-event-repository.ts
        ├── agent-log-repository.ts
        ├── agent-memory-repository.ts
        ├── agent-metrics-repository.ts
        ├── file-mission-repository.ts
        ├── file-task-repository.ts
        ├── mission-repository.ts
        └── task-repository.ts
```

### 4.5 `packages/tools` – Externí integrace

**Balíček:** `@milo/tools`
**Závisí na:** `googleapis`, `zod`

```
packages/tools/
└── src/
    ├── index.ts
    ├── registry/
    │   ├── index.ts
    │   └── defaults.ts             # Výchozí registry nástrojů
    ├── types/
    │   └── index.ts                # Typy nástrojů
    └── providers/                  # Provideri externích služeb
        ├── calendar/
        │   ├── index.ts
        │   └── types.ts
        ├── drive/
        │   ├── index.ts
        │   └── types.ts
        ├── filesystem/
        │   └── index.ts
        ├── github/
        │   └── index.ts
        ├── gmail/
        │   ├── index.ts
        │   └── types.ts
        ├── google/
        │   └── auth.ts             # Google OAuth auth
        ├── obsidian/
        │   ├── index.ts
        │   ├── indexer.ts
        │   ├── types.ts
        │   └── tools/
        │       └── index.ts
        ├── shell/
        │   └── index.ts
        ├── weather/
        │   └── index.ts
        └── web-search/
            └── index.ts
```

### 4.6 `packages/tts` – Text-to-Speech

**Balíček:** `@milo/tts`
**Závisí na:** `@milo/shared`

```
packages/tts/
├── src/
│   ├── index.ts                    # TTS registry a hlavní API
│   ├── providers/
│   │   ├── say/                    # macOS `say`
│   │   │   └── index.ts
│   │   └── web-speech/             # Web Speech API
│   │       └── index.ts
│   ├── registry/
│   │   └── index.ts
│   └── types/
│       └── index.ts
└── tests/
    └── registry.test.ts
```

### 4.7 `packages/design-system` – Design system

**Balíček:** `@milo/design-system`

```
packages/design-system/
└── src/
    ├── index.ts
    └── tokens/
        └── index.ts                # Design tokens (barvy, typography, …)
```

---

## 5. Docker a infrastruktura

```
docker/
├── ollama/                         # Ollama konfigurace (volitelné)
├── postgres/                       # Postgres konfigurace
└── redis/                          # Redis konfigurace
```

`docker-compose.yml` definuje služby:

- `postgres` (port `5432`) – transakční databáze
- `redis` (port `6379`) – cache, sessions, pub/sub, job queue
- `ollama` (port `11434`) – lokální AI modely (volitelné, profil `ai-local`)
- `api` (port `4000`) – Fastify backend
- `web` (port `3000`) – Next.js frontend

---

## 6. Dokumentace

```
docs/
├── AGENT_SAFETY_RULES.md           # Bezpečnostní pravidla pro agenty
└── reviews/
    ├── MILESTONE_0_REVIEW.md       # Review Milestone 0
    ├── MILESTONE_1_REVIEW.md       # Review Milestone 1
    └── MILESTONE_REVIEW_TEMPLATE.md # Šablona pro review
```

---

## 7. Klíčové závislosti mezi balíčky

```
┌─────────────┐
│   @milo/web │
└──────┬──────┘
       │ používá
       ▼
┌──────────────────┐     ┌─────────────┐
│  @milo/design-   │     │   @milo/tts │
│     system       │     └──────┬──────┘
└──────────────────┘            │
                                ▼
┌─────────────┐          ┌─────────────┐
│  @milo/api  │◀─────────│ @milo/shared│
└──────┬──────┘          └──────┬──────┘
       │                        │
       ▼                        ▼
┌─────────────┐          ┌─────────────┐
│ @milo/agents│◀─────────│ @milo/tools │
└──────┬──────┘          └─────────────┘
       │
       ▼
┌─────────────┐     ┌─────────────┐
│  @milo/ai   │     │@milo/database│
└─────────────┘     └─────────────┘

@milo/cli používá: @milo/agents, @milo/database, @milo/shared, @milo/tts
```

---

## 8. Životní cyklus vývoje

### Workflow

1. Každá změna prochází `build`, `lint`, `typecheck`, `test`.
2. Monorepo používá `pnpm` workspaces.
3. CI pipeline je definována v `.github/workflows/ci.yml`.
4. Po každém milestone probíhá Architecture Review do `docs/reviews/`.

### Jak se orientovat v kódu

- **Nová stránka UI:** `apps/web/app/<route>/page.tsx`
- **Nový API endpoint:** `apps/api/src/modules/<domain>/routes.ts`
- **Nový agent:** definice do `packages/agents/src/registry/<agent>.ts`, export do `registry/index.ts`
- **Nový nástroj:** `packages/tools/src/providers/<service>/`
- **Nové typy/schémata:** `packages/shared/src/`
- **Nová migrace:** `packages/database/migrations/`

---

## 9. Stav implementace

Aktuálně hotovo (Milestone 2):

- ✅ Next.js dashboard s dark mode
- ✅ Fastify API s doménovými moduly
- ✅ Agent Operating System (AOS)
- ✅ 9 skeleton agentů v registry
- ✅ Chief of Staff, Calendar Agent, Communication Agent – produkční agenti
- ✅ Mock simulace všech agentů (`pnpm --filter @milo/agents simulate`)
- ✅ TTS modul s `say` a Web Speech providery
- ✅ MiLO CLI
- ✅ API routes `/agents`, `/tasks`, `/events` včetně SSE streamu
- ✅ NOC dashboard pro agenty
- ✅ CI pipeline

Plánováno (Milestone 3+):

- ⏳ Reálné OAuth integrace (Gmail, Calendar, Drive)
- ⏳ Background sync přes BullMQ
- ⏳ Obsidian vector indexing
- ⏳ Knowledge base a RAG
- ⏳ Chat s pamětí a streamingem
- ⏳ MCP / Plugin runtime
