# BLACK LANTERN — Design Language

**Canon.** Copy this file into another repo and the language still holds.
Short law for agents lives in `.cursorrules`. This file is the full tongue.

Maker: BLACK LANTERN. First instance: **VAULT WORLDWIDE** — a local-first personal OS you run as a program on a desktop, not a website you visit, not a phone PWA.

If a thing cannot be said in this language, it is not in the work.

---

## 0. The test

Before you add a feature, a color, a font, a panel, a motion, a word:

1. Can it be said in **SPECK source**? (see §7)
2. Does it live on **charcoal / slate / off-white / live orange / danger red** — and nowhere else?
3. Is it **utility** wearing attitude, or attitude wearing a fake tool?
4. Would Jake almost throw up? (DateBlocks, SaaS kanban chrome, boxed amber terminals, paper/IMP canvas OS)

Fail any one: do not ship it.

---

## 1. World

The program lives in a **dark studio** — a desk at night, slate depth, quiet type, live orange and danger red. Not a paper sheet. Not a pixel-GUI organ field. Not a SaaS dashboard.

Attitude: slightly illegal, slightly glamorous, still a tool. Sleaze and grime are **salt**. If the studio looks like a title card or a CRM, there is too much costume.

This instance is a **desktop studio**. Phone lists, TimeTree, and paper diaries already exist. Do not design for a thumb. Packaging later is a boring native envelope (Tauri / WebView). The envelope is not the aesthetic.

Cassette futurism, IMP plaques, and 1px black windows are **anti-reference** on this instance. Steal inset wells, taut needles, and plaque labels. Do not stamp Oswald plaques, cream faceplates, or 3D knobs back onto the field.

---

## 2. Taste stack (locked)

Four layers. Do not flatten them into one costume.

| Layer | Role | If you overdo it |
| --- | --- | --- |
| Dark studio | The plate. Charcoal field, slate cards, off-white type | CRM dashboard, KPI row, avatars, “+ New Deal” |
| Quiet type | The cut. Helvetica, hairlines, racked wells | Billboard section titles, Oswald identity, CICS ledger |
| A little sleaze | Salt. Orange name-block, taut filament, WORLDWIDE ® echo | Rave flyer, Fidèle-maximal, slogan-tee graphics |
| Echo of hacker grime | Salt. Unix nest, uppercase job titles, `_` empty | Matrix rain, Kali wallpaper, hoodie-hacker stock, `1337` |

Sleaze and grime are **salt**. If the field looks like a title card, there is too much salt.

---

## 3. Tokens

### Color

| Token | Job |
| --- | --- |
| Ground | Charcoal studio field |
| Panel / card | Slate steps above ground |
| Ink | Off-white work type |
| Muted | Secondary count, stems, ghosts |
| Hair | Quiet separators |
| Highlighter | URGENT, strike, CLEAR-class danger |
| Live orange | Directory selection, FIND mark, filament, live caret |

Two signals. Strike and URGENT use danger red. Live work uses orange `#FF5C1A`. Not IMP `#E10600`. Cobalt has left. Harvest amber is forbidden as identity. `INV` / paper invert is not the identity. Cream cassette is not the OS plate.

### Type

- **Helvetica Neue / Helvetica / Arial** — the only family. Manager, directory, scratch, FIND.
- No Oswald as identity. No JetBrains. No Space Grotesk. No Inter. No VT323. No Orbitron.

### Surface

- Modest radius (~10px) on project cards and scratch blocks. Not 24–32px SaaS bowls. Not radius 0 as a religion.
- No soft shadows. No gradients. No blur. No glass. No grain/scan overlay.
- Selection in the directory: safety-orange block **behind the name**. Not CHIP+oval. Not an overlay dossier. PM GUI never draws nest stems.

---

## 4. Composition

One studio. Not a dashboard. Not stacked billboards. Not three apps in a trenchcoat. Not a PWA. Not mobile-first.

Manager is fixed on **top**. Directory is fixed **under it**. Scratch is a **right sidebar** (~320px) with FIND at the top. Those three regions do **not** drag. Scratch **blocks** snap-reorder vertically. Never a second `<input>` as a dock slab. Never three forms.

**VAULT instance (DOM studio + SPECK save format):**

SPECK stores the graph (`NODE`, `NOTE`, status, indent). It is not a Forth/DOS taskmaster, not a paint engine, and not the product personality.

