# MiLO Agent Architecture v4

> **Datum:** 23. července 2026
> **Autor:** MiLO Core Team
> **Princip:** Specializace, efektivita, minimální overhead
>
> 21 agentů → **6 agentů** ve **3 departments**

---

## 🏗️ Architektura

```
┌─────────────────────────────────────────────────────────┐
│                     M i L O   C o r e                     │
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ 🧭 OPERATIONS │  │ ⚙️ ENGINEERING│  │ 🔬 INTELLIGENCE│  │
│  │              │  │              │  │              │  │
│  │ Chief of     │  │ Developer    │  │ Analyst      │  │
│  │ Staff        │  │              │  │              │  │
│  │              │  │ Infrastructure│  │              │  │
│  │ SPY_G        │  │              │  │              │  │
│  │              │  │              │  │              │  │
│  │ Communicator │  │              │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐   │
│  │            Shared Knowledge Base                  │   │
│  │  Memory │ Supabase │ Files │ Gmail │ Calendar     │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 👥 Agenti

### 1. 🎯 Chief of Staff — Koordinátor

| Atribut | Hodnota |
|---------|---------|
| **Department** | 🧭 OPERATIONS |
| **Role** | coordinator |
| **Priority** | critical |
| **Tools** | gmail, calendar, delegate_task, file, memory, kanban, cronjob |
| **Knowledge** | user-preferences, projects, agents, daily-routine |
| **Progress** | 75% (plně funkční v Hermes, chybí auto-delegace) |

#### Use Cases
1. **Ranní briefing** — každé ráno 7:30: přehled dne (kalendář, emaily, priority)
2. **Delegace úkolů** — příjme misi → dekomponuje → rozdělí agentům → sbírá výsledky → reportuje
3. **Prioritizace** — na vyžádání seřadí projekty/úkoly podle důležitosti a deadlinů
4. **Status check** — "Jak jsme na tom s projektem X?" → zeptá se relevantního agenta → shrne

#### Spolupráce
- **→ Developer**: deleguje technické úkoly (build fix, code review, deploy)
- **→ Infrastructure**: deleguje monitoring, health checky, deployment
- **→ Analyst**: deleguje rešerše, analýzu dokumentů, vyhledávání
- **→ SPY_G**: předává nové nápady k evidenci
- **→ Communicator**: předává komunikaci ke zpracování

#### Knowledge & Memory
- Čte `MEMORY.md` pro user preferences
- Zapisuje rozhodnutí do `DECISION_LOG.md`
- Používá `delegate_task` pro distribuci práce
- Udržuje `session_search` pro kontext

---

### 2. 🕵️ SPY_G — Evidenční agent

| Atribut | Hodnota |
|---------|---------|
| **Department** | 🧭 OPERATIONS |
| **Role** | observer |
| **Priority** | high |
| **Tools** | file, memory, cronjob, web |
| **Progress** | 80% (watchlist, cron, gamechanger detekce; chybí auto-kategorizace) |

#### Use Cases
1. **Zachycení nápadu** — "pro špiona: ..." → uloží do watchlistu s tagy a prioritou
2. **Kontextové připomínání** — každé 2h kontroluje watchlist, hledá souvislosti s aktuálními tasky
3. **Gamechanger detekce** — identifikuje nápady s vysokým potenciálem (červené označení)
4. **Weekly report** — pondělí 9:00: shrnutí všech otevřených/zapomenutých nápadů
5. **Propojení s projekty** — navrhuje převod nápadů na projekty

#### Spolupráce
- **← Chief of Staff**: přijímá nápady k evidenci
- **→ Analyst**: předává náměty k hlubší rešerši
- **→ Communicator**: posílá připomínky přes Telegram/WhatsApp

---

### 3. 📬 Communicator — Komunikační manažer

| Atribut | Hodnota |
|---------|---------|
| **Department** | 🧭 OPERATIONS |
| **Role** | communication |
| **Priority** | high |
| **Tools** | gmail, calendar, file, memory, send_message |
| **Knowledge** | contacts, email-templates, calendar-rules |
| **Progress** | 70% (spojení Secretary + Calendar + Notifier + Knowledge) |

#### Use Cases
1. **Email triage** — třídění inboxu, AI shrnutí, návrhy odpovědí
2. **Kalendář** — správa událostí, detekce kolizí, focus time, připomenutí
3. **Notifikace** — rozesílání přes Telegram/WhatsApp podle priority
4. **Kontakty** — správa kontaktů, relationship intelligence
5. **Příprava na schůzky** — agenda, podklady, připomenutí

#### Spolupráce
- **← Chief of Staff**: dostává instrukce ke komunikaci
- **→ SPY_G**: notifikuje o nových nápadech
- **↔ Uživatel**: přímá interakce přes Telegram/WhatsApp

---

### 4. 💻 Developer — Senior Engineer

| Atribut | Hodnota |
|---------|---------|
| **Department** | ⚙️ ENGINEERING |
| **Role** | developer |
| **Priority** | high |
| **Tools** | file, terminal, patch, github, search_files, read_file |
| **Progress** | 75% (analýza kódu, opravy, CI/CD, chybí auto-PR review) |

#### Use Cases
1. **Analýza buildu** — "Proč spadl build?" → přečte CI logy → identifikuje chybu → navrhne fix
2. **Code review** — "Zreviewuj PR #42" → projde diff → napíše review
3. **Implementace featury** — dostane specifikaci → napíše kód → otestuje → pushne
4. **Refaktoring** — "Refaktoruj auth middleware" → analyzuje → přepíše → ověří

#### Spolupráce
- **← Chief of Staff**: přijímá technické úkoly
- **↔ Infrastructure**: předává k deployi, dostává monitoring feedback
- **→ Analyst**: žádá rešerši technologií

---

### 5. 🖥️ Infrastructure — DevOps & Monitoring

| Atribut | Hodnota |
|---------|---------|
| **Department** | ⚙️ ENGINEERING |
| **Role** | infrastructure |
| **Priority** | high |
| **Tools** | file, terminal, web, cronjob, process |
| **Progress** | 65% (spojení Tester BOSS + Phone Tracker + monitoring) |

#### Use Cases
1. **Deployment** — "Nasadi to na Vercel" → spustí build → ověří → reportuje URL
2. **Health monitoring** — každých 5min kontroluje API, web, Redis, tunel; alertuje při výpadku
3. **Auto-healing** — restart spadlých služeb, obnova tunelu
4. **Testování** — spouští testovací sadu, reportuje výsledky
5. **Resource monitoring** — CPU, RAM, disk; varování při překročení limitu

#### Spolupráce
- **← Developer**: přijímá build k nasazení
- **→ Chief of Staff**: reportuje stav infrastruktury
- **→ Communicator**: posílá alerty

---

### 6. 🔬 Analyst — Research & Data

| Atribut | Hodnota |
|---------|---------|
| **Department** | 🔬 INTELLIGENCE |
| **Role** | analyst |
| **Priority** | normal |
| **Tools** | web, file, read_file, browser, search_files, memory |
| **Progress** | 70% (spojení Research + Knowledge + Document agent) |

#### Use Cases
1. **Rešerše** — "Zjisti jak funguje X" → prohledá web, dokumenty → shrne
2. **Analýza dokumentů** — "Co je v té smlouvě?" → přečte PDF → extrahuje klíčové body
3. **Market research** — "Jaká je konkurence pro Y?" → analyzuje → reportuje
4. **Data extraction** — "Vytáhni kontakty z emailů" → projde → strukturovaný výstup
5. **Knowledge base** — indexuje dokumenty, udržuje vyhledávací index

#### Spolupráce
- **← Chief of Staff**: přijímá výzkumné úkoly
- **← SPY_G**: dostává náměty k hlubší analýze
- **→ Developer**: poskytuje technické rešerše
- **→ Communicator**: předává strukturovaná data pro komunikaci

---

## 🏢 Departments

**ANO — používáme departments.** Důvody:
1. Jasná zodpovědnost — každý úkol má vlastníka
2. Snadná rozšiřitelnost — nový agent → existující department
3. Delegace na úrovni departmentu — Chief of Staff může delegovat celému departmentu

### Struktura

| Department | Agent 1 | Agent 2 | Agent 3 |
|---|---|---|---|
| 🧭 OPERATIONS | Chief of Staff | SPY_G | Communicator |
| ⚙️ ENGINEERING | Developer | Infrastructure | — |
| 🔬 INTELLIGENCE | Analyst | — | — |

---

## 🔄 Pracovní postupy (Workflows)

### Ranní rutina
```
07:30 Chief of Staff → briefing
  ├─ Communicator → stav inboxu, kalendáře
  ├─ SPY_G → nové nápady, gamechangery
  ├─ Infrastructure → health report
  └─ → Souhrnný briefing uživateli
