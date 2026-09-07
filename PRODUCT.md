# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**[inferred from locked brief]** Jake / BLACK LANTERN. One person running a personal OS on a desktop. Phone chores (lists, TimeTree, paper) already exist elsewhere. This surface is for project and task work at a desk — not grocery-list demo, not a SaaS team.

## Product Purpose

**[inferred]** VAULT WORLDWIDE is a local-first personal OS: a project/task machine spoken in SPECK. Success is being able to dump work, see it as a tree (NEST) and as a status binder (PIPE), click-and-type to edit, and operate from one dock line — without cards, calendars, or a cloud personality.

## Positioning

**[inferred]** One work graph, two lenses. NEST is the outline; PIPE is the same nodes laid by status. The dock is an operator (commands + dump parser), not the place you type every title. Pixels are compiled from SPECK source, not a CSS component tree.

## Operating Context

- Frontend-only SPA (React host + canvas field). No backend, auth, or API.
- Persistence: SPECK source string in `localStorage` (`speck-os-v1`).
- Desktop field. Packaging later may be a boring native envelope; the envelope is not the product.
- Dev: `npm run dev` on port 5173.

## Capabilities and Constraints

**In (locked):**

- Unified graph: `id`, `title`, `body?`, `status` (`backlog|active|staging|done|none`), `parent`, ordered children, `urgent?`.
- PIPE view: binder columns FOCUS (backlog / active) | GATEWAY (staging / done). Project plaques. In-place expand (rows reflow). Empty ledger lines create. Nest project selection filters the binder.
- NEST view: unix tree, expand/collapse, click-create/rename, indent/outdent, `[+]` adds a child. SHOVEL / status puts a node on the binder. CLIP-copy is dead.
- Field editor: native input over the active cell. TAB cycles `title → body → new subtask → status`. Space shovels / checks. Esc collapses.
- Dock: operator only. Commands or a dump line (`new … project, title, need to …`).
- Organs sit where `PLACE` says. `GLYPH` is free ink. One dock. Organ `[x]` collapses that organ, not the app.

**Out (YAGNI / veto):** assignees, dates-as-product, calendar, estimates, CRDT, PWA, harvest amber, cobalt lash, 3D knobs, second dock form, DateBlocks, globe seal, month-as-OS, kanban cards, SaaS stacks.

## Brand Commitments

- Maker: BLACK LANTERN. Product: VAULT WORLDWIDE.
- Locked visual world (user-pinned, not a concept roll): office-sheet ticks + pixel-GUI 1px chrome + IMP plaques, restamped onto field / paper / **power red**. Cobalt leaves.
- Helvetica Neue / Helvetica / Arial. Radius 0. SPECK remains the substrate.
- Voice: terse machine. Empty is `_`. No dashboard welcome.

## Evidence on Hand

- Runtime: `src/speck` (lex / parse / compile / paint / hit).
- Canon: `docs/LANGUAGE.md`, `.cursorrules`, `docs/OVERNIGHT_PROMPT.md`.
- Pinned refs (session assets): office sheet, dark pixel GUI, ARPANET IMP.
- No testimonials, customers, or pricing. Do not invent them.

## Product Principles

1. One graph. Two lenses. No duplicate models.
2. Click-and-type in the field; the dock operates.
3. Source is the program. If it cannot be said in SPECK, it is not in the work.
4. One accent. Utility wearing attitude — not a costume cockpit.
5. Collapse, dump, shovel, hit: short verbs, no settings app.

## Accessibility & Inclusion

**[inferred]** Keyboard: TAB field cycle, Esc collapse, arrows / `[` `]` nest fold, Space shovel. Native inputs for typing (caret, selection, screen reader name). Hit targets on rows, `[+]`, `[x]`, shovel. Contrast: paper on field; white on power-red invert.
