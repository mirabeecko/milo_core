# DR-2026-002: Druhé Executive Board Meeting

**Status:** schváleno
**Datum:** 2026-07-08
**Předkladatel:** Chief Orchestrator
**Hlasování:** Jednomyslné (7/0/0)

---

## Účastníci

| Agent | Oddělení | Status |
|-------|----------|--------|
| Chief Orchestrator | OC | active |
| Chief Architect | ARCH | active |
| Chief Engineer | ENG | ready |
| Chief Knowledge Officer | KNOW | active |
| Chief Communications Officer | COMM | active |
| Chief Operations Officer | OPS | ready |
| Chief Quality Officer | QA | ready |

---

## Bod 1: Review současného stavu

**Chief:** Od prvního meetingu (DR-2026-001) máme Executive Runtime, 12 API endpointů, Executive Brief. 99 změněných souborů v gitu, 21 commitů za 7 dní. Organizace existuje na papíře, ale nedodává hodnotu Vlastníkovi.

**ARCH:** ARCHITECTURE.md je ve stavu před přepsáním — 350 řádků původní specifikace. Potřebuju vědět, jestli mám pokračovat v původní linii nebo použít novou architekturu z ADR-0001 až 0005.

**Chief:** Původní ARCHITECTURE.md se zachovává. ADR-0001 až 0005 jsou PROPOSED — použij je jako vstup. Nepřepisuj, doplň.

**ENG:** Můžu začít jen s tím, co ARCH dodá. Bez kontraktů nemám proti čemu implementovat.

**KNOW:** CONCEPTUAL_MODEL.md je hotový. Můžu začít indexovat okamžitě — žádné závislosti.

**COMM:** Telegram boti — MiLO_Agent běží v produkci, executive-ai taky, voice-ai-terminal taky. Tři boti, tři kódové báze. Potřebuju je zinventarizovat, ne migrovat.

**OPS:** Připraven, ale bez ENG nemám co nasazovat.

**QA:** Stejně — čekám na ENG.

---

## Bod 2: Výběr capabilities pro první vlnu

**Chief:** Navrhuji tři paralelní mise. Kritériem je: dodají hodnotu Vlastníkovi bez závislosti na ostatních odděleních.

**KNOW → M-KNOW-002: Indexovat dokumentaci.** Vlastník se může ptát "co MiLO umí?" a dostat odpověď z reálných dokumentů. Nulové závislosti.

**COMM → M-COMM-002: Audit komunikačních kanálů.** Vlastník získá přehled, co běží, co se duplikuje, co lze sjednotit. Částečná závislost: MiLO_Agent API.

**ARCH → M-ARCH-002: Minimum architektury pro první capability.** Odblokuje ENG. Závisí na KNOW (konzistenční review CONCEPTUAL_MODEL.md).

**Hlasování:** 7/0/0 — všichni pro.

---

## Bod 3: Přiřazení misí

### M-KNOW-002: Katalogizace a indexace dokumentace

