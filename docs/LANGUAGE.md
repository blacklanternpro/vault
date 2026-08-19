# BLACK LANTERN — Design Language

**Canon.** Copy this file into another repo and the language still holds.
Short law for agents lives in `.cursorrules`. This file is the full tongue.

Maker: BLACK LANTERN. First instance: **VAULT WORLDWIDE** — a local-first personal OS you install, not a website you visit.

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

The APK (later) is the device. You sideload `vault.worldwide`. Home-screen icon is the seal. No browser chrome.

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
| Paper | `#F4F4F0` | Month digits. Off-white. |
| Cobalt | `#0000FF` | Underline. Note overlay. Dock hairline. |
| White | `#FFFFFF` | Overlay type on cobalt. |

Cobalt = mark + overlay. Not a second theme. Red is not on this field.

No teal. No amber-as-theme. No terminal green. No canary. No cyan HUD. No mauve/mustard ricing palettes. No beige plastic on this instance. No globe.

### Type

- **Helvetica Neue / Helvetica / Arial** — month digits and the one-line dock. Small. Equal cells.
- No JetBrains. No Space Grotesk. No Inter. No VT323. No Orbitron. No pixel-display novelty fonts.

Tracking is tight on chrome. Uppercase for legends and shouts.

### Surface

- Border radius: **0**. Everywhere. Including native controls.
- No soft shadows. No gradients. No blur. No glass.
- Grain / scan: off on this instance.
- Selection: none. A noted day is a cobalt hairline. Open notes are a cobalt overlay.

---

## 4. Composition

One continuous personal OS field. Not a dashboard. Not stacked sections. Not three apps in a trenchcoat.

Mobile-first. The dock is locked to the viewport bottom.

**VAULT instance (SPECK machine — black month field):**

1. **Pack** — current month digits `1 … last`. 7 equal columns. Day 1 top-left. No weekday offset. No month wordmark. No globe. No clock. No INV chrome. Helvetica, small, paper on black.
2. **Dock** — ONE one-line floating prompt. Tap a day, then type a note. Empty select → `? DAY`. Never three forms. Never CTX chips in the header.
3. **Mark** — a day with notes gets a cobalt hairline under the digit.
4. **Overlay** — tap a marked day: notes drop from that line, first line flush with the hairline, cobalt fill / white type, covering whatever is under them. Tap the digit, another day, or empty field and they go.

A later agent may refine density **inside this field**. It may not bring back the globe, beige cassette chrome, todo nest, scratch dump, DateBlocks, hardware bays, card grids, or a second input.

---

## 5. Grammar (the marks)

These are the letters of the language. Use them. Do not invent a parallel alphabet.

- **Inverted chip** — cobalt field, canvas text, zero radius, padding to the glyph. Selection, active invert, painted `CHIP`. White-on-cobalt or cobalt-on-white; never a rounded pill.
- **Slash structure** — `///` and `//` as dividers and legends (`local_first // no_cloud`, `SPECK // field`). Not CSS `border-bottom` pretending to be a TUI.
- **Dashed hairline** — thin rules, sometimes dashed. Not 3px neo-brutal drop shadows.
- **ASCII stems** — `│ ├── └──` for hierarchy when source says `STEM`. Prefixes computed, not nested DOM indent.
- **Leader dots** — `label ........ value` when a readout must span. Stolen from 3270 / CICS. Use sparingly.
- **Asterisk rules** — `**********` as a tape splice, not a card edge.
- **`[X]`** — destroy / strike chrome if a program paints it. Urgent red. Character chrome, not an icon font.
- **`[ ]` brackets** — status. `[1]`, `STATUS: READY`.
- **Strike** — red mid-line through a mark. Not `text-decoration` grey.
- **Caret** — stepped blink `>`. The dock is the deck. The dock is the REPL.

---

## 6. What already works (do not throw away)

The VAULT field is a **SPECK machine**. React is the host envelope (canvas, native dock input). Notes are source. Do not restyle a component tree and call that the OS.

- One dock. This is the magic.
- 7-across current-month pack. Helvetica. Black field.
- Cobalt underline + overlay notes.
- Persistence is the SPECK source string (`speck-month-v1` in localStorage).

