# AGENTS.md

## Cursor Cloud specific instructions

`vault` is a **frontend-only** desktop-field SPA (React 19 + Vite 8 + Tailwind CSS v4,
TypeScript). There is **no backend, database, auth, API, or environment variables** —
the OS persists as a SPECK source string in `localStorage` (`speck-os-v1`).
Running the Vite dev server is enough to exercise the product end to end.

This is **not** a PWA and **not** a mobile month. It is a personal OS field:
split-page PIPE binder, unix NEST, DUMP tape, one dock REPL.

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
- Smoke: black field, Helvetica split-page binder (FOCUS | spine | GATEWAY). Dock
  adds a backlog task. `->` or `SHOVEL` advances COL. HIT a nest stem and `CLIP`
  writes a TASK. HIT a task — cobalt dossier overlay. Drag organ legends to PLACE.
  Do not revive the seal, beige chrome, month pack as the OS, kanban cards, or amber.
