# vault

VAULT WORLDWIDE — BAD FORM’s in-house OS for project and task management. The field is a **SPECK** machine (canvas runtime). React is the host envelope. The live program is a SPECK source string (`localStorage` key `speck-os-v1`).

Design language (portable): [`docs/LANGUAGE.md`](docs/LANGUAGE.md) — SPECK spec in §7.
Overnight agent brief: [`docs/OVERNIGHT_PROMPT.md`](docs/OVERNIGHT_PROMPT.md).
Product truth: [`PRODUCT.md`](PRODUCT.md).

## Composition

Black desktop field. Power red. Not a PWA. Not a month.

1. **One graph** — NEST is the tree; PIPE is the same nodes by status (FOCUS | GATEWAY)
2. Click a title to type. TAB cycles title → body → subtask → status. HIT expands in place.
3. **Dock** is the operator: commands or a dump line
4. `[+]` adds a child. `SHOVEL` puts a node on the binder. Organ `[x]` collapses that window.

```
src/
  speck/              language + runtime
    Field.tsx         host: canvas + cell editor + operator dock
    compile.ts        field + PLACE
    organs/           pipe binder, nest tree, dump tape, window chrome
    machine.ts        shovel, focus, dump, field cycle
    parse-dump.ts     operator dump
    source.ts         localStorage speck-os-v1
```

```
NEST
  NODE 1 "ops" status none
    NODE 104 "ingress routing" status backlog
```

Dock: `SEE` `WORDS` `CLEAR` `SHOVEL` `FOCUS` or `new website project, site redesign of homepage, need to assess aesthetic, create repo`.

## Development

```
npm install
npm run dev       # http://localhost:5173 (strictPort)
npm test
npm run build
npm run lint
```
