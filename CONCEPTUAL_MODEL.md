# Konceptuální model MiLO v1.0

**Doménový jazyk, bounded contexts a vztahy entit.**
**Všechny ostatní dokumenty používají terminologii definovanou zde.**

> Tento dokument definuje CO znamenají termíny v ekosystému MiLO.
> Je normativní — při konfliktu terminologie mezi tímto dokumentem a jiným dokumentem (kromě Ústavy) vítězí tento dokument.
> Při konfliktu s Ústavou vítězí Ústava.

---

## ČÁST 1: UBIQUITOUS LANGUAGE

### Základní entity

| Termín | Definice | Anglicky |
|--------|----------|----------|
| **MiLO** | Osobní Agentický Operační Systém. Entita, která propojuje agenty, nástroje, modely, znalosti a kanály. | Personal Agentic Operating System |
| **Vlastník** | Člověk, kterému MiLO slouží. Nejvyšší autorita. Definuje cíle, schvaluje kritické změny. | Owner |
| **Chief** | Vrchní orchestrátor MiLO. Koordinuje oddělení, alokuje zdroje, reprezentuje MiLO vůči Vlastníkovi. | Chief Orchestrator |
| **Agent** | Samostatná entita s definovanou rolí, nástroji, pamětí a zodpovědností. Není chatbot — je digitální zaměstnanec. | Agent |
| **Mise** | Zastřešující jednotka práce. Má cíl, fáze, vlastníka, eskalační pravidla. Není úkol — mise obsahuje úkoly. | Mission |
| **Úkol** | Dílčí krok v rámci mise. Delegovaný na agenta. | Task |
| **Nástroj** | Schopnost, kterou agent používá k interakci s vnějším světem. Může být lokální (shell) nebo vzdálený (MCP server). | Tool |
| **Dovednost** | Zapouzdřená opakovaně použitelná schopnost nezávislá na konkrétním agentovi. | Skill |
| **Znalost** | Informace, kterou MiLO získal a uložil pro budoucí použití. | Knowledge |
| **Paměť** | Úložiště kontextu — krátkodobé (konverzace) nebo dlouhodobé (preference, fakta). | Memory |

### Organizační entity

| Termín | Definice | Anglicky |
|--------|----------|----------|
| **Executive Board** | Rada složená z Chiefa a všech Department Leadů. Strategické rozhodování, řešení konfliktů. | Executive Board |
| **Executive Department** | Trvalá organizační jednotka vlastnící doménu. Má chartu, rozpočet, KPI. | Executive Department |
| **Department Lead** | Executive Agent vedoucí oddělení. Vlastní doménu, řídí specialisty, reportuje Boardu. | Department Lead |
| **Specialist Agent** | Agent s dlouhodobou specializací v rámci oddělení. Vytvářen Department Leadem. | Specialist Agent |
| **Worker Agent** | Dočasný agent vytvořený pro jednu misi. Po dokončení mise zaniká. | Worker Agent |
| **Department Charter** | Dokument definující poslání, odpovědnosti, pravomoci, hranice a KPI oddělení. | Department Charter |

### Procesní entity

| Termín | Definice | Anglicky |
|--------|----------|----------|
| **Decision Record (DR)** | Trvalý záznam o jednom rozhodnutí. Obsahuje kontext, volbu, alternativy, důsledky, datum revize. | Decision Record |
| **Architecture Decision Record (ADR)** | DR specificky pro architektonické rozhodnutí. Spravuje ARCH. | ADR |
| **Inter-Department Request (IDR)** | Formální požadavek mezi odděleními. | IDR |
| **Lessons Learned** | Záznam o tom, co se MiLO naučil z mise nebo incidentu. | Lessons Learned |
| **Mission Record** | Záznam o dokončené misi — cíl, průběh, výsledek, poučení. | Mission Record |
| **RFC** | Request for Comments — návrh změny před schválením. | RFC |

### Komunikační entity

