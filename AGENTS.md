# AGENTS.md

## Cursor Cloud specific instructions

`vault` is a **frontend-only** single-page app (React 19 + Vite 8 + Tailwind CSS v4,
TypeScript), installable as a mobile PWA. There is **no backend, database, auth, API, or
environment variables** — tasks persist as a SPECK source string in `localStorage`
(`speck-tree-v1`). Running the Vite dev server is enough to exercise the product end to end.

Standard commands live in `README.md` and `package.json` scripts (`dev`, `build`,
`lint`, `preview`). Package manager is **npm** (`package-lock.json`).

Non-obvious notes:
- The dev server (`npm run dev`) binds `host: true` on **port 5173** with
  `strictPort: true` (see `vite.config.ts`), so startup fails hard if 5173 is already
  in use — free the port rather than expecting Vite to auto-pick another one.
- `npm run build` runs `tsc -b` first, so a type error fails the build (not just a
  bundling error).
- Lint is **oxlint** (`npm run lint`), configured via `.oxlintrc.json` — not ESLint.
- There are no unit test scripts. Runtime assertions live in `src/speck/check.ts` and
  print to the console in DEV. Run them headlessly with
  `npx tsx -e "import {runSpeckChecks} from './src/speck/check.ts'; console.log(runSpeckChecks())"`.
- PWA icons are generated, not hand-drawn: `node scripts/make-icons.mjs`.
- The BAD FORM stamp is painted at runtime by `paintStamp()`; `node scripts/make-stamp.mjs`
  replays the same seed into `public/brand/` (SVG + PNG, transparent / paper / black).
  Agency-mark studies: `node scripts/make-stamp-alts.mjs` → `public/brand/alts/`.
  Original-stamp ink and oval studies: `node scripts/make-stamp-studies.mjs` → `public/brand/studies/`.
- The service worker only registers in a production build, so `npm run dev` is never
  served from a stale cache.
- Aesthetic contract is locked in `.cursorrules`; full language in `docs/LANGUAGE.md`.
- Jitter must stay pure. Every wobble comes from `src/speck/noise.ts` seeded by node
  text — if it is reseeded per frame the slip shimmers.

Smoke: black field, paper slip bleeding top and bottom, VAULT masthead. Type in the dock to add a
task. Tap `+` to arm it, add a child, confirm the connector is a **diagonal** wire. Tap the ring dot
to settle (red hand strike, time prints). Tap the text to select (cobalt band, red `[X]`). Kill and
`UNDO`. Tap a parent ratio to fold. Long-press a row to focus, tap the path to climb out. Settle
everything and the BAD FORM stamp lands across the slip. Do not revive the calendar, the globe seal,
or the beige cassette chrome.
