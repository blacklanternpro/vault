# AGENTS.md

## Cursor Cloud specific instructions

`vault` is a **frontend-only** single-page app (React 19 + Vite 8 + Tailwind CSS v4,
TypeScript). There is **no backend, database, auth, API, or environment variables** —
all content is static seed data in `src/App.tsx` / `src/data/`. Running the Vite dev
server is all that is needed to exercise the product end to end.

Standard commands live in `README.md` and `package.json` scripts (`dev`, `build`,
`lint`, `preview`). Package manager is **npm** (`package-lock.json`).

Non-obvious notes:
- The dev server (`npm run dev`) binds `host: true` on **port 5173** with
  `strictPort: true` (see `vite.config.ts`), so startup fails hard if 5173 is already
  in use — free the port rather than expecting Vite to auto-pick another one.
- `npm run build` runs `tsc -b` first, so a type error fails the build (not just a
  bundling error).
- Lint is **oxlint** (`npm run lint`), configured via `.oxlintrc.json` — not ESLint.
- Core interactivity worth smoke-testing: the SCRATCHPAD "APPEND" flow (adds a note to
  the top of the list), calendar day selection + SYS_LOG input, and the live footer
  clock. All state is in-memory only (no persistence across reloads).
