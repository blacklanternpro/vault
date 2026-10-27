# BAD FORM — Design Language

**Canon.** Copy this file into another repo and the language still holds.
Short law for agents lives in `.cursorrules`. This file is the full tongue.
The built visual system — measured tokens, as shipped — lives in `DESIGN.md`.

Maker: **BAD FORM**. BLACK LANTERN is dead. First instance: **VAULT WORLDWIDE** — a local-first personal OS you run at a desk.

If a thing cannot be said in this language, it is not in the work.

---

## 0. The test

Before you add a feature, a colour, a font, a panel, a motion, a word:

1. Can it be said in **SPECK source**? (see §7)
2. Does it live on **the light field, one ink ramp, one blue accent, one danger red** — and nowhere else?
3. Is it the **category standard played straight**, or is it a costume smuggled in as personality?
4. Would Jake almost throw up? (DateBlocks, month-as-OS, a verb codebook, a dump-parser REPL, a second input, assignees and teams)
5. Do the two languages stay split? **A job is a card and a drawer. The catalogue is a plain tree.** Mixing their chrome is failure.

Fail any one: do not ship it.

---

## 1. World

The program lives on a **light field** — white chrome, one blue accent, hairline rules, quiet UI sans, uppercase plaques on names. It is the **category standard, played straight**, at the craft level of **Linear, Things, and Height**.

This was chosen deliberately, in an attended decision round, over four costumed worlds: a cassette-deck theatre, a paste-up mechanical, a film trim bin, a type galley. The user took the plain door on purpose. **The lack of costume is the position.** Conventions are embraced without irony and without smuggled quirk.

Read that as a licence for craft, not for blandness. Playing the standard straight means the standard has to be played *well*: geometry measured rather than estimated, contrast that holds, type that fits its box, motion that explains what moved. Every value in this world came off a pixel scan of an approved comp. That is the bar, and it is a harder bar than costume ever was — a costume hides a loose 4px, a white field does not.

Attitude survives in the **work**, not the chrome: terse machine voice, `_` for empty, uppercase job names, no dashboard welcome. The field is quiet so the graph is loud.

This instance is a **desktop** surface (~1440), rebuilt to one column below 900px. Phone chores live elsewhere — lists, a paper diary, TimeTree. It is not a PWA and not designed for a thumb. Packaging later is a boring native envelope (Tauri / WebView); the envelope is not the aesthetic.

---

## 2. Taste stack (locked)

Four layers. Do not flatten them into one costume — and do not add a fifth to make the field "interesting".

| Layer | Role | If you overdo it |
| --- | --- | --- |
| Light field | The plate. Near-white ground, white panels, hairline rules, 8px radius | Grey soup, nested boxes, card-in-card, drop shadows doing a border's job |
| Quiet type | The cut. One UI sans on work, one condensed face on plaques | Billboard headings, letterspaced body, four weights in one row |
| One accent | The signal. Blue for live, selected, found, primary | Rainbow status chips, a second brand colour, coloured backgrounds as decoration |
| Terse machine voice | The attitude. Uppercase names, `_` empty, counts not prose | Slogans, emoji, "Welcome back", apologetic empty states |

Attitude is **salt** and it belongs in the words. If the field itself is trying to be memorable, there is too much salt.

---

## 3. Tokens

`DESIGN.md` carries the shipped values. This section is what each token is *for*, which is the part that ports.

### Colour

| Token | Job |
| --- | --- |
| Ground | The field behind the panels |
| Surface | Panels, cards, drawer, top bar |
| Ink | Primary text and drawn marks that must read as text |
| Ink-2 | Secondary text: counts, parents, placeholders, ghost adds |
| Ink-3 | **The tint, and never text.** Glyph strokes, tree stems, disclosure marks |
| Line / Line-2 | Hairline separators, at two strengths |
| Accent | Live, selected, found, primary action |
| Accent wash / line | The accent at panel strength, for a found or selected plate |
| Urgent | URGENT, strike, destructive |

