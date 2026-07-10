# MiLO Executive Dashboard — Integration Handoff

**Pro:** Dashboard vývojářský tým
**Od:** Chief Orchestrator
**Verze API:** 1.0 (stabilní)
**Base URL:** `http://127.0.0.1:4000`

---

## Endpointy

Všechny endpointy jsou pod `/executive`. Žádná autentizace není vyžadována (read-only interní API).

### Status

| Method | Path | Popis |
|--------|------|-------|
| GET | `/executive/status` | Organizační přehled — oddělení, agenti, aktivní mise, pending approvals |

**Response:**
```json
{
  "organization": {
    "totalDepartments": 7,
    "activeDepartments": 4,
    "totalAgents": 6,
    "activeMissions": 0,
    "pendingApprovals": 0
  },
  "departments": [{
    "id": "OC",
    "name": "Office of the Chief",
    "mission": "Strategie, koordinace...",
    "configuredStatus": "active",
    "leadAgent": { "id": "chief-of-staff", "status": "idle", "state": {...} }
  }],
  "agents": [{
    "id": "chief-of-staff",
    "name": "Chief of Staff",
    "status": "idle",
    "department": "OC",
    "state": { "taskProgress": 0, "pendingTasks": 0, ... }
  }]
}
```

---

### Departments

| Method | Path | Popis |
|--------|------|-------|
| GET | `/executive/departments` | Všechna oddělení s lead agent statusem |

**Response:** Pole objektů — id, name, mission, configuredStatus, leadAgentStatus, leadAgentState, availableTools, memoryScope, activeMissions, dependencies.

---

### Agents

| Method | Path | Popis |
|--------|------|-------|
| GET | `/executive/agents` | Všichni agenti s reálným runtime stavem |

**Klíčová pole:**
- `status` — reálný runtime stav (idle, working, waiting, failed, ...)
- `health` — { status: "healthy"|"degraded"|"unhealthy", lastHeartbeat }
- `department` — z organization-registry.json
- `tools`, `model` — konfigurace

**POZOR:** `status: "idle"` znamená že agent běží, `"offline"` že neběží. Nezaměňovat s konfigurací.

---

### Missions

| Method | Path | Popis |
|--------|------|-------|
| GET | `/executive/missions` | Všechny mise |
| POST | `/executive/missions` | Vytvořit misi |
| GET | `/executive/missions/:id` | Detail mise + úkoly |
| PATCH | `/executive/missions/:id` | Aktualizovat status mise |
| GET | `/executive/missions/:id/timeline` | Event timeline pro misi |

**POST body:**
```json
{ "title": "Název mise", "description": "...", "priority": "high" }
```

**PATCH body:**
```json
{ "status": "completed" }
```

---

### Events (Telemetry)

| Method | Path | Popis |
|--------|------|-------|
| GET | `/executive/events` | Poslední události |
| POST | `/executive/events` | Zapsat událost |

**Query params:** `?limit=50`, `?type=mission_created`

**Event types:** objective_started, mission_created, mission_assigned, mission_progress, mission_blocked, mission_completed, agent_started, agent_waiting, agent_failed, worker_created, artifact_created, risk_raised, approval_requested, approval_granted, approval_rejected

**Perzistence:** JSONL soubor (`apps/api/data/executive-events.jsonl`). Přežije restart.

---

### Approvals

| Method | Path | Popis |
|--------|------|-------|
| GET | `/executive/approvals` | Všechna schválení (?status=pending) |
| POST | `/executive/approvals` | Vytvořit žádost o schválení |
| POST | `/executive/approvals/:id/approve` | Schválit |
| POST | `/executive/approvals/:id/reject` | Zamítnout |

**POST body (create):**
```json
{
  "mission_id": "mission-7",
  "department": "ENG",
  "what": "Spustit diagnostiku",
  "why": "Read-only, bezpečné",
  "risk_level": "low",
  "requested_by": "chief-engineer"
}
```

**POST body (approve/reject):**
```json
{ "reason": "Schváleno", "decided_by": "owner" }
```

---

### Ostatní

| Method | Path | Popis |
|--------|------|-------|
| GET | `/executive/risks` | Aktivní rizika (z event logu) |
| GET | `/executive/artifacts` | Vytvořené artefakty (z event logu) |
| GET | `/executive/backlog` | Executive backlog + aktivní mise |
| GET | `/executive/registry` | Plný JSON organizačního registru |
| GET | `/executive/telemetry` | Telemetrický kontrakt (event types, status model) |

---

## Doporučení pro dashboard

### Polling
Doporučený interval: **5 sekund** pro `/executive/status` (přehled). **30 sekund** pro `/executive/events`.

### Realtime
Zatím není implementováno. Až bude, použijte SSE na `/executive/events/stream`.

### Chybové chování
- 400: špatný vstup
- 404: nenalezeno (mise, approval, soubor)
- 500: interní chyba serveru (obsahuje `error` pole)

### Známé mezery
- Worker agenti zatím nejsou vytvářeni runtime — ENG department čeká na POC
- `leadAgentStatus: "offline"` — executive agenti jsou definováni v registru, ale runtime je zatím nespouští
- Mission timeline je filtrována z event logu — pokud událost nebyla zalogována, v timeline chybí

### Autentizace
Executive endpointy jsou bez auth. Produkční endpointy (`/missions`, `/agents`) vyžadují Supabase token (`Authorization: Bearer ...` nebo `?token=...`).

---

## Spuštění backendu

```bash
cd /Users/mb/dev/MiLO_Core
pnpm --filter @milo/api dev
# API běží na http://127.0.0.1:4000
```

## Ověření

```bash
# Health check
curl http://127.0.0.1:4000/health

# Organizační přehled
curl http://127.0.0.1:4000/executive/status

# Agenti s runtime stavem
curl http://127.0.0.1:4000/executive/agents

# Vytvořit misi
curl -X POST http://127.0.0.1:4000/executive/missions \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","priority":"high"}'
```
