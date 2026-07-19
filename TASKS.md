# MiLO_Core – Aktuální úkoly

## Aktuální focus

Milestone 2: Agent Operating System — **dokončeno a schváleno (APPROVED)**.

Milestone 3: Real data & sync — **aktivní**.

První napojený zdroj: **Obsidian vault** (lokální indexing a search bez AI embeddingů).

---

## Milestone 2 — Architecture Review

- **Datum:** 2026-07-17
- **Reviewer:** AI Architecture Reviewer
- **Stav:** APPROVED s podmínkami
- **Dokument:** `docs/reviews/MILESTONE_2_REVIEW.md`

**Podmínky pro M3:**
1. BullMQ musí být nastaveno před M3.
2. Auth musí být hardnut před production nasazením (Supabase SSR na webu je již hotový).
3. Test coverage se musí zlepšit v M3 (cíl min. 60 %).

**Klíčové nálezy:**
- Architektura čistá — Entity pattern, Event bus, Repository pattern s PG + in-memory fallbackem
- 14 agentů registrováno v `packages/agents/src/registry/`
- SSE stream implementován přes `lib/hooks/useSSE.ts`
- Některé služby (Gmail, Calendar, Drive) jsou stále skeleton — očekávané pro M2
- Tech debt: nízké code coverage, BullMQ chybí

---

## Úkoly

### Dokumentace

- [x] README.md
- [x] ARCHITECTURE.md
- [x] ROADMAP.md
- [x] TASKS.md
- [x] CHANGELOG.md
- [x] `docs/reviews/MILESTONE_REVIEW_TEMPLATE.md`
- [x] `docs/reviews/MILESTONE_0_REVIEW.md`
- [x] `docs/reviews/MILESTONE_1_REVIEW.md`
- [x] `docs/reviews/MILESTONE_2_REVIEW.md`

### Struktura projektu

- [x] Vytvořit monorepo s pnpm workspace
- [x] Vytvořit `apps/web` (Next.js 14 + Tailwind + shadcn/ui)
- [x] Vytvořit `apps/api` (Fastify 5)
- [x] Vytvořit `apps/cli`
- [x] Vytvořit `packages/shared`
- [x] Vytvořit `packages/ai`
- [x] Vytvořit `packages/database`
- [x] Vytvořit `packages/tools`
- [x] Vytvořit `packages/agents`
- [x] Vytvořit `packages/design-system`
- [x] Vytvořit `packages/tts`

### Docker & Infrastructure

- [x] `Dockerfile` pro frontend
- [x] `Dockerfile` pro backend
- [x] `docker-compose.yml` s Postgres, Redis, Ollama volitelně
- [x] `.env.example`

### Frontend

- [x] Inicializovat Next.js s TypeScript
- [x] Nastavit Tailwind CSS
- [x] Nastavit shadcn/ui
- [x] Vytvořit základní layout (sidebar, header, dashboard pages)
- [x] Nastavit dark mode jako výchozí
- [x] Přepracovat Home na command center
- [x] Vytvořit Today's Brief stránku
- [x] Vytvořit funkční Chat UI
- [x] Vytvořit Agents stránku
- [x] Vytvořit Projects stránku
- [x] Vytvořit Documents centrum
- [x] Vytvořit Settings stránku
- [x] Přidat TTS controls do UI
- [x] Vytvořit centrální API vrstvu v `apps/web/lib/api/`
- [x] Extrahovat znovupoužitelné UI komponenty (`common`, `priority`, `decision`, `document`, `agent`, `project`)
- [x] Přidat loading, error a empty stavy na hlavní stránky
- [x] Přidat globální error boundary (`app/error.tsx`)
- [x] Přepnout frontend do API režimu v developmentu
- [x] Nastavit TanStack Query (QueryProvider v layout.tsx + @tanstack/react-query)
- [x] Nastavit Zustand (TTS store)

### Refaktory (REFACTOR_PLAN.md)

- [x] Refaktor #1: Centrální data / API layer na frontendu
- [x] Refaktor #2: Sjednotit demo / reálná data strategii na backendu
- [x] Refaktor #3: `/api/chat` endpoint a command processor
- [x] Refaktor #4: Extrahovat znovupoužitelné UI komponenty
- [x] Refaktor #5: Loading, error a empty stavy
- [x] Všech 5 refaktorů dokončeno

### Backend

- [x] Inicializovat Fastify 5 s TypeScript
- [x] Nastavit ESLint + Prettier
- [x] Vytvořit základní server
- [x] Přidat health check endpoint
- [x] Nastavit testovací framework (Vitest)
- [x] Přidat Redis připojení
- [x] Sjednotit demo / reálná data strategii napříč integračními službami
- [x] Vytvořit `/api/chat` endpoint a command processor
- [ ] Přidat BullMQ setup
- [x] Přidat Pino logger
- [x] Přidat rate limiting
- [x] Vytvořit demo endpointy pro Home, Agents, Projects

### Autentizace

- [x] Supabase auth middleware
- [x] Login page
- [x] Demo fallback pro lokální vývoj

### TTS modul