**The ink/tint law.** There are three inks and they are not interchangeable. Ink-2 is the floor for a **word** (4.5:1). Ink-3 is the floor for a **mark that carries meaning** (3:1) and is below what a word may be set in. A stem, a chevron, a magnifier strokes in ink-3; the moment a token carries a word, it moves to ink-2. This rule exists because it was broken once: the tint was carrying text at 3.1:1 and the review caught it.

**One accent.** Blue is live. Danger red is URGENT and strike. That is two signals and there is no third. If you need another colour, you are already lost.

**Status has colour only where a job is entered.** The board stays monochrome, so the lane a card sits in is what says its state. The status tokens exist and the drawer's plaque is where they are spent, naming the state in ink. Do not paint the board with them; that is a different composition, and composition is not yours to change.

### Type

Two faces, and the split is a rule, not a preference.

- **UI sans** (Inter-class; Public Sans on this instance) — all work: titles, body, subtasks, counts, the FIND line, the tree.
- **Condensed caps** (Sofia Sans Semi Condensed on this instance) — **plaques only**: lane names, job names on cards, drawer section labels. Nothing else shouts.
- No display faces. No monospace except the box-drawing stems, where the glyphs must join.

Size plaques and labels by **measured ink width**, not by a derived cap height: blur inflates the ink row of small caps by roughly 2px, which reads as a 20%-too-large font. Width is the honest signal.

### Surface

- 8px radius on cards, controls, and panels. One radius, used everywhere, or it is not a system.
- **Hairlines do the separating.** A 1px rule, not a shadow and not a heavy border.
- **Elevation is declared once, and only for something in the air.** A dragged copy gets a shadow because it is airborne. A resting card never does.
- **Nested work on a job is a boxed line.** Never `│ ├── └──`. Stems are the catalogue's alphabet and putting them on a job collapses the two languages into one.
- **Rows in the catalogue are plain.** Stems and a name. No boxes, no cards, no drawer chrome in the tree.
- No gradients, no glass, no blur, no grain, no scan overlay, no texture. The field is flat on purpose.

### Icons

Drawn inline SVG at one stroke weight, from one set. **No icon font, no emoji, no Unicode glyph characters as icons.** A `▸` next to `├──` reads as one more length of stem and the tree stops being legible — this is why the disclosure marks are drawn chevrons.

---

## 4. Composition

One field. Not a dashboard, not stacked billboards, not three apps in a trenchcoat, not a PWA, not mobile-first.

The board is the home. It does not become a month, a calendar, a canvas, or a REPL.

**VAULT instance (DOM field + SPECK save format):**

SPECK stores the graph (`NODE`, `NOTE`, status, indent). It is not a Forth/DOS taskmaster, not a paint engine, and not the product personality.

1. **One graph.** Every node: `id`, `title`, `body?`, `status` (`pending|rnd|active|done|dusted|none`), `parent`, ordered children, `urgent?`, `loose?`. Projects are roots (`parent` null). IDs live in source, not on the card.
2. **Top bar** — wordmark, one FIND field, filter chips, one primary action. FIND **searches only**. The chips filter; they do not create. The action creates a job. There is no second input anywhere in the product.
3. **Board** — five lanes divided by nothing but their own gaps: PENDING · R&D · ACTIVE · DONE · DUSTED. Lane head carries a plaque, a count, and a ghost add. A job is a card: uppercase plaque name, hairline, 8px radius. The lane a card sits in **is** its status. A card's one quick action is a hover chevron that puts it in the next lane along; at rest the board shows nothing but cards.
4. **Drawer** — selecting a job opens a panel at the right edge, over the board, so the lanes never reshuffle and the board never leaves the screen. It holds the status plaque, the title, the parent, `DESCRIPTION`, and `SUBTASKS` with ticks. Nested work here is **boxed lines**; `[+]` adds one.
5. **Pull and dock.** Drag a subtask out of the drawer onto a lane to make a `LOOSE` satellite card (the parent is unchanged). Drag a satellite — or a boxed line — onto a parent card to **dock it back**: it drops `LOOSE` and is a boxed line again. Physics A: moving a card takes its nested children; loose satellites stay put.
6. **Catalogue** — below the board, the same graph as a plain tree of everything: stems `│ ├── └──`, a drawn disclosure chevron, a block behind the live name. First click selects; second click / Enter renames. Trailing `_` adds a child. Indent/outdent. Drag a stem onto a lane to set status. Roots stay stems. No boxes, no cards, no board chrome.
7. **Dump tape** — txt notes as blocks beside the catalogue. Vertical snap-reorder, persisted. Pointer `_` adds a note. Drop a block on a card to hitch it (`→ TITLE`; `[x]` unhitches).
8. **The fold is cued.** A sliver of the catalogue stays on screen at every desktop height, so a field that carries on does not look like a field that ends. Pay the sliver out of dead ground, never out of a measured region.

