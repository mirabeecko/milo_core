# DR-2026-003: Policy Change — Owner Capabilities First

**Status:** schváleno
**Datum:** 2026-07-08
**Předkladatel:** Chief Orchestrator
**Hlasování:** 7/0/0

---

## Policy Change

Od tohoto bodu musí každá navržená mise odpovědět na dvě otázky:

1. **Který konkrétní problém Vlastníka řeší?**
2. **Bude Vlastník tuto schopnost reálně používat alespoň jednou týdně?**

Pokud je odpověď na kteroukoli otázku "Ne", mise dostává nižší prioritu — pokud neodstraňuje kritický technický blokátor.

---

## Re-evaluace současného backlogu

| Mise | Priorita před | Odpověď Q1 | Odpověď Q2 | Nová priorita | Verdikt |
|------|-------------|-----------|-----------|--------------|---------|
| M-KNOW-002 (indexace) | P0 | ✅ Najde dokumenty za sekundy | ✅ Denně | **P0** | Pokračovat |
| M-COMM-002 (audit botů) | P0 | ⚠️ Audit sám o sobě nic neřeší | ❌ Jednorázový audit | **P2** | Dokončit, ale ne blokuje |
| M-ARCH-002 (kontrakty) | P0 | ❌ Čistá infrastruktura | ❌ Vlastník nikdy nepoužije | **P3** | Pozastavit — není kritický blokátor |

**Zdůvodnění:** ARCH kontrakty odblokují ENG, ale ENG implementace OrchestrationProvideru je taky infrastruktura. Dokud neexistuje capability, která vyžaduje vlastní orchestrátor, ARCH+ENG může počkat. KNOW indexace naopak přímo dodává hodnotu — Vlastník může okamžitě vyhledávat.

---

## Top 3 Owner Capabilities

### 1. KNOWLEDGE SEARCH (Knowledge Search)

**Konkrétní problém:** Vlastník tráví čas hledáním v dokumentech, které MiLO už má.

**Frekvence:** Denně. "Co umí MiLO?", "Kde je popsaný agent lifecycle?", "Jak funguje schvalování?"

**Současný stav:** M-KNOW-002 (indexace) už běží. Po dokončení: KNOW přidá vyhledávací endpoint.

**Výstup pro Vlastníka:** `GET /executive/search?q=...` → relevantní dokumenty s citacemi.

**Časová osa:** 5 dní (M-KNOW-002) + 3 dny (search endpoint) = **8 dní**.

---

### 2. EXECUTIVE ASSISTANT

**Konkrétní problém:** Vlastník každé ráno manuálně kontroluje stav projektů, git, úkoly — místo aby dostal souhrn.

**Frekvence:** Denně (ranní briefing).

**Současný stav:** Executive Brief pipeline existuje (`GET /executive/brief`). Už funguje — generuje strukturovaný briefing z reálných dat.

**Co chybí:** Integrace s komunikačním kanálem (Telegram). Briefing se generuje, ale Vlastník ho musí aktivně načíst přes API.

**Výstup pro Vlastníka:** Každé ráno v 7:00 přijde Telegram zpráva: "Dobré ráno. Stav MiLO: 3 agenti aktivní, 0 blokátorů, 21 commitů za týden. Doporučení: commitnout 99 změn."

**Časová osa:** 3 dny (propojení Brief pipeline → Telegram).

---

### 3. COMMUNICATION ASSISTANT

**Konkrétní problém:** Vlastník má 3+ Telegram boty, emaily, datovou schránku. Neví, co je důležité, dokud to sám nezkontroluje.

**Frekvence:** Denně (triage příchozích zpráv).

**Současný stav:** M-COMM-002 (audit botů) je přiřazen. Po dokončení: COMM ví, co kde běží.

**Co chybí:** Jednotný inbox. Vlastník napíše jednomu botovi a vidí všechno.

**Výstup pro Vlastníka:** "Máš 2 nepřečtené důležité zprávy z datové schránky, 1 email od klienta. Chceš shrnutí?"

**Časová osa:** M-COMM-002 (7 dní) + 5 dní (unified inbox) = **12 dní**.

---

## Nové přiřazení misí

### M-KNOW-003: Knowledge Search Endpoint

| Pole | Hodnota |
|------|---------|
| **Vlastník** | Chief Knowledge Officer (KNOW) |
| **Cíl** | Postavit vyhledávací endpoint, který vrací relevantní dokumenty s citacemi |
| **Závislosti** | M-KNOW-002 (indexace — již v běhu) |
| **Termín** | Po M-KNOW-002 + 3 dny |
| **Priorita** | P0 — Vlastník používá denně |
| **Q1** | ✅ Hledání v dokumentech |
| **Q2** | ✅ Denně |

### M-OC-001: Executive Brief → Telegram

| Pole | Hodnota |
|------|---------|
| **Vlastník** | Chief Orchestrator (OC) + COMM |
| **Cíl** | Propojit Executive Brief pipeline s Telegramem — ranní briefing doručený Vlastníkovi |
| **Závislosti** | COMM audit (znát aktivní boty) |
| **Termín** | 5 dní |
| **Priorita** | P0 — Vlastník používá denně |
| **Q1** | ✅ Ranní souhrn bez manuální kontroly |
| **Q2** | ✅ Denně |

### M-COMM-003: Unified Inbox (po auditu)

| Pole | Hodnota |
|------|---------|
| **Vlastník** | Chief Communications Officer (COMM) |
| **Cíl** | Jeden Telegram bot, který agreguje zprávy ze všech kanálů |
| **Závislosti** | M-COMM-002 (audit) |
| **Termín** | Po M-COMM-002 + 5 dní |
| **Priorita** | P1 — Vlastník používá týdně |
| **Q1** | ✅ Jeden vstupní bod pro všechny zprávy |
| **Q2** | ✅ Několikrát týdně |

---

## Dopad na oddělení

| Oddělení | Původní mise | Nový stav |
|----------|-------------|-----------|
| **KNOW** | M-KNOW-002 (běží) | ✅ Pokračovat → M-KNOW-003 po dokončení |
| **COMM** | M-COMM-002 (běží) | ✅ Dokončit audit, pak M-COMM-003 |
| **OC** | — | 🆕 M-OC-001: Brief → Telegram |
| **ARCH** | M-ARCH-002 (přiřazeno) | ⏸️ Pozastaveno — není kritický blokátor |
| **ENG** | — | ⏸️ Čeká — žádná capability nevyžaduje vlastní orchestrátor |
| **OPS** | — | ⏸️ Čeká |
| **QA** | — | ✅ Review KNOW a COMM výstupů |

---

## Časová osa

```
Den 0-5:   M-KNOW-002 (indexace) + M-COMM-002 (audit)
Den 3-5:   M-OC-001 (Brief → Telegram) — paralelně
Den 5-8:   M-KNOW-003 (search endpoint)
Den 7-12:  M-COMM-003 (unified inbox)
Den 8+:    Vlastník používá Knowledge Search + Executive Brief denně
```

---

## Rozhodnutí

1. ✅ **Policy schválena.** Všechny budoucí mise musí projít Q1+Q2 testem.
2. ✅ **M-ARCH-002 pozastaveno.** ARCH se přesouvá na podporu KNOW (review konceptuálního modelu).
3. ✅ **M-KNOW-003, M-OC-001, M-COMM-003 schváleny jako P0/P1.**
4. ✅ **ENG a OPS zůstávají v ready.** Aktivují se, až capability vyžaduje vlastní orchestrátor.

---

*Zapsal: Chief Orchestrator. Schváleno 7/0/0.*