1. **One graph.** Every node: `id`, `title`, `body?`, `status` (`pending|rnd|active|done|dusted|none`), `parent`, ordered children, `urgent?`, `loose?`. Projects are roots (`parent` null). IDs live in source, not on the card.
2. **Manager** — one project at a time. Five racked wells: PENDING · R&D · ACTIVE · DONE · DUSTED. Job cards (uppercase) with an inset nested well. Click body to add a nested subtask (sentence case). First nested promotes PENDING → ACTIVE. Drag a nested row onto a lane to pull a `LOOSE` satellite; parent stays. Physics A: card moves, nested follow, loose stay, taut filament stretches. Ghost `+` in PENDING creates a job. Click title to rename. Modest fasteners / hairline bezels. Not kanban chrome. Not nest stems.
3. **Directory** — the same graph as a naked unix tree of the entire catalogue. Stems `│ ├── └──`. Orange block behind the live name. Click name to rename. Trailing `_` adds a child. Indent/outdent. Space / shovel stages a node onto the manager (`none` → `pending`, or advance). CLIP-copy is dead.
4. **Scratch** — txt notes as blocks. Vertical drag, snap into place, others shift. Persist order on `Doc.notes`. Ghost `_ LINK` / `_ PIC` / `_ FILE` stay inert. Hitch `NODE id` on a note is parked, not product identity.
5. **FIND / NOTE** — one command field, top of the sidebar. Bare line searches titles (session highlight). When a scratch txt block is focused, a line appends a note. `CLEAR` restores seed. No DOS `>` operator bar. No legend rail. No `MOVE` / `GLYPH` as product chrome.
6. **No salt organs.** CAL, SEAL, SKULL are out. Organ `PLACE`-drag is out. Grain / scan / INV-as-paper are out.

A later agent may refine density **inside this studio**. It may not bring back DateBlocks cards, month-as-OS as home, beige cassette as the OS identity, paper/IMP canvas, a Tailwind binder dashboard, harvest amber, cobalt, CLIP-copy, or a second command input.

---

## 5. Grammar (the marks)

These are the letters of the language. Use them. Do not invent a parallel alphabet.

- **Orange block** — safety-orange field behind the live directory name. FIND mark uses the same orange. Not a rounded pill overlay covering neighbors.
- **Danger red** — URGENT titles, strike, CLEAR-class.
- **Job card** — slate fill, ~10px radius, uppercase title, inset nested well. Not a SaaS deal card. Not nest stems.
- **Filament** — taut glowing line from jack-dot to jack-dot. Not a sagging brass cable.
- **Hairline** — thin rules, rack bezels. Not 3px neo-brutal drop shadows.
- **ASCII stems** — `│ ├── └──` for the directory only. Prefixes computed from `parent` / children.
- **`_` empty** — ghost add row, ghost media slots, empty titles. Not an apologetic empty state.
- **Strike** — highlighter mid-line on done if a row needs it. Not `text-decoration` grey.
- **Shovel** — Space (and in-row stage) advances a node through the wells (or from `none` onto `pending`). Cards also drag between wells.
- **FIND** — the one command field. Not a `>` DOS slab.

---

## 6. What already works (do not throw away)

The VAULT studio is a **React/DOM shell** over a **SPECK graph**. The live program is source. Do not restyle a dashboard kit and call that the OS. Do not restore the canvas organ field and call that craft.

- One FIND/NOTE field.
- Persistence is the SPECK source string (`speck-os-v2` in localStorage).
- One graph; manager is stage cards; directory is the unix tree. Scratch is notes.
- SPECK lex / parse / serialize / machine in `src/speck`. Shell in `src/shell`.

What failed: DateBlocks, the beige UN seal as the OS shell, Yjs CRDT as the database, month-as-OS as the destination, HTML/Tailwind kanban chrome, overlay CHIP dossiers, CLIP-as-copy, cobalt lash, dump-parser dock, paper/black IMP canvas with PLACE-able salt organs. Dead. Do not revive them.

---

## 7. SPECK — the save format

SPECK is a real domain-specific language. It is not a metaphor. It is not a design-token rename.

It is **not** a general-purpose language (no Python-from-scratch, no LLVM, no stdlib). Cousins: PostScript, Forth, Logo, teletext, 3270.

On this instance SPECK is the **save format** for the work graph and dump. The studio reads and writes source. Canvas compile/paint/PLACE may still exist as library code; they are not the product path.