| Termín | Definice | Anglicky |
|--------|----------|----------|
| **Kanál** | Komunikační médium mezi MiLO a vnějším světem (Telegram, email, hlas, SMS). | Channel |
| **Styl** | Definice tónu a formy komunikace (direct, professional, friendly). | Style |
| **Pravidlo** | Bezpečnostní nebo behaviorální omezení komunikace. | Rule |
| **Eskalace** | Předání problému na vyšší úroveň — z Workera na Specialistu, ze Specialisty na Leada, z Leada na Chiefa. | Escalation |
| **Briefing** | Pravidelná souhrnná zpráva pro Vlastníka (denní, týdenní). | Briefing |

### Technické entity

| Termín | Definice | Anglicky |
|--------|----------|----------|
| **MCP Server** | Samostatný proces poskytující nástroje přes Model Context Protocol. | MCP Server |
| **Provider** | Poskytovatel externí služby — LLM, databáze, komunikační kanál. Vždy za rozhraním. | Provider |
| **OrchestrationProvider** | Abstrakce nad orchestračním frameworkem. Umožňuje výměnu frameworku bez změny logiky MiLO. | OrchestrationProvider |
| **Model Router** | Komponenta rozhodující, který LLM použít pro daný krok, podle ceny, kvality a politiky. | Model Router |
| **Vector Store** | Úložiště vektorových embeddingů pro sémantické vyhledávání. | Vector Store |
| **Embedding** | Vektorová reprezentace textu používaná pro vyhledávání podobnosti. | Embedding |

---

## ČÁST 2: BOUNDED CONTEXTS

### Přehled

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Agent      │  │   Mission    │  │ Organization │
│   Runtime    │◄─┤  Management  │──►│              │
└──────┬───────┘  └──────┬───────┘  └──────┬───────┘
       │                 │                 │
       │         ┌───────┴───────┐         │
       │         │   Knowledge   │         │
       │         └───────┬───────┘         │
       │                 │                 │
┌──────┴───────┐  ┌──────┴───────┐  ┌──────┴───────┐
│Communication │  │  Documents   │  │  Automation  │
└──────────────┘  └──────────────┘  └──────────────┘
       │                 │                 │
       └─────────┬───────┴─────────┬───────┘
                 │                 │
          ┌──────┴───────┐  ┌──────┴───────┐
          │  Calendar    │  │  Monitoring  │
          └──────────────┘  └──────────────┘