A later agent may refine density **inside this world**. It may not bring back a costume, a second input, a month as home, a canvas field, assignees, teams, or the graveyard in §8.

---

## 5. Grammar (the marks)

These are the letters of the language. Use them. Do not invent a parallel alphabet.

- **Plaque** — uppercase condensed caps. Lane names, job names, drawer section labels. Nothing else.
- **Card** — white plate, hairline, 8px radius, plaque name. Its lane is its status. Not a deal card: no avatar, no assignee, no progress bar, no due pill.
- **Boxed line** — nested work on a job. Title on the line. Drawer and job only.
- **Stem** — `│ ├── └──`, computed from `parent`/children. Catalogue only. Set in the tint, at the row's own line-height so the verticals actually join.
- **Hairline** — the separator. One pixel. Not a shadow.
- **Accent wash** — the plate under a found or selected thing. Spread under the whole plate; never a wash *and* a stripe.
- **Shadow** — airborne only. A dragged copy, and nothing at rest.
- **Leash** — a slack filament from a dragged thing to where it came from. Sag at rest, tension on drag, settle after the drop. Never perfectly taut.
- **Tick** — the subtask's done mark. The filled tick is the whole signal; a done line keeps full-strength text, because greying the sentence too reads as cancelled rather than finished.
- **`_` empty** — ghost add rows, empty titles, inert slots. Not an apologetic empty state.
- **Strike** — mid-line on a killed row. Not grey `text-decoration`.
- **Dock** — drop a satellite or a boxed line onto a parent card. Inverse of pull. Drops `LOOSE`.
- **FIND** — the one search field. Not a codebook, not an operator bar.

### Motion

Motion exists to say **what moved**, and for nothing else.

- A card that changes lane by a verb **slides** there. Cutting to the result loses which card went where, and the cards that closed up behind it are part of the sentence.
- Something already flying its own landing must not also slide there. One thing arrives once.
- A drawer for a different job **arrives**; it does not cut.
- Every duration is answered by `prefers-reduced-motion`, which holds them to zero. The same code arrives instantly there.
- No entrance animations, no parallax, no attention-seeking loops.

---

## 6. What already works (do not throw away)

The VAULT field is a **React/DOM shell** over a **SPECK graph**. The live program is source. Do not restyle a dashboard kit and call that the OS.

- One FIND field (search).
- Persistence is the SPECK source string (`speck-os-v2` in `localStorage`).
- One graph; a job is a card plus a drawer; the catalogue is the plain tree; the dump tape is notes.
- SPECK lex / parse / serialize / machine in `src/speck`. Shell in `src/shell`. **`src/speck/machine.ts` behaviour is settled** — a visual pass does not change it.
- Tokens, geometry, and type in `src/index.css`, every value commented with why.

**What failed, and stays failed:** DateBlocks; the beige UN seal as the shell; Yjs CRDT as the database; month-as-OS as home; overlay CHIP dossiers; CLIP-as-copy; the cobalt lash; the dump-parser dock; the paper sheet with power-red oval and PLACE-able salt organs; the sit-down verb codebook; unix stems on job cards; the charcoal cassette theatre with VU/CRT costume and orange `#FF5C1A`. Every one of these was shipped once and rejected. Do not revive them, and do not revive them wearing a new name.

---

## 7. SPECK — the save format

SPECK is a real domain-specific language. It is not a metaphor. It is not a design-token rename.

