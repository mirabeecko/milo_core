# ADR-0003: Agent State Machine

**Status:** PROPOSED
**Datum:** 2026-07-08
**Autor:** Chief Orchestrator

---

## Kontext

Každý agent v MiLO prochází definovanými stavy (Ústava, kapitola 10 — Životní cyklus agenta). Potřebujeme stavový automat, který:

- definuje validní přechody mezi stavy,
- zamezí nekonzistentním stavům (např. agent v "working" bez úkolu),
- je implementovatelný v TypeScriptu (primární runtime) i Pythonu (MiLO_Agent),
- podporuje pozastavení, obnovení, selhání a zotavení.

## Rozhodnutí

**Používáme explicitní stavový automat s 8 stavy a definovanými přechody.**

### Stavy

| Stav | Význam |
|------|--------|
| `offline` | Agent není inicializován nebo byl zastaven |
| `idle` | Agent je připraven, čeká na úkol |
| `starting` | Agent se inicializuje |
| `working` | Agent vykonává úkol |
| `waiting` | Agent čeká na externí vstup (lidské schválení, API odpověď) |
| `paused` | Agent je pozastaven (lze obnovit) |
| `failed` | Agent selhal při vykonávání úkolu (lze retry) |
| `stopping` | Agent se ukončuje |

### Povolené přechody

```
offline → starting
starting → idle
starting → failed

idle → working (při přijetí úkolu)
idle → paused
idle → stopping

working → idle (úkol dokončen)
working → waiting (čeká na vstup)
working → failed (úkol selhal)
working → paused

waiting → working (vstup přijat)
waiting → failed (timeout)
waiting → paused

paused → idle (obnovení)
paused → stopping

failed → idle (po retry)
failed → stopping

stopping → offline
```

### Implementace

Stavový automat je implementován jako čistá funkce:

```typescript
function transition(state: AgentState, event: AgentEvent): AgentState | Error
```

Každý přechod:
1. Validuje, že zdrojový stav → cílový stav je povolen.
2. Spouští side effects (logging, metrika, persistence) přes injectované handler.
3. Vrací nový stav nebo chybu.

## Zvažované alternativy

| Alternativa | Plusy | Minusy |
|-------------|-------|--------|
| **XState** | Plnohodnotný state machine framework | Další závislost, overkill pro 8 stavů |
| **Jednoduchý enum + switch** ✅ | Žádná závislost, snadno testovatelné | Manuální validace přechodů |
| **Event sourcing** | Kompletní historie stavů | Složitější implementace, vhodné pro audit, ne pro operativní stav |
| **Bez explicitního FSM** | Jednoduché | Nekonzistentní stavy, těžko debugovatelné |

## Důsledky

### Co bude snazší
- Testování agentů — vždy známe aktuální stav
- Debugging — každá změna stavu je logována
- Monitoring — víme, kolik agentů je v jakém stavu

### Co bude těžší
- Race conditions — dva eventy současně mohou způsobit konflikt (řešeno: fronta eventů per agent)
- Přidání nového stavu — vyžaduje aktualizaci přechodové matice

## Datum revize

2027-01-08

## Reference

- CONSTITUTION.md, kapitola 10 — Životní cyklus agenta
- CONCEPTUAL_MODEL.md — BC-1 (Agent Runtime), Část 4 (stavový diagram)
