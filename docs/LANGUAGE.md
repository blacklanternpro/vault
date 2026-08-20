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
| Field | `#000000` | The machine. The ground the slip sits on. |
| Paper | `#F4F4F0` | The slip. Also the dock's type, since cobalt fails on black. |
| Ink | `#111111` | Weight: masthead, rules, totals. |
| Cobalt | `#0000FF` | The type and the chrome. Items, wires, selection, dots. |
| Urgent | `#FF2B2B` | **The hand only.** The strike and `[X]`. |

**Paper is data. Black is the machine. Red is the hand.** Cobalt is the working colour — body type,
not just an accent. Red is never decoration and never a third accent; if it is not a mark somebody
made by hand, it is not red.

Cobalt on black does not read. Anything printed on the black gutter speaks in paper.

No teal. No amber-as-theme. No terminal green. No canary. No cyan HUD. No mauve/mustard ricing palettes. No beige plastic on this instance. No globe.

### Type

- **Helvetica Neue / Helvetica / Arial**. Everything.
- No JetBrains. No Space Grotesk. No Inter. No VT323. No Orbitron. No pixel-display novelty fonts.

Tracking is tight on chrome, wide on the masthead and the stamp. Uppercase for labels and shouts,
mixed case for the work itself.

Canvas Helvetica has **proportional digits**, so numeric columns need a fixed right gutter. Never
assume glyph widths line up.

### Surface

- Border radius: **0**. Everywhere. Including native controls.
- No soft shadows. No gradients. No blur. No glass. No paper texture, no torn edges.
- The slip **bleeds** off the top and bottom of the viewport. A slip with a top and a bottom edge is a card.
- Selection is an inverted band: cobalt fill, paper type, full slip width.

### Mis-registration

The only flourish technique. Print a mark two or three times, one or two pixels apart, in cobalt and
red. It is what a real two-colour press does when the paper shifts, and it is the bridge between the
riso print refs and the glitched-badge refs.

Stamp and masthead only. **Never body text.**

---

## 4. Composition

One organ, done properly. Not a dashboard. Not stacked sections. Not three apps in a trenchcoat.

Mobile-first: this is a phone PWA that sits open on a home screen. The dock is locked to the viewport bottom.

**VAULT instance — a bureau printout whose line items sprout.** The day, itemised.

1. **Slip** — paper column on the black field, bleeding off both ends.
2. **Masthead** — real metadata only: `VAULT`, the long date and clock, `SLIP #nnnn`. Under focus it
   prints the branch path instead. Never a logo, never decoration.
3. **Rows** — ring dot, item, leader dots, right column. Settled work steps back in half-strength
   cobalt with a red hand strike through it. The right column is a settle time on a leaf and a
   roll-up ratio on a parent.
4. **Wires** — children hang off **diagonal** connectors fanning from the parent. No elbows, no
   `├──` corners, no vertical indent rails. Chaos is seeded from the task text and identical every frame.
5. **Foot** — printed rules, totals, a legend for the marks, `KEEP FOR YOUR RECORDS`, and `BAD FORM`
   in a distorted oval. When nothing is open, the stamp lands large across the whole slip.
6. **Dock** — ONE one-line prompt in the black gutter. Context comes from what you tapped. Never
   three forms. Never CTX chips in a header.

A later agent may refine density **inside this field**. It may not bring back the globe, beige
cassette chrome, the calendar, the scratch dump, DateBlocks, hardware bays, card grids, or a second input.

---

## 5. Grammar (the marks)

These are the letters of the language. Use them. Do not invent a parallel alphabet.

- **Printed rule** — rules are made of **characters** (`::::::`, `------`), the way a receipt draws
  them. Not a 1px CSS border pretending to be type.
- **Wire** — a diagonal hairline from a parent node to a child. Fans out from one anchor. Jittered,
  slightly overshooting the dot, drawn not printed. **No elbows. No rails. No ASCII corners.**
- **Node dot** — a small cobalt ring; filled when settled or armed. The hit target for settling.
- **Inverted band** — selection. Cobalt fill across the slip, paper type, zero radius. Never a pill.
- **Inverted chip** — cobalt fill, paper text, for a completed roll-up ratio.
- **Leader dots** — `item ........ value`. Stolen from 3270 / CICS. The spine of every receipt.
- **Hand strike** — the human over the machine print. A jittered red stroke that overshoots both ends
  of the text. Seeded, so it never redraws itself differently. Not `text-decoration` grey.
