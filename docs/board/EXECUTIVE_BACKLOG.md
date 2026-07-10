# MiLO Executive Backlog

**Živý dokument.** Aktualizován po každém Board meetingu.
**Spravuje:** OC (Office of the Chief)
**Poslední aktualizace:** 2026-07-08

---

## Priorita 0 — Blokuje M1 (MUSÍ)

| ID | Název | Oddělení | Effort | Závislosti | Výstup | Stav |
|----|-------|----------|--------|------------|--------|------|
| P0-001 | Vytvořit CONCEPTUAL_MODEL.md | KNOW | M | — | Dokument | ✅ Hotovo |
| P0-002 | Vytvořit ARCHITECTURE.md (části 1-6) | ARCH | L | P0-001 | Dokument | 📋 Čeká |
| P0-003 | Zapsat ADR-0001 až ADR-0005 | ARCH | M | P0-001 | 5 ADR | ✅ Hotovo |
| P0-004 | Sjednotit Telegram boty | COMM | M | — | Běžící bot | 📋 Čeká |
| P0-005 | Vytvořit Framework Reuse Assessment | ARCH | S | — | Dokument | ✅ Hotovo (ADR-0011) |

---

## Priorita 1 — Blokuje M4 (MĚLO BY)

| ID | Název | Oddělení | Effort | Závislosti | Výstup | Stav |
|----|-------|----------|--------|------------|--------|------|
| P1-001 | OrchestrationProvider interface + LangGraph adapter | ENG | L | P0-002 | Kód | 📋 Čeká |
| P1-002 | ConstitutionalValidationHook | ENG | M | P1-001 | Kód | 📋 Čeká |
| P1-003 | MissionSemantics — fáze mise | ENG | L | P1-001 | Kód | 📋 Čeká |
| P1-004 | Nastavit CI/CD | OPS | M | — | Pipeline | 📋 Čeká |
| P1-005 | Nastavit monitoring | OPS | M | — | Dashboard | 📋 Čeká |

---

## Priorita 2 — Zlepšuje kvalitu (MOHLO BY)

| ID | Název | Oddělení | Effort | Závislosti | Výstup | Stav |
|----|-------|----------|--------|------------|--------|------|
| P2-001 | Testovací sada pro MiLO adaptér | QA | L | P1-001 | Testy | 📋 Čeká |
| P2-002 | Zaindexovat všechny existující dokumenty | KNOW | M | P0-001 | Index | 📋 Čeká |
| P2-003 | Vytvořit Lessons Learned log | QA | S | — | Log | 📋 Čeká |

---

## Priorita 3 — Zrychluje budoucí práci (BONUS)

| ID | Název | Oddělení | Effort | Závislosti | Výstup | Stav |
|----|-------|----------|--------|------------|--------|------|
| P3-001 | Automatizovat tvorbu ADR šablon | ARCH | S | — | Skript | 📋 Čeká |
| P3-002 | Vytvořit Developer Guide | ENG | M | P1-001 | Dokumentace | 📋 Čeká |
| P3-003 | Integrovat MiLO_ISDS_MCP | COMM | M | P0-004 | Integrace | 📋 Čeká |
| P3-004 | Deployment Guide | OPS | S | P1-004 | Dokumentace | 📋 Čeká |
| P3-005 | Vytvořit Department Logy pro všech 7 oddělení | Všechna | S | — | 7 logů | 📋 Čeká |

---

## Nově navržené (k prioritizaci na příštím Board meetingu)

| ID | Název | Navrhl | Effort | Poznámka |
|----|-------|--------|--------|----------|
| N-001 | Migrace MiLO_Agent pod COMM | COMM | XL | Vyžaduje P0-004, bezvýpadková migrace |
| N-002 | Sjednotit styly a pravidla ze všech projektů | COMM | M | Z agent_os/, voice-ai-terminal |
| N-003 | Konsolidovat Supabase schéma | ARCH | L | Z milo-os, MiLO_Agent, ai-project-manager |
| N-004 | Vytvořit Agent Definition Registry | ENG | M | Po P1-001 |
| N-005 | Vytvořit první Worker Agenty | ENG | M | Po P1-001 — ověření celého flow |

---

## Mise v průběhu

| ID | Název | Vlastník | Deadline | Status |
|----|-------|----------|----------|--------|
| — | (žádné aktivní mise) | — | — | — |

---

*Tento backlog je projednáván na každém Board meetingu.*
*Nové položky navrhuje kterýkoli Department Lead přes IDR → OC.*
*Prioritizace: Chief + Board hlasování.*
