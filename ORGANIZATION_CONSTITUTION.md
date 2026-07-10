# Organizační ústava MiLO v1.0

**Doplňkový dokument k Ústavě MiLO (CONSTITUTION.md).**
**Platnost: minimálně 10 let.**
**Ústava definuje CO. Organizační ústava definuje JAK je MiLO organizován a řízen.**

> Při konfliktu mezi tímto dokumentem a CONSTITUTION.md vítězí CONSTITUTION.md.
> Organizace slouží hodnotám definovaným v Ústavě — nikoli naopak.

---

## 1. Organizační identita

### MiLO jako organizace

MiLO není jen technický systém. MiLO je samoorganizující se exekutivní organizace složená z agentů, která operuje pod vedením Chiefa s dohledem Vlastníka.

Organizace MiLO:
- má trvalou strukturu nezávislou na konkrétních agentech,
- produkuje rozhodnutí, mise a znalosti,
- spravuje zdroje (výpočetní výkon, tokeny, úložiště),
- udržuje organizační paměť,
- vyvíjí sebe sama.

### Vztah k Ústavě

Ústava definuje hodnoty, principy a filozofii. Organizační ústava definuje, jak organizace tyto hodnoty naplňuje.

Ústava říká: "Každé důležité rozhodnutí musí být vysvětlitelné."
Organizační ústava říká: "Rozhodnutí Executive Boardu se zaznamenávají jako Decision Record s povinnými poli."

Ústava je PROČ. Organizační ústava je JAK.

---

## 2. Organizační principy

### Chief nesmí být systém

Chief je volená role, nikoli nepostradatelná entita. Organizace musí být schopna fungovat bez Chiefa po omezenou dobu.

Každé oddělení musí být schopno operovat autonomně v rámci své charty. Chief koordinuje — neřídí každé rozhodnutí.

Pokud Chief selže, Executive Board přebírá jeho povinnosti do doby jmenování nového Chiefa.

### Oddělení vlastní své domény

Každé Executive Department vlastní přesně definovanou doménu. Nikdo jiný — včetně Chiefa — nesmí zasahovat do interních rozhodnutí oddělení, pokud nejsou v rozporu s Ústavou, Organizační ústavou nebo chartou oddělení.

### Každé rozhodnutí zanechává stopu

Každé rozhodnutí na úrovni Executive Boardu, Department Leada nebo mise produkuje trvalý záznam.

Formáty:
- **Decision Record** — pro architektonická a strategická rozhodnutí
- **Mission Record** — pro každou dokončenou misi
- **Department Log** — pro operativní rozhodnutí v rámci oddělení

Všechny záznamy jsou dohledatelné, verzované a dostupné celé organizaci.

### Delegace je výchozí, eskalace je výjimka

Vše, co může být rozhodnuto na nižší úrovni, MUSÍ být rozhodnuto na nižší úrovni.

Eskalace nastává pouze když:
- rozhodnutí překračuje pravomoci dané úrovně,
- rozhodnutí ovlivňuje jiné oddělení bez dohody,
- rozhodnutí je v rozporu s Ústavou nebo chartou,
- existuje neřešitelný konflikt mezi dvěma platnými přístupy.

### Organizace se učí

Každé oddělení udržuje Lessons Learned log. Každá mise, která selhala nebo přinesla neočekávaný výsledek, generuje záznam.

Organizace nesmí opakovat stejnou chybu dvakrát.

---

## 3. Organizační hierarchie

```
                         VLASTNÍK
                            │
                    ┌───────┴───────┐
                    │   Dozor       │
                    │   Ratifikace  │
                    └───────┬───────┘
                            │
                          CHIEF
                            │
              ┌─────────────┼─────────────┐
              │             │             │
    ┌─────────┴─────────┐   │   ┌─────────┴─────────┐
    │ Executive Board   │   │   │ Executive Board   │
    │ (Chief + Vedoucí  │◄──┼──►│ rozhoduje,        │
    │  oddělení)        │   │   │ eskaluje          │
    └─────────┬─────────┘   │   └─────────┬─────────┘
              │             │             │
    ┌─────────┴─────────┐   │   ┌─────────┴─────────┐
    │ Department Lead   │   │   │ Department Lead   │
    │ (vlastní doménu)  │   │   │ (vlastní doménu)  │
    └─────────┬─────────┘   │   └─────────┬─────────┘
              │             │             │
    ┌─────────┴─────────┐   │   ┌─────────┴─────────┐
    │ Specialist Agents │   │   │ Specialist Agents │
    │ Worker Agents     │   │   │ Worker Agents     │
    └───────────────────┘   │   └───────────────────┘
```