- **`[X]`** — destroy. Urgent red, character chrome, only on a selected row. Not an icon font.
- **Micro-label** — a tiny tracked cap over a value (`ITEM`, `TIME`, `SETTLED`). Two lines, never a
  form field.
- **Stamp** — a distorted oval with letterspaced caps inside, rotated off true, mis-registered. A
  bureau seal, not a logo.
- **Caret** — blinking `>`. The dock is the deck. The dock is the REPL.
- **`_`** — empty. It does not apologise.

---

## 6. What already works (do not throw away)

The VAULT field is a **SPECK machine**. React is the host envelope (canvas, native dock input). Tasks are source. Do not restyle a component tree and call that the OS.

- One dock, context from what you tapped. This is the magic.
- The slip: paper on black, bleeding, printed rules, real-metadata masthead.
- Branching by `+`, with diagonal wires and seeded jitter.
- Red as the hand. Cobalt as the type.
- The undo ripcord after a kill. This tool lives open on a phone; a silent branch delete is the one
  unforgivable bug.
- Persistence is the SPECK source string (`speck-tree-v1` in localStorage).

What failed: the old todo OS (calendar cards, nest, dump), the globe/beige seal shell, and the
7-across month pack. Dead. Do not revive them. Sections want cards. Cards are DateBlocks.

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
STEM "ops" 08.19.26
  STEM "flush resolvers" STRIKE 08.19.26 22:41
    STEM "check dns" 08.19.26
  STEM "scout ridge a" 08.19.26
