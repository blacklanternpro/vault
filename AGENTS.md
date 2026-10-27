# AGENTS.md

## Cursor Cloud specific instructions

`vault` is a **frontend-only** desktop-field SPA (React 19 + Vite 8 + Tailwind CSS v4,
TypeScript). There is **no backend, database, auth, API, or environment variables** —
the OS persists as a SPECK source string in `localStorage` (`speck-os-v2`).
Running the Vite dev server is enough to exercise the product end to end.

This is **not** a PWA and **not** a mobile month. It is a personal OS field: one work
graph, a five-lane board of job cards, a right detail drawer, and a plain-stem catalogue
plus note tape below the fold. Maker: **BAD FORM**. Product: VAULT WORLDWIDE.

The visual world is the **category standard played straight**, at Linear / Things /
Height craft — light field, one blue accent, hairlines, uppercase plaques on names. It
was locked by an attended decision round against four costumed alternatives. **Do not
re-roll a world**; the costume era is closed. See `.cursorrules` for the short law.

Standard commands live in `README.md` and `package.json` scripts (`dev`, `build`,
`lint`, `test`, `preview`). Package manager is **npm** (`package-lock.json`).

Non-obvious notes:
- The dev server (`npm run dev`) binds `host: true` on **port 5173** with
  `strictPort: true` (see `vite.config.ts`), so startup fails hard if 5173 is already
  in use — free the port rather than expecting Vite to auto-pick another one.
- `npm run build` runs `tsc -b` first, so a type error fails the build (not just a
  bundling error).
- Lint is **oxlint** (`npm run lint`), configured via `.oxlintrc.json` — not ESLint.
  Pre-existing warnings come from vendored skill JS under `.agents/skills/`; ignore those.
- `npm test` runs `tsx src/speck/run-checks.ts` — graph/source checks, not a UI runner.
- **`src/speck/machine.ts` behaviour is settled.** A visual pass changes `src/index.css`
  and `src/shell`, not the graph semantics.
- Aesthetic contract is locked in `.cursorrules`. Full portable language:
  `docs/LANGUAGE.md`. Shipped values as measured: `DESIGN.md`. Overnight brief:
  `docs/OVERNIGHT_PROMPT.md`. Product truth: `PRODUCT.md`.

Smoke (all of it pointer-first, no typed commands):
- Light field, white panels, hairline rules, 8px radius, one blue accent. Work type in a
  UI sans; lane names, job names and drawer labels in a condensed uppercase plaque face.
- Top bar: wordmark, a `Search tasks...` field showing `⌘ K` at rest and `N found` once
  it matches, three filter chips (`All Projects` / `Status: Any` / `Priority: Any`), and
  a `New` button. `⌘`/`Ctrl` + `K` focuses the field. FIND **searches only** — it never
  creates. Chips filter the session, never the source.
- Board: five lanes `PENDING · R&D · ACTIVE · DONE · DUSTED`, each with a plaque, a count
  and a ghost add. A job is a card and the lane it sits in is its status. Hover a card and
  a chevron appears bottom-right that shoves it to the next lane — the cards slide, they
  do not jump. At rest the board shows nothing but cards.
- Click a card: a drawer opens at the right edge **over** the board, so the lanes never
  reshuffle. It holds the status plaque, title, parent, `DESCRIPTION` and `SUBTASKS` with
  ticks. `[+]` adds a boxed line. Click a title and type. Esc / `[x]` closes.
- Drag a subtask out of the drawer onto a lane: it becomes a `LOOSE` satellite card on a
  slack leash. Drag it back onto its parent card to dock it (drops `LOOSE`).
- Below the fold: the catalogue as a plain tree — stems `│ ├── └──`, a drawn disclosure
  chevron, a block behind the live name, first click selects, second click renames, `_`
  adds a child. Beside it the note tape: txt blocks, snap-reorder, drop one on a card to
  hitch it. A sliver of the catalogue stays on screen at every desktop height.
- Below 900px the field restacks to one column with equal-height lanes.

Do not revive: DateBlocks cards, month-as-OS as home, the paper sheet with power-red oval
and salt organs (CAL / SEAL / SKULL), the charcoal cassette theatre (housing, jacks,
RECORD, VU, CRT wells, Oswald, orange `#FF5C1A`), beige/cream hi-fi or the beige UN seal,
NEXUS HUD, the paper/IMP canvas, cobalt, harvest amber, a dump-parser dock, a second
command input, a typed verb codebook, unix stems on a card, boxes in the catalogue, or
BLACK LANTERN as maker. The old "SaaS kanban chrome" veto is lifted **for the look only** —
lanes, cards, chips and a drawer are the world; assignees, teams, estimates and progress
bars are still out.