- [x] Vytvořit `@milo/tts` package
- [x] Definovat `TtsProvider` rozhraní (`speak`, `stop`, `isAvailable`)
- [x] Implementovat `SayTtsProvider` pro macOS
- [x] Implementovat `WebSpeechTtsProvider` pro prohlížeč
- [x] Vytvořit `TtsRegistry` s graceful fallback
- [x] Přidat TTS tlačítka do UI
- [x] Přidat `milo brief --speak` a `milo ask "..." --speak`

### AI & Agenti

- [x] Vytvořit `@milo/ai` s abstrakcí providerů
- [x] Implementovat OpenAI kompatibilní provider
- [x] Vytvořit `@milo/agents` s Agent Runtime
- [x] Vytvořit Chief of Staff agenta
- [x] Napojit briefing na `/api/briefing`
- [x] Sdílené typy pro agenty, úkoly a události
- [x] Databázové schéma a repository pattern pro AOS
- [x] Task model, queue a runner
- [x] Agent entity lifecycle
- [x] Live work explanation
- [x] Event bus a Agent Manager
- [x] 14 agentů v registry
- [x] API routes pro agenty, úkoly a události (včetně SSE streamu)
- [x] CLI commands pro agenty a úkoly
- [x] NOC dashboard UI
- [x] Mock simulace všech agentů

### MVP Dashboard (Milestone 2)

- [x] Vytvořit mock data a TypeScript typy
- [x] Přepracovat Home na command center
- [x] Vytvořit Today's Brief stránku s akcemi
- [x] Vytvořit funkční Chat UI
- [x] Vytvořit Agents stránku
- [x] Vytvořit Projects stránku
- [x] Vytvořit Documents centrum
- [x] Vytvořit Settings stránku

### Integrace (Milestone 3)

- [x] Obsidian (`/api/knowledge`):
  - [x] Lokální scan .md souborů v zadaném vault path.
  - [x] Indexování názvů, cest, obsahu a tagů.
  - [x] Persistovaný index do `apps/api/data/obsidian-index.json`.
  - [x] Jednoduché full-text vyhledávání bez embeddingů.
  - [x] Zobrazení v Knowledge a Documents.
  - [x] Nastavení vault path z UI.
- [ ] BullMQ setup + worker registrace
- [ ] Supabase schema (accounts, emails, calendar_events, drive_files, obsidian_notes, knowledge_chunks, briefings, chat tables)
- [ ] Google OAuth flow dokončení (exchange code → store tokens → refresh)
- [ ] Gmail sync job (BullMQ)
- [ ] Calendar sync job (BullMQ)
- [ ] Drive sync job (BullMQ)
- [ ] Obsidian sync job (periodic scan → Supabase)
- [ ] Knowledge base chunking pipeline
- [ ] Embeddings + pgvector integration
- [ ] Universal search endpoint
- [ ] Source citations v chat responses
- [ ] Types tightening (string → union types pro Agent.icon, Document.type, DecisionItem.source)
- [ ] Test coverage min. 60 %
- [ ] Milestone 3 Architecture Review

### CI

- [x] GitHub Actions workflow pro typecheck, lint, test, build

### Governance

- [x] Vytvořit šablonu `docs/reviews/MILESTONE_REVIEW_TEMPLATE.md`
- [x] Vytvořit proces Architecture Review do dokumentace
- [x] Milestone 0 Review — APPROVED
- [x] Milestone 1 Review — APPROVED
- [x] Milestone 2 Review — APPROVED (2026-07-17)
- [ ] Milestone 3 Review — připravit

---

## Další milníky

### Milestone 3: Real data & sync

- [ ] BullMQ setup + worker registrace
- [ ] Supabase schema
- [ ] Google OAuth flow dokončení
- [ ] Real-time synchronizace Gmail (BullMQ job)
- [ ] Real-time synchronizace Google Calendar (BullMQ job)
- [ ] Real-time synchronizace Google Drive (BullMQ job)
- [ ] Indexace Obsidian vaultu do Supabase + vector databáze
- [ ] Knowledge base chunking pipeline
- [ ] Embeddings + pgvector integration
- [ ] Universal search napříč zdroji
- [ ] Source citations u každé odpovědi AI
- [ ] Types tightening
- [ ] Test coverage min. 60 %
- [ ] Milestone 3 Architecture Review

### Milestone 4: Production readiness

- [ ] Production deployment pipeline
- [ ] Secrets management
- [ ] Monitoring & alerting
- [ ] Rate limiting & quota management
- [ ] Onboarding flow

---

## Blokery

Žádné.

---

## Poznámky

- Cílem je premium SaaS produkt srovnatelný s Notion, Linear, Cursor, ChatGPT.
- Každé rozhodnutí musí projít testem: "Je to dost dobré na 50–100 USD/měsíc?"
- Pro frontend používáme Next.js 14 s App Router.
- Pro backend Fastify 5.
- Pro správu závislostí pnpm workspace.
- Supabase použijeme jako managed službu, lokálně nepouštíme.
- Ollama je volitelná pro lokální vývoj s AI.
