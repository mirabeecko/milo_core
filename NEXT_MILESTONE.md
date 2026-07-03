# MiLO_Core – Next Milestone: Real Data & Sync

> Cíl: Připojit reálná data k MVP dashboardu a zajistit jejich aktuálnost.
> Předpoklad: Dokončený refactor dle `REFACTOR_PLAN.md`.

---

## Název milníku

**Milestone 3: Real Data & Sync**

---

## Cíle

1. Vytvořit stabilní data layer mezi frontendem a backendem.
2. Napojit Gmail, Google Calendar, Google Drive a Obsidian na reálná data (volitelně přes OAuth).
3. Zajistit background synchronizaci přes BullMQ.
4. Vytvořit centrální knowledge index pro vyhledávání napříč zdroji.
5. Připravit command processor pro chat, který používá reálná data.

---

## Scope

### V rámci milníku

- Refactor dle `REFACTOR_PLAN.md`.
- Frontend API client a React hooks / TanStack Query integrace.
- Backend data services s konzistentním demo fallback.
- `/api/chat` endpoint a command processor.
- Google OAuth flow pro Gmail, Calendar, Drive.
- Obsidian vault sync (lokální file watch / periodický scan).
- BullMQ jobs pro pravidelnou synchronizaci.
- Supabase databáze pro persistenci:
  - uživatelé a sessions,
  - integrované účty (tokens, scopes),
  - synchronizovaná data (emaily, události, soubory, poznámky),
  - knowledge index (metadata + embeddings).
- Error handling, retry logika a rate limiting pro externí API.

### Mimo tento milník

- WhatsApp, ISDS, Home Assistant, GitHub integrace.
- Produční deploy pipeline.
- Mobilní aplikace.
- Pokročilé RAG a knowledge graph.
- Team / multi-user podpora.

---

## Architektura

