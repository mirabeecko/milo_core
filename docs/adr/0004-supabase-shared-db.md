# ADR-0004: Supabase jako sdílená databáze

**Status:** PROPOSED
**Datum:** 2026-07-08
**Autor:** Chief Orchestrator

---

## Kontext

MiLO potřebuje perzistentní úložiště pro:

- uživatelská data (preference, kontakty),
- organizační data (oddělení, agenti, Decision Records),
- znalostní bázi (dokumenty, Lessons Learned, embeddingy),
- monitoring (metriky, náklady, health),
- sdílený stav mezi instancemi (lokální Mac ↔ VPS).

Již existuje Supabase projekt (`mljqltwcdqknezuqpisb.supabase.co`) používaný MiLO_Agent, n8n, ai-project-manager, executive-ai a milo-os. Schéma z milo-os (`supabase_schema.sql`) definuje tabulky: milo_projects, milo_tasks, milo_llm_costs, milo_work_in_progress, milo_analytics_snapshots, milo_calendar_events, milo_emails.

Ústava (kapitola 4.2) vyžaduje, aby databáze byla nahraditelná.

## Rozhodnutí

**Používáme Supabase (PostgreSQL) jako sdílenou databázi, s abstrakcí přes Repository pattern.**

Každý bounded context definuje repository port ve své `domain/ports.ts`:

```typescript
interface AgentRepository {
  findById(id: AgentId): Promise<Agent>;
  save(agent: Agent): Promise<void>;
  findByDepartment(deptId: DepartmentId): Promise<Agent[]>;
}
```

Implementace v `infrastructure/supabase-agent-repository.ts` používá Supabase JS client.

**Klíčová rozhodnutí:**

1. **Repository pattern** — doména nikdy nevolá Supabase přímo. Výměna databáze = nová implementace repository portu.

2. **PostgreSQL, ne SQLite** — potřebujeme sdílený přístup (macOS + VPS), vektorové vyhledávání (pgvector), Row Level Security.

3. **Supabase, ne raw PostgreSQL** — získáváme REST API (postgREST), realtime subscriptions, auth, storage, pgvector — bez vlastní infrastruktury.

4. **Sdílené schéma, ne per-agent** — jeden Supabase projekt pro celý MiLO. Oddělení vlastní své tabulky, sdílené tabulky (metriky, DR) jsou pod KNOW.

5. **RLS pro izolaci** — Row Level Security zajišťuje, že agent vidí jen svá data.

## Zvažované alternativy

| Alternativa | Plusy | Minusy |
|-------------|-------|--------|
| **SQLite lokálně** | Nulová latence, offline | Žádné sdílení, žádný pgvector, žádné realtime |
| **Raw PostgreSQL na VPS** | Plná kontrola | Vlastní infrastruktura, správa, zálohování |
| **Supabase** ✅ | Managed, pgvector, realtime, REST API, RLS | Vendor lock-in? → řešeno Repository patternem |
| **Firebase** | Realtime, managed | Proprietární, NoSQL (horší pro relační data), horší RAG |

## Důsledky

### Co bude snazší
- Sdílený stav mezi macOS a VPS
- Vektorové vyhledávání (pgvector je nativní)
- Realtime notifikace (Supabase Realtime)
- RAG pipeline (embeddingy v pgvector)
- Migrace z existujících projektů (už používají stejný Supabase projekt)

### Co bude těžší
- Offline režim — Supabase vyžaduje připojení (řešeno: lokální cache pro kritické operace)
- Rate limiting — Supabase free tier má limity
- Komplexní transakce přes PostgREST (řešeno: přímé SQL pro složité dotazy)

## Datum revize

2027-01-08

## Reference

- CONSTITUTION.md, kapitola 4.2 — Nahraditelnost, kapitola 3.5 — Lokální data
- CONCEPTUAL_MODEL.md — BC-4 (Knowledge), BC-9 (Monitoring)
- milo-os/supabase_schema.sql — existující schéma
