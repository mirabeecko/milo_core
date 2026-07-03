# Changelog

Všechny významné změny v projektu MiLO_Core budou zaznamenány v tomto souboru.

Formát loosely inspirován [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Funkční MVP dashboard s mock daty.
- Přepracovaná Home stránka jako command center:
  - uvítací blok s datem, stavem systému a hlavním doporučením,
  - sekce „Dnešní 3 priority“ s progress barem,
  - „Briefing snapshot“ ze všech zdrojů,
  - „Čeká na moje rozhodnutí“,
  - „Poslední aktivita“,
  - velké command input pole.
- Nová stránka Today's Brief:
  - generovaný briefing,
  - tlačítka „Přehrát briefing“, „Zkopírovat jako Markdown“, „Regenerovat briefing“,
  - kalendář dne, důležité zprávy, nové dokumenty, doporučené kroky.
- Funkční Chat UI:
  - zobrazování zpráv uživatele a MiLO,
  - loading state,
  - command input,
  - tlačítko „Přehrát odpověď“,
  - příklady promptů.
- Stránka Agents s 5 agenty, statusy, poslední aktivitou, aktuálním úkolem a logem práce.
- Stránka Projects s projekty TJ Krupka, MiLO_Core, Komárka, Ninja Týden, Obchodní příležitosti.
- Stránka Documents – dokumentové centrum s vyhledáváním a filtry podle zdroje a projektu.
- Stránka Settings – AI provider, model, TTS, Obsidian vault path, budoucí integrace.
- Mock data a TypeScript typy v `apps/web/lib/mocks` a `apps/web/lib/types`.
- Nové shadcn/ui komponenty: Card, Badge, Input, Textarea, Avatar, Separator, Skeleton, Progress.
- TTS store nyní správně detekuje dostupnost Web Speech API.

### Changed

- Aktualizován `README.md` o popis MVP a aktuální stav.
- Aktualizován `TASKS.md` – Milestone 2 dokončen.

### Fixed

- `apps/cli/package.json` `dev` script nyní používá `tsc --watch` místo `tsx src/bin.ts`, aby se CLI nespustilo s prázdným příkazem.
- `AuthService` a `BriefingService` nyní podporují demo režim při chybějících credentials.
- `apps/api/src/server.ts` logger konfigurace upravena na Fastify 5 kompatibilní objekt.

## [0.1.0] – 2026-07-03

### Added

- Premium foundation pro MiLO_Core monorepo.
- Dokumentace: README, ARCHITECTURE, ROADMAP, TASKS, MILESTONE reviews.
- Docker Compose setup s Postgres, Redis a volitelnou Ollamou.
- Next.js 14 frontend s Tailwind CSS, shadcn/ui a dark mode.
- Fastify 5 backend s health check, auth middleware, rate limiting a Pino logging.
- TTS modul `@milo/tts` s `say` (macOS) a Web Speech providery.
- MiLO CLI s `milo brief --speak` a `milo ask "..." --speak`.
- AI provider `@milo/ai` s OpenAI providerem.
- Chief of Staff briefing napojený na `/api/briefing`.
- Integrace skeleton: Gmail, Google Calendar, Google Drive, Obsidian.
- CI pipeline přes GitHub Actions.
