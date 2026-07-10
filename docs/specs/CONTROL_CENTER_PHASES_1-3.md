# MiLO Control Center — Detailní zadání Fází 1-3

**Datum:** 2026-07-11
**Status:** Připraveno k implementaci
**Reuse:** MiLO_Core monorepo (pnpm workspace, Fastify, Next.js, Supabase)

---

## FÁZE 1 — Databáze + Registry + CRUD API (3 dny)

### Cíl: Agenti a use cases v databázi s CRUD API, viditelné v dashboardu.

---

### 1.1 Databázové migrace

Vytvoř v `packages/database/migrations/`:

#### Tabulka: agents

```sql
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  purpose TEXT,
  category TEXT,
  owner TEXT,
  status TEXT DEFAULT 'draft',
  lifecycle_status TEXT DEFAULT 'specified',
  risk_level TEXT DEFAULT 'medium',
  priority TEXT DEFAULT 'normal',
  active_version_id UUID,
  deployed_version_id UUID,
  implementation_progress INTEGER DEFAULT 0,
  runtime_status TEXT DEFAULT 'offline',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  archived_at TIMESTAMPTZ
);
```

#### Tabulka: agent_versions

```sql
CREATE TABLE agent_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id),
  version_number INTEGER NOT NULL,
  version_label TEXT,
  specification JSONB NOT NULL DEFAULT '{}',
  change_summary TEXT,
  change_reason TEXT,
  created_by TEXT DEFAULT 'owner',
  parent_version_id UUID REFERENCES agent_versions(id),
  status TEXT DEFAULT 'draft',
  approved_at TIMESTAMPTZ,
  deployed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, version_number)
);
```

#### Tabulka: use_cases

```sql
CREATE TABLE use_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID NOT NULL REFERENCES agents(id),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  risk_level TEXT DEFAULT 'medium',
  priority TEXT DEFAULT 'normal',
  status TEXT DEFAULT 'draft',
  active_version_id UUID,
  implementation_status TEXT DEFAULT 'not_started',
  implementation_progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agent_id, slug)
);
```

#### Tabulka: use_case_versions

```sql
CREATE TABLE use_case_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  use_case_id UUID NOT NULL REFERENCES use_cases(id),
  version_number INTEGER NOT NULL,
  version_label TEXT,
  specification JSONB NOT NULL DEFAULT '{}',
  change_summary TEXT,
  change_reason TEXT,
  created_by TEXT DEFAULT 'owner',
  parent_version_id UUID REFERENCES use_case_versions(id),
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(use_case_id, version_number)
);
```

#### Tabulka: capabilities