The runtime lives in `src/speck`. It lexes, parses, serializes, and interprets FIND / NOTE / CLEAR / SHOVEL / graph edits. The live program is the source string.

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

Empty storage loads the seed program. `CLEAR` restores seed.

Seed does **not** include `PLACE SEAL|SKULL|CAL`, `GLYPH VAULT`, `INV`, `GRAIN`, or `SCAN`.

### 7.2 Nouns (source)

| Noun | Says |
| --- | --- |
| `PIPE` | project manager columns (a *view* of the graph) |
| `COL` | `pending` `rnd` `active` `done` `dusted` |
| `NEST` | unix directory of the same graph |
| `NODE` | a graph node: `id`, title, `status`, indent = parent, optional `LOOSE` / `URGENT` |
| `BODY` | optional body on the current node |
| `DUMP` | scratchpad |
| `NOTE` | a dump txt line |

Dead as product chrome: `PLACE`, `GLYPH`, `INV`, `GRAIN`, `SCAN`, `SEAL`, `SKULL`, `CAL`, `DOCK` legend. Legacy `TASK` / `STEM` lines still parse into `NODE`s. `PLACE` / `GLYPH` / `INV` lines may still parse for old source; they are not the studio.

`CLEAR` restores seed. In-directory `SHOVEL` / Space advances a node (or lifts `none` onto `pending`). Manager lane-drop sets that card’s status (nested follow; `LOOSE` stays). FIND highlights matching titles in-session. The FIND line does not insert `NODE`s.

### 7.3 Events

Pointer and keys belong to the studio. The host forwards into the machine.

```
HIT NODE 13
HIT ADD 10
HIT SHOVEL 13
FIND loop
NOTE "type ramp 700 / 400"
CLEAR
```

HIT a card body to add a nested subtask. HIT a title to rename. HIT `+` to create a job. Never three forms. Never CTX chips in a header.

### 7.4 Command field

FIND is the **command field**. One line, top of the scratch sidebar. Titles are typed on the card or row. Work is created in empty lanes and directory `_`, not here.

- If the line **parses as a command** (`CLEAR`, `FIND`, `NOTE`): execute it.
- `FIND query` (or a bare line, or `/query`) highlights matching titles in-session. `NOTE "…"` appends a txt line.
- When a scratch txt block is focused, a bare line appends a txt note.
- Else a bare line is search, never a project tree.
- Empty commit is a no-op.

Examples: `FIND loop` · `NOTE type ramp 700 / 400` · `CLEAR`

### 7.5 Runtime contract

1. **The program is source.** `localStorage` key `speck-os-v2`. Ignore `speck-os-v1` and `speck-month-v1`.
2. **The studio is a DOM shell** over parsed source + session. Session: selected node, nest expand, nest focus, field slot, buffer, echo, find query, dump focus.
3. **Commits mutate source.** Shovel and lane-drop rewrite a node status. Editors rewrite title/body/notes. Empty lanes and directory `_` insert nodes. `NOTE` appends txt. Scratch reorder rewrites note order. `CLEAR` restores seed. No worker. No CRDT. No JSON sidecar. FIND does not parse work trees.
4. **No CLIP, DateBlocks cards, cobalt theme, month-as-OS home, salt organs, or organ PLACE-drag** on this instance.

Packaging (when asked): boring envelope (Tauri / WebView). Desktop. The envelope is not the aesthetic.

### 7.6 What SPECK is not

- Not CSS.
- Not a general-purpose language.
- Not a Forth/DOS REPL identity (`SEE` / `WORDS` / `#104` / dump-parser as the product).
- Not a reason to costume the four tools as a CICS taskmaster or a canvas OS.
- Not a reason to add a settings app.
- Not a second palette, a HUD, DateBlocks, or a Tailwind binder dashboard.

---

## 8. Hard vetoes

Never. Not as a joke. Not as a “just for desktop.” Not as a dark-mode variant.

