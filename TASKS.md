# MiLO_Core – Aktuální úkoly

## Aktuální focus

Milestone 0: Premium Foundation

---

## Úkoly

### Dokumentace

- [x] README.md
- [x] ARCHITECTURE.md
- [x] ROADMAP.md
- [x] TASKS.md
- [x] REVIEW_TEMPLATE.md

### Struktura projektu

- [x] Vytvořit monorepo s pnpm workspace
- [x] Vytvořit `apps/web` (Next.js 15)
- [x] Vytvořit `apps/api` (Fastify 5)
- [x] Vytvořit `packages/shared`
- [x] Vytvořit `packages/ai`
- [x] Vytvořit `packages/database`
- [x] Vytvořit `packages/tools`
- [x] Vytvořit `packages/agents`
- [x] Vytvořit `packages/design-system`

### Docker & Infrastructure

- [x] `Dockerfile` pro frontend
- [x] `Dockerfile` pro backend
- [x] `docker-compose.yml` s Postgres, Redis, Ollama volitelně
- [x] `.env.example`
- [ ] Přidat Redis service do docker-compose
- [ ] Přidat S3-compatible storage stub

### Frontend skeleton

- [ ] Inicializovat Next.js 15 s TypeScript
- [ ] Nastavit Tailwind CSS
- [ ] Nastavit shadcn/ui
- [ ] Vytvořit design tokens a theme
- [ ] Vytvořit základní layout
- [ ] Nastavit dark mode jako výchozí
- [ ] Přidat základní stránky
- [ ] Nastavit TanStack Query
- [ ] Nastavit Zustand

### Backend skeleton

- [x] Inicializovat Fastify 5 s TypeScript
- [x] Nastavit ESLint + Prettier
- [x] Vytvořit základní server
- [x] Přidat health check endpoint
- [x] Nastavit testovací framework (Vitest)
- [ ] Přidat Redis připojení
- [ ] Přidat BullMQ setup
- [ ] Přidat Pino logger
- [ ] Přidat rate limiting

### TTS modul

- [x] Vytvořit `@milo/tts` package
- [x] Definovat `TtsProvider` rozhraní (`speak`, `stop`, `isAvailable`)
- [x] Implementovat `SayTtsProvider` pro macOS
- [x] Implementovat `WebSpeechTtsProvider` pro prohlížeč
- [x] Vytvořit `TtsRegistry` s graceful fallback

### CLI app

- [x] Vytvořit `@milo/cli` package
- [x] Příkaz `milo brief --speak`
- [x] Příkaz `milo ask "..." --speak`
- [ ] Napojit CLI na Agent Runtime a AI provider

### Shared packages

- [x] Vytvořit `@milo/shared` s typy a Zod schema
- [x] Vytvořit `@milo/design-system` s design tokens
- [x] Vytvořit `@milo/ai` s AI abstrakcí
- [x] Vytvořit `@milo/database` s repository pattern
- [x] Vytvořit `@milo/tools` s tool registry
- [x] Vytvořit `@milo/agents` s Agent Runtime a Chief of Staff

### CI

- [x] GitHub Actions workflow pro build, lint, test
- [ ] Přidat typecheck do CI

### Governance

- [x] Vytvořit šablonu `docs/reviews/MILESTONE_REVIEW_TEMPLATE.md`
- [x] Vytvořit proces Architecture Review do dokumentace
- [ ] Po Milestone 0 vytvořit první review dokument

---

## Dokončené úkoly

- Vytvoření repozitáře
- Základní dokumentace
- Premium architektura a roadmapa
- Backend skeleton

---

## Blokery

Žádné.

---

## Poznámky

- Cílem je premium SaaS produkt srovnatelný s Notion, Linear, Cursor, ChatGPT.
- Každý rozhodnutí musí projít testem: "Je to dost dobré na 50–100 USD/měsíc?"
- Pro frontend použijeme Next.js 15 s App Router.
- Pro backend Fastify 5.
- Pro správu závislostí pnpm workspace.
- Supabase použijeme jako managed službu, lokálně nepouštíme.
- Ollama je volitelná pro lokální vývoj s AI.
