# MiLO_Core

> Můj osobní operační systém.
> Ne chatbot. Ne nástroj. Jeden systém pro celý digitální život.

---

## Mise

MiLO_Core je osobní operační systém, který sjednocuje přístup k:

- Gmailu
- Google Calendari
- Google Drive
- Obsidianu
- Supabase
- WhatsApp
- Home Assistant
- ISDS
- GitHubu
- mým projektům
- mým dokumentům
- mým AI agentům

Dlouhodobým cílem je mít **jednu aplikaci, jedno přihlášení, jedno UI, jednu znalostní bázi a jednu AI**.

První verze je zaměřená na MVP s přihlášením, dashboardem, ranním briefingem a integrací Gmail, Google Calendar, Google Drive a Obsidian.

---

## Filozofie

- **Jednoduchost** před rychlým napsáním funkcí.
- **Dlouhodobá udržitelnost** před hacky.
- **Modulární architektura** – každá část samostatně testovatelná.
- **Kvalitní dokumentace** jako součást kódu.
- **Automatické testy** od prvního dne.
- **Minimální technický dluh**.

---

## Technologie

### Frontend

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend

- Node.js
- TypeScript
- Fastify
- Redis
- BullMQ

### AI

- OpenAI kompatibilní API
- Ollama (lokální modely)
- Podpora více providerů

### Databáze

- Supabase (Postgres)
- pgvector

### Vyhledávání

- Embeddings
- Vector search

### Container

- Docker
- Docker Compose

### Repo

- Git

### Hlasový výstup

- `@milo/tts` – abstrakce nad TTS providery
- `SayTtsProvider` – macOS `say` (lokální)
- `WebSpeechTtsProvider` – Web Speech API v prohlížeči
- Připraveno pro ElevenLabs / OpenAI TTS

---

## Aktuální stav

Agent Operating System (AOS) je postaven a testovatelný s mock simulací. Obsahuje produkční framework pro běh digitálních zaměstnanců:

- **Agent Framework** (`@milo/agents`) – životní cyklus, fronty, event bus, live explanation.
- **Agent Manager** – registrace, spouštění, delegace, monitoring, heartbeat.
- **9 skeleton agentů** – Chief of Staff, Developer, Research, Knowledge, Legal, Document, Calendar, Communication, Automation.
- **API routes** – `/agents`, `/tasks`, `/events` včetně SSE streamu.
- **CLI commands** – `milo agent list/start/stop/status/logs`, `milo task list/run/cancel`.
- **NOC Dashboard** – Agent Operating Center s živými stavy, logy a detaily agenta.
- **MVP dashboard** – Home, Today's Brief, Chat, Projects, Documents, Settings s mock daty.

Integrace (Gmail, Calendar, Drive, Obsidian) aktuálně používají demo fallback. Reálná OAuth napojení přijdou v další fázi.

---

## Jak spustit

> Dokud není nastaveno prostředí, projekt běží v režimu vývoje s demo daty.

```bash
# 1. Naklonuj repo
git clone <repo-url>
cd MiLO_Core

# 2. Nastav prostředí
cp .env.example .env
# Uprav .env podle pokynů

# 3. Nainstaluj závislosti
pnpm install

# 4. Lokální vývoj (web + api)
pnpm dev

# 5. Otevři frontend
open http://localhost:3000
```

Nebo v Dockeru:

```bash
docker compose up --build
```

## CLI

```bash
# Vygeneruj ranní briefing
pnpm milo brief

# Přečti briefing nahlas (macOS)
pnpm milo brief --speak

# Zeptej se MiLO
pnpm milo ask "Jaký je můj dnešní program?"

# Přečti odpověď nahlas
pnpm milo ask "Jaký je můj dnešní program?" --speak
```

---

## Dokumentace

- [ARCHITECTURE.md](./ARCHITECTURE.md) – architektura a struktura projektu
- [AOS.md](./AOS.md) – Agent Operating System
- [AGENTS.md](./AGENTS.md) – agenti a jejich role
- [TASK_MODEL.md](./TASK_MODEL.md) – model úkolů
- [ROADMAP.md](./ROADMAP.md) – plán vývoje a milestones
- [TASKS.md](./TASKS.md) – aktuální úkoly a stav
- [CHANGELOG.md](./CHANGELOG.md) – historie změn

---

## Pravidla vývoje

1. Každá změna prochází `build`, `lint` a `test`.
2. Každý milestone je plně funkční.
3. Kód je psán podle principů SOLID, KISS, DRY, Clean Architecture.
4. Každý agent/modul má vlastní prompt, tools, paměť, logy a nastavení.
5. Vyhledávání napříč zdroji vrací vždy zdroj odpovědi.

---

## Status

Projekt je ve fázi funkčního MVP s mock daty. Reálné integrace a sync přijdou v Milestone 2.
