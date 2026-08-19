# vault

VAULT WORLDWIDE — local-first personal OS. The field is a **SPECK** machine (canvas runtime). React is the host envelope. The live program is a SPECK source string (`localStorage` key `speck-program`).

The calendar / todo nest / scratch dump were a failed shell. They are gone. SPECK stays.

Design language (portable): [`docs/LANGUAGE.md`](docs/LANGUAGE.md) — SPECK spec in §7.
Overnight agent brief: [`docs/OVERNIGHT_PROMPT.md`](docs/OVERNIGHT_PROMPT.md).

## Composition

Mobile-first continuous field, painted by SPECK:

1. Centered sleaze micrographic seal
2. Free canvas (whatever the current source paints)
3. Fixed bottom prompt — the SPECK REPL

```
src/
  speck/              language + runtime
    Field.tsx         host: canvas + dock input
    lex.ts parse.ts   source
    compile.ts paint.ts
    machine.ts        HIT TYPE COMMIT STRIKE INV SEE CLEAR
    source.ts         default program + localStorage
```

Default source:

```
SEAL reindustrialize
GRAIN
SCAN
```

Dock commands: `INV` `WORDS` `SEE` `CLEAR` `COMMIT`. Paint nouns (`GLYPH` `CHIP` `STEM` `SEAL`) append to source. Anything else becomes `GLYPH "…"`. Typing `todo` does not spawn a todo widget.

## Development

```
npm install
npm run dev       # http://localhost:5173 (strictPort)
npm run build
npm run lint
```
