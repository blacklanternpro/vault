# BLACK LANTERN — Design Language

**Canon.** Copy this file into another repo and the language still holds.
Short law for agents lives in `.cursorrules`. This file is the full tongue.

Maker: BLACK LANTERN. First instance: **VAULT WORLDWIDE** — a local-first personal OS you run as a program on a desktop, not a website you visit, not a phone PWA.

If a thing cannot be said in this language, it is not in the work.

---

## 0. The test

Before you add a feature, a color, a font, a panel, a motion, a word:

1. Can it be said in **SPECK**? (see §7)
2. Does it live on **field / paper / cobalt** — and nowhere else?
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
- Cobalt on machine-plastic — not amber, not terminal green, not cyan-on-black.

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
| Paper | `#F4F4F0` | Type. Ledger rules (low alpha). |
| Cobalt | `#0000FF` | Spine, shovel, selection invert, dossier overlay. |
| White | `#FFFFFF` | Overlay type on cobalt. |
| Urgent | `#FF2B2B` | Strike, URGENT, broken. Not a theme. |

Cobalt = mark + overlay. Not a second theme. Harvest amber is forbidden. No charcoal leather.

No teal. No amber-as-theme. No terminal green. No canary. No cyan HUD. No mauve/mustard ricing palettes. No beige plastic on this instance. No globe.

### Type

- **Helvetica Neue / Helvetica / Arial** — binder, nest, dump, dock. Small. Dense.
- No JetBrains. No Space Grotesk. No Inter. No VT323. No Orbitron. No pixel-display novelty fonts.

Tracking is tight on chrome. Uppercase for legends and shouts.

### Surface

- Border radius: **0**. Everywhere. Including native controls.
- No soft shadows. No gradients. No blur. No glass.
- Grain / scan: off on this instance.
- Selection: inverted CHIP on the selected row. Open dossier is a cobalt overlay from that line.

---

## 4. Composition

One continuous personal OS field. Not a dashboard. Not stacked sections. Not three apps in a trenchcoat. Not a PWA. Not mobile-first.

The dock is locked to the viewport bottom.

**VAULT instance (SPECK machine — composed desktop field):**

1. **PIPE** — split-page binder. Left page FOCUS (`backlog` / `active`). Right page GATEWAY (`staging` / `done`). ASCII spine `┃┃` and ring hits. Tasks occupy a **fixed line grid**. Empty rows stay. Shovel (`->` or `SHOVEL`) advances COL through the spine. Not kanban cards. Not infinite columns.
2. **NEST** — unix directory pit. `│ ├── └──`. Rapid stems. `CLIP` writes a stem into PIPE as a `TASK` tagged with the path.
3. **DUMP** — scratch tape. `NOTE MM.DD.YY "…"`. Not the dossier.
4. **PLACE / GLYPH** — organs sit where source says. Free glyphs overlap anything. Drag the organ legend to rewrite `PLACE`.
5. **Dock** — ONE one-line REPL. Never three forms. Never CTX chips in a header. Never PROJECTS / ROSTER / FLEET / LOGS tab bars.
6. **Dossier** — HIT a TASK: cobalt spec CHIP drops from that row. Tap the row, another organ, or empty field to dismiss. Edit through the dock.

A later agent may refine density **inside this field**. It may not bring back DateBlocks, month-as-OS, beige cassette chrome, the globe as field chrome, a Tailwind binder, harvest amber, or a second input.

---

## 5. Grammar (the marks)

These are the letters of the language. Use them. Do not invent a parallel alphabet.

- **Inverted chip** — cobalt field, canvas text, zero radius, padding to the glyph. Selection, active invert, painted `CHIP`. White-on-cobalt or cobalt-on-white; never a rounded pill.
- **Slash structure** — `///` and `//` as dividers and legends (`PIPE // vault`, `FOCUS // GATEWAY`). Not CSS `border-bottom` pretending to be a TUI.
- **Dashed hairline** — thin rules, sometimes dashed. Not 3px neo-brutal drop shadows.
- **ASCII stems** — `│ ├── └──` for hierarchy when source says `STEM`. Prefixes computed, not nested DOM indent.
- **Leader dots** — `label ........ value` when a readout must span. Stolen from 3270 / CICS. Use sparingly.
- **Asterisk rules** — `**********` as a tape splice, not a card edge.
- **`[X]`** — destroy / strike chrome if a program paints it. Urgent red. Character chrome, not an icon font.
- **`[ ]` brackets** — status. `[1]`, `STATUS: READY`.
- **Strike** — red mid-line through a mark. Not `text-decoration` grey.
- **Caret** — stepped blink `>`. The dock is the deck. The dock is the REPL.
- **Shovel** — margin `->`. Advances a task through the spine. Not a drag handle for cards.

---

## 6. What already works (do not throw away)

The VAULT field is a **SPECK machine**. React is the host envelope (canvas, native dock input). The live program is source. Do not restyle a component tree and call that the OS.

- One dock. This is the magic.
- Canvas display list. Hit-test. Overlap is legal.
- Persistence is the SPECK source string (`speck-os-v1` in localStorage).
- PIPE split-page binder. NEST pit. DUMP tape. PLACE / GLYPH.

What failed: DateBlocks, the globe/beige seal shell, Yjs CRDT as the database, month-as-OS as the destination, HTML/Tailwind kanban. Dead. Do not revive them. Sections want cards. Cards are DateBlocks.

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
  TASK backlog "ingress routing" id 104
  TASK active "telemetry ui" id 102 nest ops/net/