```

**Tokens**

| Form | Example | Meaning |
| --- | --- | --- |
| word | `STEM` `HIT` `STRIKE` | opcode or flag |
| string | `"flush resolvers"` | the task |
| tape date | `08.19.26` | `MM.DD.YY` — born, for staleness |
| clock | `22:41` | `HH:MM` — the settle time |
| indent | two spaces | depth. This is the whole tree model. |

Indent is the hierarchy. Depth is capped at 4; a child added deeper lands as a sibling rather than
disappearing. Empty source is a clean slip.

### 7.2 Nouns (source)

These name the field. They compile to paint ops. Do not add a noun unless the field grew a new organ.

| Noun | Says |
| --- | --- |
| `STEM` | one task. Nested by indent. `STRIKE` settles it. |
| `DOCK` | the one prompt (always compiled) |

Dead organs, never to be compiled again: `CAL` `DAY` `NEST` `DUMP` `SEAL`. Typed at the dock they are
just tasks, which is correct.

### 7.3 Opcodes / IR

The painter executes a **stateless display list**. Colour is baked into each op at compile.

| Op | Paints |
| --- | --- |
| `GLYPH` | type. Optional `ghost` prints it twice, off-register. |
| `WIRE` | diagonal parent-to-child connector, jittered, overshooting. |
| `DOT` | node ring; filled when settled or armed. |
| `HAND` | the red strike. Jittered polyline past both ends of the text. |
| `CHIP` | cobalt fill, paper text. Radius 0. |
| `LINE` | hairline. Dashed for stale. |
| `FILL` | the black field and the paper slip. |
| `STAMP` | distorted oval, letterspaced caps, mis-registered. |

Overlap is legal. The stamp may cross the rows.

### 7.4 Events

Pointer and keys are SPECK. The host does not own behaviour; it forwards.

```
HIT DOT   <path>    settle / unsettle
HIT ROW   <path>    select
HIT PLUS  <path>    arm as parent
HIT RATIO <path>    fold the branch
HIT KILL  <path>    take the branch, arm undo
HIT PATH  <path>    climb out of focus
FOCUS <path> / OUT  print from a branch
TYPE … / COMMIT / UNDO / CLEAR / WIPE / SEE / WORDS
```

A path is positional (`0.2.1`). Taps land on pointer-up so a drag scrolls instead of firing, and a
long press claims the row first.

### 7.5 Dock REPL

The Prompt Dock is the **REPL**. One line. What you type is a task.

- A **lone verb** is a command. Anything longer is a task: `CLEAR` clears, `clear the desk` is work.
  This rule exists so the language can never eat your words.
- `+` arms a parent, and the placeholder says so (`+ under ops`). Commit lands the child there.
- Empty commit is a no-op. Unknown structural word echoes `? WORD`.
- The echo line carries the ripcord: `killed ops +2 · UNDO`.

### 7.6 Runtime contract

1. **Tasks are source.** `localStorage` key `speck-tree-v1`. Parse to a tree, mutate the tree,
   serialise back. Never do line surgery on the text.
2. **The field is compiled**, every frame, from source + session + now → display list → pixels.
   Session: selected, armed, folded, focus, undo, buffer, echo.
3. **Paint pixels.** Canvas (later Skia). Not DOM flow. The host may keep a native `<input>` over the
   dock glyph line. Envelope, not aesthetic.
4. **Hit test the display list.** Highest-z box wins. Dot and plus above the row; kill above both.
5. **Chaos is pure.** Every wobble comes from a hash of the task text. Reseed per frame and the slip
   shimmers — which is the difference between a printed object and a screensaver.
6. **Identity is the text.** Jitter follows a task when it moves; paths address it where it sits.

Packaging: installed PWA, `standalone`, black status bar, offline shell. The envelope is not the aesthetic.

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
- `├── └──` elbows and vertical indent rails for hierarchy — that is a file manager in a costume
- Fake receipt props: paper texture photos, torn or serrated edges, crumple, barcodes, QR
- macOS window chrome around the field

---

## 9. Refs — take / leave

Mood is canon. Palette of the ref is usually not.

**Rule:** if a reference is dark + green/cyan/amber phosphor, steal *structure* (density, leaders, brackets, grain) and restamp it onto canvas / ink / cobalt / urgent.

### TAKE

- **Cobalt-on-pale Archive poster** — north star. Saturated `#0000FF` on tinted off-white. Inverted highlight blocks as selection. Slashes `///` as structure. Dashed hairline. ASCII as graphic. Sharp, no radius, no shadow. Sleaze = editorial zine, not rave.
- **Fidèle mobile / S4AD (Pioneer Works)** — the same instinct twice, and the proof that cobalt is the *type* and not merely an accent. Micro-labels over values (`DATE` / `READ`), hairline rules between entries, letterspaced caps, rules printed as `*****` and `/////`, inverted highlight as selection.
- **HelloMe / That's / Astroworld receipts** — item left, value right, leader spine, dry service copy (`KEEP FOR YOUR RECORDS`, `DUPLICATE COPY`), a total that is really a count. A white slip in a black void: the contrast is the charge. Leave the paper texture and the serrated edge.
- **Astroworld's marker scrawl** — the hand over the machine print. This is where red comes from. Take the principle; leave the literal smiley sticker.
- **April 04 calendar** — coloured lines struck straight through numerals, with a printed legend so the marks stay honest. Take strike-as-status and the key. Leave the month grid.
- **Red node diagram** — dots fanning on straight diagonal wires. The connector language, exactly.
- **Pacific Bell glitch badge** — mis-registration and a distorted seal. Take the technique; green is vetoed.
- **CICS / z/OS region overview** — density, `Command ==>`, leader dots, color as status, character chrome `[X] [←]`. Leave the black rainbow phosphor.
- **1985 tactical monochrome** — leader dots, asterisks as dividers, geometric status glyphs (`● ○ ▲`), UTC stamps, every pixel earns its keep. Leave radar/cockpit and black-only.
- **btop / popeye / GDB TUIs** — character grid, `[bracket]` pane labels, keyboard legend, dotted leaders, ASCII wordmarks, `>>>` prompt, nested hierarchy. Leave dark themes, emojis, mascots, rainbow accents.
- **CIPHER grain + wireframe globe** — slash section markers, 90° corners, ticker of terse values. Leave yellow/black, the service cards, and the globe itself.
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

**VAULT-specific content (this repo):** the branching task slip; Helvetica throughout; `BAD FORM` as
the maker's stamp; one-line dock REPL; persistence `speck-tree-v1`. No globe. No beige seal shell. No
calendar. No scratch dump.

---

## 11. Voice

Write like a terminal that went to art school for one semester and dropped out.

- Terse. Uppercase where the machine would shout.
- No “welcome to your dashboard.”
- No empty states that apologize. Empty is `_`.
- Service copy, not UI copy: `KEEP FOR YOUR RECORDS`, `BAD FORM`, `killed ops +2 · UNDO`.
- Filenames as mythos: `flush_stale_resolvers.sh`, `cnc_toolpath_night_run`, `scout_ridge_a`.
- Maker mark: BLACK LANTERN. Product mark: VAULT WORLDWIDE.

---

## 12. Authority

Further from the norm. Firmly in utility. Order from chaos.

Propose bold changes inside this language. Do not propose a new language because CSS was easier.

Full short law: `.cursorrules`  
This file: the canon.
