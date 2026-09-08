---
name: VAULT WORLDWIDE
description: Local-first personal OS as a dark DOM studio — manager cards, unix directory, scratch, FIND.
colors:
  ground: "#111318"
  panel: "#181b22"
  card: "#22262f"
  card-2: "#2a2f3a"
  ink: "#eeeae4"
  muted: "#a8adb8"
  hair: "#2c313c"
  mark: "#ff3355"
  mark-ink: "#14080a"
typography:
  card:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: "1.35"
    letterSpacing: "-0.02em"
  directory:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: "22px"
    letterSpacing: "normal"
  find:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "1.4"
    letterSpacing: "normal"
  label:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: "1.2"
    letterSpacing: "0.08em"
  count:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "1"
    letterSpacing: "normal"
rounded:
  card: "10px"
  name: "2px"
spacing:
  studio-gap: "10px"
  card-pad: "14px 15px 12px"
  sidebar: "320px"
  manager: "42%"
components:
  project-card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.card}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-pad}"
  directory-select:
    backgroundColor: "{colors.mark}"
    textColor: "{colors.mark-ink}"
    typography: "{typography.directory}"
    rounded: "{rounded.name}"
    height: "20px"
    padding: "1px 6px"
  find-field:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.ink}"
    typography: "{typography.find}"
    rounded: "0px"
    padding: "4px 0"
  scratch-block:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.directory}"
    rounded: "{rounded.card}"
    padding: "10px 12px 8px"
---

# DESIGN.md

## Overview

VAULT is a dark desktop studio, not a dashboard and not a canvas organ field. Charcoal ground, slate cards, off-white type, one highlighter red. Four tools as a fixed layout: project cards on top, a naked unix directory under them, scratch blocks in a right sidebar, FIND at the top of that sidebar. SPECK source is the save format. Sections do not drag. Type does the work.

## Colors

| Token | Hex | Use |
| --- | --- | --- |
| Ground | `#111318` | Studio field |
| Panel | `#181b22` | Scratch sidebar |
| Card | `#22262f` | Project and note blocks |
| Card 2 | `#2a2f3a` | Card hover |
| Ink | `#eeeae4` | Work type |
| Muted | `#a8adb8` | Counts, stems, labels |
| Hair | `#2c313c` | Separators, ghosts |
| Mark | `#ff3355` | Directory selection, FIND mark, urgent, caret |
| Mark ink | `#14080a` | Type on highlighter |

No second accent. Strike and URGENT are highlighter. Not IMP `#E10600`. Cobalt is not in the system. Dark is native; paper invert is not identity.

## Typography

Helvetica Neue / Helvetica / Arial only. Cards 15px / 500 / tight tracking. Directory and notes 13px / row 22. FIND 14px. Labels 11px tracked. Counts and ghosts 12px. No Oswald, JetBrains, Space Grotesk, Inter, VT323, or pixel novelty faces.

## Layout

Desktop (~1440). Main column is manager (~42% height) over directory, hairline between. Right sidebar 320px: FIND, then snap-reorderable note blocks, then inert `_ LINK` `_ PIC` `_ FILE`. Four silent stage lanes — position encodes stage, no billboard titles. Scratch blocks reorder vertically; the three main regions stay put.

## Elevation & Depth

No shadows, no blur, no glass, no grain/scan overlay. Depth is slate steps on charcoal. Live card: 1px highlighter hairline. Drag ghost: opacity, not a drop shadow.

## Shapes

Radius 10px on project cards and scratch blocks. Radius 2px on the directory name block. FIND and native chrome stay square. Selection is a highlighter rectangle behind the name — not an oval, not a pill overlay covering neighbors.

## Components

- **Project card** — off-white title, muted child count, urgent title in highlighter. Drag between lanes to stage; drag in-lane to reorder. Click focuses the directory subtree. Click title to rename. Trailing `_` creates.
- **Directory row** — ascii stem `│ ├── └──`, name, hover shovel `→`. Live name sits on highlighter with dark type. Trailing `└── _` adds a child. Click a stem with children to fold.
- **FIND** — one command field. Label FIND or NOTE. Echo line for the machine. Bare line searches; NOTE appends when a scratch block is live. `CLEAR` restores seed.
- **Scratch block** — date + textarea. Vertical snap-reorder. Ghost media slots inert.
- **Field editor** — native input on the live title, highlighter caret, no second dock slab.

## Do's and Don'ts

**Do:** keep one graph and two looks (cards + directory); click-and-type; FIND searches; shovel or lane-drop to stage; snap-reorder notes; stay on charcoal / slate / highlighter.

**Don't:** DateBlocks, SaaS kanban chrome (avatars, KPIs, progress bars, “+ New Deal”), section billboards (`PIPE // vault`), paper/IMP canvas, salt organs, organ PLACE-drag, Oswald plaques, DOS `>` dock, dump-parser, cobalt, harvest amber, CLIP-copy, month-as-OS as home.