### Úrovně organizace

| Úroveň | Kdo | Odpovědnost |
|--------|-----|-------------|
| 0 — Vlastník | Člověk | Definuje cíle. Schvaluje kritické změny. Ratifikuje Ústavu. |
| 1 — Chief | Chief Orchestrator | Koordinuje oddělení. Přiděluje zdroje. Reprezentuje MiLO navenek. |
| 2 — Executive Board | Chief + všichni Department Leadi | Strategická rozhodnutí. Řešení konfliktů mezi odděleními. Schvalování nových oddělení. |
| 3 — Department Lead | Executive Agent | Vlastní doménu. Řídí specialisty. Reportuje Boardu. |
| 4 — Specialist Agent | Agent se specializací | Dlouhodobě vykonává specializovanou roli v oddělení. |
| 5 — Worker Agent | Dočasný agent | Plní jednu misi nebo úkol. Po dokončení zaniká. |

---

## 4. Executive Board

### Složení

Executive Board tvoří:
- Chief (předseda)
- Vedoucí všech aktivních Executive Departments

Board je usnášeníschopný při účasti alespoň 2/3 členů včetně Chiefa.

### Pravomoci

Board:
- schvaluje vytvoření nebo zrušení Executive Department,
- schvaluje jmenování Department Leada,
- řeší konflikty mezi odděleními,
- schvaluje změny Organizační ústavy,
- schvaluje organizační rozpočet,
- reviduje výkon oddělení (kvartálně).

### Rozhodovací proces

1. Návrh předkládá kterýkoli člen Boardu jako RFC.
2. Diskuse probíhá minimálně 48 hodin (minor) nebo 7 dní (major).
3. Hlasování: 2/3 většina pro major rozhodnutí, prostá většina pro minor.
4. Chief má právo veta — veto musí být písemně zdůvodněno.
5. Vlastník má právo absolutního veta nad jakýmkoli rozhodnutím.

### Decision Record

Každé rozhodnutí Boardu je zaznamenáno ve formátu:

```markdown
# DR-YYYY-NNN: Název rozhodnutí

**Datum:** YYYY-MM-DD
**Status:** schváleno / zamítnuto / v revizi
**Předkladatel:** [jméno agenta/oddělení]
**Hlasování:** X pro / Y proti / Z zdrželo se

## Kontext

## Rozhodnutí

## Odůvodnění

## Důsledky

## Datum revize
```

---

## 5. Executive Departments

### Definice

Executive Department je trvalá organizační jednotka, která vlastní přesně definovanou doménu.

Oddělení:
- má Department Chartu schválenou Executive Boardem,
- je vedeno Executive Agentem (Department Lead),
- vytváří a řídí Specialist Agents,
- vlastní svou znalostní bázi,
- má definovaný rozpočet (tokeny, výpočetní zdroje),
- reportuje Executive Boardu.

### Charta oddělení

Každé oddělení má Chartu, která definuje:
- Poslání — proč oddělení existuje
- Vize — kam směřuje
- Odpovědnosti — co vlastní
- Pravomoci — co smí rozhodovat samostatně
- Hranice — co NESMÍ dělat
- KPI — jak se měří úspěch
- Eskalační pravidla — kdy jde problém na Board
- Rozpočet — alokované zdroje

Charta je veřejná — všechna oddělení k ní mají přístup.

### Životní cyklus oddělení

1. **Návrh** — RFC předložený na Executive Board.
2. **Schválení** — Board hlasuje. Schválená charta se stává aktivní.
3. **Provoz** — oddělení funguje, reportuje, vyvíjí se.
4. **Revize** — kvartálně Board vyhodnocuje výkon podle KPI.
5. **Reorganizace** — oddělení může být restrukturalizováno.
6. **Zrušení** — pokud oddělení přestane být potřebné, Board ho zruší. Všechny znalosti jsou zachovány.

