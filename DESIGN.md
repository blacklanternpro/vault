---
name: VAULT
description: One person's ledger as a directory on a light field — a tree that pivots into a board, three faces, one blue, raw seams.
colors:
  ground: "#f2f3f6"
  surface: "#ffffff"
  ink: "#151515"
  ink-2: "#5f636a"
  ink-3: "#696d74"
  tint: "#83878e"
  line: "#e5e6e8"
  line-2: "#d7d9dd"
  accent: "#0b6ef3"
  accent-deep: "#0a5cdd"
  accent-ink: "#ffffff"
  accent-wash: "#f1f6fe"
  accent-line: "#a9c9fb"
  urgent: "#c8281d"
  pending: "#5f636a"
  rnd: "#7a4ddb"
  active: "#0a5cdd"
  done: "#147a47"
  dusted: "#7b6a5d"
colors-night:
  ground: "#101114"
  surface: "#17191d"
  ink: "#ecedef"
  ink-2: "#a2a6ad"
  ink-3: "#868a91"
  tint: "#6f737a"
  line: "#262930"
  line-2: "#33373f"
  accent: "#4c8ff7"
  accent-deep: "#5a98f8"
  accent-ink: "#101114"
  accent-wash: "#172238"
  accent-line: "#2b4a80"
  urgent: "#f0574b"
  pending: "#a2a6ad"
  rnd: "#b39bf2"
  active: "#4c8ff7"
  done: "#4cbf86"
  dusted: "#b9a089"
typography:
  wordmark:
    fontFamily: "Sofia Sans Semi Condensed Variable, Public Sans Variable, Helvetica Neue, Arial, sans-serif"
    fontSize: "24px"
    fontWeight: 700
    lineHeight: "1"
    letterSpacing: "0.03em"
  lane:
    fontFamily: "Sofia Sans Semi Condensed Variable, Public Sans Variable, Helvetica Neue, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: "1"
    letterSpacing: "0.055em"
  card-title:
    fontFamily: "Sofia Sans Semi Condensed Variable, Public Sans Variable, Helvetica Neue, Arial, sans-serif"
    fontSize: "15.5px"
    fontWeight: 700
    lineHeight: "20px"
    letterSpacing: "0.02em"
  slot:
    fontFamily: "Sofia Sans Semi Condensed Variable, Public Sans Variable, Helvetica Neue, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 700
    lineHeight: "1"
    letterSpacing: "0.06em"
  tree-task:
    fontFamily: "Sofia Sans Semi Condensed Variable, Public Sans Variable, Helvetica Neue, Arial, sans-serif"
    fontSize: "14.5px"
    fontWeight: 700
    lineHeight: "24px"
  typed:
    fontFamily: "Public Sans Variable, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: "24px"
  body:
    fontFamily: "Public Sans Variable, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "1.4"
  mono-row:
    fontFamily: "JetBrains Mono Variable, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "24px"
  mono-col:
    fontFamily: "JetBrains Mono Variable, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "12px"
    fontWeight: 400
  mono-meta:
    fontFamily: "JetBrains Mono Variable, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "11.5px"
    fontWeight: 400
  mono-path:
    fontFamily: "JetBrains Mono Variable, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: "1.3"
rounded:
  edge: "8px"
  inner: "4px"
  dot: "50%"
spacing:
  topbar-height: "52px"
  topbar-pad: "0 16px"
  stage-pad: "20px 28px 48px"
  row: "24px"
  row-pad: "0 6px"
  folder-gap: "10px"
  tree-max: "1040px"
  rail-width: "216px"
  rail-pad: "20px 14px"
  rail-gap: "8px"
  drawer-width: "286px"
  board-gap: "14px"
  lane-pad: "4px 4px 12px"
  card-gap: "8px"
  card-pad: "10px 12px 11px"
  status-height: "32px"