```
┌─────────────────────────────────────────────────────────────┐
│                         Frontend                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────┐ │
│  │   Home   │ │  Brief   │ │   Chat   │ │ Documents, ... │ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └───────┬────────┘ │
│       │            │            │                │          │
│  ┌────┴────────────┴────────────┴────────────────┘          │
│  │              lib/api (client + hooks)                    │
│  └───────────────────────┬─────────────────────────────────┘
└──────────────────────────┼──────────────────────────────────┘
                           │ HTTP / WebSocket
┌──────────────────────────┼──────────────────────────────────┐
│                         Backend                             │
│  ┌───────────────────────┴─────────────────────────────────┐│
│  │                   Fastify API Routes                     ││
│  └───────┬───────────────┬───────────────┬─────────────────┘│
│          │               │               │                  │
│  ┌───────┴──────┐ ┌──────┴──────┐ ┌─────┴──────┐          │
│  │   Services   │ │   Agents    │ │  Command   │          │
│  │  (Gmail,     │ │  (Chief of  │ │  Processor │          │
│  │  Calendar,   │ │  Staff, ...)│ │            │          │
│  │  Drive,      │ └─────────────┘ └────────────┘          │
│  │  Obsidian)   │                                        │
│  └──────┬───────┘                                        │
│         │                                                 │
│  ┌──────┴──────────────────────────────────────┐         │
│  │              BullMQ Jobs                     │         │
│  │  (sync-gmail, sync-calendar, sync-drive,    │         │
│  │   sync-obsidian, generate-briefing)          │         │
│  └──────────────────────────────────────────────┘         │
│  ┌──────────────────────────────────────────────┐         │
│  │              Supabase (Postgres)             │         │
│  │  users, accounts, emails, events, files,     │         │
│  │  notes, knowledge_chunks                     │         │
│  └──────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

---

## Úkoly

### Fáze 1: Refactor základny (1–2 týdny)

- [ ] Dokončit Refaktor #2: sjednotit demo/reálná data na backendu.
- [ ] Dokončit Refaktor #1: vytvořit frontend API layer.
- [ ] Dokončit Refaktor #3: `/api/chat` endpoint a command processor.
- [ ] Dokončit Refaktor #4: extrahovat UI komponenty.
- [ ] Dokončit Refaktor #5: loading/error stavy.
- [ ] Aktualizovat testy pro API client a common komponenty.
- [ ] **Architecture Review** – schválit data layer a command processor.

### Fáze 2: Supabase schema a persistence (1 týden)

- [ ] Definovat databázové tabulky:
  - `users`
  - `accounts` (provider, access_token, refresh_token, expires_at)
  - `emails`
  - `calendar_events`
  - `drive_files`
  - `obsidian_notes`
  - `knowledge_chunks`
  - `briefings`
  - `chat_conversations`
  - `chat_messages`
- [ ] Vytvořit migration scripts.
- [ ] Vytvořit repository pattern v `packages/database`.
- [ ] Připravit Row Level Security policies.

### Fáze 3: Integrace (2–3 týdny)

- [ ] Gmail OAuth + sync job.
- [ ] Google Calendar OAuth + sync job.
- [ ] Google Drive OAuth + sync job.
- [ ] Obsidian vault sync job (file watcher / periodic scan).
- [ ] Každá integrace ukládá data do Supabase a aktualizuje `synced_at`.

### Fáze 4: Knowledge base (1–2 týdny)

- [ ] Chunking pipeline pro dokumenty, emaily a poznámky.
- [ ] Embeddings přes `@milo/ai` (OpenAI nebo Ollama).
- [ ] Uložení embeddings do `knowledge_chunks` (pgvector).
- [ ] Základní vector search endpoint `/api/knowledge/search`.
- [ ] Zobrazení zdrojů u chat odpovědí.

### Fáze 5: Chief of Staff a briefing (1 týden)

- [ ] Chief of Staff agent používá reálná data z knowledge base.
- [ ] Plánovaný briefing job přes BullMQ (každé ráno).
- [ ] Briefing se ukládá do databáze s audit logem.

### Fáze 6: Polish a review (1 týden)

- [ ] Retry a error handling pro externí API.
- [ ] Rate limiting a quota management.
- [ ] Kompletní test coverage min. 60 %.
- [ ] Aktualizovat dokumentaci.
- [ ] **Architecture Review** – schválit real data sync, bezpečnost a scalability.

---

## Acceptance Criteria

- [ ] Uživatel se přihlásí přes Supabase Auth.
- [ ] Uživatel připojí Gmail, Calendar, Drive přes OAuth.
- [ ] Uživatel nastaví cestu k Obsidian vaultu.
- [ ] Data se pravidelně synchronizují na pozadí.
- [ ] Home zobrazuje reálná data z poslední sync.
- [ ] Chat odpovídá na základě reálných dat a uvádí zdroje.
- [ ] Briefing se generuje z reálných dat a lze přehrát / zkopírovat.
- [ ] Vyhledávání v Documents funguje napříč všemi zdroji.
- [ ] Aplikace funguje i bez credentials v demo režimu.
- [ ] Build, lint a testy procházejí.

---

## Technický dluh k řešení během milníku

- Sjednocení demo fallback strategie.
- Vytvoření API client a hooks na frontendu.
- Command processor pro chat.
- Extrahování znovupoužitelných UI komponent.
- Loading/error stavy a error boundaries.
- Repository pattern pro Supabase.
- Retry logika a idempotence BullMQ jobs.

---

## Rizika a mitigace

| Riziko | Mitigace |
|--------|----------|
| OAuth komplexita | Začít s jednou integrací (Gmail), pak replikovat pattern. |
| Rate limiting Google API | Implementovat exponenciální backoff a denní quota tracking. |
| Velké Obsidian vaulty | Chunking a postupná indexace, nikoliv vše najednou. |
| Náklady na embeddings | Podpora Ollama pro lokální embeddings. |
| Bezpečnost tokenů | Ukládat pouze refresh tokeny šifrovaně, používat Supabase RLS. |

---

## Definition of Done

- Všechny úkoly ve scope jsou hotové.
- Všechny acceptance criteria jsou splněné.
- Prošel Architecture Review.
- Dokumentace je aktuální.
- `pnpm typecheck && pnpm lint && pnpm test && pnpm build` prochází.
