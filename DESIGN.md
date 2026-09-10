---
name: VAULT WORLDWIDE
description: A local-first personal work board played straight — white chrome, one blue, hairlines, and two faces.
colors:
  ground: "#f2f3f6"
  surface: "#ffffff"
  ink: "#151515"
  ink-2: "#666a70"
  ink-3: "#83878e"
  line: "#e5e6e8"
  line-2: "#d7d9dd"
  accent: "#0b6ef3"
  accent-deep: "#0a5cdd"
  accent-ink: "#ffffff"
  accent-wash: "#f1f6fe"
  accent-line: "#a9c9fb"
  urgent: "#d92c20"
  pending: "#666a70"
  rnd: "#7a4ddb"
  active: "#0b6ef3"
  done: "#157f4a"
  dusted: "#7b6a5d"
typography:
  display:
    fontFamily: "Sofia Sans Semi Condensed Variable, Sofia Sans Semi Condensed, Public Sans Variable, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: "32px"
    letterSpacing: "0.016em"
  headline:
    fontFamily: "Sofia Sans Semi Condensed Variable, Sofia Sans Semi Condensed, Public Sans Variable, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: "22px"
    letterSpacing: "0.055em"
  title:
    fontFamily: "Sofia Sans Semi Condensed Variable, Sofia Sans Semi Condensed, Public Sans Variable, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "15.5px"
    fontWeight: 700
    lineHeight: "20px"
    letterSpacing: "0"
  label:
    fontFamily: "Sofia Sans Semi Condensed Variable, Sofia Sans Semi Condensed, Public Sans Variable, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: "18px"
    letterSpacing: "0.015em"
  body:
    fontFamily: "Public Sans Variable, Public Sans, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "13.5px"
    fontWeight: 400
    lineHeight: "20px"
  meta:
    fontFamily: "Public Sans Variable, Public Sans, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "12.5px"
    fontWeight: 400
  micro:
    fontFamily: "Public Sans Variable, Public Sans, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    letterSpacing: "0.04em"
rounded:
  slab: "8px"
  control: "8px"
  mark: "6px"
  row: "5px"
  tick: "4px"
  pill: "50%"
spacing:
  edge: "16px"
  edge-narrow: "14px"
  gutter: "10px"
  panel-inset: "10px"
  row: "9px"
  card-gap: "15px"
  subtask-gap: "18px"
  fold-cue: "24px"
  panel-head: "15px 19px 21px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.control}"
    padding: "0 7px 0 15px"
    height: "38px"
  button-primary-hover:
    backgroundColor: "{colors.accent-deep}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.control}"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 12px 0 13px"
    height: "36px"
  input-find:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.control}"
    padding: "0 14px"
    height: "40px"
    width: "377px"
  lane:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.headline}"
    rounded: "{rounded.slab}"
    padding: "{spacing.panel-head}"
    width: "196px"
  card-job:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.slab}"
    padding: "23px 14px 18px"
  card-job-open:
    backgroundColor: "{colors.accent-wash}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.slab}"
  drawer:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    padding: "19px 18px 24px"
    width: "286px"
  tree-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.row}"
    padding: "1px 9px"
  tree-row-live:
    backgroundColor: "{colors.accent-wash}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.row}"
  note-row:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.row}"
    padding: "{spacing.row}"
  subtask-tick:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.tick}"
    size: "20px"
  subtask-tick-done:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.tick}"
    size: "20px"
---

# Design System: VAULT WORLDWIDE

## Overview

**Creative North Star: "The Straight Board"**

This is the category standard played without a costume, at the craft level of Linear, Things and Height, and the ambition is to be indistinguishable from them on a glance and better than them on a second look. Everything the eye reads as "app" here is white panel on a cool near-white ground, separated by a single hairline. There is one blue and no second hue. The personality is not in a surface treatment; it is in the density of the board, the exactness of the plaques, and the fact that nothing on the page is decorative.

The field is one work graph shown twice. The upper screen is five lanes of job cards — PENDING, R&D, ACTIVE, DONE, DUSTED — and selecting a card opens a detail rail over the right of the board rather than in a column of its own, so the lanes never reshuffle and the board never leaves the screen. Below the board the same graph is a plain indented tree, and beside the tree a tape of dated notes. The two readings deliberately do not share chrome: a job is a card with a caps plaque on it, a catalogue entry is a stem and a line of text. Where the board is spatial, the tree is typographic.