components:
  tree-row:
    textColor: "{colors.ink}"
    typography: "{typography.mono-row}"
    height: "24px"
    padding: "{spacing.row-pad}"
    rounded: "{rounded.inner}"
  tree-row-hover:
    backgroundColor: "{colors.accent-wash}"
  tree-row-cursor:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.card-title}"
    rounded: "{rounded.edge}"
    padding: "{spacing.card-pad}"
  card-cursor:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.accent}"
  rail-slot:
    backgroundColor: "{colors.surface}"
    typography: "{typography.slot}"
    rounded: "{rounded.edge}"
    padding: "14px 12px"
  chute:
    backgroundColor: "{colors.surface}"
    rounded: "8px 8px 0 0"
    padding: "18px 10px"
  draft:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.edge}"
    padding: "6px 10px 8px"
  status-line:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    typography: "{typography.mono-col}"
    height: "32px"
  topbar:
    backgroundColor: "{colors.surface}"
    height: "52px"
  drawer:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    width: "286px"
    padding: "19px 18px 24px"
---

# Design System: VAULT (tree-first)

The rules are in [`docs/LANGUAGE.md`](docs/LANGUAGE.md). This file is the values: what Phase 2 builds the new home with, measured from the approved prototype (`src/proto/proto.css` on branch `proto/pivot`, Jake: "feels pretty good", 17 Nov) and from the shipped board where a value survives. Strings: [`docs/VOICE.md`](docs/VOICE.md). Actions: [`docs/ACTIONS.md`](docs/ACTIONS.md).

Two builds live in this repo during Phase 2:

- **The new home** — new files beside the old screen. Every value in the front matter above is for it.
- **The retiring shell** — `src/shell/*` and `src/index.css` (~4,430 lines), kept at `/classic` until Jake kills it. Its values are listed in §9 so nobody ports them by accident. Don't refactor it; don't add to it.

Where this file disagrees with the prototype, this file wins and says why.

## 1. North star

**"The directory, played straight."** A cool near-white field, one blue, hairlines, and a tree you can drive with the mouse, the keys or a line of shell. The board is the same rows turned on their side. Character comes from who wrote what (sans vs mono), from real state shown plainly, and from a voice used once a screen.

Key characteristics:
- The tree sits on the ground; panels (top bar, rail, drawer, status line, cards) are white on one hairline.
- One blue, spent on the cursor's caret, hover and drop zones, the primary action, blue words (in `accent-deep`).
- Three faces: sans for what a person typed, plaque caps for names, mono for what the machine wrote and for structure.
- No shadows at rest. A dragged row is reverse video.
- Icons are characters: `+ x → _ ! ░ ^`.

## 2. Colour

### 2.1 Day (measured contrast)

Contrast is WCAG 2.x ratio against the **ground** `#f2f3f6`, the **surface** `#ffffff` and the **wash** `#f1f6fe` (hover and drop zones). A word must clear 4.5:1 on all three; a meaningful mark 3:1.

| Token | Value | ground | surface | wash | Job |
| --- | --- | --- | --- | --- | --- |
| ink | `#151515` | 16.46 | 18.26 | 16.83 | primary text; the cursor plate |
| ink-2 | `#5f636a` | 5.44 | 6.04 | 5.56 | subtasks, meta, counts, status line |
| **ink-3** | **`#696d74`** | **4.68** | **5.20** | **4.79** | the faintest word: hints, `_`, done rows, path lines, exit codes |
| tint | `#83878e` | 3.25 | 3.61 | 3.32 | **marks only**: stems, `░`. Never a word |
| line | `#e5e6e8` | — | — | — | hairline |
| line-2 | `#d7d9dd` | — | — | — | hover border, dashed slots, a done subtask's strike |
| accent | `#0b6ef3` | 4.17 | 4.63 | 4.26 | fills, the caret, borders, drop rules. **Not** a word on the ground |
| accent-deep | `#0a5cdd` | 5.28 | 5.85 | 5.39 | a blue **word** (`← claude`, links, `ACTIVE`); the primary button's hover |
| accent-ink | `#ffffff` | — | — | — | text on an accent fill (4.63 on `accent`, 5.85 on `accent-deep`) |
| accent-wash | `#f1f6fe` | — | — | — | hover, drop zone |
| accent-line | `#a9c9fb` | 1.52 | 1.69 | 1.56 | a draft's dashed border; a decorative line, never a mark that carries meaning alone |
| urgent | `#c8281d` | 5.01 | 5.56 | 5.12 | `^`, `!`, `3d late`, `4/3` |
| pending | `#5f636a` | 5.44 | 6.04 | 5.56 | = ink-2 ("not started" is not an event) |
| rnd | `#7a4ddb` | 4.84 | 5.37 | 4.95 | R&D word |
| active | `#0a5cdd` | 5.28 | 5.85 | 5.39 | ACTIVE word (= accent-deep) |
| done | `#147a47` | 4.85 | 5.38 | 4.96 | DONE word, chute floor |
| dusted | `#7b6a5d` | 4.66 | 5.17 | 4.76 | `.dusted/` word |