What failed: the old todo OS (calendar cards, nest, dump) and the globe/beige seal shell. Dead. Do not revive them. Sections want cards. Cards are DateBlocks.

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
DAY 08.19.26 "ridge"
DAY 08.19.26 "call"
```

**Tokens**

| Form | Example | Meaning |
| --- | --- | --- |
| word | `DAY` `HIT` `CLEAR` | opcode |
| string | `"ridge"` | note payload |
| tape date | `08.19.26` | `MM.DD.YY` — keys a note to a day |

The month pack is compiled from the clock. Source only stores notes. Empty source is a clean month.

### 7.2 Nouns (source)

These name the field. They compile to paint ops. Do not add a noun unless the field grew a new organ.

| Noun | Says |
| --- | --- |
| `DAY` | a note on a tape date (`DAY 08.19.26 "ridge"`) |
| `DOCK` | the one prompt (always compiled) |

The pack is not a source noun. It is the live month. Dead organs (do not compile): `CAL` `NEST` `DUMP` `SEAL` as chrome. Typed at the dock they are notes if a day is selected.

`SEE` echoes source. `WORDS` echoes the opcode list. `CLEAR` wipes notes.

### 7.3 Opcodes / IR

The painter executes a **stateless display list**. Source `INK` is baked into each op at compile. Public ops:

`GLYPH` `INK` `STRIKE` `CHIP` `STEM` `SEAL` `DOCK` `GRAIN` `SCAN` `INV`

| Op | Paints |
| --- | --- |
| `GLYPH` | month digit (Helvetica, paper) or dock type. |
| `CHIP` | cobalt fill, white note text. Overlay. Radius 0. |
| `LINE` | cobalt hairline under a noted digit. |
| `DOCK` | one-line `>` buffer `↵`. Locked to the viewport bottom. |
| `FILL` | black field. |

Overlap is legal. Overlay chips cover later digits.

### 7.4 Events

Pointer and keys are SPECK. The host does not own behavior; it forwards.

```
HIT DAY 19
HIT FIELD
TYPE …
COMMIT
CLEAR
SEE
WORDS
```

Tap a day to select it (and open overlay if it has notes). Tap empty field to dismiss overlay. Never three forms. Never CTX chips in a header.

### 7.5 Dock REPL

The Prompt Dock is the **REPL**. One line. What you type is a note on the selected day.

- Tap a day first. Else commit echoes `? DAY`.
- If the line **parses as a command** (`SEE`, `WORDS`, `CLEAR`, `HIT`, `COMMIT`): execute it.
- Else append `DAY MM.DD.YY "…"`.
- Empty commit is a no-op.

Examples: `SEE` · `WORDS` · `CLEAR` · `ridge` (a note)

### 7.6 Runtime contract

1. **Notes are source.** `localStorage` key `speck-month-v1`. Lines like `DAY 08.19.26 "ridge"`. The month pack is compiled from the clock, not stored.
2. **The field is compiled**, every frame, from source + session + now → display list → pixels. Session: selected day, overlay open, dock buffer, echo.
3. **Paint pixels.** Canvas (later Skia). Not DOM flow. The host may keep a native `<input>` over the dock glyph line. Envelope, not aesthetic.
4. **Hit test the display list.** Highest-z box wins. Overlay above days. Days above empty field.
5. **Commits mutate source.** `COMMIT` appends a `DAY` line. `CLEAR` wipes. No worker. No CRDT.
6. **No grain, scan, INV, or seal** on this instance.

Packaging (when asked): SPECK runtime in a boring envelope (Capacitor / WebView / TWA) → sideloadable APK. Seal as icon. No browser chrome. The envelope is not the aesthetic.

### 7.7 What SPECK is not

- Not CSS.
- Not a React component tree with cute names.
- Not a general-purpose language.
- Not a reason to add a settings app.
- Not a second palette, a HUD, or a card system.

---

## 8. Hard vetoes

Never. Not as a joke. Not as a “just for desktop.” Not as a dark-mode variant.

- DateBlocks, jagged day cards, stacked day modules
- SaaS stacks, cards, rounded corners, soft shadows, glass, gradients
- Acid watermarks, giant boxed logos, section billboards (`CALENDAR` / `TO-DO` as Helvetica monuments)
- Inter, VT323, Orbitron, “sci-fi display” fonts
- Green-on-black notes, amber boxed terminals, phosphor takeover (amber / green / cyan as the OS)
- Header CTX chips, mode switcher in the top bar, three input forms
- Demo fluff (`BUY MILK`, lorem, fake dashboards)
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
- **CICS / z/OS region overview** — density, `Command ==>`, leader dots, color as status, character chrome `[X] [←]`. Leave the black rainbow phosphor.
- **1985 tactical monochrome** — leader dots, asterisks as dividers, geometric status glyphs (`● ○ ▲`), UTC stamps, every pixel earns its keep. Leave radar/cockpit and black-only.
- **btop / popeye / GDB TUIs** — character grid, `[bracket]` pane labels, keyboard legend, dotted leaders, ASCII wordmarks, `>>>` prompt, nested hierarchy. Leave dark themes, emojis, mascots, rainbow accents.
- **CIPHER grain + wireframe globe** — film grain, slash section markers, 90° corners, ticker of terse values. Leave yellow/black and website service cards. The globe is already the seal.
- **NEXUS by BLACK LANTERN** — keep the *maker mark* and the syntax (`[1] MODE`, `>>` stems, underscores). Leave the black cyan HUD, GRADE D, waveforms, tabs-as-apps, ESP32 cosplay.
- **Night-drive CRT / FULCRUM report** — grain, scan, ASCII boxes (`+----+`, `*`), `STATUS: READY`, wireframe as data. Leave phosphor-green bloom and multi-monitor HUD.

### LEAVE

- Green-on-black Matrix Android launcher
- Arch ricing (mauve/teal/mustard, anime fetch, glass hover)
- AMMAR-style l33t IP-tracker CLI
- Lo-fi sci-fi montage (amber/magenta overlays, radar, chromatic aberration as style)
- ServerHub 2×3 card dashboard
- Any `NEXUS_OS v5.0 tactical orchestrator` chrome

Older canon still in force: Gemini neo-brutal TUI blueprint (engineering DNA, not the boxed-shadow look), Pinterest sleaze board, fried TUI / burn-the-box trail (PRs #8–#11). DateBlocks from PR #7 are a warning, not a direction.

---

## 10. How to apply this to another project

1. Copy **this file**. Keep tokens, vetoes, grammar, SPECK, taste stack.
2. Change **world content** only: what the field paints, what the dock commits.
3. Do not change the substrate into cards because “this product is a marketing site.” If it cannot live on one field with one dock, it is a different language — do not pretend it is this one.
4. Point `.cursorrules` at this file. Keep `.cursorrules` short. Agents read the short law; humans and long agents read this.
5. If you need a second color, you are already lost. Use cobalt. If it is an alarm, use urgent.

**VAULT-specific content (this repo):** black month pack; Helvetica digits; dock one-line note REPL; persistence `speck-month-v1`. No globe. No beige seal shell. No todo nest. No scratch dump.

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
