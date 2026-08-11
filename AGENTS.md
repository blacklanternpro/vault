# AGENTS.md

## Cursor Cloud specific instructions

`vault` is a **frontend-only** single-page app (React 19 + Vite 8 + Tailwind CSS v4,
TypeScript). There is **no backend, database, auth, API, or environment variables** —
persistence is local IndexedDB via a Yjs Web Worker. Seed content lives in
`src/workers/sync.worker.ts`. Running the Vite dev server is enough to exercise the
product end to end.

Standard commands live in `README.md` and `package.json` scripts (`dev`, `build`,
`lint`, `preview`). Package manager is **npm** (`package-lock.json`).

Non-obvious notes:
- The dev server (`npm run dev`) binds `host: true` on **port 5173** with
  `strictPort: true` (see `vite.config.ts`), so startup fails hard if 5173 is already
  in use — free the port rather than expecting Vite to auto-pick another one.
- `npm run build` runs `tsc -b` first, so a type error fails the build (not just a
  bundling error).
- Lint is **oxlint** (`npm run lint`), configured via `.oxlintrc.json` — not ESLint.
- Aesthetic contract is locked in `.cursorrules`. Calendar must remain the True Cram
  Grid — never DateBlocks / stacked day cards.
- Core interactivity worth smoke-testing: teletext mode chips (`DAY|NEST|DUMP`),
  calendar day select + parasite overlay logs, single Prompt Dock submit routing,
  Hybrid Nest focus + `[X]`, DUMP attach, INV invert, live footer clock. State
  survives reload via IndexedDB.