```

### BC-1: Agent Runtime

**Odpovědnost:** Životní cyklus agentů, stavový automat, binding nástrojů, registr agentů, exekuce úkolů.

**Vlastník:** ARCH + ENG

**Entity:**
- `Agent` — identita, role, stav, specializace, konfigurace
- `AgentDefinition` — neměnná definice agenta (co umí, jaké má nástroje, prompty)
- `AgentState` — aktuální stav (offline, idle, working, waiting, paused, failed)
- `AgentRegistry` — registr všech aktivních agentů
- `ToolBinding` — přiřazení nástroje agentovi s oprávněními
- `ToolContext` — kontext, ve kterém nástroj běží (cesty, credentials)

**Rozhraní:**
- AgentManager — registrace, start, stop, pause, resume agentů
- ExecutionTaskRunner — spuštění úkolu s nástroji
- AgentStateMachine — validní přechody mezi stavy

**Hranice:** Agent Runtime neřeší, CO agent dělá — jen JAK to dělá. Mise dává CO.

---

### BC-2: Mission Management

**Odpovědnost:** Životní cyklus mise — plánování, dekompozice na úkoly, exekuce, monitoring, zhodnocení, poučení.

**Vlastník:** OC + ARCH

**Entity:**
- `Mission` — cíl, fáze, vlastník (agent), úroveň autonomie, eskalační pravidla
- `MissionPlan` — rozložení mise na úkoly s odhady a závislostmi
- `Task` — dílčí krok mise; vlastník (agent), priorita, deadline, stav
- `MissionState` — pending → planning → active → reviewing → completed / failed / cancelled
- `TaskState` — pending → assigned → running → completed / failed / blocked
- `EscalationRule` — podmínka a cíl eskalace
- `AutonomyLevel` — úroveň 0-4 podle Ústavy, kapitola 8

**Rozhraní:**
- MissionService — vytvoření, spuštění, monitoring mise
- MissionPlanner — dekompozice cíle na úkoly
- MissionReviewer — zhodnocení výsledku, Lessons Learned

**Hranice:** Mission Management nevykonává úkoly — deleguje je na Agent Runtime.

---

### BC-3: Organization

**Odpovědnost:** Struktura organizace, oddělení, Board, rozhodovací procesy, reporting.

**Vlastník:** OC

**Entity:**
- `ExecutiveBoard` — Chief + Department Leady
- `Department` — identita, charta, lead, specialisté, rozpočet
- `DepartmentLead` — Executive Agent vedoucí oddělení
- `DepartmentCharter` — poslání, odpovědnosti, pravomoci, KPI
- `SpecialistAgent` — trvalý specializovaný agent v oddělení
- `WorkerAgent` — dočasný agent pro jednu misi
- `DecisionRecord` — záznam rozhodnutí
- `InterDepartmentRequest` — požadavek mezi odděleními
- `Budget` — alokace zdrojů (tokeny, CPU, storage)

**Rozhraní:**
- BoardService — schvalování, hlasování, eskalace
- DepartmentService — správa oddělení, specialistů, rozpočtu
- ReportingService — pravidelné reporty (denní, týdenní, měsíční, kvartální)

**Hranice:** Organization definuje KDO co dělá. Ne JAK.

---

### BC-4: Knowledge

**Odpovědnost:** Ukládání, indexace, vyhledávání a export znalostí. Organizační paměť.

**Vlastník:** KNOW

**Entity:**
- `KnowledgeItem` — jedna jednotka znalosti (dokument, DR, Lessons Learned, konverzace)
- `KnowledgeBase` — kolekce indexovaných znalostí
- `Embedding` — vektorová reprezentace pro sémantické vyhledávání
- `SearchQuery` — dotaz s výsledky a skóre relevance
- `Memory` — krátkodobá (kontext relace) nebo dlouhodobá (fakta, preference)
- `Export` — kompletní export znalostí v otevřeném formátu

**Rozhraní:**
- KnowledgeService — indexace, vyhledávání, klasifikace
- MemoryService — čtení/zápis krátkodobé a dlouhodobé paměti
- ExportService — export všech znalostí do otevřeného formátu

**Hranice:** Knowledge nehodnotí důležitost — jen ukládá a vyhledává.

---

### BC-5: Communication

**Odpovědnost:** Všechny externí komunikační kanály, formátování zpráv, styly, bezpečnostní pravidla.

**Vlastník:** COMM

**Entity:**
- `Channel` — komunikační médium (Telegram, Email, SMS, WhatsApp, Voice, Dashboard)
- `Message` — příchozí nebo odchozí zpráva
- `Style` — definice tónu a formy (direct, professional, friendly, recruitment)
- `Rule` — bezpečnostní omezení (safety, whatsapp, mission_handling, autonomy)
- `Notification` — řízené přerušení Vlastníka
- `VoiceCommand` — hlasový příkaz včetně transkripce

**Rozhraní:**
- ChannelManager — správa aktivních kanálů
- MessageRouter — směrování příchozích zpráv správnému oddělení
- StyleEngine — aplikace stylu na odchozí zprávu
- RuleEngine — validace zprávy proti bezpečnostním pravidlům

**Hranice:** Communication neinterpretuje obsah — jen doručuje.

---

### BC-6: Documents

**Odpovědnost:** Zpracování dokumentů — parsování, extrakce textu, OCR, konverze formátů.

**Vlastník:** KNOW + ENG

**Entity:**
- `Document` — soubor s metadaty (typ, velikost, zdroj)
- `ExtractedText` — čistý text extrahovaný z dokumentu
- `Attachment` — příloha zprávy (ISDS, email)
- `DocumentFormat` — PDF, DOCX, ZFO, Markdown, Plain Text

**Rozhraní:**
- DocumentParser — extrakce textu podle formátu
- OCRService — optické rozpoznávání znaků z obrázků
- DocumentIndexer — indexace extrahovaného textu do Knowledge

**Hranice:** Documents extrahuje text. Knowledge ho indexuje a vyhledává.

---

### BC-7: Automation

**Odpovědnost:** Workflow, plánované úlohy, n8n integrace, opakující se procesy.

**Vlastník:** OPS + ENG

**Entity:**
- `Workflow` — definice automatizovaného procesu
- `ScheduledJob` — plánovaná úloha s frekvencí
- `Trigger` — událost spouštějící workflow
- `AutomationContext` — stav běžící automatizace

**Rozhraní:**
- WorkflowEngine — exekuce workflow
- Scheduler — plánování a spouštění úloh
- n8nAdapter — integrace s n8n

**Hranice:** Automation spouští procesy. Mission Management definuje PROČ.

---

### BC-8: Calendar & Scheduling

**Odpovědnost:** Časové plánování, události, připomínky, detekce konfliktů.

**Vlastník:** OC + COMM

**Entity:**
- `CalendarEvent` — událost s časem, popisem, účastníky
- `Reminder` — připomínka s časem spuštění
- `TimeSlot` — volný nebo obsazený časový blok
- `Schedule` — denní/týdenní plán
- `Conflict` — překryv dvou událostí

**Rozhraní:**
- CalendarService — CRUD událostí, synchronizace s externími kalendáři
- ReminderService — vytváření a spouštění připomínek
- ConflictDetector — detekce a návrh řešení konfliktů

**Hranice:** Calendar spravuje čas. Mission Management ho používá pro plánování.

---

### BC-9: Monitoring & Observability

**Odpovědnost:** Sledování zdraví systému, metrik, nákladů, analytiky.

**Vlastník:** OPS + QA

**Entity:**
- `HealthCheck` — stav jedné komponenty (pass/warn/fail)
- `Metric` — měřitelná hodnota v čase (uptime, chybovost, latence)
- `CostRecord` — záznam o spotřebě tokenů a nákladech
- `AnalyticsSnapshot` — periodický snímek GA4/Ads dat
- `Incident` — zaznamenaný výpadek nebo anomálie
- `Alert` — notifikace při překročení prahu metriky

**Rozhraní:**
- HealthMonitor — kontinuální kontrola zdraví komponent
- MetricsCollector — sběr a agregace metrik
- CostTracker — sledování nákladů na LLM a infrastrukturu
- AlertManager — eskalace při překročení prahů

**Hranice:** Monitoring sleduje. Neopravuje — to je OPS.

---

## ČÁST 3: VZTAHY MEZI KONTEXTY

### Mapa závislostí

```
Organization ──► Mission Management ──► Agent Runtime
     │                    │                     │
     │                    ▼                     ▼
     │              Knowledge ◄────────── Documents
     │                    ▲                     
     ▼                    │                     