The reverse-video cursor (surface `#ffffff` on ink `#151515`) is 18.26.

**Audit 10, corrected.** The faintest grey in the shipped app is the old `ink-3` `#83878e`, which ends up carrying words at 3.61:1 on white (3.25 on the ground) against a 4.5:1 floor; the prototype's `#767a81` is still only 3.89 on the ground. Phase 2 sets:
- `ink-3` = **`#696d74`** — the lightest grey that holds 4.5:1 on the ground, the surface and the wash with a margin (4.68 / 5.20 / 4.79).
- `tint` = `#83878e` — the old value, renamed, for marks only.
- `ink-2` = `#5f636a` (the prototype's value, darker than the shipped `#666a70`), so ink-2 and ink-3 stay a visible step apart.

**Also corrected while here** (same floor, same reason — each of these was a word below 4.5:1 on the ground):
- `urgent` `#d92c20` (4.37 on ground) → **`#c8281d`** (5.01).
- `done` `#157f4a` (4.54, too close to the floor) → **`#147a47`** (4.85).
- Blue words use `accent-deep` `#0a5cdd`; `accent` `#0b6ef3` is 4.17 on the ground and stays a fill, a rule and the caret.
- The prototype draws a draft's stems in `accent-line` (1.69:1). Stems are marks: draft stems use `accent` (4.63 on surface).

### 2.2 Night (the same field inverted)

| Token | Value | ground | surface | wash |
| --- | --- | --- | --- | --- |
| ink | `#ecedef` | 16.12 | 15.02 | 13.56 |
| ink-2 | `#a2a6ad` | 7.73 | 7.20 | 6.50 |
| ink-3 | `#868a91` | 5.45 | 5.08 | 4.58 |
| tint | `#6f737a` | 3.96 | 3.70 | 3.33 |
| accent | `#4c8ff7` | 5.92 | 5.51 | 4.98 |
| accent-deep | `#5a98f8` | 6.55 | 6.10 | 5.51 |
| urgent | `#f0574b` | 5.55 | 5.17 | 4.67 |

Ground `#101114`, surface `#17191d`, line `#262930`, line-2 `#33373f`, accent-wash `#172238`, accent-line `#2b4a80`, accent-ink `#101114` (5.9:1 on the lifted blue), status inks rnd `#b39bf2`, done `#4cbf86`, dusted `#b9a089`, pending = ink-2, active = accent. These are the shipped night values (`src/index.css` §night mode), except `ink-3`/`tint` (the shipped night `ink-3` `#6f737a` is the tint, renamed) and `accent-deep` (the shipped `#3b7de6` is 4.41 on the night surface, so it can't be a word). A stored choice on `<html data-theme>` wins; with none, the system preference.

### 2.3 Rules

1. **Marks-only tint.** Audit: grep for `tint`; if one use is a word, it's the wrong token.
2. **One accent.** Wash, line, solid, deep — values of one hue. Red is urgent/late/over. Nothing else saturated.
3. **Status ink on the word.** `ls -l` status column, lane plaque, rail slot plaque, drawer plaque. Never a fill, border or row background.

## 3. Type

Faces (self-hosted through Fontsource, variable weights):
- **UI sans:** Public Sans Variable (`@fontsource-variable/public-sans`, installed).
- **Plaque:** Sofia Sans Semi Condensed Variable (`@fontsource-variable/sofia-sans-semi-condensed`, installed).
- **Mono:** JetBrains Mono Variable (`@fontsource-variable/jetbrains-mono`) — on `proto/pivot`; **Phase 2 adds it to `main`'s `package.json`**. Today's shell uses `ui-monospace` stacks in several places; the new home uses JetBrains Mono everywhere mono appears.
- `public/fonts/oswald-*.woff2` are dead-world leftovers (Oswald is vetoed as work type) and should go in the deletion pass.

| Role | Face | Size / line | Weight | Notes |
| --- | --- | --- | --- | --- |
| wordmark `VAULT_` | plaque | 24 / 1 | 700 | tracked .03em; `_` in accent; no blink |
| lane plaque | plaque | 17 / 1 | 700 | tracked .055em; status ink |
| card title (Jake) | plaque | 15.5 / 20 | 700 | tracked .02em, uppercase |
| card title (Claude) | mono | 13 / 19 | 600 | until touched |
| rail slot plaque | plaque | 15 / 1 | 700 | tracked .06em |
| tree task (Jake) | plaque | 14.5 / 24 | 700 | uppercase *(call: G4, see below)* |
| tree folder / subtask (Jake) | sans | 13.5 / 24 | 700 folder, 400 subtask | subtask in ink-2 |
| tree row (Claude), stems, ticks | mono | 13 / 24 | 600 task, 400 else | the prototype's tree face |
| `ls -l` columns, counts, status line, top-bar buttons | mono | 12 | 400; status word 600; buttons 500 | tabular |
| card meta | mono | 11.5 | 400 | ink-2 |
| card path line | mono | 11 / 1.3 | 400 | ink-3 |
| `← claude` | mono | 11.5 | 400 | accent-deep |
| empty `_` | mono | 13 | 400 | ink-3 |
| drawer body, inputs | sans | 14 / 1.4 (description 13.5 / 25) | 400 | |
| chute arrow `↓` | mono | 40 / 1 | 400 | done ink |
| chute `today n` / `n all time` | mono | 12.5 / 11 | 700 / 400 | |

**Call (G4): the tree's face follows the plan, not the prototype.** The prototype set every tree row in mono. The plan's rule is that the face says who wrote it, so in production Jake's titles are sans (folders, subtasks) and plaque caps (tasks); stems, columns and Claude's untouched rows stay mono. Task rows use the same plaque as their cards so the pivot morphs a name into the same name. If the feel check on the Phase 2 preview prefers the all-mono tree, the switch is two tokens.

Rules: caps are names; numbers beside names are `tabular-nums`; size plaques by measured ink width; no fourth face.

## 4. Layout (desktop, from `proto.css`)

- **Page:** a column — top bar (52px, white, hairline below, padding `0 16px`), body, status line (32px, white, hairline above, padding `0 16px`, gap 10px).
- **Body, tree:** `tree · drawer · rail`. Tree in `minmax(0, 1fr)` on the ground, padding `20px 28px 48px`, rows capped at 1040px. Drawer 286px (the shipped width), docked, white, hairline left. Rail 216px, white, hairline left, padding `20px 14px`, slots 8px apart. *(Call: G4 — the plan docks the drawer beside the tree but doesn't say where; the prototype has only the rail. Order tree · drawer · rail at ≥1360px; below 1360 the drawer overlays the tree's right edge as it does the board's; below 900 it is a panel in the column.)*
- **Tree rows:** 24px tall; row plate padding `0 6px`; folders 10px apart (the first has no gap); `ls -l` columns at the right: status 9ch, progress 6ch right-aligned, due 10ch right-aligned.
- **Body, board:** one column. Grid `repeat(3, minmax(220px, 1fr)) minmax(120px, 150px)` — three lanes and the chute — gap 14px, `align-items: start`. Lane min-height 240px, padding `4px 4px 12px`, head padding `2px 6px 12px`. Cards 8px apart.
- **Chute:** sticky at the top, min-height 240px, padding `18px 10px`, 1px `line-2` border with a 4px `done` floor and square bottom corners (8px top), centred `DONE`, `↓`, `today n`, `n all time`.
- **Rail slots:** padding `14px 12px`, dashed `line-2`, 8px. DONE slot solid `line-2`, square bottom, `inset 0 -3px 0 done` floor. `.dusted/` slot pinned to the rail's foot.
- **Draft (inbox/):** white, 1px dashed `accent-line`, 8px, padding `6px 10px 8px`, 18px below it.
- **Paste panel:** under the top bar, padding `12px 16px`, mono textarea 13/20 on the ground, 132px tall, `line-2` border, 8px.
- **Below 900px:** one column; the rail becomes a wrapping row under the tree (no label, no dust slot); the board scrolls sideways at four 220px columns; the key hint on the status line hides.

## 5. Shapes and surface

- **Two radii:** 8px on every edge you can see (cards, slots, drafts, panels, controls, the paste textarea); 4px on inner chrome (the row plate, kbd, top-bar buttons, the drag ghost). Circles only for dots. The prototype's 3px row plate, 6px buttons and ghost, and 10px lanes and chute are normalised to 4 / 4 / 8 *(call: G4)*.
- **Hairlines:** 1px `line`; `line-2` for hover, dashed slots and drop outlines.
- **Shadows:** none at rest. The prototype's drag ghost is reverse video (ink plate, surface text, mono 600 12.5px, padding `7px 10px`, rotated −1.5°, offset 14px/10px from the pointer) with no shadow; keep it that way.
- **Drop targets:** a folder, lane, card, slot or chute under a drag takes `accent-wash` with `inset 0 0 0 1px accent`. Dropping above a row draws `inset 0 2px 0 accent` on that row instead.
- **Cursor:** the row plate in `ink`, every glyph in it `surface`, `_` caret after the title. On the board the cursor card takes an `accent` border plus `inset 0 0 0 1px accent`.
- **Lifted row:** 30% opacity while its ghost is out.
- **Kbd:** mono 11px, ink-3, 1px `line-2` (2px bottom), 4px, padding `3px 5px`.

## 6. Motion (measured)

| Motion | Value | Notes |
| --- | --- | --- |
| caret blink | 1.1 s `steps(1)` infinite | the live caret only; the wordmark `_` does not blink *(call: G4 — the prototype blinks both)* |
| pivot out | 140 ms; non-card rows, stems, ticks, lane heads, chute, drafts fade 120 ms ease-out | |
| pivot morph | 520 ms `cubic-bezier(.2,.8,.15,1)`, stagger 14 ms per row capped at 300 ms, then the ghost fades 140 ms | rows with no card fall into the chute; past 90 morphs the rest appear in place |
| pivot in | everything else fades in 260 ms after a 360 ms delay | must be interruptible in production |
| done → chute | the title flies to the counter, 620 ms `cubic-bezier(.55,0,.8,.2)`, scale to .3; then the counter bumps 380 ms `cubic-bezier(.3,1.6,.5,1)` | |
| typed in (push lands) | `clip-path` reveal, 420 ms `steps(16)`, 70 ms stagger per row, top to bottom, once | the one new motion |
| status line message | the same reveal, 300 ms `steps(20)` | |
| state changes (borders, fills, opacity) | 110–140 ms | the shipped range |

Every duration is answered by `prefers-reduced-motion: reduce` holding all animations and transitions to none — the caret included.

## 7. Components

- **Top bar:** `VAULT_`, the `tree / board` segment with `kbd v` (pressed segment: ink fill, surface text), `ls -l` and `ls -a` toggles (pressed: accent text, accent-line border, wash), the find field, `paste a tree`, then on the right `saved 21:14 · 3 unpushed`, `done today n` (a hairline left of it), `?` and `⋯`. Buttons are mono 500 12px, ink-2, transparent border, 4px, padding `8px 9px`; hover ink with a `line-2` border.
- **Tree row:** see §3–5. Hover strip at the row's right end (before the columns), mono, ink-3: `+` `→` `x`, each with its key in the tooltip. A Claude row ends in `← claude`. A loose row ends in ` →`. Done rows: title ink-3; done subtasks struck in `line-2`. Folder count at the right (`_` at zero).
- **`.dusted/` row:** dusted ink, at the folder's foot, with its count and `· a shows` while hidden.
- **Card:** path line, title, meta line (`2/5 · fri · ^ · ← claude`, gap 10px, margin-top 6px; hidden when empty). Hover border `line-2`. A Claude card's title is mono.
- **Lane head:** plaque + mono count (ink-3; `n/3` on ACTIVE, urgent when over). An empty lane shows `_`.
- **Drawer:** 286px, padding `19px 18px 24px`. Head: status plaque in its ink, title (display plaque 32/32 for Jake, mono for Claude), path. Sections as plaques: `NEXT`, `LEFT OFF`, `DESCRIPTION`, `SUBTASKS`, `LINKS`, `HANDOFF`, `TRAIL`. Subtasks are rows with `[ ]`/`[x]` — no boxed lines, no drawn ticks.
- **Status line:** `$` (accent, 700), the last message, gap, exit code (ink-3), key hint (ink-3, hidden under 900px). When `:` is pressed the message becomes the prompt.
- **tail -f strip:** above the status line, white, hairline above, mono 12px, the last five writes newest at the bottom, `← claude` lines in accent-deep.
- **Confirm (rm -r only):** a single line in the status line's place, mono: `this takes 14 things with it. sure?  y  n`, focus on `n`.

## 8. Do / don't

Do: build every surface as white on the ground with one hairline and 8px corners · set what a person typed in the sans and what a machine wrote in mono · keep the tint on stems · put status ink on the word only · use characters for icons · show the real number · hold the reduced-motion block for every new animation · measure before you set a value.

Don't: add a hue · put a shadow on anything at rest · colour a card by status · set a word in the tint · draw an SVG icon in the new home · add a progress bar · let opening the drawer move a lane · port a rule from `index.css` without a reason.

## 9. The retiring shell's values (`src/shell`, `src/index.css`) — reference, don't port

Kept at `/classic` until Jake kills it. Values as shipped:

| Thing | Retiring value | New home |
| --- | --- | --- |
| ink-2 | `#666a70` (5.44 surface / 4.90 ground) | `#5f636a` |
| ink-3 | `#83878e` (3.61 / 3.25) — the tint | split: `ink-3` `#696d74`, `tint` `#83878e` |
| urgent | `#d92c20` | `#c8281d` |
| done | `#157f4a` | `#147a47` |
| night ink-3 | `#6f737a` | `ink-3` `#868a91`, `tint` `#6f737a` |
| night accent-deep | `#3b7de6` | `#5a98f8` |
| radii | 8 slab/control, 6 mark, 5 row, 4 tick, 50% | 8 / 4 / 50% |
| type | display 32/32, headline 17/22 (.055em), title 15.5/20, label 15/18 (.015em), body 13.5/20, meta 12.5, micro 12 (.04em) | §3 |
| layout | top bar 69px, lanes 196px with a 10px gutter, cards 15px apart, card padding `23px 14px 18px`, drawer 286px over the board, catalogue below with a 24px fold cue | §4 (the drawer's 286px survives; the rest retires) |
| mono | `ui-monospace, SFMono-Regular, Menlo, Consolas` for stems, prompt, palette | JetBrains Mono Variable |
| icons | inline SVG at 1.3–1.8px stroke (`Glyph.tsx`, `HandoffGlyph.tsx`, `NightGlyph.tsx`, `Mark.tsx`) | the ASCII set |
| motion | drawer arrival 170 ms `cubic-bezier(0.2, 0.7, 0.3, 1)`, lines at 30/55/80 ms; lane slide; leash; state 110–140 ms | §6 |
| shadow | airborne `0 8px 20px rgb(21 21 21 / .13)`; focus halo `0 0 0 3px accent-wash` | reverse-video ghost; focus is the accent outline |
| retired with it | five lanes, the leash and jacks, the fold cue, filter chips, the `+ New` button, the notes tape, the Tonight shelf's dim | |
