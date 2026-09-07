# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Jake. One person. Daily desk use for project and task work. Phone chores (lists, TimeTree, paper) already live elsewhere. Not a SaaS team, not a store product, not a grocery-list demo.

## Product Purpose

VAULT WORLDWIDE is BAD FORM’s in-house OS: a local-first project and task management system you run as a program on a desktop, spoken in SPECK. Success is using it as the daily work surface — dump work, see it in the binder and the nest, operate from one dock line — without cards, a cloud personality, or month-as-OS as home.

## Positioning

One field, one work program. PIPE is the status binder; NEST is the unix pit; DUMP is scratch tape. Pixels compile from SPECK source, not a CSS component tree. The dock is the operator. Neighboring products (Linear, Notion, phone list apps) cannot truthfully claim this mechanism.

## Operating Context

- Frontend-only SPA (React host + canvas field). No backend, auth, or API.
- Persistence: SPECK source string in `localStorage` (`speck-os-v1`).
- Desktop field. Packaging as a native envelope is undecided; the envelope is not the product.
- Dev: `npm run dev` on port 5173 (`strictPort`).
- Daily driver. Sync, export, and sharing are undecided — do not invent them.

## Capabilities and Constraints

**In (current machine):**

- PIPE: split-page binder, FOCUS (backlog / active) | GATEWAY (staging / done). `SHOVEL` advances a task. Empty ledger rows stay.
- NEST: unix pit of stems. `CLIP` a stem into PIPE as a TASK.
- DUMP: scratch tape (`NOTE`).
- HIT a TASK opens a dossier from that row; tap row / field / other organ to dismiss.
- Organs sit where `PLACE` says. `GLYPH` is free ink. One one-line dock, locked to the viewport bottom.

**Out:**

- Assignees, estimates, CRDT, PWA, DateBlocks, kanban cards, SaaS stacks, a second dock input, month-as-OS as home.
- BLACK LANTERN as maker, mark, or voice. That name is dead. Do not revive it.

**Undecided (do not invent):**

- Native packaging (Tauri / WebView or otherwise).
- Export, backup, or sync beyond `localStorage`.
- A formal accessibility standard beyond what the current keyboard and native dock input already do.

## Brand Commitments

- House: **BAD FORM**. Product: **VAULT WORLDWIDE**. In-house OS for project and task management.
- Voice: terse machine. Empty is `_`. No dashboard welcome.
- SPECK remains the substrate. Visual law lives in `docs/LANGUAGE.md` and `.cursorrules`; this record does not replace it.

## Evidence on Hand

- Runtime: `src/speck` (lex / parse / compile / paint / hit).
- Canon: `docs/LANGUAGE.md`, `.cursorrules`, `docs/OVERNIGHT_PROMPT.md`.
- No testimonials, customers, pricing, or press. Do not invent them.

## Product Principles

1. Daily tool, one person, local-first.
2. Source is the program. If it cannot be said in SPECK, it is not in the work.
3. Binder and nest are lenses on the same field, not two apps.
4. The dock operates; the field is the work.
5. Short verbs. No settings app. No cloud personality.
