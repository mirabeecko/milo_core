# Paperclip + Hermes: bezpečný start MVP

## Rozhodnutí

Použít Paperclip `v2026.720.0` jako samostatný control plane. Nevkládat jeho zdrojový kód do rootu `MiLO_Core` a nevytvářet další Vite aplikaci. MiLO_Core se připojí přes jeho verzované REST/OpenAPI rozhraní až po průchodu testy.

## Předpoklady

- MacBook, Node.js 20+; současný Node 20 je dostačující.
- Hermes nejprve zálohovat; teprve poté řízeně aktualizovat/testovat v0.19.0.
- První běh pouze na loopbacku. Vzdálený přístup až přes řízenou privátní síť a autentizovaný režim.

## Instalace připnuté verze

```bash
mkdir -p ~/dev/milo-control
cd ~/dev/milo-control
npx --registry https://registry.npmjs.org paperclipai@2026.720.0 onboard --yes
```

Po startu ověřit `http://localhost:3100/api/health` a uložit výstup testu do prvního instalačního ticketu.

## Pořadí konfigurace

1. Company `MiLO` s jediným cílem: „Každý přijatý úkol se evidovaně posune k ověřenému výsledku.“
2. Vytvořit Hermes Chief; heartbeats zatím ručně.
3. Vložit `agents/HERMES_CHIEF.md` a Ústavu.
4. Vytvořit Atlas a Argus; ověřit otázkový workflow.
5. Vytvořit Forge; ověřit akční workflow.
6. Připojit deterministickou Truth Gateway; žádný agent nesmí zapisovat přímo do Fact Ledgeru.
7. Nastavit rozpočtové hard-stopy a schvalovací brány.
8. Až poté zapnout plánované heartbeat/routines.

## Integrace s existujícím MiLO_Core

- Zdrojová integrace patří do existujících `apps/api` a `packages/*`.
- Dashboard v `apps/web` bude nejprve pouze číst Paperclip API a MiLO truth API.
- Neduplikovat stav úkolu v Supabase i Paperclipu. Paperclip je autorita pro práci; MiLO Truth je autorita pro fakta a důkazy.
- Každý objekt nese externí ID pro proklik mezi systémy.

## Aktualizace

Verzi nikdy nezvedat automaticky. Upgrade je ticket: release notes → záloha → testovací instance → akceptační testy → rozhodnutí → produkce → rollback plán.
