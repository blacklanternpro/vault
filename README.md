# vault

VAULT WORLDWIDE — local-first personal OS. Dark studio shell (React/DOM). The live program is a **SPECK** source string (`localStorage` key `speck-os-v2`).

Design language (portable): [`docs/LANGUAGE.md`](docs/LANGUAGE.md) — SPECK spec in §7.
Overnight agent brief: [`docs/OVERNIGHT_PROMPT.md`](docs/OVERNIGHT_PROMPT.md).
Product truth: [`PRODUCT.md`](PRODUCT.md).

## Composition

Charcoal studio. Black cassette deck. Live orange leash. Danger red. Not a PWA. Not a month. Not a canvas organ field.

1. **One graph** — directory is the unix catalogue; manager is jobs of one project plus loose satellite slugs
2. Click a title to type. Click a job body to nest a ledger line. Pull the line to make a slug. Trailing `_` adds a child. Ghost `+` creates a job.
3. **FIND** searches (`FIND loop`); it does not create work. NOTE when a scratch block is focused. `CLEAR` restores seed.
4. Space / shovel stages a node onto the manager. Scratch blocks snap-reorder vertically.

```
src/
  shell/              Studio, Manager, Directory, Scratch
  speck/              SPECK save format + graph machine
    doc.ts            parse / serialize / seed
    machine.ts        shovel, find, note, field cycle
    source.ts         localStorage speck-os-v2
```

```
NEST
  NODE 1 "site" status none
    NODE 10 "HOME PAGE" status active
    NODE 30 "REPO" status pending
  NODE 2 "print" status none
```

Command field: `FIND loop` · `NOTE type ramp 700 / 400` · `CLEAR`.

## Development

```
npm install
npm run dev       # http://localhost:5173 (strictPort)
npm test
npm run build
npm run lint
```