Communication ◄───────────┘                     
     │                                          
     ▼                                          
  Calendar                                      
     │                                          
     ▼                                          
  Automation ──────────────────────────────────► Monitoring
```

### Sdílené kernele

**Agent Identity** — sdílí Agent Runtime a Organization. Každý agent má organizační roli (Worker, Specialist, Lead) a runtime stav (idle, working).

**Mission ID** — sdílí Mission Management a Knowledge. Každá mise má záznam v Knowledge.

**Message** — sdílí Communication a Mission Management. Příchozí zpráva může spustit misi.

### Anti-corruption layery

**Organization → Agent Runtime:** Organizační role se nesmí propsat do runtime logiky. Agent Runtime neví, jestli je agent Worker nebo Lead — jen vykonává úkoly.

**Communication → Mission Management:** Formát zprávy (Telegram JSON, SMS text) se normalizuje na jednotný formát před vstupem do Mission Management.

**Documents → Knowledge:** Extrahovaný text prochází normalizací před indexací (odstranění artefaktů OCR, sjednocení kódování).

---

## ČÁST 4: STAVOVÉ DIAGRAMY

### Stavový diagram agenta

```
        ┌─────────┐
        │ offline │
        └────┬────┘
             │ initialize()
             ▼
        ┌─────────┐
   ┌───►│  idle   │◄──────────────────┐
   │    └────┬────┘                   │
   │         │ runTask()              │
   │         ▼                        │
   │    ┌─────────┐     ┌─────────┐   │
   │    │ working │────►│ waiting │   │
   │    └────┬────┘     └────┬────┘   │
   │         │               │        │
   │    ┌────┴────┐          │        │
   │    ▼         ▼          │        │
   │ ┌──────┐ ┌──────┐       │        │
   │ │failed│ │compl.│       │        │
   │ └──┬───┘ └──────┘       │        │
   │    │                    │        │
   │    └────────────────────┘        │
   │                                  │
   │    ┌─────────┐                   │
   └────│ paused  │───────────────────┘
        └─────────┘
             │ stop()
             ▼
        ┌─────────┐
        │stopping │
        └────┬────┘
             │
             ▼
        ┌─────────┐
        │ offline │
        └─────────┘