NEST ops/
  STEM lab/ scout_ridge_a
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
| `PIPE` | split-page binder (the project engine) |
| `COL` | `backlog` `active` `staging` `done` |
| `TASK` | a line of work on a COL |
| `NEST` | unix pit root |
| `STEM` | a node in the pit |
| `DUMP` | scratch tape |
| `NOTE` | a dump line |
| `PLACE` | organ origin `x y` |
| `GLYPH` | free field ink `x y px "text"` |
| `DOCK` | the one prompt (always compiled) |

Dead as field chrome (do not compile): `CAL` `SEAL` month pack, `GRAIN` `SCAN` `INV`. Typed at the dock they are notes/tasks if an organ is selected.

`SEE` echoes source. `WORDS` echoes the live opcode list. `CLEAR` restores seed. `SHOVEL` advances a TASK. `CLIP` copies a STEM into PIPE.

### 7.3 Opcodes / IR

The painter executes a **stateless display list**. Source `INK` is baked into each op at compile. Live public ops:

`FILL` `GLYPH` `LINE` `CHIP` `STRIKE` `STEM`

| Op | Paints |
| --- | --- |
| `GLYPH` | Helvetica type (binder, nest, dump, dock). |
| `CHIP` | cobalt fill, white text. Dossier overlay. Selection invert. Radius 0. |
| `LINE` | ledger hairline. Spine. Organ double-edge. |
| `STRIKE` | urgent mid-line on done / `[X]`. |
| `STEM` | ascii tree prefix + label. |
| `FILL` | black field. |

Overlap is legal. Overlay chips cover later ink.

Do not advertise `SEAL` `GRAIN` `SCAN` `INV` as live ops.

### 7.4 Events

Pointer and keys are SPECK. The host does not own behavior; it forwards.

```
HIT TASK 102
HIT STEM ops/net/
HIT SHOVEL 102
HIT CLIP ops/lab/scout_ridge_a
HIT RING
HIT FIELD
SHOVEL
CLIP
TYPE …
COMMIT
CLEAR
SEE
WORDS
```

HIT a TASK to select it (and open dossier). HIT empty field to dismiss overlay. Never three forms. Never CTX chips in a header.

### 7.5 Dock REPL

The Prompt Dock is the **REPL**. One line.

- PIPE selected (or a COL/TASK): plain text appends a `TASK` to that COL (default `backlog`).
- NEST / STEM selected: plain text appends a `STEM`. `CLIP` writes the stem into PIPE.
- DUMP selected: plain text appends a `NOTE` for today.
- If the line **parses as a command** (`SEE`, `WORDS`, `CLEAR`, `HIT`, `COMMIT`, `SHOVEL`, `CLIP`, `MOVE`): execute it.
- Empty commit is a no-op.

Examples: `SEE` · `WORDS` · `SHOVEL` · `CLIP` · `ingress routing`

### 7.6 Runtime contract

1. **The program is source.** `localStorage` key `speck-os-v1`. Ignore `speck-month-v1`.
2. **The field is compiled** from source + session → display list → pixels. Session: selected organ/node, overlay open, dock buffer, echo. Redraw on dirty + caret interval. No hot RAF.
3. **Paint pixels.** Canvas (later Skia). Not DOM flow. The host may keep a native `<input>` over the dock glyph line. Envelope, not aesthetic.
4. **Hit test the display list.** Highest-z box wins. Overlay above rows. Organs above empty field.
5. **Commits mutate source.** `SHOVEL` rewrites a TASK col. `CLIP` inserts a TASK. `CLEAR` restores seed. No worker. No CRDT. No JSON sidecar.
6. **No grain, scan, INV, seal, amber, or month pack** on this instance.

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

**Rule:** if a reference is dark + green/cyan/amber phosphor, steal *structure* (density, leaders, brackets, grain) and restamp it onto canvas / ink / cobalt / urgent.

### TAKE

- **Cobalt-on-pale Archive poster** — north star. Saturated `#0000FF` on tinted off-white. Inverted highlight blocks as selection. Slashes `///` as structure. Dashed hairline. ASCII as graphic. Sharp, no radius, no shadow. Sleaze = editorial zine, not rave.
- **Lotus Organizer split-page** — two pages, spine, shovel through the gutter, fixed ledger rows. Leave leather, amber, and card chrome. Restamp onto field / paper / cobalt.
- **CICS / z/OS region overview** — density, `Command ==>`, leader dots, color as status, character chrome `[X] [←]`. Leave the black rainbow phosphor.
- **1985 tactical monochrome** — leader dots, asterisks as dividers, geometric status glyphs (`● ○ ▲`), UTC stamps, every pixel earns its keep. Leave radar/cockpit and black-only.
- **btop / popeye / GDB TUIs** — character grid, `[bracket]` pane labels, keyboard legend, dotted leaders, ASCII wordmarks, `>>>` prompt, nested hierarchy. Leave dark themes, emojis, mascots, rainbow accents.
- **CIPHER grain + wireframe globe** — film grain, slash section markers, 90° corners, ticker of terse values. Leave yellow/black and website service cards.
- **NEXUS by BLACK LANTERN** — keep the *maker mark* and the syntax (`[1] MODE`, `>>` stems, underscores). Leave the black cyan HUD, GRADE D, waveforms, tabs-as-apps, ESP32 cosplay.
- **Night-drive CRT / FULCRUM report** — grain, scan, ASCII boxes (`+----+`, `*`), `STATUS: READY`, wireframe as data. Leave phosphor-green bloom and multi-monitor HUD.

### LEAVE

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
5. If you need a second color, you are already lost. Use cobalt. If it is an alarm, use urgent.

**VAULT-specific content (this repo):** composed desktop field; PIPE split-page binder; NEST pit; DUMP tape; persistence `speck-os-v1`. No globe. No beige seal shell. No month-as-OS. No amber binder.

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
