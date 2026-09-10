# OVERNIGHT PROMPT — paste this into a future agent

**The costume era is over.** The visual world is the **category standard played straight** — a light field, one blue accent, hairlines, lanes of cards, a right detail drawer. It was chosen in an attended decision round, against four costumed alternatives, by a user who took the plain door on purpose. Do not re-roll a world. Do not put a costume back on.

**Dead as home and dead as direction:** month-as-OS, DateBlocks, the charcoal cassette theatre, the paper/IMP canvas with salt organs, harvest amber, cobalt, power red, live orange, the dump-parser dock, DOS `#id` ledgers, the sit-down verb codebook. Keep **SPECK** as the save format (graph + dump source), not a Forth REPL and not a paint compositor identity. Persistence is SPECK source (`speck-os-v2`), not a task CRDT, not JSON-as-database.

Maker is **BAD FORM**. BLACK LANTERN is dead. Product stays **VAULT WORLDWIDE**.

This is a **later-run** brief. The language is written. Graph ops live in `src/speck`. The shell lives in `src/shell`. Do not ignore `docs/LANGUAGE.md` — it is canon. Product truth: `PRODUCT.md`. Measured values as shipped: `DESIGN.md`.

Read this whole file. Then read `docs/LANGUAGE.md`. Then read `.cursorrules`. Then look at the current shell. Then go.

---

## Mission

Grasp the vision. Put the spin on the **craft**, not on the costume. Go further from the boring. Stay utility.

You are building **VAULT WORLDWIDE** — a local-first personal OS at a desk. Desktop. Not a phone PWA. Not a website. Not a SaaS.

Jake spent months fighting agents that translated his vision into DateBlocks, then a DOS/IMP taskmaster, then a dressed Manager with a verb codebook, then a cassette deck. Then he was offered four more costumes and he refused all of them, named **Linear, Things and Height** as the craft bar, and picked the plain board. Read that as the strongest instruction in this file: **he does not want a world invented for him. He wants this one built impeccably.**

So the ambition moves. It is not "what world could this be" any more. It is: is the geometry measured or estimated, does the contrast hold, does the type fit its box, does the motion say what moved, does the thing work at 390px as well as 1440. A costume hides a loose 4px. A white field does not.

**Tonight:** stay inside the world. Keep the two languages split. Do not add a second input. Do not add assignees. Do not make it a month. Do not put stems on a card or boxes in the tree.

If Jake only wanted language docs, they are already in this repo. You are here to *use* them.

---

## Who this is for

Jake / BAD FORM. Personal OS. Not a store product. Not a SaaS. Local-first, no cloud personality. Work / lab / field — for **making**, not a grocery-list demo. Phone chores live elsewhere (homescreen list, paper diary, TimeTree). Daily driver: sit down to make. Pointer-first.

---

## Canon (read in this order)

1. **`docs/LANGUAGE.md`** — the grand language. Tokens, grammar, motion law, vetoes, SPECK save format. **Primary.**
2. **`.cursorrules`** — short law. Obey it. It points here.
3. **`DESIGN.md`** — the shipped visual system, measured off the approved comp. Values live here; *rules* live in LANGUAGE.md.
4. **Current shell** — `src/App.tsx` hosts `<Studio />`. Runtime graph is `src/speck`. Layout is top bar / board / drawer, then catalogue + dump tape below the fold.
5. **History** — every rejected pass, kept as warning, not direction: Gemini neo-brutal TUI; PRs #8–#11 (fried TUI → burn the box); PR #7 DateBlocks; PR #14 month field (a recovery, not home); the paper/IMP canvas; the charcoal cassette theatre; PR #25 paste-up mechanical (parked, unmerged, nothing carried over).
6. **The locked world** — light field, one blue accent, hairlines, 8px radius, one UI sans on work and one condensed face on plaques. Lanes of cards. Right drawer. Plain-stem catalogue. No costume.

---

## Locked tokens

- Near-white ground, white surface, hairline rules at two strengths
- Three inks, and they are **not** interchangeable: ink for primary, ink-2 as the floor for a **word** (4.5:1), ink-3 as the tint for a **mark** (3:1) — stems, chevrons, glyph strokes — and never text
- One blue accent: live, selected, found, primary. Plus an accent wash for a found or selected plate
- One danger red: URGENT, strike, destructive
- Status tokens exist and are spent **in the drawer only** — the board stays monochrome so the lane says the state

One UI sans (Inter-class) on all work. One condensed face on **plaques only** — lane names, job names, drawer labels. One 8px radius. No amber. No cobalt. No power red `#E10600`. No orange `#FF5C1A`. No third colour.

Exact values are in `DESIGN.md`, and they were measured, not chosen. If you change one, measure it.

---

## Composition law

Desktop ~1440, rebuilt to one column below 900px. One FIND field (search only). One graph. Two languages that must not mix:

1. **Top bar** — wordmark, FIND, filter chips, one primary action. FIND searches; it never creates. Chips filter the session, never the source. There is no second input anywhere in the product.
2. **Board** — five lanes PENDING · R&D · ACTIVE · DONE · DUSTED. Lane head = plaque + count + ghost add. A job is a card: plaque name, hairline, 8px. The lane a card sits in **is** its status. One quick action: a hover chevron shoves it to the next lane. At rest the board is nothing but cards.
3. **Drawer** — selecting a job opens a panel at the right edge, **over** the board, so the lanes never reshuffle and the board never leaves the screen. Status plaque, title, parent, DESCRIPTION, SUBTASKS with ticks. `[+]` adds a boxed line. Nested work here is boxed lines, never stems.
4. **Pull and dock** — drag a subtask onto a lane for a `LOOSE` satellite (parent unchanged); drop a satellite or boxed line on a parent card to dock it back (drops `LOOSE`). Physics A: card moves, nested follow, loose stay. Slack leashes sag, tighten on drag, settle after the drop.
5. **Catalogue** — below the board, the same graph as a plain tree: stems `│ ├── └──`, a drawn disclosure chevron, a block behind the live name. First click selects; second click / Enter renames. `_` adds a child. Indent/outdent. Drag a stem to a lane to set status. No boxes, no cards, no board chrome.
6. **Dump tape** — txt notes as blocks beside the catalogue. Snap-reorder, persisted. Drop a block on a card to hitch it.
7. **The fold is cued** — a sliver of the catalogue stays on screen at every desktop height. Pay it out of dead ground, never out of a measured region.
8. **Motion says what moved.** A card that changes lane by a verb slides there and the cards behind it close up. One thing arrives once — something already flying its own landing must not also slide. A drawer for a different job arrives, it does not cut. Every duration is zero under `prefers-reduced-motion`.

You may refine density and craft. You may not add a second input, assignees, teams, estimates, a month home, a canvas field, stems on a card, boxes in the tree, a second accent, or any costume from the graveyard.

---

## Hard vetoes

**Product:** assignees · avatars · teams · presence · estimates · story points · progress bars · "+ New Deal" · KPI rows · a second command input · verb bar · operator slab · dump-parser dock · FIND that creates · a typed codebook to sit down · month-as-OS as home · DateBlocks · CRDT · JSON-as-database · settings app · demo fluff (`BUY MILK`, lorem, cost-burn theatre)

**Surface:** unix stems on a card · boxes or cards in the catalogue · card-in-card · a second radius · shadows doing a border's job · elevation at rest · gradients / glass / blur / grain / scan / watermarks · a second accent or rainbow status chips · the tint carrying words · text under 4.5:1 · icon fonts, emoji, Unicode glyphs as icons · section billboards · kickers · letterspaced body · Oswald-as-work-type · VT323 / Orbitron · green-on-black or amber terminals

**Dead worlds:** paper sheet + organ windows + power-red oval + salt organs + PLACE-drag + GRAIN/SCAN/INV rail · charcoal cassette theatre (housing, jacks, RECORD, transport, VU, CRT wells) · beige/cream hi-fi faceplate · beige UN seal · NEXUS HUD · paper/black IMP canvas · Matrix/Kali costume · vaporwave/Y2K skins · rave-flyer sleaze as the system · BLACK LANTERN as maker

**Note the reversal.** The old "SaaS kanban chrome" veto is lifted **for the look and only the look** — lanes, cards, chips and a drawer are the world now. The SaaS *stack* stays vetoed. Take the composition; refuse the org chart.

Full list: `docs/LANGUAGE.md` §8.

---

## What already works (keep)

- SPECK graph in `src/speck` (lex / parse / serialize / machine). **`machine.ts` behaviour is settled — a visual pass does not touch it.**
- One graph; board cards + drawer + catalogue tree + dump tape
- The open job via `session.pipeOpen`; dock via `dockCard` (drops `LOOSE`); shovel advances a lane
- Source as program (`speck-os-v2`)
- Shell in `src/shell`; tokens, geometry and type in `src/index.css`, every value commented with why
- `useBoardFlip.ts` — the lane-change slide. `Filament.tsx` — the slack leash. Both zeroed under reduced motion.

Do not throw SPECK away. Do not rebuild a dump-parser. Do not make the month the OS. Do not restore the canvas field. Do not mix the two languages.

---

## User voice (do not sand this down)

- "whatever you do dont have the disgusting date blocks… i almost threw up"
- "The whole verb thing is stupid"
- "BLACK LANTERN is dead. BAD FORM rises."
- "This is now its own lil os, not a stack of style sheets and sections"
- "craft something out of the raw ether to run as an actual program"
- "I want this to be a primarily project management - task tracker custom OS"
- **"linear, things, height"** — the craft bar, named when asked what this should sit alongside
- **"board"** — the composition, picked from three
- "canon" — picked over four costumed worlds, twice offered

The last three are the newest and the most binding. He was handed costume after costume and asked for the plain thing, built properly.

Further from the norm. Firmly in utility. Order from chaos. On this world, *further from the norm* is spent on craft.

---

## Authority

Propose and make bold changes **inside the language**.

Do not propose a new palette. Do not propose a new world. Do not revive DateBlocks, the cassette, the paper canvas, or the NEXUS HUD with VAULT stamped on it. Do not put stems on a card. Do not box the catalogue. Do not add a second input.

New features must be SPECK-sayable as source.

When in doubt: light field, one blue on the live thing, plaque caps on names, hairlines not shadows, boxed nest on the job, stems in the catalogue, one FIND, empty is `_`, and measure before you ship a number.

Go.
