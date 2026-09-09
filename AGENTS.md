# AGENTS.md

## Cursor Cloud specific instructions

`vault` is a **frontend-only** desktop-studio SPA (React 19 + Vite 8 + Tailwind CSS v4,
TypeScript). There is **no backend, database, auth, API, or environment variables** —
the OS persists as a SPECK source string in `localStorage` (`speck-os-v2`).
Running the Vite dev server is enough to exercise the product end to end.

This is **not** a PWA and **not** a mobile month. It is a personal OS studio:
one work graph, cassette theatre on top, elite TUI directory underneath, scratch sidebar
with FIND, no canvas organ field. Maker: **BAD FORM**. Product: VAULT WORLDWIDE.

Standard commands live in `README.md` and `package.json` scripts (`dev`, `build`,
`lint`, `test`, `preview`). Package manager is **npm** (`package-lock.json`).

Non-obvious notes:
- The dev server (`npm run dev`) binds `host: true` on **port 5173** with
 `strictPort: true` (see `vite.config.ts`), so startup fails hard if 5173 is already
 in use — free the port rather than expecting Vite to auto-pick another one.
- `npm run build` runs `tsc -b` first, so a type error fails the build (not just a
  bundling error).
- Lint is **oxlint** (`npm run lint`), configured via `.oxlintrc.json` — not ESLint.
- Aesthetic contract is locked in `.cursorrules`. Full portable language: `docs/LANGUAGE.md`. Overnight brief: `docs/OVERNIGHT_PROMPT.md`. Product: `PRODUCT.md`.
- Smoke: charcoal/slate studio, Helvetica work, Oswald plaques, live orange leash + danger red (not IMP `#E10600`, not cobalt).
  Cassette theatre on top (housing, transport plaques, RECORD, five hairline gutters, square slabs, boxed nest lines, satellite slugs, slack leashes, ghost `+`).
  HIT a job slab to enter the folio; Esc / `[x]` returns. Nested rows are boxed, never `├──`.
  Pull a boxed line to a gutter, then drop the slug back onto the parent card to dock.
  Directory under it (unix stems, orange name-block, first click selects, `ON` stages). Scratch sidebar with FIND (search only). Pointer `_` adds a note.
  Do not revive DateBlocks cards, beige UN identity, month-as-OS as home, paper/black
  IMP canvas, dump-parser, SaaS kanban chrome, cream cassette OS, rounded-in-rect, unix-on-cards, boxed directory rows, NEXUS HUD, VU KPIs, CRT wells, or cobalt.
