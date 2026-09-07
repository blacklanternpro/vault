# BLACK LANTERN — Design Language

**Canon.** Copy this file into another repo and the language still holds.
Short law for agents lives in `.cursorrules`. This file is the full tongue.

Maker: BLACK LANTERN. First instance: **VAULT WORLDWIDE** — a local-first personal OS you run as a program on a desktop, not a website you visit, not a phone PWA.

If a thing cannot be said in this language, it is not in the work.

---

## 0. The test

Before you add a feature, a color, a font, a panel, a motion, a word:

1. Can it be said in **SPECK**? (see §7)
2. Does it live on **field / paper / power red** — and nowhere else?
3. Is it **utility** wearing attitude, or attitude wearing a fake tool?
4. Would Jake almost throw up? (DateBlocks, cards, SaaS stacks, boxed amber terminals)

Fail any one: do not ship it.

---

## 1. World

The program lives in **cassette futurism** — a 1970s–late-80s analog future. CRT readouts. Tape. Membrane keys. Industrial labels. Beige plastic. Worn metal. Phosphor. Red warning LEDs. You plug in. There is no wifi as a personality. The computer is a **machine**.

Canon board: [cassette futurism ui](https://au.pinterest.com/search/pins/?q=cassette%20futurism%20ui&rs=typed)

That board is the *room*. It is not a license to build a toy cockpit.

**VAULT’s cut of that world:**

- More **minimal**. More **refined rawness**.
- A **little** sleaze. An **echo** of hacker grime.
- Power red on black field — not amber, not terminal green, not cyan-on-black, not cobalt.

This instance is a **desktop field**. Phone lists, TimeTree, and paper diaries already exist. Do not design for a thumb. Packaging later is a boring native envelope (Tauri / WebView). The envelope is not the aesthetic.

---

## 2. Taste stack (locked)

Four layers. Do not flatten them into one costume.

| Layer | Role | If you overdo it |
| --- | --- | --- |
| Cassette futurism | The plate. Analog-future machine. | Alien Isolation cosplay, chunky 3D knobs, aviation switches |
| Refined rawness | The cut. Xerox, dot-matrix, label-maker, hairline rules | CGI bezels, screws, vents, skeuomorphic tape decks |
| A little sleaze | Salt. 90s/indie sleaze, WORLDWIDE ®, overlapping chips, fried grain | Rave flyer, Fidèle-maximal, slogan-tee graphics |
| Echo of hacker grime | Salt. Unix nest, uppercase logs, `[X]`, INV, ops/lab/field dirt | Matrix rain, Kali wallpaper, hoodie-hacker stock, `1337` |

Sleaze and grime are **salt**. If the field looks like a title card, there is too much salt.

Attitude: slightly illegal, slightly glamorous, still a tool.

---

## 3. Tokens

### Color

| Token | Hex | Job |
| --- | --- | --- |
| Field | `#000000` | The glass. This instance. |
| Paper | `#F4F4F0` | Type. Ledger rules (low alpha). Tick marks. |
| Power red | `#E10600` | Selection invert, operator caret, live ticks, `[+]` / shovel, strike / URGENT. |
| White | `#FFFFFF` | Type on power-red invert. |

One accent. Strike and URGENT use the same red — not two reds. Cobalt has left. Harvest amber is forbidden. No charcoal leather.

No teal. No amber-as-theme. No terminal green. No canary. No cyan HUD. No mauve/mustard ricing palettes. No beige plastic on this instance. No globe. No cobalt lash.

### Type

- **Helvetica Neue / Helvetica / Arial** — binder, nest, dump, dock. Small. Dense.
- No JetBrains. No Space Grotesk. No Inter. No VT323. No Orbitron. No pixel-display novelty fonts.

Tracking is tight on chrome. Uppercase for legends and shouts.

### Surface

- Border radius: **0**. Everywhere. Including native controls.
- No soft shadows. No gradients. No blur. No glass.
- Grain / scan: off on this instance.
- Selection: inverted CHIP (power red, white type) on the live row — same row height. HIT expands in place; rows below move down. No overlay covering neighbors.

---

## 4. Composition

One continuous personal OS field. Not a dashboard. Not stacked sections. Not three apps in a trenchcoat. Not a PWA. Not mobile-first.

The dock is locked to the viewport bottom.

**VAULT instance (SPECK machine — composed desktop field):**

1. **One graph.** Every node: `id`, `title`, `body?`, `status` (`backlog|active|staging|done|none`), `parent`, ordered children, `urgent?`. Projects are nodes with children. Tasks appear on PIPE when status is a binder column.
2. **PIPE** — a *view* of binder-status nodes, grouped under project plaques. Left page FOCUS (`backlog` / `active`). Right page GATEWAY (`staging` / `done`). ASCII spine and ring hits. Empty ledger rows stay and **create**. HIT expands in place (body, subtasks, status ticks); everything below **moves down**. Shovel (`->` or `SHOVEL`) advances status. Nest project selection filters the binder to that subtree. Not kanban cards. Not overlay chips.
3. **NEST** — the same graph as a unix tree. Expand/collapse. Click name to rename. `[+]` or empty child slot adds. Indent/outdent. `SHOVEL` puts a node on the binder. CLIP-copy is dead.
4. **DUMP** — scratch tape. `NOTE MM.DD.YY "…"`. Not the work graph.
5. **PLACE / GLYPH** — organs sit where source says. Window chrome: double hairline, plaque `PIPE // vault`, `[x] ···` (`x` collapses the organ), tick ruler, circle counts. Drag the plaque to rewrite `PLACE`. Dither is salt, not a texture layer.
6. **Dock** — ONE one-line **operator**. Commands (`SEE`, `WORDS`, `CLEAR`, `SHOVEL`, `FOCUS`, `HIT`, …) or a dump line. Never three forms. Never CTX chips in a header.
7. **Field editor** — one native `<input>` over the active cell. Click a title, type. TAB / Shift-TAB: `title → body → new subtask → status`. Enter commits. Esc collapses. Space on `[ ]` shovels / checks. Two writers on purpose (cell + operator).

A later agent may refine density **inside this field**. It may not bring back DateBlocks, month-as-OS, beige cassette chrome, the globe as field chrome, a Tailwind binder, harvest amber, cobalt, CLIP-copy, overlay dossiers, or a second input.

---

## 5. Grammar (the marks)

These are the letters of the language. Use them. Do not invent a parallel alphabet.

- **Inverted chip** — power-red field, canvas text, zero radius, padding to the glyph. Selection invert, painted `CHIP`. White-on-red; never a rounded pill; never an overlay stack covering the next row.
- **Slash structure** — `///` and `//` as dividers and legends (`PIPE // vault`, `FOCUS // GATEWAY`). Not CSS `border-bottom` pretending to be a TUI.
- **Dashed hairline** — thin rules, sometimes dashed. Not 3px neo-brutal drop shadows.
- **ASCII stems** — `│ ├── └──` for the nest tree. Prefixes computed from `parent` / children, not nested DOM indent.
- **Leader dots** — `label ........ value` when a readout must span. Stolen from 3270 / CICS. Use sparingly.
- **Asterisk rules** — `**********` as a tape splice, not a card edge.
- **`[X]`** — destroy / strike chrome if a program paints it. Urgent red. Character chrome, not an icon font.
- **`[ ]` brackets** — status. `[1]`, `STATUS: READY`.
- **Strike** — red mid-line through a mark. Not `text-decoration` grey.
- **Caret** — stepped blink `>`. The dock is the **operator**. The cell input is the writer.
- **Shovel** — margin `->`. Advances a node through the spine (or from `none` onto `backlog`). Not a drag handle for cards.
- **Window chrome** — 1px double hairline, plaque, `[x] ···`, registration ticks, circle counters. Recess via double hairline, not 3D knobs.

---

## 6. What already works (do not throw away)

The VAULT field is a **SPECK machine**. React is the host envelope (canvas, native dock input). The live program is source. Do not restyle a component tree and call that the OS.

- One dock as operator. The cell editor is the other writer.
- Canvas display list. Hit-test. Overlap is legal.
- Persistence is the SPECK source string (`speck-os-v1` in localStorage).
- One graph; PIPE and NEST are lenses. DUMP tape. PLACE / GLYPH.

What failed: DateBlocks, the globe/beige seal shell, Yjs CRDT as the database, month-as-OS as the destination, HTML/Tailwind kanban, overlay CHIP dossiers, CLIP-as-copy, cobalt lash. Dead. Do not revive them. Sections want cards. Cards are DateBlocks.

---

## 7. SPECK — the machine tongue

SPECK is a real domain-specific language. It is not a metaphor. It is not a design-token rename.

It is **not** a general-purpose language (no Python-from-scratch, no LLVM, no stdlib). Cousins: PostScript, Forth, Logo, teletext, 3270.

HTML/CSS/React nouns are boxes, cards, flow. SPECK nouns are the field.

The runtime lives in `src/speck`. It lexes, parses, compiles a display list, paints pixels, and interprets dock lines + hits. The live program is the source string.

### Feature dream rule

A new feature must be **sayable in SPECK**. If you cannot write it as source, it does not belong. Help Jake say it, or refuse the feature.

### 7.1 Source

Line-oriented. Indent (2 spaces) groups a body. Words are Forth-like. Case-insensitive opcodes; payloads keep their case. Comments: `//` or Forth `\` to end of line.

```
PIPE vault
  COL backlog
  COL active
  COL staging
  COL done
NEST
  NODE 1 "ops" status none
    NODE 10 "lab" status none
      NODE 11 "scout_ridge_a" status none URGENT
    NODE 20 "net" status none
      NODE 102 "telemetry ui" status active
        BODY "spec leftover"
    NODE 104 "ingress routing" status backlog
DUMP
  NOTE 09.07.26 "ridge"
PLACE PIPE 24 16
PLACE NEST 16 420
PLACE DUMP 560 420
GLYPH 820 36 72 "07"
```

**Tokens**

| Form | Example | Meaning |
| --- | --- | --- |
| word | `PIPE` `TASK` `SHOVEL` | opcode |
| string | `"ridge"` | payload |
| tape date | `09.07.26` | `MM.DD.YY` on DUMP notes |
| number | `104` `24` | id, PLACE, GLYPH size |

Empty storage loads the seed program. `CLEAR` restores seed.

### 7.2 Nouns (source)

These name the field. They compile to paint ops. Do not add a noun unless the field grew a new organ.

| Noun | Says |
| --- | --- |
| `PIPE` | split-page binder (a *view* of the graph) |
| `COL` | `backlog` `active` `staging` `done` |
| `NEST` | tree lens of the same graph |
| `NODE` | a graph node: `id`, title, `status`, indent = parent |
| `BODY` | optional body on the current node |
| `DUMP` | scratch tape |
| `NOTE` | a dump line |
| `PLACE` | organ origin `x y` |
| `GLYPH` | free field ink `x y px "text"` |
| `DOCK` | the one operator (always compiled) |

Dead as field chrome (do not compile): `CAL` `SEAL` month pack, `GRAIN` `SCAN` `INV`, `TASK` `STEM` `CLIP` as live nouns. Legacy `TASK` / `STEM` lines still parse into `NODE`s. Typed at the dock they are dumps if they are not commands.

`SEE` echoes source. `WORDS` echoes the live opcode list. `CLEAR` restores seed. `SHOVEL` advances a node (or lifts `none` onto `backlog`). `FOCUS` filters PIPE to a nest subtree. Dump lines create projects and child tasks.

### 7.3 Opcodes / IR

The painter executes a **stateless display list**. Source `INK` is baked into each op at compile. Live public ops:

`FILL` `GLYPH` `LINE` `CHIP` `STRIKE` `STEM`

| Op | Paints |
| --- | --- |
| `GLYPH` | Helvetica type (binder, nest, dump, dock). |
| `CHIP` | power-red fill, white text. Selection invert. Radius 0. Same row height. |
| `LINE` | ledger hairline. Spine. Organ double-edge. Tick ruler. |
| `STRIKE` | power-red mid-line on done / `[X]`. |
| `STEM` | ascii tree prefix + label. |
| `FILL` | black field. Dither salt (1×1). |

Overlap is legal. Expanded rows **reflow** — they do not cover later ink.

Do not advertise `SEAL` `GRAIN` `SCAN` `INV` as live ops.

### 7.4 Events

Pointer and keys are SPECK. The host does not own behavior; it forwards.

```
HIT NODE 102
HIT ADD 20
HIT SHOVEL 102
HIT FIELD
SHOVEL
FOCUS
TYPE …
COMMIT
CLEAR
SEE
WORDS
```

HIT a binder node to expand it in place and edit. HIT empty field / Esc to collapse. Never three forms. Never CTX chips in a header.

### 7.5 Dock operator

The Prompt Dock is the **operator**. One line. Titles are typed in the field editor.

- If the line **parses as a command** (`SEE`, `WORDS`, `CLEAR`, `HIT`, `COMMIT`, `SHOVEL`, `FOCUS`, `MOVE`, `STRIKE`): execute it.
- Else it is a **dump**. Cue `new … project` / `create project` → project node; next clause is the title (do not auto-abbreviate); remaining clauses (commas / `need to` / `and`) → child tasks at `backlog`. Bare dumps → tasks under the focused project, or inbox. Ambiguous parse echoes `?` plus the guessed tree; empty Enter confirms.
- Empty commit is a no-op unless a pending dump is waiting.

Examples: `SEE` · `WORDS` · `SHOVEL` · `FOCUS` · `new website project, site redesign of homepage, need to assess aesthetic, create repo`

### 7.6 Runtime contract

1. **The program is source.** `localStorage` key `speck-os-v1`. Ignore `speck-month-v1`.
2. **The field is compiled** from source + session → display list → pixels. Session: selected node, nest/pipe expand, nest focus, field slot, collapsed organs, dock buffer, echo, pending dump. Redraw on dirty + caret interval. No hot RAF.
3. **Paint pixels.** Canvas (later Skia). Not DOM flow. The host keeps a native `<input>` over the dock glyph line **and** over the active cell. Envelope, not aesthetic.
4. **Hit test the display list.** Highest-z box wins. Expanded rows occupy their own hits. Organs above empty field.
5. **Commits mutate source.** `SHOVEL` rewrites a node status. Dump inserts nodes. Field editor rewrites title/body. `CLEAR` restores seed. No worker. No CRDT. No JSON sidecar.
6. **No grain layer, scan, INV, seal, amber, cobalt, CLIP, overlay dossier, or month pack** on this instance.

Packaging (when asked): SPECK runtime in a boring envelope (Tauri / WebView). Desktop. Seal as icon only. No browser chrome. The envelope is not the aesthetic.

### 7.7 What SPECK is not

- Not CSS.
- Not a React component tree with cute names.
- Not a general-purpose language.
- Not a reason to add a settings app.
- Not a second palette, a HUD, a card system, or a Tailwind binder.

---

## 8. Hard vetoes

Never. Not as a joke. Not as a “just for desktop.” Not as a dark-mode variant.

- DateBlocks, jagged day cards, stacked day modules
- SaaS stacks, cards, rounded corners, soft shadows, glass, gradients
- Kanban card boards, harvest amber, charcoal leather, HTML notebook skins
- Acid watermarks, giant boxed logos, section billboards (`CALENDAR` / `TO-DO` as Helvetica monuments)
- Header CTX chips, PROJECTS / ROSTER / FLEET / LOGS as a mode bar
- Inter, VT323, Orbitron, “sci-fi display” fonts
- Green-on-black notes, amber boxed terminals, phosphor takeover (amber / green / cyan as the OS)
- Three input forms
- Demo fluff (`BUY MILK`, lorem, fake dashboards, cost-burn theatre)
- Alien Isolation cosplay, chunky 3D knobs, screws, vents, tape-deck skeuomorphism
- Vaporwave, synthwave, neon alley, Y2K chrome media-player skins
- Heavy modular console of adjacent hardware bays
- Matrix rain, Anonymous masks, hoodie-hacker stock, `1337`, Kali wallpaper
- Rave-flyer / Fidèle-maximal sleaze as the brand system
- NEXUS-HUD chrome: GRADE D panels, waveforms, tabs-as-apps, cyan-on-black tactical orchestrator
- 2×3 card dashboards in a terminal skin
- l33t CLI costume (gradient ASCII wordmarks, emojis, “cyber king”)

---

## 9. Refs — take / leave

Mood is canon. Palette of the ref is usually not.

**Rule:** if a reference is dark + green/cyan/amber phosphor, steal *structure* (density, leaders, brackets, ticks) and restamp it onto field / paper / power red.

### TAKE

- **Office sheet** — registration ticks, hairline rules, circle counters, stencil weight on plaques, one oval/invert for live selection. Leave skull chrome and `IMAGE NOT FOUND` theatre.
- **Pixel GUI** — 1px window chrome, title bar with `[x]` and `···`, overlap legal, dither as salt. Leave Win95 gray and pixel novelty fonts.
- **IMP** — labeled blocks, dense legends, scanline bars for meters, Helvetica industrial caps, recessed *feeling* via double hairline. Leave rotary 3D knobs.
- **Lotus Organizer split-page** — two pages, spine, shovel through the gutter, ledger rows that **reflow**. Leave leather, amber, and card chrome.
- **Linear / Things / OmniFocus / Todoist (stolen, not cloned)** — project + issue + sub-issue; click empty row to add; outline is the document; dump parser. Leave cloud, Apple UI, karma, board cards.
- **ranger / nnn** — arrows, enter expand, `n` new node. Leave two-pane file-manager costume.
- **CICS / z/OS / btop** — density, `Command ==>`, leader dots, `[bracket]` pane labels. Leave phosphor rainbows.

### LEAVE

- Skull as chrome, `IMAGE NOT FOUND` theatre, UN globe, rotary 3D, Win95 gray, pixel novelty fonts
- Harvest amber, cobalt as the lash, DateBlocks/cards
- Green-on-black Matrix Android launcher
- Arch ricing (mauve/teal/mustard, anime fetch, glass hover)
- AMMAR-style l33t IP-tracker CLI
- Lo-fi sci-fi montage (amber/magenta overlays, radar, chromatic aberration as style)
- ServerHub 2×3 card dashboard
- Any `NEXUS_OS v5.0 tactical orchestrator` chrome
- Tailwind / v0 “editorial binder” templates

Older canon still in force: Gemini neo-brutal TUI blueprint (engineering DNA, not the boxed-shadow look), Pinterest sleaze board, fried TUI / burn-the-box trail (PRs #8–#11). DateBlocks from PR #7 are a warning, not a direction. Month-as-OS (PR #14) was a recovery, not the destination.

---

## 10. How to apply this to another project

1. Copy **this file**. Keep tokens, vetoes, grammar, SPECK, taste stack.
2. Change **world content** only: what the field paints, what the dock commits.
3. Do not change the substrate into cards because “this product is a marketing site.” If it cannot live on one field with one dock, it is a different language — do not pretend it is this one.
4. Point `.cursorrules` at this file. Keep `.cursorrules` short. Agents read the short law; humans and long agents read this.
5. If you need a second color, you are already lost. Use power red. Strike is the same red.

**VAULT-specific content (this repo):** composed desktop field; one graph; PIPE binder view; NEST tree; DUMP tape; operator dock; persistence `speck-os-v1`. No globe. No beige seal shell. No month-as-OS. No amber binder. No cobalt.

---

## 11. Voice

Write like a terminal that went to art school for one semester and dropped out.

- Terse. Uppercase where the machine would shout.
- No “welcome to your dashboard.”
- No empty states that apologize. Empty is `_` or `empty/`.
- Filenames as mythos: `flush_stale_resolvers.sh`, `cnc_toolpath_night_run`, `scout_ridge_a`.
- Maker mark: BLACK LANTERN. Product mark: VAULT WORLDWIDE.

---

## 12. Authority

Further from the norm. Firmly in utility. Order from chaos.

Propose bold changes inside this language. Do not propose a new language because CSS was easier.

Full short law: `.cursorrules`  
This file: the canon.
