# MiLO_Core – Roadmap

## Filozofie roadmapy

Každý milestone je plně funkční a prochází **Architecture Review**. Cílem není rychle nashromáždit funkce, ale postavit **premium osobní OS** – produkt, za který jsou lidé ochotni platit 50–100 USD měsíčně.

---

## Milestone 0: Premium Foundation

- [x] Vytvořit repo a základní dokumentaci
- [x] Definovat strukturu projektu podle Premium standardu
- [x] Nastavit Docker a Docker Compose (Postgres, Redis, Ollama volitelně)
- [x] Vytvořit frontend skeleton (Next.js 14, Tailwind, shadcn/ui, design tokens)
- [x] Vytvořit backend skeleton (Fastify 5, TypeScript, strict mode)
- [x] Nastavit Redis (cache, sessions, pub/sub)
- [x] Nastavit Pino logging
- [x] Nastavit rate limiting
- [x] Nastavit CI/CD pipeline (build, lint, typecheck, test)
- [x] Vytvořit design system a základní komponenty
- [x] **Architecture Review** – schválit foundation, Docker, CI, bezpečnost a premium stack

**Cíl:** Repo je připravené pro premium vývoj. Aplikace se spustí lokálně i v Dockeru.

**Stav:** APPROVED – viz [MILESTONE_0_REVIEW.md](./docs/reviews/MILESTONE_0_REVIEW.md)

---

## Milestone 1: Core Integrations Skeleton

- [x] Autentizace přes Supabase Auth s demo fallback
- [x] Dashboard layout (Notion + Linear + ChatGPT feel)
- [x] Navigace: Home, Today's Brief, Projects, Agents, Documents, Knowledge, Email, Calendar, Settings, Chat, Activity, Notifications
- [x] Dark mode jako výchozí, design tokens
- [x] TTS modul (`@milo/tts`) s abstrakcí a macOS `say` providerem
- [x] MiLO CLI (`milo brief --speak`, `milo ask "..." --speak`)
- [x] AI provider abstrakce (OpenAI kompatibilní) a Chief of Staff briefing
- [x] Gmail integrace skeleton (`/api/email`)
- [x] Google Calendar integrace skeleton (`/api/calendar`)
- [x] Google Drive integrace skeleton (`/api/documents`)
- [x] Obsidian integrace skeleton (`/api/knowledge/obsidian`)
- [ ] **Architecture Review** – integrace, TTS, auth, UX a bezpečnost

**Cíl:** Uživatel se přihlásí, vidí premium dashboard a může prohlížet demo data ze všech core zdrojů.

**Stav:** Implementace hotová, čeká na Architecture Review.

---

## Milestone 2: Real Data & Background Sync

- [ ] Production-ready Supabase Auth (OAuth, magic link, passkeys)
- [ ] RBAC a oprávnění na úrovni zdrojů
- [ ] BullMQ setup pro background jobs
- [ ] Real-time synchronizace Gmail (webhook / polling)
- [ ] Real-time synchronizace Google Calendar
- [ ] Real-time synchronizace Google Drive
- [ ] Indexace Obsidian vaultu do vector databáze
- [ ] Universal search napříč zdroji
- [ ] Zdroje u každé odpovědi AI
- [ ] **Architecture Review** – sync, jobs, vector indexing, data handling

**Cíl:** MiLO pracuje se skutečnými daty a udržuje je aktuální na pozadí.

---

## Milestone 3: Knowledge Base & RAG

- [ ] Centralizovaná knowledge base v Supabase + pgvector
- [ ] Embeddings pipeline pro dokumenty, emaily, poznámky
- [ ] Chunking strategie pro různé typy obsahu
- [ ] Vector search s filtry a hybridním vyhledáváním
- [ ] Re-ranking a citace zdrojů
- [ ] Knowledge graph (základní verze)
- [ ] RAG odpovědi napříč zdroji v chatu
- [ ] **Architecture Review** – vector DB, embedding pipeline, RAG quality, source citations

**Cíl:** Uživatel může klást otázky napříč všemi zdroji a dostávat odpovědi s odkazy.

---

## Milestone 4: Chat, Activity & MCP Runtime

- [ ] Chatové rozhraní s Chief of Staff agentem
- [ ] Streaming odpovědí do UI
- [ ] Historie konverzací s persistentní pamětí
- [ ] Aktivity feed
- [ ] Notifikace a real-time updates (Supabase Realtime / WebSockets)
- [ ] Command palette (Cmd+K)
- [ ] MCP / Plugin runtime (sandbox, registry)
- [ ] **Architecture Review** – chat state, message history, real-time updates, plugin security

**Cíl:** Uživatel může chatovat s MiLO, sledovat aktivity a rozšiřovat schopnosti přes pluginy/MCP.

---

## Milestone 5: Polishing a Release MVP v1.0.0

- [ ] Ladění UX a výkonu (Lighthouse 90+, interakce pod 100 ms)
- [ ] Responzivní layout dokončení
- [ ] Kompletní test coverage (min. 70 %)
- [ ] Bezpečnostní audit a penetration testing základy
- [ ] Dokumentace pro uživatele a vývojáře
- [ ] Deployment příprava (Docker, env, secrets management)
- [ ] S3-compatible storage pro velké soubory
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
