# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**[inferred from locked brief]** Jake / BLACK LANTERN. One person running a personal OS on a desktop. Phone chores (lists, TimeTree, paper) already exist elsewhere. This surface is for project and task work at a desk — not grocery-list demo, not a SaaS team.

## Product Purpose

**[inferred]** VAULT WORLDWIDE is a local-first personal OS: four tools on a paper sheet (project manager, unix task directory, mixed scratchpad, command field), composed by SPECK. Success is staging real work, keeping a separate directory, scratching txt, and rearranging windows — without cards, a dump-parser REPL, or month-as-OS as home.

## Positioning

**[inferred]** SPECK is the compositor (`PLACE`, paint, hit). It is not the app. One work graph: NEST is the unix directory; PIPE is the project manager (same nodes by stage). The dock places ink / searches; it does not create projects or tasks. Pixels are compiled from SPECK source, not a CSS component tree.

## Operating Context

- Frontend-only SPA (React host + canvas field). No backend, auth, or API.
- Persistence: SPECK source string in `localStorage` (`speck-os-v1`).
- Desktop field. Packaging later may be a boring native envelope; the envelope is not the product.
- Dev: `npm run dev` on port 5173.

## Capabilities and Constraints

**In (locked):**

- Unified graph: `id`, `title`, `body?`, `status` (`backlog|active|staging|done|none`), `parent`, ordered children, `urgent?`. IDs stay in source, not on manager rows.
- PIPE project manager: binder columns FOCUS (backlog / active) | GATEWAY (staging / done). Oswald project names, Helvetica titles. In-place expand (rows reflow, body as type, status CHIP). Empty rows create. Nest project selection filters the binder. Arrow Up/Down moves selection. In-organ shovel / Space / status HIT stages work.
- NEST tasks directory: unix tree, expand/collapse, click-create/rename, indent/outdent, `[+]` adds a child. Own `PLACE` window. SHOVEL / status lifts a node onto the manager. CLIP-copy is dead. Coincident origins overlap; they do not fold into `PIPE | NEST` ticks.
- Field editor: native input over the active cell. TAB cycles `title → body → new subtask → status`. Space shovels. Esc collapses.
- Dock: command field plus a read-only legend rail. `MOVE` / `GLYPH` / `FIND` / `NOTE` / `CLEAR`. Bare line searches titles in-session (or appends txt when DUMP is live). Does not parse work trees. Legend HIT toggles `GRAIN` / `SCAN` / `INV`.
- Organs sit where `PLACE` says. `GLYPH` is free ink. Salt organs: `SEAL`, `SKULL`, `CAL` (month digits in a window; DUMP notes underline days). Organ `[x]` collapses that organ, not the app. DUMP looks like a mixed scratchpad; txt notes work this pass; LINK / PIC / FILE slots are inert ghosts.

**Out (YAGNI / veto):** assignees, estimates, CRDT, PWA, harvest amber, cobalt lash, 3D knobs, second dock **input**, DateBlocks cards, month-as-OS as home, kanban cards, SaaS stacks, dump-parser dock, `#id` checkbox ledgers, coincident-PLACE fold as OS chrome, media blobs. Calendar/globe/skull are in as salt organs, not as identity.

## Brand Commitments

- Maker: BLACK LANTERN. Product: VAULT WORLDWIDE.
- Locked visual world (user-pinned): office-sheet **paper ground** + pixel-GUI 1px black windows + IMP plaques, restamped onto paper / black / **power red**. Cobalt leaves.
- Oswald 700 on plaques. Helvetica Neue / Helvetica / Arial on work. Radius 0. SPECK remains the substrate (paint / PLACE), not a DOS costume.
- Voice: terse machine. Empty is `_`. No dashboard welcome.

## Evidence on Hand

- Runtime: `src/speck` (lex / parse / compile / paint / hit).
- Canon: `docs/LANGUAGE.md`, `.cursorrules`, `docs/OVERNIGHT_PROMPT.md`.
- Pinned refs (session assets): office sheet, dark pixel GUI, ARPANET IMP.
- No testimonials, customers, or pricing. Do not invent them.

## Product Principles

1. One graph. Two looks (manager + directory). No duplicate models.
2. Click-and-type in the field; the dock places and searches.
3. SPECK paints placement. If it cannot be said in SPECK, it is not in the work — but SPECK is not a reason to ship a REPL taskmaster.
4. One accent. Utility wearing attitude — not a costume cockpit.
5. Collapse, shovel, hit: short verbs, no settings app. Create work in the organs, not the dock.

## Accessibility & Inclusion

**[inferred]** Keyboard: TAB field cycle, Esc collapse, arrows / `[` `]` nest fold, Space shovel. Native inputs for typing (caret, selection, screen reader name). Hit targets on rows, `[+]`, `[x]`, shovel, legend, CAL days. Contrast: black ink on paper; paper on black windows; white on power-red invert.
