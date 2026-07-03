# MiLO_Core – Aktuální úkoly

## Aktuální focus

Milestone 3: Real data & sync — **začíná**.

První napojený zdroj: **Obsidian vault** (lokální indexing a search bez AI embeddingů).

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
- [ ] Nastavit TanStack Query
- [x] Nastavit Zustand (TTS store)

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

- [ ] Gmail (`/api/email`) – pouze skeleton
- [ ] Google Calendar (`/api/calendar`) – pouze skeleton
- [ ] Google Drive (`/api/documents`) – pouze skeleton
- [x] Obsidian (`/api/knowledge`):
  - [x] Lokální scan .md souborů v zadaném vault path.
  - [x] Indexování názvů, cest, obsahu a tagů.
  - [x] Persistovaný index do `apps/api/data/obsidian-index.json`.
  - [x] Jednoduché full-text vyhledávání bez embeddingů.
  - [x] Zobrazení v Knowledge a Documents.
  - [x] Nastavení vault path z UI.

Ostatní integrace zůstávají v demo/skeleton režimu.

### CI

- [x] GitHub Actions workflow pro typecheck, lint, test, build

### Governance

- [x] Vytvořit šablonu `docs/reviews/MILESTONE_REVIEW_TEMPLATE.md`
- [x] Vytvořit proces Architecture Review do dokumentace
- [x] Milestone 0 Review — APPROVED
- [x] Milestone 1 Review — APPROVED
- [ ] Milestone 2 Review — připravit

---

## Další milníky

### Milestone 3: Real data & sync

- [ ] Real-time synchronizace Gmail (webhook / polling)
- [ ] Real-time synchronizace Google Calendar
- [ ] Real-time synchronizace Google Drive
- [ ] Indexace Obsidian vaultu do vector databáze
- [ ] Universal search napříč zdroji
- [ ] Zdroje u každé odpovědi AI

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