- DateBlocks, jagged day cards, stacked day modules
- SaaS stacks: avatars, KPI rows, chat panes, funnel money, progress bars, “+ New Deal”
- Harvest amber, charcoal leather *as costume*, HTML notebook skins
- Acid watermarks, giant boxed logos, section billboards (`PIPE // vault`, `CALENDAR` / `TO-DO` as monuments)
- Header CTX chips, PROJECTS / ROSTER / FLEET / LOGS as a mode bar
- Inter, VT323, Orbitron, Oswald-as-identity, “sci-fi display” fonts
- Green-on-black notes, amber boxed terminals, phosphor takeover
- Three input forms
- Demo fluff (`BUY MILK`, lorem, fake dashboards, cost-burn theatre)
- Alien Isolation cosplay, chunky 3D knobs, VU meters as KPIs, brass patch-cables, PM nest stems
- Cream cassette / beige hi-fi as the OS plate (steal inset wells only)
- Vaporwave, synthwave, neon alley, Y2K chrome media-player skins
- Heavy modular console of adjacent hardware bays
- Matrix rain, Anonymous masks, hoodie-hacker stock, `1337`, Kali wallpaper
- Rave-flyer / Fidèle-maximal sleaze as the brand system
- NEXUS-HUD chrome: GRADE D panels, waveforms, tabs-as-apps, cyan-on-black tactical orchestrator
- 2×3 card dashboards in a terminal skin
- l33t CLI costume (gradient ASCII wordmarks, emojis, “cyber king”)
- Paper sheet + 1px organ windows + power-red oval as the OS identity
- Salt organs CAL / SEAL / SKULL
- Organ PLACE-drag of the main sections
- Dump-parser dock, DOS `>` operator slab, legend rail GRAIN/SCAN/INV

Quiet project cards with modest radius are **in**. DateBlocks and SaaS kanban chrome are **out**.

---

## 9. Refs — take / leave

Mood is canon. Palette of the ref is usually not.

**Rule:** steal slate depth, quiet card type, and the naked directory’s highlighter-block selection. Do not clone KPI dashboards.

### TAKE

- **Dark studio slate** — depth via value steps, not shadows. Quiet cards. Type does the work.
- **Naked unix directory** — stems, highlighter behind the live name, nothing else.
- **Linear / Things / OmniFocus (stolen, not cloned)** — project + issue + sub-issue; click empty to add; outline is the document. Leave cloud, Apple UI, karma, board chrome, dump-parser-as-OS.
- **ranger / nnn** — arrows, enter expand. Leave two-pane file-manager costume.

### LEAVE

- Office-sheet / pixel-GUI / IMP as the OS chrome
- Harvest amber, cobalt as the lash, DateBlocks
- Month-as-OS as home
- Beige UN seal as the OS identity
- Green-on-black Matrix Android launcher
- Arch ricing (mauve/teal/mustard, anime fetch, glass hover)
- ServerHub 2×3 card dashboard, CRM deal boards
- Any `NEXUS_OS v5.0 tactical orchestrator` chrome
- Tailwind / v0 “editorial binder” templates
- Dump-parser dock, `#id` checkbox ledger

Older canon still in force as warning: Gemini neo-brutal TUI blueprint (engineering DNA, not the boxed-shadow look), fried TUI / burn-the-box trail (PRs #8–#11). DateBlocks from PR #7 are a warning, not a direction. Month-as-OS (PR #14) was a recovery, not the destination. Paper IMP canvas was a pass, not the destination.

---

## 10. How to apply this to another project

1. Copy **this file**. Keep tokens, vetoes, grammar, SPECK, taste stack.
2. Change **world content** only: what the studio shows, what FIND commits.
3. Do not change the substrate into a CRM because “this product is a dashboard.” If it cannot live as manager + directory + scratch + one field, it is a different language — do not pretend it is this one.
4. Point `.cursorrules` at this file. Keep `.cursorrules` short. Agents read the short law; humans and long agents read this.
5. If you need a third color, you are already lost. Live orange and danger red are the two signals.

**VAULT-specific content (this repo):** dark DOM studio; SPECK as save format; one graph; racked manager; unix directory; scratch blocks (txt this pass); FIND/NOTE; persistence `speck-os-v2`. No DateBlocks. No month-as-OS home. No amber binder. No cobalt. No dump-parser dock. No salt organs. No PLACE-drag of sections.

---

## 11. Voice

Write like a terminal that went to art school for one semester and dropped out.

- Terse. Uppercase where the machine would shout.
- No “welcome to your dashboard.”
- No empty states that apologize. Empty is `_` or `empty/`.
- Work files as nouns: `type_ramp.md`, `hero_still.tif`, `still_loop.mov`.
- Maker mark: BLACK LANTERN. Product mark: VAULT WORLDWIDE.

---

## 12. Authority

Further from the norm. Firmly in utility. Order from chaos.

Propose bold changes inside this language. Do not propose a new language because a canvas painter was easier, or because a CRM kit was closer.

Full short law: `.cursorrules`
This file: the canon.