Density is high and quiet. Cards are 196px wide and carry a name and a folder line, nothing else, until the pointer arrives and the card's one quick action fades in at its corner. Colour is spent almost nowhere: the accent marks what is selected, what a search found, and what you can press, and the five status colours are held back for the one place a job is actually named as a state. Confirmed rejections: the dark charcoal cassette-theatre studio this world replaced, its orange accent, its condensed-display plaques on black, and any depth built from shadows rather than lines.

**Key Characteristics:**
- White panels on a cool near-white ground (`surface` on `ground`), never a tinted app chrome.
- One blue accent, spent on selection, search hits and the single primary button.
- Depth by hairline (1px `line`) and surface change; the only shadow in the system means "in the air".
- Two faces: a semi-condensed plaque face for caps names, a neutral UI sans for everything read or written.
- A marks-only tint (`ink-3`) that is allowed to draw but never allowed to spell.
- Every list ends in an empty row that writes.

## Colors

A cool, almost colourless field with one saturated blue in it, sized so that the blue is always the thing you were looking for.

### Primary
- **Signal Blue** (`{colors.accent}`): The one accent. It fills the single primary button (`+ New`), fills a completed subtask's tick, colours the search hit count and the note's hitch line, rules under the word a search matched, and draws the focus ring's border. Nothing else in the interface is saturated by default.
- **Signal Blue Deep** (`{colors.accent-deep}`): The pressed-down step of the same blue, used only as the primary button's hover fill.
- **Signal Wash** (`{colors.accent-wash}`): The blue at reading strength. This is the system's selection surface: the open job card, the live tree row, the live note, the highlight behind a search hit, and the 3px focus halo around a field.
- **Signal Hairline** (`{colors.accent-line}`): The blue as a line rather than a fill. Borders the merely-selected (not open) card, dashes an empty lane while a drag is live, and rings the jack of a pulled satellite.
- **Signal Ink** (`{colors.accent-ink}`): Type and marks set on top of Signal Blue.

### Secondary
- **Flag Red** (`{colors.urgent}`): The `URGENT` flag and the title of a card carrying it. It is a flag, not a theme; it never fills a surface.

### Tertiary
The five lane inks, spent only inside the detail drawer's status plaque and dot:
- **Held Grey** (`{colors.pending}`): PENDING — the same value as secondary text, because "not started" is not an event.
- **Enquiry Violet** (`{colors.rnd}`): R&D.
- **Working Blue** (`{colors.active}`): ACTIVE — the accent itself, so the working state and the interface's own voice are one colour.
- **Closed Green** (`{colors.done}`): DONE.
- **Shelf Brown** (`{colors.dusted}`): DUSTED. The only warm ink in the field, and the point of it: the shelved thing is the one thing here that has gathered any.

### Neutral
- **Cool Ground** (`{colors.ground}`): The field behind every panel, and the hover surface for tree rows, notes and the drawer's close button.
- **Panel White** (`{colors.surface}`): Every panel and every card: top bar, lane, job card, drawer, directory, dump. Also the leash's jacket stroke, so a cable reads as passing over a panel rather than through it.
- **Near-Black Ink** (`{colors.ink}`): All primary text — plaques, job names, tree names, note text.
- **Readable Grey** (`{colors.ink-2}`): Secondary text at 5.4:1 on the panel and 4.9:1 on the ground: lane counts, folder counts, dates, placeholders, ledger-row prompts, drawer section labels, status verbs.
- **Mark Tint** (`{colors.ink-3}`): Held at 3:1 on both the panel and the ground. Glyph strokes, tree stems, disclosure chevrons, the search magnifier, the card's shovel at rest.
- **Hairline** (`{colors.line}`): The system's separator: under the top bar, around every panel, between notes, and as the drawer's own rule.
- **Hairline Strong** (`{colors.line-2}`): The one step up — hover border on a card or chip, the unfilled tick's border, a jack's ring, the leash core at rest, and the scrollbar thumb.

### Named Rules

**The Marks-Only Tint Rule.** `ink-3` is measured at 3:1 — the floor for a mark that carries meaning and below what a word is allowed to be set in. It draws stems, strokes and disclosure marks; it never sets a word. Secondary *text* is `ink-2` at 5.4:1. Audit test: find every use of the 3:1 tint; if one of them is a word, it is the wrong token.

**The One Accent Rule.** There is exactly one hue in the interface. Emphasis is a value of that hue — wash, hairline, solid, deep — not a second colour. Red is a flag and the five lane inks are a plaque; neither is licence for a palette.

