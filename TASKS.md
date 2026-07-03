# MiLO_Core – Aktuální úkoly

## Aktuální focus

Milestone 1: Core Integrations skeleton (Gmail, Calendar, Drive, Obsidian, TTS) — **dokončen**.

Čeká na Architecture Review před přechodem na další fázi.

---

## Úkoly

### Dokumentace

- [x] README.md
- [x] ARCHITECTURE.md
- [x] ROADMAP.md
- [x] TASKS.md
- [x] `docs/reviews/MILESTONE_REVIEW_TEMPLATE.md`
- [x] `docs/reviews/MILESTONE_0_REVIEW.md`
- [ ] `docs/reviews/MILESTONE_1_REVIEW.md`

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

### Frontend skeleton

- [x] Inicializovat Next.js s TypeScript
- [x] Nastavit Tailwind CSS
- [x] Nastavit shadcn/ui
- [x] Vytvořit základní layout (sidebar, header, dashboard pages)
- [x] Nastavit dark mode jako výchozí
- [x] Přidat základní stránky (Home, Brief, Email, Calendar, Documents, Knowledge, Chat, Settings, ...)
- [x] Přidat TTS controls do UI
- [ ] Nastavit TanStack Query
- [ ] Nastavit Zustand

### Backend skeleton

- [x] Inicializovat Fastify 5 s TypeScript
- [x] Nastavit ESLint + Prettier
- [x] Vytvořit základní server
- [x] Přidat health check endpoint
- [x] Nastavit testovací framework (Vitest)
- [x] Přidat Redis připojení
- [ ] Přidat BullMQ setup
- [x] Přidat Pino logger
- [x] Přidat rate limiting

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

### Integrace (Milestone 1 skeleton)

- [x] Gmail (`/api/email`)
- [x] Google Calendar (`/api/calendar`)
- [x] Google Drive (`/api/documents`)
- [x] Obsidian (`/api/knowledge/obsidian`)

Všechny integrace aktuálně podporují demo fallback při chybějících credentials.

### CI

- [x] GitHub Actions workflow pro typecheck, lint, test, build

### Governance

- [x] Vytvořit šablonu `docs/reviews/MILESTONE_REVIEW_TEMPLATE.md`
- [x] Vytvořit proces Architecture Review do dokumentace
- [x] Milestone 0 Review — APPROVED
- [ ] Milestone 1 Review — připravit

---

## Další milníky (připravit)

### Milestone 2: Real data & sync

- [ ] Real-time synchronizace Gmail (webhook / polling)
- [ ] Real-time synchronizace Google Calendar
- [ ] Real-time synchronizace Google Drive
- [ ] Indexace Obsidian vaultu do vector databáze
- [ ] Universal search napříč zdroji
- [ ] Zdroje u každé odpovědi AI

### Milestone 3: Production readiness

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
