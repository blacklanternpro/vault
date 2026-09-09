# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**[inferred from locked brief]** Jake / BLACK LANTERN. One person running a personal OS on a desktop. Phone chores (lists, TimeTree, paper) already exist elsewhere. This surface is for project and task work at a desk — not grocery-list demo, not a SaaS team.

## Product Purpose

**[inferred]** VAULT WORLDWIDE is a local-first personal OS: four tools as a fixed dark studio (black-deck project manager, unix task directory, scratch sidebar, one FIND/NOTE field). Success is staging jobs on one project at a time, nesting subtasks as ledger lines, pulling satellite slugs with a slack leash, keeping a separate directory, scratching txt, and snap-reordering notes — without a canvas organ field, a dump-parser REPL, DateBlocks, or month-as-OS as home.

## Positioning

**[inferred]** SPECK is the **save format** (graph + dump source in `speck-os-v2`). It is not the app and not a paint/PLACE compositor identity. React/DOM is the studio shell. One work graph: the directory is the tree; the manager is the same nodes as deck slabs and slugs. FIND searches; it does not create projects or tasks.

## Operating Context

- Frontend-only SPA (React 19 + Vite). No backend, auth, or API.
- Persistence: SPECK source string in `localStorage` (`speck-os-v2`).
- Desktop studio (~1440). Packaging later may be a boring native envelope; the envelope is not the product.
- Dev: `npm run dev` on port 5173.

## Capabilities and Constraints

**In (locked):**

- Unified graph: `id`, `title`, `body?`, `status` (`pending|rnd|active|done|dusted|none`), `parent`, ordered children, `urgent?`, `loose?`. IDs stay in source, not on cards.
- Project manager (top ~50%): one project at a time (cassette window + RECORD ADD). Five hairline gutters — PENDING · R&D · ACTIVE · DONE · DUSTED. Square job slabs (uppercase). Empty jobs have no well. Click the body line to write the thought; `[+]` nest tick adds a ledger line. First nested promotes PENDING → ACTIVE. Drag a nested row onto a gutter to pull a `LOOSE` satellite slug (parent unchanged). Physics A: moving a slab takes nested children; loose satellites stay; slack leashes sag, tighten on drag, settle after drop. Ghost `+` in PENDING creates a job. Click title to rename. Backspace / Delete kills the selected non-root node (subtree). Drop a scratch block onto a slab to hitch.
- Tasks directory (bottom): naked unix tree of the entire catalogue. Selection is a safety-orange block behind the name. Click-rename, trailing `_` add, indent/outdent, Space/shovel onto the manager. Stems never appear on the PM.
- Scratch sidebar (~320px): FIND at the top (the one command field). Txt notes as blocks; vertical snap-reorder; persist `Doc.notes` order. Hitch shows `→ TITLE` on the note; `[x]` unhitches. Ghost `_ LINK` / `_ PIC` / `_ FILE` inert. NOTE when a txt block is focused; else FIND. `CLEAR` as a typed command. FIND searches; it does not create projects or tasks.
- Field typing: native inputs on the live title / body / note / FIND line. TAB cycles title → body on the slab. Esc clears the live edit.

**Out (YAGNI / veto):** assignees, estimates, CRDT, PWA, harvest amber as identity, cobalt lash, 3D knobs, VU KPIs, taut tuner-needle filaments, PM nest stems, rounded-in-rect, five CRT wells, second command **input**, DateBlocks cards, month-as-OS as home, SaaS kanban chrome, dump-parser dock, `#id` checkbox ledgers, organ PLACE-drag, salt organs CAL/SEAL/SKULL, GRAIN/SCAN/INV as product chrome, DOS `>` dock, media blobs, coincident-PLACE fold.

## Brand Commitments

- Maker: BLACK LANTERN. Product: VAULT WORLDWIDE.
- Locked visual world (user-pinned): **black cassette deck** on a dark studio — charcoal/slate field, off-white type, live orange + danger red. Oswald 700 on plaques. Square slabs. Slack leashes. No salt organs. No PLACE-drag of sections.
- Type: Helvetica Neue / Helvetica / Arial on work. Oswald 700 on plaques. Radius 0 on slabs; jack hole is the only radius.
- Voice: terse machine. Empty is `_`. No dashboard welcome.

## Evidence on Hand

- Graph + source: `src/speck` (lex / parse / serialize / machine).
- Studio shell: `src/shell`.
- Canon: `docs/LANGUAGE.md`, `.cursorrules`, `docs/OVERNIGHT_PROMPT.md`.
- No testimonials, customers, or pricing. Do not invent them.

## Product Principles

1. One graph. Two looks (deck slabs + directory). No duplicate models.
2. Click-and-type on the card, the row, the note. FIND searches; it does not create work.
3. SPECK stores the graph. If it cannot be said in SPECK source, it is not in the work — but SPECK is not a reason to ship a REPL or a canvas OS.
4. Live orange and danger red. Utility wearing attitude — not a costume cockpit.
5. Shovel, snap, hit: short verbs, no settings app. Create work in the manager and directory, not the FIND line.

## Accessibility & Inclusion

**[inferred]** Keyboard: FIND/NOTE field, Esc cancel, arrows move directory selection, `[` `]` fold, Tab indent/outdent (directory) and title → body (slab), Space shovel, Backspace/Delete kill selected non-root. Native inputs for typing (caret, selection, accessible name). Hit targets on cards, rows, notes, FIND. Contrast: off-white on charcoal/slate; dark type on orange selection.