| Pole | Hodnota |
|------|---------|
| **Vlastník** | Chief Knowledge Officer (KNOW) |
| **Cíl** | Zaindexovat všechny dokumenty v MiLO_Core tak, aby byly fulltextově prohledatelné |
| **Vstupy** | CONSTITUTION.md, ORGANIZATION_CONSTITUTION.md, CONCEPTUAL_MODEL.md, ARCHITECTURE.md, všechny ADR, docs/board/*.md |
| **Výstupy** | Vyhledávací index, Document Catalog (seznam všech dokumentů s metadaty), Authority Graph |
| **Akceptační kritéria** | Vlastník položí dotaz → KNOW vrátí relevantní dokumenty s citacemi |
| **Termín** | 5 dní |
| **Autonomie** | 3 (provést po schválení) |
| **QA review** | Chief Quality Officer ověří: pokrytí dokumentů ≥ 90 %, doba vyhledání ≤ 5s |
| **Závislosti** | Žádné |
| **Specialisté** | KNOW může vytvořit Knowledge Curator a Search Specialist |

### M-COMM-002: Audit komunikačních kanálů

| Pole | Hodnota |
|------|---------|
| **Vlastník** | Chief Communications Officer (COMM) |
| **Cíl** | Zinventarizovat všechny existující Telegram boty, identifikovat duplicity, připravit plán sjednocení |
| **Vstupy** | MiLO_Agent (běžící), executive-ai (běžící), voice-ai-terminal (běžící), n8n workflows |
| **Výstupy** | Inventory report, Duplication Map, Migration Plan, Risk Assessment |
| **Akceptační kritéria** | Každý bot zdokumentován (token, project, status, funkce). Plán migrace má rollback. |
| **Termín** | 7 dní |
| **Autonomie** | 2 (připravit — audit je read-only) |
| **QA review** | Chief Quality Officer ověří: 100 % botů zinventarizováno, rollback plán testovatelný |
| **Závislosti** | MiLO_Agent API (běží na localhost) |
| **Specialisté** | COMM může vytvořit Channel Manager |

### M-ARCH-002: Minimum architektury pro první capability

| Pole | Hodnota |
|------|---------|
| **Vlastník** | Chief Architect (ARCH) |
| **Cíl** | Doplnit ARCHITECTURE.md o kontrakty potřebné pro první ENG implementaci |
| **Vstupy** | CONCEPTUAL_MODEL.md (po KNOW review), ADR-0001 až 0005 (PROPOSED), ADR-0011 (framework reuse) |
| **Výstupy** | OrchestrationProvider contract, MissionLifecycle contract, AgentRegistry contract, ApprovalGate contract, AuditEvent contract |
| **Akceptační kritéria** | Každý kontrakt je TypeScript interface. ENG může začít implementovat bez dalších dotazů. |
| **Termín** | 10 dní |
| **Autonomie** | 2 (připravit — ENG neschvaluje) |
| **QA review** | Chief Quality Officer ověří: kontrakty jsou testovatelné, provider-agnostic |
| **Závislosti** | KNOW: konzistenční review CONCEPTUAL_MODEL.md (M-KNOW-002) |
| **Specialisté** | ARCH může vytvořit Standards Architect |

---

## Bod 4: Graf závislostí

```
M-KNOW-002 (indexace)     M-COMM-002 (audit botů)
       │                        │
       ▼                        │
M-ARCH-002 (architektura)       │
       │                        │
       ▼                        ▼
M-ENG-001 (POC implementace)   M-COMM-003 (migrace)
       │
       ▼
M-OPS-001 (nasazení)
       │
       ▼
M-QA-001 (validace)
```

**Paralelní:** M-KNOW-002 a M-COMM-002 běží současně.

---

## Bod 5: Plán paralelní exekuce

| Den | KNOW | COMM | ARCH | ENG | OPS | QA |
|-----|------|------|------|-----|-----|-----|
| 1-3 | Indexace dokumentů | Inventory botů | Čeká na KNOW | — | — | Připravuje kritéria |
| 4-5 | Dokončení, předání ARCH | Dokončení inventory | Začíná kontrakty | — | — | Review KNOW výstupu |
| 6-7 | — | Duplication map | Kontrakty | — | — | Review COMM výstupu |
| 8-10 | — | Migration plan | Dokončení, předání ENG | — | — | Review ARCH výstupu |
| 11+ | — | — | — | POC implementace | Příprava infrastruktury | Testy |

---

## Bod 6: Rizika

| Riziko | Pravděpodobnost | Dopad | Mitigace |
|--------|----------------|-------|----------|
| KNOW nestihne review do 5 dní | Střední | Blokuje ARCH | KNOW může vytvořit Specialistu |
| COMM narazí na auth u MiLO_Agent | Nízká | Zpoždění auditu | MiLO_Agent API je read-only |
| ARCH kontrakty nejsou dostatečné pro ENG | Střední | ENG se zasekne | QA review před předáním ENG |
| 99 unstaged změn způsobí konflikt | Vysoká | Ztráta práce | Commit před začátkem misí |

---

## Bod 7: Doporučené akce Vlastníka

1. **Commit a push** — 99 změněných souborů, 21 commitů. Riziko konfliktu je reálné.
2. **Schválit aktivaci misí** — M-KNOW-002, M-COMM-002, M-ARCH-002 jsou připraveny ke spuštění.
3. **Nastavit Google credentials** — pro Calendar a Gmail integraci v Executive Briefu.

---

## Bod 8: Rozhodnutí

1. ✅ **Aktivovat 3 mise:** KNOW (indexace), COMM (audit), ARCH (kontrakty).
2. ✅ **M-KNOW-002 a M-COMM-002 startují okamžitě** — nulové závislosti.
3. ✅ **M-ARCH-002 startuje po KNOW review** — závisí na konzistenčním reportu.
4. ✅ **ENG, OPS, QA zůstávají v ready** — čekají na ARCH výstup.
5. ✅ **Chief nemicromanaguje implementaci** — Department Leadi rozhodují o Specialistech a Workerech.
6. ✅ **Příští Board meeting za 7 dní** — review progresu.

---

*Zapsal: Chief Orchestrator. Schváleno 7/0/0.*
