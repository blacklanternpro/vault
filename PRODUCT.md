# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Jake / BAD FORM. One person running a personal OS at a desk. Phone chores (lists, TimeTree, paper) already exist elsewhere. This surface is for making — not a grocery-list demo, not a SaaS team. BLACK LANTERN is dead as the maker mark.

## Product Purpose

VAULT WORLDWIDE is a local-first personal OS: four tools in one field (a board of jobs, a detail drawer, a catalogue listing, a note tape, one FIND field). Success is opening a job beside the board, writing in it, nesting as boxed lines, docking satellites back onto parent jobs, glancing the catalogue as unix stems, scratching txt, and snap-reordering notes — without a canvas organ field, a dump-parser REPL, DateBlocks, or month-as-OS as home.

**[inferred]** The daily sit-down is: open one job, write in it, nest and dock lines, shove the next piece a lane along, scratch a note, leave. Not a status meeting. Not a month view.

## Positioning

SPECK is the **save format** (graph + dump source in `localStorage` key `speck-os-v2`). It is not the app and not a paint/PLACE compositor identity. React/DOM is the shell. One work graph, two languages: the catalogue is the plain-stem binder; a job is a card in the lane that is its status, opened in a drawer beside the board. FIND searches; it does not create projects or tasks. Pointer-first: no codebook of typed NOTE / SHOVEL / CLEAR / FOCUS as the way to work.

## Operating Context

- Frontend-only SPA (React 19 + Vite). No backend, auth, or API.
- Persistence: SPECK source string in `localStorage` (`speck-os-v2`).
- Desktop field (~1440), fixed-width chrome down to 900px, restacked to one column below that. Not a PWA, not mobile-first. Packaging later may be a boring native envelope; the envelope is not the product.
- Dev: `npm run dev` on port 5173 (`strictPort`). Lint: oxlint. Tests: `npm test`. Build: `tsc -b` then Vite.

## Capabilities and Constraints

**In (locked):**

- Unified graph: `id`, `title`, `body?`, `status` (`pending|rnd|active|done|dusted|none`), `parent`, ordered children, `urgent?`, `loose?`. IDs stay in source, not on cards.
- Top bar: wordmark, one FIND field (search only, `⌘`/`Ctrl` + `K` focuses it), three filter chips (project / status / priority), one primary action that creates a job. Chips narrow the session; they never rewrite source. There is no second input anywhere in the product.
- Board: five lanes — PENDING · R&D · ACTIVE · DONE · DUSTED. Each lane head carries a plaque, a count, and a ghost add. A job is a card with an uppercase plaque name, and **the lane it sits in is its status**. All projects show by default; the project chip narrows. A card's one quick action is a hover chevron that shoves it to the next lane along; a lane change **animates**, so which card went where is legible. Backspace / Delete kills the selected non-root node (subtree). Drop a note block onto a card to hitch.
- Drawer: selecting a job opens a panel at the right edge, **over** the board, so the lanes never reshuffle and the board never leaves the screen. It carries the status plaque, title, parent, `DESCRIPTION`, and `SUBTASKS` with ticks. `[+]` adds a boxed line (never `│ ├── └──`); boxed lines may nest boxed lines. First nested promotes PENDING → ACTIVE. Second click on the title renames. Esc / `[x]` closes. A done subtask keeps full-strength text — the filled tick is the whole signal.
- Pull and dock: drag a boxed line out of the drawer onto a lane to pull a `LOOSE` satellite card (parent unchanged). Drop a satellite, or a boxed line, onto a parent card to **dock back** (drops `LOOSE`, it is a boxed line again). Physics A: moving a card takes nested children; loose satellites stay; slack leashes sag, tighten on drag, settle after the drop.
- Catalogue (below the board): plain **TUI listing** of the entire graph (ranger/nnn density). Stems `│ ├── └──` and a drawn disclosure chevron. Block highlight behind the live name. First click selects; second click / Enter renames. `ON` (or drag onto a lane) sets status. Space is a silent shortcut. Trailing `_` adds a child. Indent/outdent. Roots stay stems. No boxes, no cards, no drawer chrome in the tree. Stems never appear on a card. A sliver of the catalogue is held on screen at every desktop height.
- Note tape (beside the catalogue): txt notes as blocks; vertical snap-reorder; persist `Doc.notes` order. Pointer `_` adds a note. Hitch stays pointer (`→ TITLE`; `[x]` unhitches). Ghost `_ LINK` / `_ PIC` / `_ FILE` inert. `CLEAR` may remain source recovery in the machine; it is not the way to work.
- Field typing: native inputs on the live title / body / note / FIND line. TAB cycles title → body → subtask → status. Esc commits the live field then collapses (drawer writes survive Esc).
- Responsive: chrome is fixed-width down to 900px; below that the field restacks to one column with equal-height lanes.