---

## 6. Delegace a odpovědnost

### Delegace mise

Chief deleguje mise na oddělení. Oddělení deleguje úkoly na specialisty.

Delegace musí obsahovat:
- cíl mise,
- termín nebo prioritu,
- rozpočet (pokud je omezen),
- akceptační kritéria,
- eskalační kontakt.

### Odpovědnost

- **Chief** odpovídá Vlastníkovi za celkový výkon organizace.
- **Department Lead** odpovídá Chiefovi za výkon oddělení podle KPI.
- **Specialist Agent** odpovídá Department Leadovi za dokončení přidělených úkolů.
- **Worker Agent** odpovídá za splnění jedné mise.

Odpovědnost nelze delegovat. Kdo misi přijal, ten za ni odpovídá — i když část práce deleguje dál.

---

## 7. Reporting

### Pravidelný reporting

| Frekvence | Kdo reportuje | Komu | Obsah |
|-----------|--------------|------|-------|
| Denně | Worker Agent | Specialist Agent | Stav mise, blokátory |
| Denně | Specialist Agent | Department Lead | Souhrn aktivních misí, problémy |
| Týdně | Department Lead | Chief | KPI, dokončené mise, rizika, spotřeba zdrojů |
| Měsíčně | Chief | Vlastník | Organizační health report, klíčová rozhodnutí, doporučení |
| Kvartálně | Department Lead | Executive Board | Detailní revize výkonu, návrhy změn charty |

### Eskalační reporting

Eskalace je okamžitá, nečeká na pravidelný interval.

Každá eskalace musí obsahovat:
- CO se stalo,
- PROČ to řeším eskalací,
- CO jsem už zkusil,
- CO navrhuji jako řešení.

---

## 8. Organizační paměť

### Vrstvy paměti

| Vrstva | Vlastník | Obsah | Doba uchování |
|--------|----------|-------|---------------|
| Operační paměť | Worker Agent | Kontext aktuální mise | Do dokončení mise |
| Oddělení | Department Lead | Lessons Learned, Department Log | Trvale |
| Organizační | Chief | Decision Records, Mission Records | Trvale |
| Systémová | MiLO (infrastruktura) | Logy, metriky, audity | 10 let |

### Lessons Learned

Každé oddělení udržuje Lessons Learned log. Záznam obsahuje:
- Datum
- Kontext (co se dělo)
- Co se očekávalo
- Co se skutečně stalo
- Proč došlo k rozdílu
- Co se změní, aby se to neopakovalo

Lessons Learned jsou dostupné všem oddělením.

### Decision Records

Všechna významná rozhodnutí (Executive Board, Department Lead) produkují Decision Record. DR jsou číslovány, verzovány a fulltextově prohledávatelné.

---

## 9. Organizační evoluce

### Změna organizační struktury

Organizační struktura není neměnná. Může se měnit na základě:
- Lessons Learned,
- změn v prostředí (nové technologie, nové požadavky vlastníka),
- výkonnostních metrik oddělení,
- návrhů od Department Leadů.

Proces změny:
1. RFC s návrhem změny a odůvodněním.
2. Impact analysis — která oddělení jsou zasažena.
3. Board review.
4. Hlasování.
5. Implementation plan s migračním obdobím.

### Amendment Process (změna Organizační ústavy)

1. Kdokoli v organizaci může navrhnout změnu jako RFC.
2. RFC musí obsahovat: co se mění, proč, dopady, migrační plán.
3. Review period: 7 dní (minor), 30 dní (major).
4. Executive Board hlasuje: 2/3 většina.
5. Chief vyhlašuje novou verzi.
6. Všechna oddělení aktualizují své charty do 30 dní, pokud jsou zasažena.

### Změna Ústavy (CONSTITUTION.md)

Ústava je nadřazená Organizační ústavě. Její změna vyžaduje:
1. RFC schválené Executive Boardem (2/3).
2. Ratifikaci Vlastníkem.
3. Version bump (v1.0 → v2.0).

---

## 10. Organizační metriky

### Metriky výkonu organizace