**The Lane Says The Status Rule.** Status colours exist, and they are spent only where a job is entered: the drawer's plaque and dot. The board itself stays monochrome, so what says a card's state is the lane it is sitting in. This is restraint, not absence — do not conclude that status has no colour, and do not tint a card by its status.

## Typography

**Display / Plaque Font:** Sofia Sans Semi Condensed Variable (falling back to Public Sans Variable, then Helvetica Neue / Helvetica / Arial)
**Body / UI Font:** Public Sans Variable (falling back to Public Sans, then Helvetica Neue / Helvetica / Arial)

**Character:** A neutral, slightly warm grotesque for everything a person reads or types, and a taller, narrower cut for the names shouted in caps. The pairing is close enough to read as one voice and different enough that a name never looks like a sentence. Both are variable weights, self-hosted through Fontsource; no system display face is used anywhere.

### Hierarchy
- **Display** (plaque face, 700, `{typography.display.fontSize}` on a 32px line, tracked `0.016em`, uppercase): The entered job's name at the head of the detail drawer. One per screen.
- **Headline** (plaque face, 700, `{typography.headline.fontSize}` on a 22px line, tracked `0.055em`, uppercase): Panel names — the five lane heads, `CATALOGUE`, `DUMP` — and the drawer's status plaque, which takes the same size with tracking closed to 0 because a status is one short word beside a dot.
- **Title** (plaque face, 700, `{typography.title.fontSize}` on a 20px line, untracked, uppercase): A job's name on its card. The same plaque appears in the tree one step down (14.5px) so a job is recognisable as a job in either language.
- **Label** (plaque face, 600, `{typography.label.fontSize}` on an 18px line, tracked `0.015em`, uppercase): The drawer's section labels, `DESCRIPTION` and `SUBTASKS`. These are plaques two sizes down from the lane heads, not letterspaced body text — the earlier body-sans version of these labels was the worst-scoring text on the page.
- **Body** (UI sans, 400, `{typography.body.fontSize}` on a 20px line): The work rows — tree names, note text, the search input, every ledger row. The drawer's description paragraphs take the same size on a 25px line, because that column is read rather than scanned.
- **Meta** (UI sans, 400, `{typography.meta.fontSize}`): The quiet line beside a name — a card's folder line, a note's date, a subtask's name, and the box-drawing stems.
- **Micro** (UI sans, 600, `{typography.micro.fontSize}`, tracked `0.04em`, uppercase where it is a word): Counts, the search hit count, a tree row's status verb, the note's hitch line. The `URGENT` flag is the one heavier micro (700, tracked `0.08em`).

### Named Rules

**The Two Faces Rule.** The plaque face is for names set in caps and nothing else: lane heads, panel heads, job names on cards and in the tree, the drawer title, the drawer's section labels. Everything a person reads or types — descriptions, notes, tree names, inputs, prompts, counts — is the UI sans. A caps name in the body sans, or a sentence in the plaque face, is a defect in either direction.

**The Caps-Are-Names Rule.** Uppercase marks a name or a label, never a sentence and never a button. `+ New` is sentence case; `PENDING` is not.

**The Tabular Counts Rule.** Every number that sits beside a name — lane counts, folder counts, note dates — is set `font-variant-numeric: tabular-nums`, so a count changing does not move the name next to it.

## Layout

The page is a bounded field over a catalogue. The field is a two-row grid — top bar, then stage — sized `calc(100vh - 24px)`: a screen less a sliver, so the catalogue's own top edge is on screen at every desktop height and the page says there is more of it. The top bar is 69px, white, on one hairline, and holds the wordmark, a 377px search field, three filter chips packed against it, and the primary button pinned to the right rail; the slack between the chips and the button absorbs whatever the labels cost.

The board is a column grid of 196px lanes with a 10px gutter, padded `21px 16px`, scrolling sideways and never vertically — a lane scrolls its own stack instead. Cards sit 15px apart. The detail drawer is 286px, absolutely positioned over the right of the stage rather than taking a grid column, so opening a job never reshuffles the lanes underneath and the last lane runs on behind it. From 1360px up, the board pays the drawer's width as right padding so the rail is held open at every wide width and the lanes take the remaining slack; below that the drawer overlaps the last lane, which is what the approved comp shows.

Below the fold the catalogue repeats the field's own grid: the directory tree in `1fr` and the notes tape in the drawer's 286px, so the right rail stands in one line down the whole page. The tree is a multi-column flow at `columns: 400px` with a 28px column gap and each folder breaking as its own column — wide columns, because a subtask sits four stems deep and a narrow column is where its name loses its tail.

