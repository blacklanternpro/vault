# vault

VAULT WORLDWIDE — local-first personal OS. Dark studio shell (React/DOM). Maker: **BAD FORM**. The live program is a **SPECK** source string (`localStorage` key `speck-os-v2`).

Design language (portable): [`docs/LANGUAGE.md`](docs/LANGUAGE.md) — SPECK spec in §7.
Overnight agent brief: [`docs/OVERNIGHT_PROMPT.md`](docs/OVERNIGHT_PROMPT.md).
Product truth: [`PRODUCT.md`](PRODUCT.md).

## Composition

Charcoal studio. Cassette theatre. Live orange leash. Danger red. Not a PWA. Not a month. Not a canvas organ field.

1. **One graph** — directory is the TUI catalogue; manager is cassette theatre (rack slabs + entered folio)
2. HIT a job to enter it. Type the body. `[+]` adds a boxed line. Pull a line to make a slug; drop the slug on a parent card to dock it back. Trailing `_` adds a child. Ghost `+` creates a job. `ON` stages a stem onto the deck.
3. **FIND** searches (`loop`); it does not create work. Pointer `_` in scratch adds a note. Hitch is drop.
4. Space is a silent stage shortcut. Scratch blocks snap-reorder vertically.

```
src/
  shell/              Studio, Manager, Directory, Scratch
  speck/              SPECK save format + graph machine
    doc.ts            parse / serialize / seed
    machine.ts        stage, find, folio, dock, field cycle
    source.ts         localStorage speck-os-v2
```

```
NEST
  NODE 1 "site" status none
    NODE 10 "HOME PAGE" status active
    NODE 30 "REPO" status pending
  NODE 2 "print" status none
```

FIND: `loop`. Pointer, not a codebook.

## Development

```
npm install
npm run dev       # http://localhost:5173 (strictPort)
npm test
npm run build
npm run lint
```