```sql
CREATE TABLE capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  capability_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  status TEXT DEFAULT 'draft',
  maturity_level TEXT DEFAULT 'concept',
  owner TEXT,
  active_version INTEGER DEFAULT 1,
  implementation_progress INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Vazební tabulka: agent_capabilities

```sql
CREATE TABLE agent_capabilities (
  agent_id UUID REFERENCES agents(id),
  capability_id UUID REFERENCES capabilities(id),
  required BOOLEAN DEFAULT true,
  PRIMARY KEY (agent_id, capability_id)
);
```

#### Tabulka: implementation_components

```sql
CREATE TABLE implementation_components (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  use_case_id UUID REFERENCES use_cases(id),
  capability_id UUID REFERENCES capabilities(id),
  component_type TEXT NOT NULL,
  name TEXT NOT NULL,
  repository TEXT,
  file_path TEXT,
  module_name TEXT,
  api_endpoint TEXT,
  implementation_status TEXT DEFAULT 'not_started',
  test_status TEXT DEFAULT 'none',
  deployed_status TEXT DEFAULT 'none',
  last_verified_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

### 1.2 Typy (@milo/shared)

Rozšiř `packages/shared/src/types/` o:

```
packages/shared/src/types/agent.ts        — Agent, AgentVersion, AgentStatus, spec schema
packages/shared/src/types/use-case.ts     — UseCase, UseCaseVersion, UseCaseStatus
packages/shared/src/types/capability.ts   — Capability, CapabilityStatus
packages/shared/src/types/component.ts    — ImplementationComponent, ComponentType
```

Každý typ musí obsahovat TypeScript interface pro API response, create input a update input.

---

### 1.3 Database client (@milo/database)

Nový balíček `packages/database/` s:

- Supabase client singleton
- Query helpers pro každou tabulku (getAgents, getAgentById, createAgent, updateAgent...)
- Row-level type mapping (Supabase generované typy, nebo manuální)

Nepoužívat ORM. Přímé SQL přes Supabase JS client.

---

### 1.4 API endpointy (@milo/api)

Rozšířit `apps/api/src/modules/`:

#### Agents

```
GET    /executive/control/agents           — list (filtry: status, category, search)
POST   /executive/control/agents           — create
GET    /executive/control/agents/:id       — detail s versions, use_cases
PATCH  /executive/control/agents/:id       — update metadata
DELETE /executive/control/agents/:id       — archive (soft delete)

POST   /executive/control/agents/:id/versions          — create version
GET    /executive/control/agents/:id/versions          — list versions
GET    /executive/control/agents/:id/versions/:vid     — version detail + spec
```

#### Use Cases

```
GET    /executive/control/use-cases                    — list (filtry: agent_id)
POST   /executive/control/use-cases                    — create
GET    /executive/control/use-cases/:id                — detail
PATCH  /executive/control/use-cases/:id                — update
DELETE /executive/control/use-cases/:id                — archive

POST   /executive/control/use-cases/:id/versions       — create version
GET    /executive/control/use-cases/:id/versions       — list
GET    /executive/control/use-cases/:id/versions/:vid  — detail + spec
```

#### Capabilities

```
GET    /executive/control/capabilities      — list
POST   /executive/control/capabilities      — create
PATCH  /executive/control/capabilities/:id  — update
```

#### Components

```
GET    /executive/control/components                    — list (filtry: agent_id)
POST   /executive/control/components                    — create/register
PATCH  /executive/control/components/:id                — update status
```

---

### 1.5 Dashboard — Control Center modul

Nový adresář `apps/web/app/control/`:

```
apps/web/app/control/
├── layout.tsx              — navigace (Agents, Use Cases, Capabilities, Development...)
├── page.tsx                — přehled: počet agentů, use cases, stav
├── agents/
│   ├── page.tsx            — katalog agentů (karty + tabulka)
│   └── [id]/
│       └── page.tsx        — detail agenta (záložky)
├── use-cases/
│   ├── page.tsx            — katalog use cases
│   └── [id]/
│       └── page.tsx        — detail use case
└── capabilities/
    └── page.tsx            — registr capabilities
```

**Katalog agentů** — karty zobrazující: name, purpose, category, status, implementation_progress (bar), use_cases count.

**Detail agenta** — záložky: Overview (souhrn), Specification (read-only pro F1, editor ve F2), Use Cases (seznam).

Data z API přes existující `useExecutiveQueries` pattern (SWR).

---

### 1.6 Seed data

V `packages/database/seeds/`:

- 7 Executive agentů (OC, ARCH, ENG, KNOW, COMM, OPS, QA) s reálnými popisy
- 3-5 use cases na agenta (z Process Catalog)
- Základní capabilities (document_ingestion, ocr, gmail_search, deadline_extraction...)
- Propojení agent_capabilities

Seed spustitelný přes `pnpm --filter @milo/database seed`.

---

### 1.7 Testy

```
packages/database/tests/queries.test.ts   — CRUD operace nad tabulkami
apps/api/tests/control-agents.test.ts     — API testy pro agents CRUD
apps/api/tests/control-use-cases.test.ts  — API testy pro use cases CRUD
```

---

### 1.8 Acceptance criteria — Fáze 1

- [ ] `pnpm --filter @milo/database migrate` vytvoří všech 7 tabulek
- [ ] `pnpm --filter @milo/database seed` naplní databázi
- [ ] `GET /executive/control/agents` vrátí seznam agentů
- [ ] `POST /executive/control/agents` vytvoří nového agenta
- [ ] `GET /executive/control/agents/:id` vrátí detail s versions a use_cases
- [ ] `GET /executive/control/use-cases` vrátí use cases s filtrem na agent_id
- [ ] Dashboard `/control/agents` zobrazí karty agentů z API
- [ ] Dashboard `/control/agents/:id` zobrazí detail s use cases
- [ ] Dashboard `/control/capabilities` zobrazí registr capabilities
- [ ] Typy v @milo/shared jsou kompletní a typecheck prochází
- [ ] Všechny testy prochází

---

## FÁZE 2 — Editor + Verzování + Diff (3 dny)

### Cíl: Vlastník upravuje specifikace agentů a use cases přes dashboard, vidí diff a historii.

---

### 2.1 Specifikační editor — Agent

Na stránce detailu agenta přidat záložku "Specification" s:

- **Formulářový editor** — strukturovaná pole:
  - Identita (name, slug, purpose, description, category, owner)
  - Role (responsibilities, not_responsible_for, depends_on, delivers_to)
  - Chování (rules, decision_principles, communication_style, uncertainty_handling)
  - Oprávnění (read_only, can_write, auto_execute, requires_approval, forbidden)
  - Modelová strategie (preferred_model, fallback_model, max_cost, max_runtime)
  - Schvalování (approval_rules, approver, timeout)

- **JSON editor** — přepínací tlačítko "Formulář / JSON". Syntax highlighting.

- **Validace** — před uložením:
  - Povinná pole (name, purpose)
  - Slug unikátní
  - JSON schema valid

- **Uložení**:
  - Tlačítko "Uložit koncept" — POST /agents/:id/versions (status=draft)
  - Tlačítko "Publikovat verzi" — POST /agents/:id/versions (status=ready)
  - Povinné pole "change_summary" (co se změnilo) a "change_reason" (proč)

---

### 2.2 Specifikační editor — Use Case

Stejný princip jako agent, ale use-case-specifická pole:

- Účel, spouštěč, vstupy, výstupy
- Workflow steps (drag-and-drop pořadí)
- Rozhodovací pravidla
- Používané capabilities (multiselect z registru)
- Nástroje
- Schvalovací pravidla
- Testovací scénáře
- Definition of Done

---

### 2.3 Verzování

- Každé uložení vytvoří novou verzi (`agent_versions` / `use_case_versions`)
- `version_number` autoinkrementuje pro daný agent/use case
- Při publikování: `status = 'ready'`, `agents.active_version_id` se aktualizuje
- Staré verze zůstávají — read-only

**Záložka "Versions"** na detailu agenta/use case:
- Tabulka: version_number, label, status, created_at, created_by, change_summary
- Kliknutím na verzi → detail s plnou specifikací
- Tlačítko "Obnovit tuto verzi" → vytvoří novou verzi s kopií staré specifikace

---

### 2.4 Specification Diff

Backend: `POST /executive/control/agents/:id/diff?from=X&to=Y`

Vrátí strukturovaný diff (ne textový):

```json
{
  "from_version": 1,
  "to_version": 2,
  "changed_sections": [
    {
      "section": "behavior.rules",
      "change_type": "added",
      "path": "behavior.rules[2]",
      "old_value": null,
      "new_value": "Každý právní dokument musí extrahovat osoby, organizace, částky a právní ustanovení."
    }
  ],
  "unchanged_sections": ["identity", "permissions"],
  "added_sections": [],
  "removed_sections": []
}
```

Diff algoritmus: rekurzivní porovnání JSON objektů. Detekuje added, removed, modified na úrovni klíčů i hodnot.

Dashboard: Záložka "Versions" → tlačítko "Porovnat" → výběr dvou verzí → barevně zvýrazněný diff.

---

### 2.5 Historie změn

Záložka "Activity" na detailu agenta/use case:
- Časová osa změn specifikace
- Každá položka: datum, kdo, co změnil, change_summary, odkaz na verzi

---

### 2.6 Acceptance criteria — Fáze 2

- [ ] Specifikaci agenta lze upravit přes formulář i JSON editor
- [ ] Specifikaci use case lze upravit přes formulář i JSON editor
- [ ] Uložení vytvoří novou verzi s change_summary
- [ ] Nelze uložit nevalidní specifikaci
- [ ] Seznam verzí zobrazuje všechny verze s možností detailu
- [ ] Diff endpoint vrací strukturovaný diff
- [ ] Dashboard zobrazuje diff barevně
- [ ] Lze obnovit starší verzi (vytvoří novou kopii)
- [ ] Activity log zobrazuje historii změn
- [ ] Typecheck a testy prochází

---

## FÁZE 3 — Vývojový stav + Komponenty + Úkoly (4 dny)

### Cíl: Dashboard zobrazuje reálný stav implementace — co je hotové, co chybí, proč.

---

### 3.1 Vývojová matice agenta

Na detailu agenta záložka "Development" — matice:

| Vrstva | Stav | Progress | Úkoly | Blokátory |
|--------|------|---------|-------|-----------|
| Specifikace | ✅ Hotovo | 100% | 0 | 0 |
| Datový model | 🔨 V vývoji | 40% | 2 | 1 |
| Backend | ❌ Nezahájeno | 0% | 3 | 0 |
| Frontend | ❌ Nezahájeno | 0% | 1 | 0 |
| ... | | | | |

Každý řádek rozbalitelný → seznam konkrétních úkolů.

Data: Agregace z `implementation_components` + `development_tasks`.

---

### 3.2 Registrace implementačních komponent

Backend API: `POST /executive/control/components`

Registruje reálnou komponentu v repozitáři:

```json
{
  "agent_id": "uuid",
  "component_type": "backend",
  "name": "ISDS Intake API",
  "repository": "milo-core",
  "file_path": "apps/api/src/modules/executive/isds-intake.ts",
  "api_endpoint": "/executive/isds/intake",
  "implementation_status": "implemented",
  "test_status": "none"
}
```

Dashboard: Záložka "Components" — tabulka všech komponent s filtry.

---

### 3.3 Tabulka: development_tasks

```sql
CREATE TABLE development_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id UUID REFERENCES agents(id),
  use_case_id UUID REFERENCES use_cases(id),
  capability_id UUID REFERENCES capabilities(id),
  title TEXT NOT NULL,
  description TEXT,
  technical_context TEXT,
  source TEXT DEFAULT 'manual',
  task_type TEXT DEFAULT 'implementation',
  priority TEXT DEFAULT 'normal',
  risk_level TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'planned',
  assigned_worker TEXT,
  assigned_model TEXT,
  reviewer TEXT,
  acceptance_criteria TEXT,
  definition_of_done TEXT,
  estimated_complexity INTEGER DEFAULT 3,
  created_from_spec_diff BOOLEAN DEFAULT false,
  blocked_reason TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

API:

```
GET    /executive/control/tasks                    — list (filtry: agent_id, status, type)
POST   /executive/control/tasks                    — create
PATCH  /executive/control/tasks/:id                — update status, assign
POST   /executive/control/tasks/:id/start          — mark in_progress
POST   /executive/control/tasks/:id/complete       — mark completed
POST   /executive/control/tasks/:id/verify         — mark verified
POST   /executive/control/tasks/:id/block          — block s důvodem
```

---

### 3.4 Výpočet připravenosti

Backend: `GET /executive/control/agents/:id/progress`

Vypočítá `implementation_progress` z reálných dat:

- Procento dokončených use cases (podle jejich implementation_status)
- Procento implementovaných komponent (podle component_type vah)
- Procento dokončených úkolů
- Vážený průměr: UC 40%, komponenty 40%, úkoly 20%

```json
{
  "agent_id": "uuid",
  "progress": 58,
  "breakdown": {
    "use_cases": {"total": 5, "done": 3, "percent": 60},
    "components": {"total": 12, "done": 6, "percent": 50},
    "tasks": {"total": 8, "done": 5, "percent": 62}
  },
  "missing": [
    "Backend: ISDS intake API — neimplementováno",
    "Datový model: deadline extraction schema — v vývoji",
    "Test: OCR quality test — chybí"
  ]
}
```

Dashboard: Progress bar s rozpisem co konkrétně chybí (ne jen procento).

---

### 3.5 Development board

Nová stránka: `/control/development`

- Board view: sloupce podle statusu (planned → in_progress → in_review → completed)
- Tabulkový view: všechny úkoly, řaditelné, filtrovatelné
- Drag-and-drop mezi sloupci (změní status)
- Actions: start, complete, block, assign, create mission

---

### 3.6 Testy

```
apps/api/tests/control-tasks.test.ts          — CRUD + lifecycle
apps/api/tests/control-progress.test.ts       — výpočet připravenosti
packages/database/tests/components.test.ts    — komponenty CRUD
```

---

### 3.7 Acceptance criteria — Fáze 3

- [ ] Vývojová matice zobrazuje stav všech vrstev
- [ ] Komponenty lze registrovat a zobrazit v dashboardu
- [ ] Úkoly lze vytvářet, přiřazovat, spouštět, dokončovat
- [ ] Development board umožňuje drag-and-drop změnu stavu
- [ ] Progress se počítá z reálných dat (ne manuální procento)
- [ ] Dashboard zobrazuje konkrétní chybějící položky
- [ ] Typecheck a všechny testy prochází

---

## Souhrn — prvních 10 dní

| Den | Co vznikne |
|-----|-----------|
| 1 | DB migrace, @milo/database balíček, typy |
| 2 | CRUD API pro agents, use cases, capabilities |
| 3 | Dashboard: katalog agentů, detail, seed data, testy |
| 4 | Editor specifikace (formulář + JSON) |
| 5 | Verzování, verze, historie |
| 6 | Specification diff engine + UI |
| 7 | Implementační komponenty, registrace |
| 8 | Development tasks, CRUD, board |
| 9 | Výpočet připravenosti, vývojová matice |
| 10 | Testy, integrace, ladění |

---

### Klíčové soubory k vytvoření/úpravě

```
Nové:
  packages/database/                        — celý balíček
  packages/database/migrations/001_agents.sql až 003_tasks.sql
  packages/database/seeds/seed.ts
  packages/shared/src/types/agent.ts
  packages/shared/src/types/use-case.ts
  packages/shared/src/types/capability.ts
  packages/shared/src/types/component.ts
  packages/shared/src/types/task.ts
  apps/api/src/modules/control/agents.ts
  apps/api/src/modules/control/use-cases.ts
  apps/api/src/modules/control/capabilities.ts
  apps/api/src/modules/control/components.ts
  apps/api/src/modules/control/tasks.ts
  apps/api/src/modules/control/diff.ts
  apps/api/src/modules/control/progress.ts
  apps/web/app/control/                    — celý modul (10+ souborů)

Upravit:
  apps/api/src/server.ts                    — registrace control routes
  packages/shared/src/index.ts              — export nových typů
```