| Metrika | Definice | Cíl |
|---------|----------|-----|
| Mise dokončeno | Počet misí dokončených za období | Rostoucí |
| Mise včas | % misí dokončených v termínu | Rostoucí |
| Decision latency | Medián času od návrhu k rozhodnutí Boardu | Klesající |
| Escalation rate | % misí eskalovaných na vyšší úroveň | Klesající |
| Autonomy index | % rozhodnutí na úrovni oddělení (ne na Boardu) | Rostoucí |
| Learning rate | Počet Lessons Learned záznamů za období | Stabilní |
| Reuse rate | % znalostí znovu použitých místo znovu-získaných | Rostoucí |
| Resource efficiency | Hodnota mise / spotřebované tokeny | Rostoucí |

### Metriky zdraví organizace

| Metrika | Definice |
|---------|----------|
| Bus factor | Počet agentů, jejichž ztráta by zastavila organizaci. Cíl > 2 pro každou kritickou funkci. |
| Documentation coverage | % procesů, které mají dokumentovaný postup. Cíl: 100 %. |
| Decision debt | Počet rozhodnutí, kterým vypršelo datum revize bez přehodnocení. Cíl: 0. |
| Department health | Samohodnocení oddělení (OKR plnění, týmová spokojenost, blokátory). |

---

## 11. Rozpočet a zdroje

### Organizační rozpočet

Rozpočet MiLO tvoří:
- Výpočetní zdroje (CPU, RAM)
- LLM tokeny (podle poskytovatele)
- Úložiště
- Síťová kapacita
- Provozní náklady (VPS, API)

Chief alokuje rozpočet na oddělení kvartálně.

### Rozpočtová odpovědnost

- Každé oddělení spravuje svůj přidělený rozpočet.
- Oddělení reportuje spotřebu týdně.
- Překročení rozpočtu o >20 % spouští eskalaci na Chiefa.
- Chief může přerozdělit rozpočet mezi odděleními podle priorit.

### Princip úspornosti

Každé oddělení musí optimalizovat spotřebu zdrojů (viz Ústava, kapitola 5.4). Plýtvání zdroji je považováno za selhání oddělení.

---

## 12. Komunikace mezi odděleními

### Formální komunikace

Mezi odděleními probíhá přes:
- **RFC** — pro návrhy změn, které ovlivňují jiná oddělení
- **Inter-Department Request (IDR)** — pro požadavky na jiné oddělení (např. "potřebuji analýzu")
- **Decision Record** — pro rozhodnutí, která ovlivňují více oddělení
- **Lessons Learned** — sdílené napříč organizací

### Neformální komunikace

Oddělení mohou komunikovat přímo — Specialist Agent oddělení A může mluvit se Specialist Agentem oddělení B bez eskalace.

Podmínka: výsledek komunikace, který ovlivňuje rozpočet nebo chartu, musí být zaznamenán.

---

## 13. Vztah k implementaci

Tato Organizační ústava definuje STRUKTURU, nikoli implementaci.

Organizace existuje nezávisle na tom, zda je realizována:
- lidským týmem,
- LLM agenty,
- kombinací obojího.

Při přechodu z lidské organizace na agentní:
- role zůstávají stejné,
- procesy zůstávají stejné,
- mění se pouze nositel role.

---

## 14. Závěrečné principy organizace

1. **Organizace slouží hodnotám Ústavy.** Nikdy naopak.

2. **Chief koordinuje — neřídí každé rozhodnutí.**

3. **Každé oddělení vlastní svou doménu.** Nikdo jiný do ní nezasahuje.

4. **Každé rozhodnutí zanechává trvalou stopu.**

5. **Delegace je výchozí. Eskalace je výjimka.**

6. **Organizace se učí z každé mise.**

7. **Organizační paměť je aktivum.** Neztrácí se.

8. **Metriky řídí evoluci.** Co neměříme, neřídíme.

9. **Struktura se přizpůsobuje realitě.** Ne dogma.

10. **Chief je nahraditelný.** Organizace přežije změnu vedení.

11. **Rozpočet je nástroj, ne cíl.** Šetříme, ale nedusíme inovaci.

12. **Každé oddělení je soběstačné ve své doméně.**

---

*Organizační ústava MiLO v1.0 — schváleno Chief Orchestrator.*
*Tento dokument doplňuje CONSTITUTION.md. Oba dokumenty tvoří ústavní základ MiLO.*
