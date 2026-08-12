# vault

VAULT WORLDWIDE — local-first personal OS. The field is a **SPECK** machine (canvas runtime). React is the host envelope. Persistence is Yjs / IndexedDB.

Design language (portable): [`docs/LANGUAGE.md`](docs/LANGUAGE.md) — SPECK spec in §7.
Overnight agent brief: [`docs/OVERNIGHT_PROMPT.md`](docs/OVERNIGHT_PROMPT.md).

## Composition

Mobile-first continuous field, painted by SPECK:

1. Centered sleaze micrographic seal
2. Half-scale ungridded calendar (MO ↔ YR + month nav)
3. Dense Unix file-tree nest
4. Scratch dump
5. Fixed bottom prompt — the SPECK REPL. Context from what you click.

```
src/
  speck/              language + runtime
    Field.tsx         host: canvas + dock input
    lex.ts parse.ts   source
    compile.ts paint.ts
    machine.ts        HIT TYPE COMMIT STRIKE INV
  workers/sync.worker.ts
```

Dock commands (whole line): `INV` `DAY 11` `MO` `YR` `NAV -1` `NEST ops/` `DUMP` `SEE` `WORDS` `STRIKE` `URGENT`. Anything else is data for the current context.

## Development

```
npm install
npm run dev       # http://localhost:5173 (strictPort)
npm run build
npm run lint
```

State in IndexedDB (`tui-os-vault`). Seed version bumps wipe legacy demo data.
