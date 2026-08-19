# AGENTS.md

## Cursor Cloud specific instructions

`vault` is a **frontend-only** single-page app (React 19 + Vite 8 + Tailwind CSS v4,
TypeScript). There is **no backend, database, auth, API, or environment variables** —
the live program is a SPECK source string in `localStorage` (`speck-program`).
Running the Vite dev server is enough to exercise the product end to end.

Standard commands live in `README.md` and `package.json` scripts (`dev`, `build`,
`lint`, `preview`). Package manager is **npm** (`package-lock.json`).

Non-obvious notes:
- The dev server (`npm run dev`) binds `host: true` on **port 5173** with
  `strictPort: true` (see `vite.config.ts`), so startup fails hard if 5173 is already
  in use — free the port rather than expecting Vite to auto-pick another one.
- `npm run build` runs `tsc -b` first, so a type error fails the build (not just a
  bundling error).
- Lint is **oxlint** (`npm run lint`), configured via `.oxlintrc.json` — not ESLint.
- Aesthetic contract is locked in `.cursorrules`. Full portable language: `docs/LANGUAGE.md`. Overnight brief: `docs/OVERNIGHT_PROMPT.md`.
- Smoke: SPECK canvas field (seal + free canvas + INV), fixed bottom prompt (REPL).
  Dock speaks SPECK (`INV`, `SEE`, `WORDS`, `CLEAR`). Paint nouns append to source.
  Unknown words become `GLYPH`. Do not revive calendar, todo nest, or scratch dump.