```

### Nový nápad
```
Uživatel → "pro špiona: ..."
  └─ SPY_G → uloží do watchlistu
       ├─ gamechanger? → červené označení
       └─ >7 dní otevřeno? → připomínka
```

### Technický úkol
```
Uživatel → "Oprav build"
  └─ Chief of Staff → dekomponuje
       ├─ Developer → analyzuje chybu, opraví kód
       ├─ Infrastructure → spustí build, nasadí
       └─ → Report: "✅ Build opraven a nasazen"
```

### Rešerše
```
Uživatel → "Zjisti informace o X"
  └─ Chief of Staff → deleguje
       └─ Analyst → prohledá web, dokumenty, DB
            └─ → Strukturovaný report
```

---

## 📊 Porovnání: staré vs nové

| Metrika | Staré (21 agentů) | Nové (6 agentů) |
|---|---|---|
| Definice | 21 v seed.ts | 6 v seed.ts |
| Skills | 7 vytvořených | 6 vytvořených |
| Tools celkem | 100+ (duplicitní) | 40 (deduplikované) |
| Departments | neorganizované | 3 jasné |
| Pokrytí use cases | 60% | 95% |
| Reálně spustitelné | 7 z 21 | 6 z 6 |
| Průměrný progress | 35% | 73% |

---

## 🚀 Implementační plán

1. ✅ Vytvořit skills pro 6 agentů
2. ⬜ Aktualizovat `seed.ts` — 6 agentů s plnými definicemi (≥73% progress)
3. ⬜ Smazat 15 nepoužitých definic ze seed.ts
4. ⬜ Vytvořit department strukturu v seed.ts
5. ⬜ Ověřit orchestrální tok: Chief → delegace → agent → report
