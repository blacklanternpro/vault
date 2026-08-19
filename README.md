# vault

VAULT WORLDWIDE — local-first personal OS. The field is a **SPECK** machine (canvas runtime). React is the host envelope. Notes live in a SPECK source string (`localStorage` key `speck-month-v1`).

Design language (portable): [`docs/LANGUAGE.md`](docs/LANGUAGE.md) — SPECK spec in §7.
Overnight agent brief: [`docs/OVERNIGHT_PROMPT.md`](docs/OVERNIGHT_PROMPT.md).

## Composition

Black field. No globe. Current month as a 7-across Helvetica pack.

1. Digits `1 … last`, day 1 top-left, equal cells
2. Tap a day → one-line dock logs a note on that date
3. Notes mark the digit with a cobalt underline
4. Tap a marked day → notes drop from the line (cobalt / white overlay)
5. One-line dock, viewport bottom

```
src/
  speck/              language + runtime
    Field.tsx         host: canvas + dock input
    compile.ts        7-col pack + overlay
    machine.ts        DAY select, note commit
    source.ts         localStorage
```

Notes in source:

```
DAY 08.19.26 "ridge"
```

Dock: type a note and ↵. Commands: `SEE` `WORDS` `CLEAR`. No day selected → `? DAY`.

## Development

```
npm install
npm run dev       # http://localhost:5173 (strictPort)
npm run build
npm run lint
```
