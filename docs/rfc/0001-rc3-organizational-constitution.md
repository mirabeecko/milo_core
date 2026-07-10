# RC3 Amendment Proposal — Organizační ústava MiLO

**Autor:** Chief Orchestrator
**Datum:** 2026-07-08
**Status:** Návrh k revizi
**Typ:** Rozšíření Ústavy o organizační dimenzi

---

## Souhrn

Ústava MiLO v1.0 je silný dokument definující MiLO jako technický systém. Chybí mu však organizační dimenze — MiLO není jen sada komponent, je to organizace agentů, která musí fungovat i bez Vlastníka a i bez konkrétního Chiefa.

RC3 navrhuje NEUPRAVOVAT existující Ústavu, ale vytvořit samostatný dokument — **Organizační ústavu MiLO** — který Ústavu doplňuje o organizační vrstvu.

---

## Identifikované mezery

### G1 — MiLO jako organizace

**Problém:** Ústava definuje MiLO jako "Osobní Agentický Operační Systém" a "vrstvu, která propojuje agenty". To je technická definice. Chybí definice MiLO jako organizace — entity, která má strukturu, hierarchii, rozhodovací procesy a schopnost sebe-řízení.

**Návrh:** Organizační ústava definuje MiLO jako "samoorganizující se exekutivní organizaci složenou z agentů, která operuje pod vedením Chiefa s dohledem Vlastníka."

**Neovlivňuje:** CONSTITUTION.md. Přidává se jako samostatný dokument.

---

### G2 — Chybějící výkonná struktura

**Problém:** Kapitola 11 (Architektonické vrstvy) definuje vrstvu "Chief", ale nepopisuje, jak Chief organizuje práci. Chybí koncept oddělení (departments), delegace, reportingových linií.

**Návrh:** Organizační ústava zavádí:
- **Executive Board** — stálá rada složená z Chiefa a vedoucích oddělení
- **Executive Departments** — stálá oddělení s jasně definovanými doménami
- **Specialist Agents** — agenti vytváření odděleními pro specifické úkoly
- **Worker Agents** — dočasní agenti pro jednorázové mise

**Neovlivňuje:** Kapitolu 11 (vrstvy zůstávají technické). Organizační ústava přidává organizační mapování na tyto vrstvy.

---

### G3 — Chybějící proces změny Ústavy

**Problém:** Ústava říká "Další revize: v2.0, nejpozději 2031", ale nedefinuje, KDO a JAK může Ústavu změnit. Kdo navrhuje změnu? Kdo schvaluje? Jaký je proces?

**Návrh:** Organizační ústava definuje Amendment Process:
1. RFC (Request for Comment) — návrh změny s odůvodněním
2. Review period (min. 7 dní pro minor, 30 dní pro major změny)
3. Executive Board vote (2/3 většina)
4. Owner ratification (veto right)
5. Version bump a release notes

**Neovlivňuje:** Text Ústavy. Přidává proces kolem ní.

---

### G4 — Chybějící koncept oddělení a jejich autonomie

**Problém:** Ústava mluví o agentech jako jednotlivcích. Ale organizace potřebuje oddělení — skupiny agentů, které společně vlastní doménu, mají rozpočet (výpočetní zdroje, tokeny), sdílejí znalosti a reportují jako celek.

**Návrh:** Organizační ústava definuje:
- Oddělení má vlastní Chartu (poslání, pravomoci, KPI)
- Oddělení vlastní svou znalostní bázi
- Oddělení spravuje své specialisty
- Oddělení má rozpočtovou odpovědnost
- Oddělení eskaluje na Executive Board

**Neovlivňuje:** Kapitolu 10 (životní cyklus agenta zůstává pro jednotlivce). Organizační ústava přidává životní cyklus oddělení.

---

### G5 — Organizační paměť

**Problém:** Ústava definuje Znalosti a Paměť jako technické vrstvy. Ale organizace potřebuje organizační paměť — kdo co rozhodl, proč, s jakým výsledkem. To není technický detail, to je organizační princip.

**Návrh:** Organizační ústava definuje:
- Každé rozhodnutí Executive Boardu produkuje Decision Record
- Každé oddělení udržuje Department Log
- Každá mise produkuje Mission Record
- Všechny záznamy jsou trvalé, dohledatelné a verzované

---

### G6 — Eskalační hierarchie