Below 900px the field stops being one screen and becomes one column at `height: auto`. The top bar wraps into three rows (wordmark and primary button share the first, search takes the second, the filter chips scroll sideways on the third rather than stacking into a fourth). The board keeps its own sideways scroll at `min(80vw, 320px)` per lane and stretches its lanes to a shared height, so a short lane cannot leave a screen of bare ground under its last card. The drawer becomes static, a panel in the column with its own border and 8px corners. Page padding drops from 16px to 14px, one seam for the whole column.

### Named Rules

**The Fold Cue Rule.** 24px of the catalogue is held on screen at every desktop height, and it is spent out of the bare ground under the lanes rather than out of the lanes themselves. A field cut exactly at the fold is a field that looks like it ends there.

**The Board Never Reflows Rule.** Opening, closing or renaming a job must not move a lane. The drawer floats over the stage and is paid for in padding, never in grid columns.

## Elevation & Depth

This system is flat. Depth is a 1px hairline and a change of surface: white panel on cool ground, a stronger hairline on hover, a wash for selection. There is no ambient shadow, no glass, no gradient, and no border heavier than 1px anywhere in the resting interface. Layering is expressed by the panel edge alone, which is why the hairline tokens are two steps rather than one.

The single exception is motion-bound. A card or subtask picked up leaves the page and casts one soft shadow while it is airborne; the row it came from holds its place at 32% opacity until the drop resolves. Because elevation is the whole signal there, the airborne card keeps its own hairline — a thing in the air is still the same thing.

### Shadow Vocabulary
- **Airborne** (`box-shadow: 0 8px 20px rgb(21 21 21 / 0.13)`): A dragged card or a subtask mid-pull, and nothing else.
- **Focus halo** (`box-shadow: 0 0 0 3px var(--color-accent-wash)`): The 3px wash ring on a focused search field or chip, paired with a blue border. This is a ring, not elevation.
- **Row seam** (`box-shadow: 0 -1px 0 var(--color-line)`): A hairline drawn as a shadow so it does not add to a row's box — used between notes and above the tape's ledger row.

### Named Rules

**The Hairline Rule.** Depth is a line, not a shadow. If a surface needs to read as above another, it changes fill and takes one 1px `line` border. Reach for `line-2` only for hover.

**The Shadow-Means-Airborne Rule.** The only shadow that reads as elevation is the airborne one, and it appears only while something is under the pointer and off the page. A resting surface with a shadow on it is a bug, not a variant.

## Shapes

Rounded but not soft. Panels, cards and controls all take 8px (`{rounded.slab}` / `{rounded.control}`), which is the single figure that makes a job card, a lane, a chip, the search field and the primary button read as the same family of object. Small chrome steps down: 6px on the icon buttons that appear inside a card or the drawer, 5px on the tree, note and tape rows, 4px on the subtask tick. Full round (`{rounded.pill}`) appears exactly twice — the drawer's status dot and the leash's jack — and both are circles by function, not pills.

Every border is 1px except the subtask tick's and the jack's 1.5px ring, which are marks rather than panels. Borders never double: a card inside a lane has its own hairline and the lane has one, and nothing else nests further. Dashes carry one meaning only — a pulled `LOOSE` card and an empty lane during a drag — so a dashed edge in this system always says "somewhere else is involved".

Icons are hand-drawn inline SVG on 12–21px boxes at a consistent 1.3–1.8px stroke, on `currentColor`, with round caps and joins: a two-wedge brand mark, magnifier, caret, chevron, plus, cross, folder, check and ring. The caret opens downward on a select, the chevron points along a move — that pair is the field's whole vocabulary for "open" and "onward".

### Named Rules

**The One Radius Rule.** 8px for anything you can see the edge of, 4–6px for anything inside it, circles only for dots and jacks. Do not introduce a fourth panel radius.

**The Drawn Mark Rule.** Every icon is a stroke drawn in inline SVG at the set's own weight. No icon font, no emoji, and no Unicode arrow standing in for a mark — the tree's `▸`/`▾` were replaced by drawn chevrons precisely because a text arrow in a column of drawn chrome reads as a different system. The box-drawing stems in the directory are the one deliberate exception: they are typeset structure in a monospaced column, with the row pitch tied to the glyph's own 18px line so the verticals actually join, and they are structure rather than iconography.

## Components

