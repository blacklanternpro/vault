# vault

VAULT WORLDWIDE — BAD FORM’s in-house OS for project and task management. The field is a **SPECK** machine (canvas runtime). React is the host envelope. The live program is a SPECK source string (`localStorage` key `speck-os-v1`).

Design language (portable): [`docs/LANGUAGE.md`](docs/LANGUAGE.md) — SPECK spec in §7.
Overnight agent brief: [`docs/OVERNIGHT_PROMPT.md`](docs/OVERNIGHT_PROMPT.md).
Product truth: [`PRODUCT.md`](PRODUCT.md).

## Composition

Black desktop field. Not a PWA. Not a month.

1. **PIPE** — split-page binder: FOCUS (backlog / active) | spine | GATEWAY (staging / done)
2. **NEST** — unix pit. `CLIP` a stem into the binder
3. **DUMP** — scratch tape
4. HIT a task → cobalt dossier overlay
5. One-line dock, viewport bottom. `SHOVEL` advances a task. Drag organ legends to `PLACE`

```
src/
  speck/              language + runtime
    Field.tsx         host: canvas + dock input
    compile.ts        field + PLACE
    organs/           pipe binder, nest, dump
    machine.ts        shovel, clip, commit
    source.ts         localStorage speck-os-v1
```

```
PIPE vault
  TASK backlog "ingress routing" id 104
NEST ops/
  STEM lab/ scout_ridge_a
```

Dock: type a line and ↵. Commands: `SEE` `WORDS` `CLEAR` `SHOVEL` `CLIP`.

## Development

```
npm install
npm run dev       # http://localhost:5173 (strictPort)
npm test
npm run build
npm run lint
```
