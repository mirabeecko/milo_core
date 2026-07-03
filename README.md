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

# 4. Spusť v Dockeru
docker compose up --build

# 5. Otevři frontend
open http://localhost:3000
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
- [ROADMAP.md](./ROADMAP.md) – plán vývoje a milestones
- [TASKS.md](./TASKS.md) – aktuální úkoly a stav

---

## Pravidla vývoje

1. Každá změna prochází `build`, `lint` a `test`.
2. Každý milestone je plně funkční.
3. Kód je psán podle principů SOLID, KISS, DRY, Clean Architecture.
4. Každý agent/modul má vlastní prompt, tools, paměť, logy a nastavení.
5. Vyhledávání napříč zdroji vrací vždy zdroj odpovědi.

---

## Status

Projekt je ve fázi zakládání – dokumentace a skeleton.
