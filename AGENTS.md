# AGENTS.md

## Cursor Cloud specific instructions

`vault` is a **frontend-only** desktop-studio SPA (React 19 + Vite 8 + Tailwind CSS v4,
TypeScript). There is **no backend, database, auth, API, or environment variables** —
the OS persists as a SPECK source string in `localStorage` (`speck-os-v2`).
Running the Vite dev server is enough to exercise the product end to end.

This is **not** a PWA and **not** a mobile month. It is a personal OS studio:
one work graph, manager cards on top, unix directory underneath, scratch sidebar
with FIND, no canvas organ field.

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
- Smoke: charcoal/slate studio, Helvetica work, live orange selection + danger red (not IMP `#E10600`, not cobalt).
  Racked manager on top (five wells, job cards, nested well, ghost `+`). Directory under it (unix stems, orange name-block).
  Scratch sidebar with FIND. Drag a job between wells; pull a nested row onto a lane; snap-reorder notes; click a
  title, type; click a job body to nest; trailing `_` adds a child; Space/shovel stages a node. Typed `CLEAR`
  restores seed. No CAL / SEAL / SKULL, no organ PLACE-drag, no DOS `>` dock.
  Do not revive DateBlocks cards, beige UN identity, month-as-OS as home, paper/black
  IMP canvas, dump-parser, SaaS kanban chrome, cream cassette OS, or cobalt.
