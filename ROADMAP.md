# MiLO_Core – Roadmap

## Filozofie roadmapy

Každý milestone je plně funkční a prochází **Architecture Review**. Cílem není rychle nashromáždit funkce, ale postavit **premium osobní OS** – produkt, za který jsou lidé ochotni platit 50–100 USD měsíčně.

---

## Milestone 0: Premium Foundation

- [x] Vytvořit repo a základní dokumentaci
- [ ] Definovat strukturu projektu podle Premium standardu
- [ ] Nastavit Docker a Docker Compose (Postgres, Redis, Ollama volitelně)
- [ ] Vytvořit frontend skeleton (Next.js 15, Tailwind, shadcn/ui, design tokens)
- [ ] Vytvořit backend skeleton (Fastify 5, TypeScript, strict mode)
- [ ] Vytvořit TTS modul s abstrakcí a macOS `say` providerem
- [ ] Vytvořit MiLO CLI (`milo brief --speak`, `milo ask "..." --speak`)
- [ ] Nastavit Redis (cache, sessions, pub/sub)
- [ ] Nastavit BullMQ pro background jobs
- [ ] Nastavit základní observability (Pino logging, Sentry, OpenTelemetry stubs)
- [ ] Nastavit CI/CD pipeline (build, lint, typecheck, test)
- [ ] Vytvořit design system a základní komponenty
- [ ] **Architecture Review** – schválit foundation, Docker, CI, bezpečnost a premium stack

**Cíl:** Repo je připravené pro premium vývoj. Aplikace se spustí lokálně i v Dockeru s Redis a job queue.

---

## Milestone 1: Autentizace a základní dashboard

- [ ] Implementovat přihlášení přes Supabase Auth (OAuth, magic link, passkeys)
- [ ] RBAC a oprávnění na úrovni zdrojů
- [ ] Vytvořit layout dashboardu (Notion + Linear + ChatGPT feel)
- [ ] Navigace: Home, Today's Brief, Projects, Agents, Documents, Knowledge, Email, Calendar, Settings, Chat, Activity, Notifications
- [ ] Dark mode jako výchozí, design tokens
- [ ] Command palette (Cmd+K)
- [ ] Responzivní layout
- [ ] Real-time notifikace přes WebSockets / Supabase Realtime
- [ ] **Architecture Review** – autentizace, autorizace, UX a bezpečnost

**Cíl:** Uživatel se přihlásí a vidí premium dashboard.

---

## Milestone 2: AI Runtime a Agent Runtime

- [ ] Vytvořit AI provider abstrakci (OpenAI, Anthropic, Ollama, Groq)
- [ ] Prompt registry s verzováním a testy
- [ ] Streaming odpovědí do UI
- [ ] Vytvořit Agent Runtime (paměť, tools, plánování, logy)
- [ ] Tool registry s validací a sandboxem
- [ ] Multi-provider fallback
- [ ] **Architecture Review** – AI/Agent architektura, streaming, bezpečnost volání nástrojů

**Cíl:** MiLO má spolehlivý AI a Agent runtime.

---

## Milestone 3: Chief of Staff agent a ranní briefing

- [ ] Definovat Chief of Staff agenta
- [ ] Prompt pro ranní briefing
- [ ] Generování briefing na vyžádání i naplánovaně
- [ ] Uložení briefing do databáze s audit logem
- [ ] Zobrazení briefing v dashboardu s citacemi
- [ ] **Architecture Review** – agent lifecycle, scheduling, quality

**Cíl:** Uživatel si každé ráno dostane personalizovaný briefing.

---

## Milestone 4: Gmail integrace

- [ ] OAuth připojení k Gmailu
- [ ] Načítání příchozích emailů s background sync
- [ ] Zobrazení emailů v dashboardu
- [ ] Vyhledávání v emailech
- [ ] Ukládání emailů do knowledge base
- [ ] **Architecture Review** – OAuth security, data handling, tool abstrakce

**Cíl:** Uživatel vidí a vyhledává v emailech.

---

## Milestone 5: Google Calendar integrace

- [ ] OAuth připojení k Google Calendar
- [ ] Načítání událostí s background sync
- [ ] Zobrazení kalendáře v dashboardu
- [ ] Denní / týdenní / měsíční přehled
- [ ] Ukládání událostí do knowledge base
- [ ] **Architecture Review** – opakované použití tool patternu, data sync

**Cíl:** Uživatel vidí své události v MiLO.

---

## Milestone 6: Google Drive integrace

- [ ] OAuth připojení k Google Drive
- [ ] Načítání seznamu souborů
- [ ] Zobrazení a vyhledávání souborů
- [ ] Indexování obsahu dokumentů (chunking, embeddings)
- [ ] Ukládání metadat do knowledge base
- [ ] S3-compatible storage pro velké soubory
- [ ] **Architecture Review** – velké soubory, permissions, vector indexing

**Cíl:** Uživatel vidí a vyhledává v Drive souborech.

---

## Milestone 7: Obsidian integrace

- [ ] Připojení k lokální Obsidian vault
- [ ] Načítání poznámek s respektem k privátnosti
- [ ] Vyhledávání v poznámkách
- [ ] Indexování poznámek do knowledge base
- [ ] Zobrazení poznámek v dashboardu
- [ ] **Architecture Review** – lokální file access, sync strategy, bezpečnost

**Cíl:** Uživatel vidí a vyhledává v Obsidian poznámkách.

---

## Milestone 8: Knowledge base a vector search

- [ ] Centralizovaná knowledge base
- [ ] Embeddings pro dokumenty, emaily, poznámky
- [ ] Vector search s filtry a hybridním vyhledáváním
- [ ] Re-ranking a citace zdrojů
- [ ] Knowledge graph (základní verze)
- [ ] RAG odpovědi napříč zdroji
- [ ] **Architecture Review** – vector DB, embedding pipeline, RAG quality, source citations

**Cíl:** Uživatel může klást otázky napříč všemi zdroji a dostávat odpovědi s odkazy.

---

## Milestone 9: Chat, aktivity a MCP runtime

- [ ] Chatové rozhraní s Chief of Staff agentem
- [ ] Historie konverzací s persistentní pamětí
- [ ] Aktivity feed
- [ ] Notifikace a real-time updates
- [ ] MCP / Plugin runtime (sandbox, registry)
- [ ] **Architecture Review** – chat state, message history, real-time updates, plugin security

**Cíl:** Uživatel může chatovat s MiLO, sledovat aktivity a rozšiřovat schopnosti přes pluginy/MCP.

---

## Milestone 10: Polishing a release MVP v1.0.0

- [ ] Ladění UX a výkonu (Lighthouse 90+, interakce pod 100 ms)
- [ ] Kompletní test coverage (min. 70 %)
- [ ] Bezpečnostní audit a penetration testing základy
- [ ] Dokumentace pro uživatele a vývojáře
- [ ] Deployment příprava (Docker, env, secrets management)
- [ ] Release v1.0.0
- [ ] **Architecture Review** – finální kontrola architektury, dluhu, bezpečnosti a dokumentace

**Cíl:** MiLO_Core MVP je připraven jako placený produkt.

---

## Pozdější fáze (mimo MVP)

- WhatsApp integrace
- Home Assistant integrace
- ISDS integrace
- GitHub integrace
- Local-first sync a offline mode
- Pokročilí agenti s plánováním
- Automatizace workflow
- Mobilní aplikace (React Native)
- Komunitní marketplace pluginů
- Team / multi-user podpora