It is **not** a general-purpose language (no Python-from-scratch, no LLVM, no stdlib). Cousins: PostScript, Forth, Logo, teletext, 3270.

On this instance SPECK is the **save format** for the work graph and dump. The field reads and writes source. The user never types SPECK to sit down.

The runtime lives in `src/speck`. It lexes, parses, serializes, and interprets graph edits. The live program is the source string.

### Feature dream rule

A new feature must be **sayable in SPECK**. If you cannot write it as source, it does not belong. Help Jake say it, or refuse the feature.

### 7.1 Source

Line-oriented. Indent (2 spaces) groups a body. Words are Forth-like. Case-insensitive opcodes; payloads keep their case. Comments: `//` or Forth `\` to end of line.

```
PIPE vault
  COL pending
  COL rnd
  COL active
  COL done
  COL dusted
NEST
  NODE 1 "site" status none
    NODE 10 "HOME PAGE" status active
      NODE 11 "lock type ramp" status active URGENT
      NODE 13 "still loop" status rnd LOOSE
        BODY "8s loop, no sting"
    NODE 30 "REPO" status pending
  NODE 2 "print" status none
    NODE 60 "RUN SHEET" status pending
DUMP
  NOTE 09.09.26 "type ramp 700 / 400"
```

**Tokens**

| Form | Example | Meaning |
| --- | --- | --- |
| word | `PIPE` `NODE` `SHOVEL` | opcode |
| string | `"type ramp 700 / 400"` | payload |
| tape date | `09.09.26` | `MM.DD.YY` on DUMP notes |
| number | `10` | id |

Empty storage loads the seed program. `CLEAR` restores seed. Seed does **not** include `PLACE`, `GLYPH`, `INV`, `GRAIN`, or `SCAN`.

### 7.2 Nouns (source)

| Noun | Says |
| --- | --- |
| `PIPE` | the lane rack (a *view* of the graph) |
| `COL` | `pending` `rnd` `active` `done` `dusted` |
| `NEST` | the catalogue tree of the same graph |
| `NODE` | a graph node: `id`, title, `status`, indent = parent, optional `LOOSE` / `URGENT` |
| `BODY` | optional body on the current node |
| `DUMP` | the note tape |
| `NOTE` | a dump txt line |

Dead as product chrome: `PLACE`, `GLYPH`, `INV`, `GRAIN`, `SCAN`, `SEAL`, `SKULL`, `CAL`, the `DOCK` legend. Legacy `TASK` / `STEM` lines still parse into `NODE`s, and `PLACE` / `GLYPH` / `INV` lines may still parse for old source; none of them are the product.

Lane-drop sets that card's status (nested follow; `LOOSE` stays). Shovel advances a card one lane. Dock-back drops `LOOSE` and reparents onto the target card. In the catalogue, `ON` / Space advances a node, or lifts `none` onto `pending`. FIND highlights matching titles in-session and **does not insert `NODE`s**.

### 7.3 Events

Pointer and keys belong to the shell. The host forwards into the machine.

```
HIT NODE 13
HIT ADD 10
HIT SHOVEL 13
FIND loop
```

HIT a card to open its drawer. HIT a title to type in it. HIT `[+]` to nest a boxed line. HIT a lane's ghost add to create a job. Drop a satellite on a parent card to dock. Never three forms. Never a verb bar.

### 7.4 Command field

FIND is **search**. One line, in the top bar. Titles are typed on the card, the drawer, or the row. Work is created by the lane's ghost add and the catalogue's `_`, not here.

- A bare line (or `/query`) highlights matching titles in-session.
- Pointer `_` on the tape appends a txt note. Hitch is a drop.
- `CLEAR` may remain source recovery in the machine; FIND submit does not run a codebook.
- Empty commit is a no-op.

### 7.5 Runtime contract

1. **The program is source.** `localStorage` key `speck-os-v2`. Ignore `speck-os-v1` and `speck-month-v1`.
2. **The shell is DOM** over parsed source + session. Session: selected node, tree expand, tree focus, `pipeOpen` (the open job), field slot, buffer, echo, find query, dump focus.
3. **Commits mutate source.** Stage, shovel, and lane-drop rewrite a status. Dock drops `LOOSE`. Editors rewrite title/body/notes. Lane adds and catalogue `_` insert nodes. The tape appends txt. Tape reorder rewrites note order. `CLEAR` restores seed. No worker. No CRDT. No JSON sidecar.
4. **Filters are session, not source.** A chip narrows what the board shows; it never edits the graph.

### 7.6 What SPECK is not

- Not CSS. Not a general-purpose language.
- Not a Forth/DOS REPL identity (`SEE` / `WORDS` / `#104` / dump-parser as the product).
- Not a reason to costume the field as a taskmaster or a canvas OS.
- Not a reason to add a settings app.
- Not a second palette, a HUD, or DateBlocks.
- Not a codebook the user types to sit down.