```

### Stavový diagram mise

```
┌─────────┐     ┌──────────┐     ┌──────────┐     ┌───────────┐
│ pending │────►│ planning │────►│  active  │────►│ reviewing │
└─────────┘     └──────────┘     └─────┬────┘     └─────┬─────┘
                                       │                │
                                  ┌────┴────┐      ┌────┴────┐
                                  ▼         ▼      ▼         ▼
                             ┌────────┐┌──────┐┌────────┐┌────────┐
                             │ blocked││failed││completed││cancelled│
                             └────────┘└──────┘└────────┘└────────┘
```

### Životní cyklus oddělení

```
┌────────┐     ┌───────────┐     ┌────────┐     ┌──────────┐
│ návrh  │────►│ schváleno │────►│ provoz │────►│ revize   │◄──┐
└────────┘     └───────────┘     └───┬────┘     └────┬─────┘   │
                                     │               │         │
                                     │          ┌────┴────┐    │
                                     │          ▼         ▼    │
                                     │     ┌─────────┐┌───────┐│
                                     │     │reorganiz││zrušeno││
                                     │     └─────────┘└───────┘│
                                     │                          │
                                     └──────────────────────────┘
```

---

## ČÁST 5: KONZISTENCE S ÚSTAVOU

| Koncept v modelu | Odpovídá kapitole Ústavy |
|------------------|--------------------------|
| Agent, AgentState, AgentRegistry | 10 — Životní cyklus agenta |
| Mission, MissionState, Task | 9 — Filozofie mise |
| ExecutiveBoard, Department, DepartmentLead | 11 — Architektonické vrstvy |
| AutonomyLevel 0-4 | 8 — Autonomie |
| KnowledgeBase, Memory, Export | 3.9 — Zachování znalostí; 4.5 — Znalosti patří vlastníkovi |
| Style, Rule | 3.1 — Pravda; 3.2 — Transparentnost; 8.2 — Styly |
| Provider, OrchestrationProvider | 4.2 — Každá komponenta je nahraditelná |
| EscalationRule | 6 — Vztah s člověkem; 8 — Autonomie |
| DecisionRecord, ADR | 13 — Evoluce (ADR proces) |
| Metric, CostRecord | 14 — Metriky úspěchu |

---

## ČÁST 6: ROZŠIŘITELNOST

### Přidání nového bounded contextu

1. RFC s návrhem nového kontextu — název, odpovědnost, entity, rozhraní, vztahy k existujícím.
2. KNOW Department review — konzistence terminologie.
3. ARCH Department review — zapadá do architektury?
4. Executive Board schválení.
5. Aktualizace CONCEPTUAL_MODEL.md.

### Přidání nového termínu

1. KNOW Department — návrh termínu s definicí a anglickým ekvivalentem.
2. Revize, zda termín už neexistuje pod jiným názvem.
3. Aktualizace Ubiquitous Language tabulky.
4. Notifikace všem oddělením (terminologie se mění).

---

*Konceptuální model MiLO v1.0 — schváleno Chief Orchestrator.*
*Tento dokument je předpokladem pro ARCHITECTURE.md a všechny ADR.*
*Spravuje: KNOW Department.*