### Buttons
- **Shape:** Rounded 8px (`{rounded.control}`), 1px border matching the fill.
- **Primary** (`+ New`): Signal Blue fill, white type, 38px tall, sentence case at 14px/600, a drawn plus at the leading edge and a chevron thrown to the far edge at 75% opacity. There is exactly one of these on the page.
- **Hover / Focus:** Fill steps to Signal Blue Deep; focus is the global 2px accent outline at 1px offset with 3px radius.
- **Icon buttons** (drawer close, card shovel): 23–26px squares, 6px radius, transparent at rest, tinted `ground` (close) or `accent-wash` (shovel) on hover, with the mark going from `ink-3` to `ink` or accent.
- **Text actions** (`ON`-style status verbs, the note's hitch line): no box at all — micro caps in `ink-2` or accent, going accent on hover.

### Chips
- **Style:** Panel white, 1px `line` border, 8px radius, 36px tall, 14.5px sentence-case label in `ink` with a drawn caret in `ink-2`. Three of them: folder, status, priority.
- **State:** Border steps to `line-2` on hover; on focus the border goes accent with the 3px wash halo. The chip label carries the current value (`Status: Any`, `Priority: Urgent`) rather than a separate selected style — a transparent native `<select>` is stretched over the chip so the label sets the width while the real control keeps the interaction.

### Cards / Containers
- **Corner Style:** 8px (`{rounded.slab}`) on every panel and card.
- **Background:** Panel white, on the cool ground.
- **Shadow Strategy:** None at rest. See Elevation & Depth.
- **Border:** 1px hairline; `line-2` on hover.
- **Internal Padding:** Panels head at `{spacing.panel-head}` and inset their content by `{spacing.panel-inset}`; a job card and the drawer each carry their own asymmetric padding, given on their component entries.

### Inputs / Fields
- **Style:** The search field is a 40px control — panel white, 1px hairline, 8px radius, a drawn magnifier in the mark tint, a 13.5px input, and a trailing `⌘ K` hint that swaps for a blue hit count once a query is live.
- **Focus:** Border to accent plus a 3px `accent-wash` halo, transitioned over 120ms.
- **In-place fields:** Everywhere else, typing happens on the thing itself — the card title, the drawer title, a tree name, a note — as a borderless native input inheriting that element's exact type, so committing text never changes the row's shape. The one boxed exception is the description textarea, which takes a `ground` fill, a hairline and 6px corners to say it is a writing surface.

### Navigation
The top bar is the whole of it: wordmark and drawn brand mark at the left, search, filter chips, primary button. It is white on one hairline, 69px on desktop, and wraps to three rows below 900px with the chips scrolling sideways. There is no sidebar, no tab strip and no second command input.

### Job Card
The board's unit. 196px wide, 94px minimum, an uppercase plaque name over a 12.5px folder line. A card in the DONE lane drops a drawn ring into the gutter left of its plaque and runs both lines down one text column beside it. Selected but not open: accent hairline. Open: accent wash and an accent border. A search hit gets nothing at card level — the hit is declared on the word that matched, so the plate stays the open card's alone. Urgent: red plaque and a `URGENT` micro flag at the top right. Loose: dashed border with an accent-ringed jack. The card's one quick action — a chevron that moves it to the next lane along — is hidden until the pointer is on the card, takes the card's own background so it masks rather than patches, and is absent in the last lane, which has nowhere to send it.

### Detail Drawer
A 286px rail, panel white on one left hairline, running to the bottom of the field — where the notes tape picks the same column up, in the same white behind one hairline, so the right rail reads as continuous down the whole page. Reading order is status plaque with its dot, close button, display title, folder button with a drawn folder mark, hairline rule, then `DESCRIPTION` and `SUBTASKS` as plaques with their content. This is the only place the five status inks appear. A subtask is a 20px tick (4px radius, 1.5px `line-2` border, filling accent with a white check when done) and a 12.5px name; a finished subtask keeps its full-strength text, because the filled tick is the whole signal and greying the sentence too would read as "cancelled" rather than "finished".

### Directory Tree
The catalogue's language, and deliberately not the board's. A row is a 5px-radius strip with box-drawing stems in the mark tint, a drawn disclosure chevron in the stem column, a name, and a micro status verb at the right. Folders are 13.5px semibold sans; jobs inside them are the plaque, one size down; a search hit thickens the name to 600 rather than boxing it. Hover takes the cool ground, live takes the wash. No boxes, no cards, no plaques on folders.

### Notes Tape
Dated blocks in the drawer's rail below the fold: a 12.5px tabular date column and a borderless auto-height textarea, rows separated by a drawn seam, hover on ground and live on wash. An optional hitch line under a note names the job it is pinned to, in accent micro caps.

### Leash
When a job is pulled `LOOSE` it keeps a drawn cable back to the card it came from, so the graph stays legible after the board has scattered it. The cable is a quadratic curve with a real sag, stroked twice: a 4px panel-white jacket so it reads as passing over a lane, then a 1.5px `line-2` core that crosses to accent while the drag is taut. It paints above the lane panels and below the cards, so it threads behind a card it passes but is never hidden by a panel. Ends land in 7px jacks — white circles with a 1.5px ring — held inside the card's edge, since the lane stack scrolls and anything overhanging would clip.

### Motion
One authored moment: the pull. A line of a job leaves the drawer, casts its airborne shadow, borrows the card's plate to travel on, pays out a cable that goes taut across the board, lands in a lane, and the cable settles back into slack. Around it: the drawer arrives from its own rail (`170ms`, `cubic-bezier(0.2, 0.7, 0.3, 1)`) and its lines follow at 30/55/80ms so the eye lands on the title first; a card moved between lanes is animated from where it was rather than cut to where it is; and state changes on borders, fills and opacity run 110–140ms. Nothing here is decorative.

### Named Rules

**The Ledger Row Rule.** Every list ends in an empty row that writes — `New job` in a lane, `Add subtask` in the drawer, `New note` on the tape, a trailing stem in the tree. The row is a 13.5px prompt in `ink-2` behind a drawn plus, invisible and non-interactive until the pointer is on its panel, and it goes accent on hover. In an empty lane it moves to the first position, because there it is the lane's whole content rather than a note stranded at the foot.

**The Two Languages Rule.** The board's language (cards, caps plaques, boxes, lanes) and the catalogue's language (stems, plain rows, monospaced structure) must not share chrome. Stems never appear on a card; a card never appears in the tree. This is the product's own division made visible, and it is not negotiable for a new surface.

**The One Authored Moment Rule.** Motion serves the pull and nothing else. Every duration is answered by a `prefers-reduced-motion` block that holds all transitions and animations to `0ms`, so the same code arrives instantly for a reader who asked for that.

## Do's and Don'ts

### Do:
- **Do** build every new surface as a white panel on the cool ground with one 1px `line` border and 8px corners.
- **Do** set caps names in the plaque face and everything read or typed in the UI sans — **The Two Faces Rule**.
- **Do** keep the 3:1 mark tint on strokes and stems and use the 5.4:1 grey for any word — **The Marks-Only Tint Rule**.
- **Do** spend the accent on selection, search hits and the one primary action, as a wash, a hairline, a fill or a deep press — **The One Accent Rule**.
- **Do** keep the five status inks inside the drawer and let the lane say a card's state on the board — **The Lane Says The Status Rule**.
- **Do** let the plate mean where you are and a mark mean what you searched for, so a filter result never dresses like a selection — **The Plate Is Selection Rule**.
- **Do** end every list with an empty row that writes, revealed on panel hover — **The Ledger Row Rule**.
- **Do** draw new icons as inline SVG strokes at the set's weight on `currentColor` — **The Drawn Mark Rule**.
- **Do** type on the thing itself with a borderless input that inherits its exact type, so committing text never changes a row's shape.
- **Do** hold a sliver of the next panel on screen at the desktop fold — **The Fold Cue Rule**.
- **Do** answer every new animation with the reduced-motion block that already holds durations to zero.

### Don't:
- **Don't** add a second hue. Not a green pill, not an amber warning, not a purple tag on the board.
- **Don't** put a resting shadow on anything; the one shadow in the system means the thing is airborne.
- **Don't** tint a job card by its status or add a status swatch to the board.
- **Don't** declare one state twice, or two states in the same channel; if two things separate on a hairline's colour alone, one of them is in the wrong channel.
- **Don't** set a word in the 3:1 mark tint, and don't set a stem or a stroke in the text grey.
- **Don't** letterspace body sans to imitate a plaque; use the plaque face at its own size.
- **Don't** use an icon font, an emoji, or a Unicode arrow as a mark.
- **Don't** give the tree boxes, cards or plaqued folders, and don't give a card a stem — **The Two Languages Rule**.
- **Don't** let opening a job move a lane — **The Board Never Reflows Rule**.
- **Don't** add a second command input, an assignee avatar, a team switcher or an estimate field; the product has none of those and the chrome must not imply them.
- **Don't** revive the previous world: charcoal ground, orange accent, jack-hole costume, VU/CRT plates, or a month view as the home surface.
