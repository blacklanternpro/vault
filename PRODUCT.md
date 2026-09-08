# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Jake. One person. Daily desk use for project and task work. Phone chores (lists, TimeTree, paper) already live elsewhere. Not a SaaS team, not a store product, not a grocery-list demo.

## Product Purpose

VAULT WORLDWIDE is BAD FORM’s in-house OS: a local-first project and task management system you run as a program on a desktop, spoken in SPECK. Success is using it as the daily work surface — dump work, see it as a tree (NEST) and as a status binder (PIPE), click-and-type to edit, and operate from one dock line — on a paper sheet that speaks, without cards, a cloud personality, or month-as-OS as home.

## Positioning

One work graph, two lenses. NEST is the outline; PIPE is the same nodes laid by status. The dock is an operator (commands + dump parser), not the place you type every title. Pixels are compiled from SPECK source, not a CSS component tree.

## Operating Context

- Frontend-only SPA (React host + canvas field). No backend, auth, or API.
- Persistence: SPECK source string in `localStorage` (`speck-os-v1`).
- Desktop field. Packaging as a native envelope is undecided; the envelope is not the product.
- Dev: `npm run dev` on port 5173 (`strictPort`).
- Daily driver. Sync, export, and sharing are undecided — do not invent them.

## Capabilities and Constraints

**In (locked):**

- Unified graph: `id`, `title`, `body?`, `status` (`backlog|active|staging|done|none`), `parent`, ordered children, `urgent?`.
- PIPE view: binder columns FOCUS (backlog / active) | GATEWAY (staging / done). Project plaques. In-place expand (rows reflow). Empty ledger lines create. Nest project selection filters the binder.
- NEST view: unix tree, expand/collapse, click-create/rename, indent/outdent, `[+]` adds a child. SHOVEL / status puts a node on the binder. CLIP-copy is dead.
- Field editor: native input over the active cell. TAB cycles `title → body → new subtask → status`. Space shovels / checks. Esc collapses.
- Dock: operator plus a read-only legend rail. Commands or a dump line (`new … project, title, need to …`). Legend HIT toggles `GRAIN` / `SCAN` / `INV`.
- Organs sit where `PLACE` says. `GLYPH` is free ink. Salt organs: `SEAL`, `SKULL`, `CAL` (month digits in a window; DUMP notes underline days). Organ `[x]` collapses that organ, not the app.

**Out:**

- Assignees, estimates, CRDT, PWA, harvest amber, cobalt lash, 3D knobs, second dock **input**, DateBlocks cards, month-as-OS as home, kanban cards, SaaS stacks.
- Calendar/globe/skull are in as salt organs, not as identity.
- BLACK LANTERN as maker, mark, or voice. That name is dead. Do not revive it.

**Undecided (do not invent):**

- Native packaging (Tauri / WebView or otherwise).
- Export, backup, or sync beyond `localStorage`.
- A formal accessibility standard beyond what the current keyboard and native dock input already do.

## Brand Commitments

- House: **BAD FORM**. Product: **VAULT WORLDWIDE**. In-house OS for project and task management.
- Locked visual world (user-pinned): office-sheet **paper ground** + pixel-GUI 1px black windows + IMP plaques, restamped onto paper / black / **power red**. Cobalt leaves.
- Oswald 700 on plaques. Helvetica Neue / Helvetica / Arial on work. Radius 0. SPECK remains the substrate.
- Voice: terse machine. Empty is `_`. No dashboard welcome.
- Visual law lives in `docs/LANGUAGE.md` and `.cursorrules`; this record does not replace it.

## Evidence on Hand

- Runtime: `src/speck` (lex / parse / compile / paint / hit).
- Canon: `docs/LANGUAGE.md`, `.cursorrules`, `docs/OVERNIGHT_PROMPT.md`.
- Pinned refs (session assets): office sheet, dark pixel GUI, ARPANET IMP.
- No testimonials, customers, pricing, or press. Do not invent them.

## Product Principles

1. Daily tool, one person, local-first.
2. One graph. Two lenses. No duplicate models.
3. Source is the program. If it cannot be said in SPECK, it is not in the work.
4. Click-and-type in the field; the dock operates.
5. Short verbs. No settings app. No cloud personality.
