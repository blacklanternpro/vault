# BLACK LANTERN — Design Language

**Canon.** Copy this file into another repo and the language still holds.
Short law for agents lives in `.cursorrules`. This file is the full tongue.

Maker: BLACK LANTERN. First instance: **VAULT WORLDWIDE** — a local-first personal OS you install, not a website you visit.

If a thing cannot be said in this language, it is not in the work.

---

## 0. The test

Before you add a feature, a color, a font, a panel, a motion, a word:

1. Can it be said in **SPECK**? (see §7)
2. Does it live on **canvas / ink / cobalt / urgent** — and nowhere else?
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
| Canvas | `#F4F4F0` | Machine plastic. The field. |
| Ink | `#111111` | Body, stems, seal linework. |
| Cobalt | `#0000FF` | Phosphor. Chrome. Selection. Day labels. Date anchors. Active invert chips. |
| Urgent | `#FF2B2B` | Warning LED only: strikes, URGENT, `[X]`. |

Cobalt = chrome. Red is not a brand color. Red is an alarm.

No teal. No amber-as-theme. No terminal green. No canary. No cyan HUD. No mauve/mustard ricing palettes.

**INV** inverts the whole field (`invert` + `hue-rotate-180`). It is a dirty display invert, not a second theme system. Do not author a dark palette.

### Type

- **JetBrains Mono** — everything that is data, chrome, marks, dock, metadata.
- **Space Grotesk, light** — display numerals if the program paints them. Not a calendar organ.
- No Inter. No VT323. No Orbitron. No Helvetica-as-section-billboard. No pixel-display novelty fonts.

Tracking is tight on chrome. Uppercase for legends and shouts.

### Surface

- Border radius: **0**. Everywhere. Including native controls.
- No soft shadows. No gradients. No blur. No glass.
- Grain: fried SVG noise, multiply, low opacity — xerox, not Instagram.
- Scan: CRT hairlines, barely there.
- Selection: cobalt field, canvas text.

---

## 4. Composition

One continuous personal OS field. Not a dashboard. Not stacked sections. Not three apps in a trenchcoat.

Mobile-first. The dock is locked to the viewport bottom.

**VAULT instance (SPECK machine — the calendar / todo / scratch shell is dead):**

1. **Seal** — centered VAULT WORLDWIDE micrographic. Scanline globe + orbital seal. Legend `REINDUSTRIALIZE`. Wordmark + `WORLDWIDE ®`. Tagline `local_first // no_cloud`. Clock + `INV` as chrome, not a header bar. **No box around the seal.**
2. **Field** — whatever the live SPECK source paints (`GLYPH` `CHIP` `STEM`). Empty source after the seal is empty canvas. Click a mark to `STRIKE` it. No month grid. No todo tree as an app. No scratch organ.
3. **Dock** — ONE prompt. Always. Label `SPECK // field`. Blinking `>`. `↵` commits. Never three forms. Never CTX chips in the header.

A later agent may rethink density and placement **inside this world**. It may not revive CAL / NEST / DUMP as product organs. It may not add hardware bays, card grids, or a second input.

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

The VAULT field is a **SPECK machine**. React is the host envelope (canvas, native dock input). The live program is source. Do not restyle a component tree and call that the OS.

- One dock. This is the magic. The dock is the SPECK REPL.
- Seal + INV + grain + scan on the glass.
- Paint ops: `GLYPH` `CHIP` `STEM` `SEAL` `STRIKE`.
- Beige canvas already *is* cassette-futurism plastic.
- Persistence is the SPECK source string (`speck-program` in localStorage).

What failed: the calendar / todo nest / scratch dump as the product. Dead. Do not revive them. What failed historically before that: translating vision into React *sections*. Sections want cards. Cards are DateBlocks.

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
SEAL reindustrialize
GLYPH "FLUSH RESOLVERS"
CHIP "OPS"
STEM ops/
  STEM net/ flush_stale_resolvers.sh
