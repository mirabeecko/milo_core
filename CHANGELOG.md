# Changelog

Všechny významné změny v projektu MiLO_Core budou zaznamenány v tomto souboru.

Formát loosely inspirován [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Communication Agent (`CommunicationAgent`) – produkční inteligentní komunikační manažer:
  - `CommunicationProvider` interface s `MockGmailProvider`, `MockWhatsAppProvider` a skeletony pro budoucí kanály.
  - `DefaultCommunicationService` pro synchronizaci, priorizaci, spam filtraci, AI shrnutí, extrakci úkolů/termínů/částek a generování konceptů odpovědí.
  - Relationship Intelligence – kontext u každého kontaktu: projekty, otevřené závazky, doporučený tón, eskalační riziko.
  - Živá simulace stavů `loading_messages → analyzing → summarizing → drafting_reply → reviewing → reporting`.
  - Nové agent stavy: `loading_messages`, `summarizing`, `drafting_reply`.
  - API endpointy `GET /agents/:id/communication/state` a `POST /agents/:id/communication/sync`.
  - Web UI: specializovaný detail Communication Agenta s Inbox, čekajícími odpověďmi, AI koncepty, Relationship Intelligence a statistikami.
- Calendar Agent (`CalendarAgent`) – produkční inteligentní manažer času:
  - `CalendarProvider` interface s `MockCalendarProvider` a `GoogleCalendarProvider` skeletonem.
  - `DefaultCalendarService` pro synchronizaci, analýzu dne, detekci kolizí, hledání volných slotů a smart doporučení.
  - Živá simulace stavů `loading_calendar → analyzing → scheduling → reviewing → reporting`.
  - Nové agent stavy: `loading_calendar`, `analyzing`, `scheduling`.
  - API endpointy `GET /agents/:id/calendar/state` a `POST /agents/:id/calendar/sync`.
  - Web UI: specializovaný detail Calendar Agenta s dnešním rozvrhem, produktivním skóre, kolizemi, doporučeními a nadcházejícími událostmi.
- Chief of Staff agent (`ChiefOfStaffAgent`) – první plně funkční produkční agent:
  - Živá simulace stavů `thinking → planning → delegating → working → reviewing → reporting`.
  - Postupné zvyšování `taskProgress` a generování konkrétního lidsky čitelného vysvětlení.
  - Automatický přechod na další úkol po dokončení s ukládáním do historie.
  - Rozhraní `AgentEntity` rozšířeno o `restart()`, `getTaskHistory()` a `getPendingQueue()`.
  - API endpointy `POST /agents/:id/restart`, `GET /agents/:id/tasks/history`, `GET /agents/:id/tasks/queue`.
  - Web UI: funkční tlačítka Start/Stop/Pause/Resume/Restart v AgentCard i detailu agenta.
- Nové stavy agenta: `thinking`, `planning`, `delegating`, `reviewing`, `reporting`.
- `LiveWorkExplanation` rozšířen o `confidence` (míra jistoty) a `alternativeApproach` (alternativní postup).
- `AgentRuntimeState` rozšířen o `taskProgress`, `runningTimeMs` a `lastActivityAt`.
- Nová shadcn/ui komponenta `Tabs` pro detail agenta.

### Changed

- Detail agenta přepracován podle produkční specifikace:
  - Live Overview s kompletním vysvětlením práce.
  - Aktivní úkol s progress barem a běžícím časem.
  - Fronta úkolů, historie úkolů a nastavení v tabs.
  - Statistiky, live log a rozhodovací log.
- AgentCard aktualizován pro nové stavy, zobrazuje task progress, running time a tlačítka Restart / Detail.

### Fixed

- Konsistence typů mezi `@milo/shared`, `@milo/agents` a frontendem po rozšíření stavů a runtime stavu.

- Agent Operating System (AOS) framework v `@milo/agents`:
  - Sdílené typy pro agenty, úkoly a události v `@milo/shared`.
  - Databázové schéma a repository pattern (PG + in-memory fallback) v `@milo/database`.
  - Task model, queue a runner s progress a logováním.
  - Agent entity lifecycle: initialize, start, stop, pause, resume, runTask, cancelTask, scheduleTask, retry, heartbeat, report.
  - Live work explanation – lidsky čitelné vysvětlení práce agenta.
  - Event bus pro komunikaci mezi agenty.
  - Agent Manager pro registraci, delegaci, monitoring a heartbeat.
  - 9 skeleton agentů: Chief of Staff, Developer, Research, Knowledge, Legal, Document, Calendar, Communication, Automation.
  - Mock simulace všech agentů: `pnpm --filter @milo/agents simulate`.
- API routes pro AOS:
  - `GET /agents`, `GET /agents/:id`, `POST /agents/:id/{start,stop,pause,resume}`.
  - `GET /agents/:id/{logs,metrics,memory,explanation}`.
  - `GET /tasks`, `POST /tasks`, `POST /tasks/:id/{cancel,retry}`.
  - `GET /events`, `GET /events/stream` (SSE).
- CLI commands pro AOS:
  - `milo agent list/start/stop/status/logs`.
  - `milo task list/run/cancel`.
  - `milo brief` a `milo ask` nyní delegují úkol do AgentManager.
- NOC dashboard UI:
  - Agent Operating Center s živými stavy, frontou úkolů, statistikami a logy.
  - Detail agenta s přehledem, vysvětlením práce, nástroji, metrikami a logem.
- Dokumentace AOS: `AOS.md`, `AGENTS.md`, `TASK_MODEL.md`.

### Changed

- `@milo/agents` byl kompletně přepsán z jednoduchého runtime na produkční Agent Operating System.
- Stránka Agents nyní načítá reálná data z `/api/agents` a sleduje SSE `/api/events/stream`.

### Fixed

- Konzistence typů mezi frontendem a novým AOS API.

- Napojení lokálního Obsidian vaultu:
  - `ObsidianIndexer` v `@milo/tools` pro skenování, čtení a persistenci indexu .md souborů.
  - Vyhledávání bez AI embeddingů – jednoduchý full-text scoring podle názvu, cesty, obsahu a tagů.
  - API endpointy: `GET /knowledge/obsidian`, `GET /knowledge/obsidian/:id`, `GET /knowledge/search`, `POST /knowledge/index`, `GET/POST /knowledge/settings/obsidian`.
  - Settings UI pro nastavení cesty k vaultu a spuštění reindexu.
  - Knowledge stránka s vyhledáváním a náhledem poznámky.
  - Documents stránka nyní zobrazuje i Obsidian poznámky.
- Centrální frontend API vrstva v `apps/web/lib/api/` (`client`, `types`, doménové služby).
- `/api/chat` endpoint s `ChatService` a `CommandProcessor` – sdílený pro UI, CLI i budoucí hlas.
- `app/error.tsx` – globální error boundary.
- Znovupoužitelné UI komponenty v `components/common/` a doménových složkách.
- Loading, error a empty stavy na všech hlavních stránkách.
- Demo režim pro `DocumentsService` a `KnowledgeService` s jednotným rozhraním.
- `AuthProvider` nyní spravuje a persistuje `accessToken` pro API volání.
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

- Všechny stránky nyní načítají data přes API vrstvu místo přímého importu mock dat.
- Mock data byla přesunuta z page komponent do `lib/mocks/` a API služeb.
- `EmailService` a `CalendarService` přešly na konzistentní `isConfigured` / `isDemo` / `generateDemoData` pattern.
- `DocumentsService` a `KnowledgeService` přešly na konzistentní demo pattern bez házení chyb v constructoru.
- `TtsStore` – inicializace dostupnosti byla přesunuta z definice store do `TtsControls` efektu.
- Aktualizován `README.md` o popis MVP a aktuální stav.
- Aktualizován `TASKS.md` – Milestone 2 dokončen.

### Fixed

- `apps/cli/package.json` `dev` script nyní používá `tsc --watch` místo `tsx src/bin.ts`, aby se CLI nespustilo s prázdným příkazem.
- `AuthService` a `BriefingService` nyní podporují demo režim při chybějících credentials.
- `DocumentsService` a `KnowledgeService` již neházejí chybu v constructoru při chybějících credentials.
- Frontend defaultně volá reálné API i v developmentu. Chybějící demo endpointy (`/home`, `/agents`, `/projects`) byly doplněny na backendu.
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