---

## 8. Hard vetoes

Never. Not as a joke. Not as a "just for desktop." Not as a dark-mode variant.

**Product**

- Assignees, avatars, teams, mentions, presence, "shared with"
- Estimates, story points, velocity, burndown, funnel money, KPI rows
- A second command input, a verb bar, three forms, an operator slab, a dump-parser dock
- FIND that creates work; a codebook typed to sit down
- Month-as-OS as home; DateBlocks; jagged day cards; stacked day modules
- CRDT, cloud personality, accounts, a settings app, JSON-as-database
- Demo fluff: `BUY MILK`, lorem, fake dashboards, cost-burn theatre

**Surface**

- Unix stems on a job card; boxes or cards in the catalogue tree; drawer chrome in the tree
- Card-in-card, rounded inside square, more than one radius
- Soft shadows or hard offset shadows doing a border's job; elevation on anything at rest
- Gradients, glass, blur, grain, scan overlays, texture, watermarks
- A second accent; rainbow status chips; coloured backgrounds as decoration; harvest amber; cobalt; power red `#E10600`; live orange `#FF5C1A`
- The tint carrying words; any text below 4.5:1; any meaningful mark below 3:1
- Icon fonts, emoji, Unicode glyph characters as icons
- Section billboards, giant boxed logos, kickers and eyebrows, letterspaced body copy
- Inter-as-plaque-face is fine; Oswald-as-work-type is not — plaques are plaques
- VT323, Orbitron, "sci-fi display" faces, green-on-black notes, amber boxed terminals

**Whole dead worlds** — each of these shipped once and was rejected. They are not directions to re-explore:

- Paper sheet + 1px organ windows + power-red oval + salt organs (CAL / SEAL / SKULL) + PLACE-drag + GRAIN/SCAN/INV legend rail
- Charcoal cassette theatre: black housing, chrome hairlines, jack holes, RECORD, transport plaques, VU meters, CRT wells, Oswald caps, orange `#FF5C1A`
- Beige/cream hi-fi faceplate as the shell; the beige UN seal identity
- NEXUS-HUD chrome: GRADE D panels, waveforms, tabs-as-apps, cyan-on-black tactical orchestrator
- Paper/black IMP canvas with a coincident-PLACE fold
- Matrix rain, Kali wallpaper, hoodie-hacker stock, `1337`, gradient ASCII wordmarks
- Vaporwave, synthwave, neon alley, Y2K chrome media-player skins
- Alien Isolation cosplay, chunky 3D knobs, heavy modular console bays
- Rave-flyer / Fidèle-maximal sleaze as the brand system
- Tailwind / v0 "editorial binder" templates; 2×3 card dashboards in a terminal skin

**Note the reversal.** Older canon vetoed "SaaS kanban chrome" as a look. That veto is **lifted for the look and only the look**: lanes, cards, filter chips and a detail drawer are the world now. It is not lifted for the product — the SaaS *stack* above (assignees, estimates, avatars, progress bars, "+ New Deal") stays vetoed, and that is the whole distinction. Take the composition; refuse the org chart.

---

## 9. Refs — take / leave

Mood is canon. Palette of the ref is usually not.

**Rule:** steal mechanics and craft, not costumes. On this world the refs are unusually literal — the point of the door is that it looks like the leaders — so the discipline moves from *how much to take* to *how well it is executed*.

### TAKE