**Out (YAGNI / veto):** assignees, teams, presence, estimates, story points, progress bars, avatars, "+ New Deal", KPI rows, CRDT, PWA, a second command **input**, dump-parser dock, DOS `>` dock, `#id` checkbox ledgers, a sit-down verb codebook (typed NOTE / SHOVEL / FOCUS as the way to work), FIND that creates, DateBlocks cards, month-as-OS as home, media blobs, a settings app, harvest amber, cobalt, power red `#E10600`, live orange `#FF5C1A`, a second accent, the tint carrying words, text under 4.5:1, icon fonts / emoji / Unicode glyphs as icons, elevation at rest, gradients / glass / blur / grain / scan, unix stems on a card, boxes in the catalogue, card-in-card, a second radius, 3D knobs, VU KPIs, CRT wells, NEXUS HUD, organ PLACE-drag, salt organs CAL/SEAL/SKULL, GRAIN/SCAN/INV as product chrome, coincident-PLACE fold.

**Visual world (locked):** the light field — near-white ground, white surfaces, hairline rules, one 8px radius, three inks under a strict floor (a word at 4.5:1, a mark at 3:1, and the tint never carries text), one blue accent, one danger red, one UI sans on work and one condensed face on plaques only. Status tokens exist but are spent in the drawer alone; the board stays monochrome so the lane says the state. Motion says what moved and is zeroed under `prefers-reduced-motion`. Locked by an attended decision round against four costumed alternatives (cassette theatre, paste-up mechanical, film trim bin, type galley) and built to a measured comp. Values live in `DESIGN.md`; the rules live in `docs/LANGUAGE.md`. **The costume era is closed — do not re-roll a world.**

## Brand Commitments

- Maker: **BAD FORM**. Product: VAULT WORLDWIDE. BLACK LANTERN is dead.
- Visual world: the **category standard, played straight**, at the craft level of **Linear, Things, and Height**. Chosen deliberately over costumed worlds; conventions are embraced without irony or smuggled quirk. This overrides the older "SaaS kanban chrome" veto as a look — it does not license assignees, teams, or a second input.
- Voice: terse machine. Empty is `_`. No dashboard welcome.
- Two languages must not share chrome: the job (card / drawer / boxed nest) vs the catalogue (plain stems). Sections do not drag.
- Playing the standard straight is not permission to be careless. Geometry is measured off the approved comp, contrast floors hold, type is sized by ink width, motion explains what moved. A quiet field shows every loose value.
- **[inferred]** No customer logo lockup, no testimonials, no pricing. Identity is the maker mark and the studio, not a SaaS wordmark.

## Evidence on Hand

- Graph + source: `src/speck` (lex / parse / serialize / machine).
- Shell: `src/shell`. Tokens, geometry and type: `src/index.css`, every value commented with why.
- Canon: `docs/LANGUAGE.md`, `.cursorrules`, `docs/OVERNIGHT_PROMPT.md`. Shipped visual system, as measured: `DESIGN.md`.
- The locked comp and its region spec: `.impeccable/mocks/canon-board.webp`, `.impeccable/build/spec.json`.
- No testimonials, customers, or pricing. Do not invent them.

## Product Principles

1. One graph. Two languages (the job as card + drawer, the catalogue as plain stems). No duplicate models. Do not share chrome.
2. Pointer-first. Click-and-type on the card, the drawer, the boxed line, the stem, the note. FIND searches; it does not create work.
3. SPECK stores the graph. If it cannot be said in SPECK source, it is not in the work — but SPECK is not a reason to ship a REPL or a canvas OS.
4. Open the job. Dock back. Shove a lane along, or drag. Create work at the lane's ghost add and the catalogue's `_`, not the FIND line.
5. Utility with the attitude in the **words**, not the chrome — not a costume cockpit, not a month, not a dump parser.

## Accessibility & Inclusion

**[inferred]** Keyboard: `⌘`/`Ctrl` + `K` focuses FIND, Esc commit-then-close, arrows move catalogue selection, `[` `]` fold, Tab indent/outdent (catalogue) and title → body → subtask → status (card/drawer), Space stages the selected stem, Enter renames the selected stem, Backspace/Delete kill selected non-root. Native inputs for typing (caret, selection, accessible name). Hit targets on cards, boxed lines, stems, notes, FIND. The card's hover chevron is reachable by keyboard and names its destination lane.

Contrast is a floor, not a preference: **a word holds 4.5:1 and a meaningful mark holds 3:1**, on both the ground and the surface. The marks-only tint is never allowed to carry text. Motion respects `prefers-reduced-motion` by holding every duration to zero, so a lane change arrives instantly rather than not at all.
