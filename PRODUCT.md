# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**[inferred from locked brief]** Jake / BLACK LANTERN. One person running a personal OS on a desktop. Phone chores (lists, TimeTree, paper) already exist elsewhere. This surface is for project and task work at a desk — not grocery-list demo, not a SaaS team.

## Product Purpose

**[inferred]** VAULT WORLDWIDE is a local-first personal OS: four tools as a fixed dark studio (project manager, unix task directory, scratch sidebar, one FIND/NOTE field). Success is staging real work on quiet cards, keeping a separate directory, scratching txt, and snap-reordering notes — without a canvas organ field, a dump-parser REPL, DateBlocks, or month-as-OS as home.

## Positioning

**[inferred]** SPECK is the **save format** (graph + dump source in `speck-os-v1`). It is not the app and not a paint/PLACE compositor identity. React/DOM is the studio shell. One work graph: the directory is the tree; the manager is the same nodes as stage cards. FIND searches; it does not create projects or tasks.

## Operating Context

- Frontend-only SPA (React 19 + Vite). No backend, auth, or API.
- Persistence: SPECK source string in `localStorage` (`speck-os-v1`).
- Desktop studio (~1440). Packaging later may be a boring native envelope; the envelope is not the product.
- Dev: `npm run dev` on port 5173.

## Capabilities and Constraints

**In (locked):**

- Unified graph: `id`, `title`, `body?`, `status` (`backlog|active|staging|done|none`), `parent`, ordered children, `urgent?`. IDs stay in source, not on cards.
- Project manager (top ~40–45%): quiet stage lanes without billboard titles — position encodes stage. Project cards (nodes with children, plus binder-status roots). Off-white title, muted child count, urgent as highlighter. Drag a card between lanes to rewrite that project’s `status` (children stay). Drag within a lane reorders siblings in source. Click card: focus the directory to that subtree. Click title to rename. Empty lane creates a project (click-and-type).
- Tasks directory (bottom): naked unix tree on the dark field. Selection is a highlighter-red block behind the name. Click-rename, trailing `_` add, indent/outdent, Space/shovel onto the manager.
- Scratch sidebar (~320px): FIND at the top (the one command field). Txt notes as blocks; vertical snap-reorder; persist `Doc.notes` order. Ghost `_ LINK` / `_ PIC` / `_ FILE` inert. NOTE when a txt block is focused; else FIND. `CLEAR` as a typed command.
- Field typing: native inputs on the live title / note / FIND line. TAB indent in the directory. Esc clears the live edit.

**Out (YAGNI / veto):** assignees, estimates, CRDT, PWA, harvest amber, cobalt lash, 3D knobs, second command **input**, DateBlocks cards, month-as-OS as home, SaaS kanban chrome, dump-parser dock, `#id` checkbox ledgers, organ PLACE-drag, salt organs CAL/SEAL/SKULL, GRAIN/SCAN/INV as product chrome, Oswald plaques, DOS `>` dock, media blobs, coincident-PLACE fold.

## Brand Commitments

- Maker: BLACK LANTERN. Product: VAULT WORLDWIDE.
- Locked visual world (user-pinned): **dark studio** — charcoal/slate field, off-white type, one highlighter red (not IMP `#E10600`). DOM shell. No salt organs. No PLACE-drag of sections.
- Type: Helvetica Neue / Helvetica / Arial only. Modest radius (~10px) on project/scratch cards; not 24–32px SaaS bowls.
- Voice: terse machine. Empty is `_`. No dashboard welcome.

## Evidence on Hand

- Graph + source: `src/speck` (lex / parse / serialize / machine).
- Studio shell: `src/shell`.
- Canon: `docs/LANGUAGE.md`, `.cursorrules`, `docs/OVERNIGHT_PROMPT.md`.
- No testimonials, customers, or pricing. Do not invent them.

## Product Principles

1. One graph. Two looks (manager cards + directory). No duplicate models.
2. Click-and-type on the card, the row, the note. FIND searches; it does not create work.
3. SPECK stores the graph. If it cannot be said in SPECK source, it is not in the work — but SPECK is not a reason to ship a REPL or a canvas OS.
4. One accent. Utility wearing attitude — not a costume cockpit.
5. Shovel, snap, hit: short verbs, no settings app. Create work in the manager and directory, not the FIND line.

## Accessibility & Inclusion

**[inferred]** Keyboard: FIND/NOTE field, Esc cancel, arrows move directory selection, `[` `]` fold, Tab indent/outdent, Space shovel. Native inputs for typing (caret, selection, accessible name). Hit targets on cards, rows, notes, FIND. Contrast: off-white on charcoal/slate; dark type on highlighter selection.