**Problém:** Ústava definuje autonomii pro jednotlivé akce, ale ne pro organizační eskalaci. Kdy eskaluje agent na vedoucího oddělení? Kdy vedoucí na Chiefa? Kdy Chief na Vlastníka?

**Návrh:** Organizační ústava definuje eskalační žebřík:
1. Worker Agent → Specialist Agent → Department Lead → Chief → Owner
2. Každá úroveň má definované eskalační triggery
3. Každá eskalace musí obsahovat: co se stalo, proč to nedokážu vyřešit, co navrhuji

---

### G7 — Metriky organizace vs metriky systému

**Problém:** Kapitola 14 definuje metriky pro celý MiLO. Ale organizace potřebuje vlastní metriky: výkon oddělení, rychlost rozhodování, kvalitu delegace, organizační zdraví.

**Návrh:** Organizační ústava přidává organizační metriky:
- Department throughput (mise dokončené za období)
- Decision latency (čas od návrhu k rozhodnutí)
- Escalation rate (kolik rozhodnutí muselo jít výš)
- Autonomy index (podíl rozhodnutí na úrovni oddělení)
- Organizational learning rate (nové poznatky za období)

---

### G8 — Chybějící princip "Chief nesmí být systém"

**Problém:** Ústava neobsahuje princip, že Chief je role, nikoli nepostradatelná entita. Pokud Chief selže, organizace musí fungovat dál.

**Návrh:** Přidat do Organizační ústavy jako základní princip:
"Chief je volená role, nikoli nepostradatelná entita. Organizace musí být schopna fungovat bez Chiefa po omezenou dobu. Každé oddělení musí být schopno operovat autonomně v rámci své charty. Chief koordinuje — neřídí každé rozhodnutí."

---

### G9 — Chybějící proces tvorby agentů odděleními

**Problém:** Ústava definuje životní cyklus agenta (kapitola 10), ale neříká, KDO vytváří agenty. V praxi budou oddělení vytvářet specialisty. Jaký je proces?

**Návrh:** Organizační ústava definuje:
- Oddělení může vytvářet Specialist Agents v rámci své charty
- Vytvoření vyžaduje Department Lead approval
- Vytvoření Executive Agenta vyžaduje Executive Board approval
- Každý agent má při vytvoření definovaný TTL (time-to-live) a review date

---

### G10 — Rozpočtová odpovědnost

**Problém:** Ústava definuje preferenci nižších nákladů (5.4), ale neříká, kdo rozhoduje o alokaci zdrojů mezi odděleními.

**Návrh:** Organizační ústava definuje:
- Chief alokuje globální rozpočet na oddělení
- Oddělení alokuje rozpočet na své agenty a mise
- Každé oddělení reportuje spotřebu zdrojů
- Překročení rozpočtu spouští eskalaci

---

## Principy, které patří jinam

Následující koncepty jsou v Ústavě správně, ale jejich detailní rozpracování patří do jiných dokumentů:

| Koncept | V Ústavě (kapitola) | Detail patří do |
|---------|---------------------|-----------------|
| Konkrétní cíle metrik | 14 (princip měřitelnosti) | ARCHITECTURE.md, docs/operations/ |
| Technické vrstvy — implementace | 11 (koncept) | ARCHITECTURE.md |
| ADR formát | 13 (princip) | docs/adr/TEMPLATE.md |
| Fáze mise — implementace | 9 (princip) | ARCHITECTURE.md |
| Tabulka autonomie | 8 (princip) | CONCEPTUAL_MODEL.md (rozšiřitelná) |

---

## Doporučení

1. **NEMĚNIT CONSTITUTION.md.** Je stabilní. RC3 není revize Ústavy — je to vytvoření nového dokumentu.

2. **Vytvořit ORGANIZATION_CONSTITUTION.md** jako samostatný dokument na stejné úrovni jako CONSTITUTION.md. Oba dokumenty jsou na úrovni 0.

3. **Vztah dokumentů:**
   - CONSTITUTION.md = CO je MiLO a PROČ existuje (systémová ústava)
   - ORGANIZATION_CONSTITUTION.md = JAK je MiLO organizován a řízen (organizační ústava)
   - Při konfliktu: CONSTITUTION.md vítězí, protože definuje hodnoty, kterým musí organizace sloužit

4. **Budoucí RC4 (v2.0, 2031):** Až bude organizace fungovat několik let, zvážit sloučení obou dokumentů nebo ponechání jako samostatných.
