# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**[inferred from locked brief]** Jake / BAD FORM. One person running a personal OS on a desktop. Phone chores (lists, TimeTree, paper) already exist elsewhere. This surface is for making at a desk — not grocery-list demo, not a SaaS team. BLACK LANTERN is dead as the maker mark.

## Product Purpose

**[inferred]** VAULT WORLDWIDE is a local-first personal OS: four tools as a fixed dark studio (cassette-theatre project manager, elite TUI directory, scratch sidebar, one FIND field). Success is entering a job as a document, staging work on one project at a time, nesting as boxed lines on the deck, docking satellites back onto parent cards, glancing the catalogue as unix stems, scratching txt, and snap-reordering notes — without a canvas organ field, a dump-parser REPL, DateBlocks, or month-as-OS as home.

## Positioning

**[inferred]** SPECK is the **save format** (graph + dump source in `speck-os-v2`). It is not the app and not a paint/PLACE compositor identity. React/DOM is the studio shell. One work graph: the directory is the TUI binder; the manager is cassette theatre — rack slabs and entered folios. FIND searches; it does not create projects or tasks. Pointer-first: no codebook of typed NOTE / SHOVEL / CLEAR / FOCUS as the way to work.

## Operating Context

- Frontend-only SPA (React 19 + Vite). No backend, auth, or API.
- Persistence: SPECK source string in `localStorage` (`speck-os-v2`).
- Desktop studio (~1440). Packaging later may be a boring native envelope; the envelope is not the product.
- Dev: `npm run dev` on port 5173.

## Capabilities and Constraints

**In (locked):**

- Unified graph: `id`, `title`, `body?`, `status` (`pending|rnd|active|done|dusted|none`), `parent`, ordered children, `urgent?`, `loose?`. IDs stay in source, not on cards.
- Project manager (top ~50%): cassette **theatre**. One project at a time (cassette window + RECORD). Five hairline gutters — PENDING · R&D · ACTIVE · DONE · DUSTED. Square job slabs (uppercase). Empty jobs have no nest well. HIT a slab **enters the folio** (large title, real writing surface, boxed-line outline, hitch strip). Esc / plaque / `[x]` returns to the rack. Second click on the folio title renames. `[+]` adds a boxed line (radius 0, inset slate, hairline — never `│ ├── └──`). Nested boxed lines may nest boxed lines. First nested promotes PENDING → ACTIVE. Drag a boxed line onto a gutter to pull a `LOOSE` satellite slug (parent unchanged). Drop a satellite (or a boxed line) onto a parent job slab to **dock back** (drop `LOOSE`, it is a boxed line again). Physics A: moving a slab takes nested children; loose satellites stay; slack leashes sag, tighten on drag, settle after drop. Ghost `+` in PENDING creates a job. Backspace / Delete kills the selected non-root node (subtree). Drop a scratch block onto a slab to hitch.
- Tasks directory (bottom): elite **TUI listing** of the entire catalogue (ranger/nnn density). Stems `│ ├── └──`. Safety-orange block behind the live name. First click selects; second click / Enter renames. `ON` (or drag onto a gutter) stages onto the deck. Space is a silent shortcut. Trailing `_` adds a child. Indent/outdent. Roots stay stems (columns of stem text if the pane is wide). No boxes, no cassette chrome, no job-card homes in the nest. Stems never appear on the PM.
- Scratch sidebar (~320px): FIND at the top (search only). Txt notes as blocks; vertical snap-reorder; persist `Doc.notes` order. Pointer `_` adds a note. Hitch stays pointer (`→ TITLE`; `[x]` unhitches). Ghost `_ LINK` / `_ PIC` / `_ FILE` inert. `CLEAR` may remain source recovery in the machine; it is not the way to work. FIND searches; it does not create projects or tasks.
- Field typing: native inputs on the live title / body / note / FIND line. TAB cycles title → body → subtask → status. Esc clears the live edit (and closes a folio when not typing a field).

**Out (YAGNI / veto):** assignees, estimates, CRDT, PWA, harvest amber as identity, cobalt lash, 3D knobs, VU KPIs, taut tuner-needle filaments, unix stems on PM cards, rounded-in-rect, five CRT wells, NEXUS HUD, second command **input**, DateBlocks cards, month-as-OS as home, SaaS kanban chrome, dump-parser dock, `#id` checkbox ledgers, organ PLACE-drag, salt organs CAL/SEAL/SKULL, GRAIN/SCAN/INV as product chrome, DOS `>` dock, media blobs, coincident-PLACE fold, sit-down verb codebook (typed NOTE / SHOVEL / FOCUS as the way to work).

## Brand Commitments

- Maker: **BAD FORM**. Product: VAULT WORLDWIDE. BLACK LANTERN is dead.
- Locked visual world (user-pinned): **black cassette theatre** on a dark studio — charcoal/slate field, off-white type, live orange + danger red. Oswald 700 on plaques. Square slabs. Slack leashes. Boxed nest on the PM. Elite TUI directory. No salt organs. No PLACE-drag of sections.
- Type: Helvetica Neue / Helvetica / Arial on work. Oswald 700 on plaques. Radius 0 on slabs; jack hole is the only radius.
- Voice: terse machine. Empty is `_`. No dashboard welcome.

## Evidence on Hand

- Graph + source: `src/speck` (lex / parse / serialize / machine).
- Studio shell: `src/shell`.
- Canon: `docs/LANGUAGE.md`, `.cursorrules`, `docs/OVERNIGHT_PROMPT.md`.
- No testimonials, customers, or pricing. Do not invent them.

## Product Principles

1. One graph. Two languages (cassette theatre + TUI directory). No duplicate models. Do not share chrome.
2. Pointer-first. Click-and-type on the folio, the boxed line, the stem, the note. FIND searches; it does not create work.
3. SPECK stores the graph. If it cannot be said in SPECK source, it is not in the work — but SPECK is not a reason to ship a REPL or a canvas OS.
4. Live orange and danger red. Utility wearing attitude — not a costume cockpit.
5. Enter the job. Dock back. Stage with ON / drag. Create work on the deck and in the directory, not the FIND line.

## Accessibility & Inclusion

**[inferred]** Keyboard: FIND field, Esc cancel / close folio, arrows move directory selection, `[` `]` fold, Tab indent/outdent (directory) and title → body → subtask → status (folio/slab), Space stages the selected stem, Enter renames the selected stem, Backspace/Delete kill selected non-root. Native inputs for typing (caret, selection, accessible name). Hit targets on cards, boxed lines, stems, notes, FIND. Contrast: off-white on charcoal/slate; dark type on orange selection.