GRAIN
SCAN
```

**Tokens**

| Form | Example | Meaning |
| --- | --- | --- |
| word | `SEAL` `ops/` `GLYPH` | opcode, path, legend |
| string | `"FLUSH RESOLVERS"` | glyph / chip payload |
| number | `11` `-1` | counts, hit args |
| flag | `STRIKE` `URGENT` | ink on a mark |

Default program is seal + glass. Empty field after the seal is correct.

### 7.2 Nouns (source)

These name the field. They compile to paint ops. Do not add a noun unless the field grew a new organ.

| Noun | Says |
| --- | --- |
| `SEAL` | orbital mark + legend |
| `GLYPH` | ink string on the field |
| `CHIP` | inverted cobalt block |
| `STEM` | one tree node (`│ ├── └──`) |
| `DOCK` | the one prompt (always compiled; not a widget you spawn) |

Dead nouns (do not compile as organs): `CAL` `DAY` `NEST` `DUMP`. Typed at the dock they are data → `GLYPH`.

`SEE` echoes the current source in the dock. `WORDS` echoes the opcode list. `CLEAR` resets to the default source. `URGENT` is STEM ink. `STRIKE` cuts the last mark (or the mark you click).

### 7.3 Opcodes / IR

The painter executes a **stateless display list**. Source `INK` is baked into each op at compile. Public ops:

`GLYPH` `INK` `STRIKE` `CHIP` `STEM` `SEAL` `DOCK` `GRAIN` `SCAN` `INV`

| Op | Paints |
| --- | --- |
| `GLYPH` | string at a point. Mono, except display numerals (Space Grotesk light). |
| `INK` | source-only. Baked into the glyph at compile. |
| `STRIKE` | urgent red mid-line through a mark. |
| `CHIP` | cobalt (or white) field, opposite text, radius 0. |
| `STEM` | ASCII prefix + label. |
| `SEAL` | globe + orbital + `VAULT` / `WORLDWIDE ®`. No box. |
| `DOCK` | `SPECK // field`, caret `>`, buffer, `↵`. Locked to the viewport bottom. |
| `GRAIN` | xerox dirt on the glass. |
| `SCAN` | CRT hairlines on the glass. |
| `INV` | dirty invert of the whole field. Not a palette. |

Overlap is legal.

### 7.4 Events

Pointer and keys are SPECK. The host does not own behavior; it forwards.

```
HIT INV
HIT MARK <line>
TYPE …
COMMIT
STRIKE
INV
CLEAR
SEE
WORDS
```

Click a painted mark to strike it. Click INV to invert. Never three forms. Never CTX chips in a header.

### 7.5 Dock REPL

The Prompt Dock is the **REPL**. One field. What you type is what the machine speaks.

- If the line **parses as a command** (first word is a paint op, event, `SEE`, `WORDS`, `CLEAR`): execute it.
- Paint nouns (`GLYPH` `CHIP` `STEM` `SEAL`) **append to source** (or replace the seal).
- Else the line is **data** → append `GLYPH "…"`. Typing `todo` does not spawn a todo widget.
- Empty commit is `_` (no-op).
- Unknown command word: echo `? WORD` (Forth).

Examples of command lines: `INV` · `SEE` · `WORDS` · `CLEAR` · `GLYPH "ridge"` · `CHIP "OPS"` · `STEM ops/` · `STRIKE`

### 7.6 Runtime contract

1. **The program is source.** `localStorage` key `speck-program`. Default is `SEAL reindustrialize` + `GRAIN` + `SCAN`. SPECK is not a database of tasks.
2. **The field is compiled**, every frame, from source + session → display list → pixels. Session is the live machine: INV, dock buffer, echo.
3. **Paint pixels.** Canvas (later Skia). Not DOM flow. Not Tailwind-as-OS. The host may keep a native `<input>` over the dock glyph line so the device keyboard works. That input is envelope, not aesthetic.
4. **Hit test the display list.** Highest-z box wins. Marks strike. INV chrome sits above.
5. **Commits mutate source.** `COMMIT` / paint nouns / `STRIKE` / `CLEAR` rewrite the program. No worker. No CRDT.
6. **Glass vs machine.** `GRAIN` and `SCAN` may be executed as CSS dirt on the host glass. They still appear in source (`SEE`). `INV` is a host invert of the whole field.

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
2. Change **world content** only: seal legend, what the field paints, what the dock commits.
3. Do not change the substrate into cards because “this product is a marketing site.” If it cannot live on one field with one dock, it is a different language — do not pretend it is this one.
4. Point `.cursorrules` at this file. Keep `.cursorrules` short. Agents read the short law; humans and long agents read this.
5. If you need a second color, you are already lost. Use cobalt. If it is an alarm, use urgent.

**VAULT-specific content (this repo):** seal `REINDUSTRIALIZE` / `VAULT` / `WORLDWIDE ®`; dock `SPECK // field`; persistence `speck-program`. The calendar / nest / dump shell is not part of the language instance anymore.

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
