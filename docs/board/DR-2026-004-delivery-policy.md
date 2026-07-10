# DR-2026-004: Executive Delivery Policy — Denní inkrementy

**Status:** schváleno
**Datum:** 2026-07-08

---

## Policy

Každá mise musí být rozložena na inkrementy dokončitelné, demonstrovatelné a reviewovatelné do jednoho dne.

Dlouhé mise zůstávají povolené, ale musí být rozděleny na nezávisle použitelné milníky.

Každý milník:
- dodává fungující schopnost,
- je demonstrovatelný,
- je testovatelný,
- poskytuje okamžitou hodnotu Vlastníkovi, kdykoli je to možné.

---

## Aplikace na aktivní mise

### M-KNOW-002: Indexace dokumentace

| Milník | Den | Výstup | Demonstrovatelné |
|--------|-----|--------|-----------------|
| M1 | 1 | Document Catalog — seznam všech dokumentů s metadaty | `GET /executive/artifacts` → catalog.json |
| M2 | 2 | Fulltextový index (Whoosh) | `GET /knowledge/search?q=...` → výsledky |
| M3 | 3 | Vyhledávací API endpoint | `curl /knowledge/search?q=agent` → citace |
| M4 | 4 | Authority Graph — který dokument je nadřazený kterému | Vizualizace vztahů |
| M5 | 5 | QA review + předání | QA report |

### M-KNOW-003: Knowledge Search Endpoint

| Milník | Den | Výstup |
|--------|-----|--------|
| M1 | 6 | `GET /knowledge/search?q=...` — základní vyhledávání |
| M2 | 7 | Rankování podle relevance + citace |
| M3 | 8 | QA review |

### M-OC-001: Executive Brief → Telegram

| Milník | Den | Výstup | Demonstrovatelné |
|--------|-----|--------|-----------------|
| M1 | 1 | Brief pipeline generuje plain-text verzi | `GET /executive/brief?format=text` |
| M2 | 2 | Telegram sender — odešle zprávu na testovací chat | Vlastník dostane testovací zprávu |
| M3 | 3 | Scheduled delivery — brief se posílá automaticky v 7:00 | Ráno přijde briefing |
| M4 | 4 | Error handling + retry | Briefing přijde i při výpadku API |
| M5 | 5 | QA review | QA report |

### M-COMM-002: Audit Telegram botů

| Milník | Den | Výstup |
|--------|-----|--------|
| M1 | 1 | Inventory — seznam všech botů (tokeny, projekty, status) |
| M2 | 2 | Funkční mapa — co každý bot umí |
| M3 | 3 | Duplication report — které funkce se překrývají |
| M4 | 4 | Migration plan — kroky, rizika, rollback |
| M5 | 5 | QA review |

### M-COMM-003: Unified Inbox

| Milník | Den | Výstup |
|--------|-----|--------|
| M1 | 8 | Jeden bot přijímá zprávy ze všech existujících botů |
| M2 | 9 | Routing — zpráva jde správnému oddělení |
| M3 | 10 | Summary — bot shrne nepřečtené zprávy |
| M4 | 11 | Owner notification — bot aktivně upozorní na důležité |
| M5 | 12 | QA review |

---

## Denní Board Check-in

Každý večer v 18:00 poběží automatický check-in:

```
DNEŠNÍ DODÁVKY:
KNOW: ✅ M1 hotovo — Document Catalog (42 dokumentů)
COMM: ✅ M1 hotovo — Inventory (3 boti nalezeni)
OC:   🔨 M1 v běhu — Text brief pipeline

VLASTNÍKOVA OTÁZKA:
"Co nového MiLO dnes umí, co včera neuměl?"

ODPOVĚĎ:
MiLO dnes umí vypsat všech 42 dokumentů v katalogu.
MiLO dnes ví o 3 běžících Telegram botech.
```

---

## Pravidla

1. **Žádný milník nesmí trvat déle než 1 den.** Pokud trvá déle, je špatně rozložen.
2. **Každý milník končí demonstrací.** Nestačí "kód je napsaný" — musí být vidět výsledek.
3. **QA reviewuje každý milník.** Ne až na konci mise.
4. **Vlastník dostává denní update.** Co přibylo, co se změnilo, co blokuje.

---

*Schváleno 7/0/0. Účinné okamžitě.*
