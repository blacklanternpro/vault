# AGENTS.md

## Cursor Cloud specific instructions

`vault` is a **frontend-only** desktop-field SPA (React 19 + Vite 8 + Tailwind CSS v4,
TypeScript). There is **no backend, database, auth, API, or environment variables** —
the OS persists as a SPECK source string in `localStorage` (`speck-os-v1`).
Running the Vite dev server is enough to exercise the product end to end.

This is **not** a PWA and **not** a mobile month. It is a personal OS field:
one work graph, NEST tree + PIPE status lens, DUMP tape, field editor, one operator dock.

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
- Smoke: paper sheet, Oswald plaques, Helvetica work rows, power-red oval + chrome (not cobalt).
  Split-page binder (FOCUS | spine | GATEWAY) with project plaques. Tap a row: expand in place,
  rows below move. Click a title, type. `[+]` in nest adds a child. Dock dump:
  `new website project, site redesign of homepage, need to assess aesthetic, create repo`.
  Legend rail toggles GRAIN / SCAN / INV. Organ `[x]` collapses that window.
  Salt organs SEAL / SKULL / CAL. Do not revive DateBlocks cards, beige UN identity,
  month-as-OS as home, overlay CHIP dossier, CLIP-copy, kanban cards, amber, or cobalt.