- **Linear** — the whole composition: lane board, card, filter chips, right detail drawer, hairline density, one accent, the restraint of a monochrome board. Leave cloud, teams, cycles, assignees, estimates, triage.
- **Things 3** — first click selects; click empty to add; the tick as the whole signal; how little chrome a list needs. Leave Apple UI, areas, tags-as-taxonomy.
- **Height** — the graph as one thing seen through lenses; how a board and a list can be the same nodes. Leave chat, AI copilot theatre, the org surface.
- **Plain unix listing (ranger / nnn)** — the catalogue's alphabet: stems, a block behind the live name, nothing else. ranger/nnn density. Leave two-pane file-manager costume.
- **Scrivener** — the binder is the tree; the document is the work. Leave the compile pipeline.
- **iA Writer** — entering a job is writing. Chrome is the frame around it.
- **Muse / HyperCard** — go *into* the thing.

### LEAVE

- Assignees, teams, cycles, estimates, triage, inbox-zero theatre — every ref above has them and none of them are ours
- Any dark-studio, cassette, paper-sheet, or terminal costume (§8)
- Harvest amber, cobalt, power red, live orange — one blue is the accent
- Month-as-OS as home; DateBlocks
- CRM deal boards, ServerHub card dashboards, `NEXUS_OS` tactical chrome
- Tailwind / v0 template chrome
- Unix stems on job cards; boxed rows in the catalogue

Older canon still in force as **warning, not direction**: the Gemini neo-brutal TUI blueprint (engineering DNA, not the boxed-shadow look), the fried-TUI trail (PRs #8–#11), DateBlocks (PR #7), month-as-OS (PR #14, a recovery, not a destination), the paper IMP canvas, the cassette theatre. Each was a pass. None is home.

---

## 10. How to apply this to another project

1. Copy **this file**. Keep the test, the taste stack, the token *jobs*, the grammar, SPECK, the vetoes.
2. Copy the ink/tint law, the one-accent law, the two-face type split, and the elevation-once law verbatim. Those are the portable craft rules and they are the reason this world holds up.
3. Change **world content** only: what the field shows, what FIND searches.
4. Do not change the substrate into a CRM because "this product is a dashboard." If it cannot live as one graph seen through a board and a tree, with one search field, it is a different language — do not pretend it is this one.
5. Point `.cursorrules` at this file. Keep `.cursorrules` short. Agents read the short law; humans and long agents read this. `DESIGN.md` carries the measured values and is written *after* a build, from the build.
6. If you need a third colour, you are already lost. One blue and one danger red are the two signals.
7. **Playing the standard straight is not permission to be careless.** Measure the geometry, hold the contrast floors, size type by ink width, and make motion explain what moved. A quiet world shows every loose value.

**VAULT-specific content (this repo):** light DOM field; SPECK as save format; one graph; top bar with one FIND and one primary action; five-lane board of cards; right detail drawer with boxed nest; plain-stem catalogue below the fold; dump tape; pull / dock / shovel; persistence `speck-os-v2`. Maker BAD FORM. No assignees. No teams. No second input. No costume.

---

## 11. Voice

Write like a terminal that went to art school for one semester and dropped out.

- Terse. Uppercase where the machine would shout.
- No "welcome to your dashboard."
- No empty states that apologize. Empty is `_` or a ghost add.
- Counts, not prose. `4` beats "You have 4 tasks."
- Work files as nouns: `type_ramp.md`, `hero_still.tif`, `still_loop.mov`.
- Maker mark: BAD FORM. Product mark: VAULT WORLDWIDE.

The voice is where the attitude lives now that the chrome is quiet. Do not sand it down to match the field.

---

## 12. Authority

Further from the norm. Firmly in utility. Order from chaos.

On this world, *further from the norm* is spent on **craft**, not on costume. The composition is settled and approved; the ambition goes into how well it is executed.

Propose bold changes inside this language. Do not propose a new language because a canvas painter was easier, a CRM kit was closer, or a costume seemed more expressive than a white field.

Full short law: `.cursorrules`
Built values: `DESIGN.md`
Product truth: `PRODUCT.md`
This file: the canon.
