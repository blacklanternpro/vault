---
name: VAULT WORLDWIDE
description: Local-first personal OS as a dark DOM studio — black cassette deck, unix directory, scratch, FIND.
colors:
  ground: "#111318"
  panel: "#181b22"
  card: "#22262f"
  card-2: "#2a2f3a"
  well: "#0a0b0e"
  ink: "#eeeae4"
  muted: "#a8adb8"
  hair: "#3a414e"
  chrome: "rgba(238, 234, 228, 0.2)"
  jacket: "#1c1410"
  live: "#FF5C1A"
  live-ink: "#14080a"
  mark: "#ff3355"
  mark-ink: "#14080a"
typography:
  plaque:
    fontFamily: "Oswald, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: "1.2"
    letterSpacing: "0.14em"
  project:
    fontFamily: "Oswald, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: "1.2"
    letterSpacing: "0.12em"
  card:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: "1.35"
    letterSpacing: "0.06em"
  nested:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "1.35"
    letterSpacing: "normal"
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
  count:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: "1"
    letterSpacing: "normal"
rounded:
  card: "0px"
  jack: "50%"
  name: "0px"
spacing:
  studio-gap: "8px"
  card-pad: "10px 12px 9px"
  slug-pad: "6px 9px 5px"
  sidebar: "320px"
  manager: "52%"
components:
  job-slab:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.card}"
    rounded: "{rounded.card}"
    padding: "{spacing.card-pad}"
  directory-select:
    backgroundColor: "{colors.live}"
    textColor: "{colors.live-ink}"
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

VAULT is a dark desktop studio, not a dashboard and not a canvas organ field. Charcoal ground, slate slabs, off-white type. Two signals: safety orange for live/select/leash, highlighter red for URGENT/RECORD/CLEAR. The Manager is a black cassette **deck** (section, not a boxed window): five hairline gutters, Oswald plaques, square slabs. Nested work is a ledger line. Pulled subtasks are slugs on slack patch-cables. Directory under the deck is the unix catalogue. Scratch sidebar with FIND. SPECK source is the save format. Sections do not drag.

## Colors

| Token | Hex | Use |
| --- | --- | --- |
| Ground | `#111318` | Studio field |
| Panel | `#181b22` | Scratch sidebar |
| Card | `#22262f` | Job / satellite / note slabs |
| Card 2 | `#2a2f3a` | Slab hover |
| Well | `#0a0b0e` | Cassette transport window |
| Ink | `#eeeae4` | Work type |
| Muted | `#a8adb8` | Counts, stems, plaques |
| Hair | `#3a414e` | Quiet rules, card edges |
| Chrome | `rgba(238,234,228,0.2)` | Gutter and transport hairlines |
| Jacket | `#1c1410` | Leash cable jacket |
| Live | `#FF5C1A` | Directory select, FIND mark, leash conductor, caret, live slab |
| Live ink | `#14080a` | Type on orange |
| Mark | `#ff3355` | URGENT, RECORD, strike, CLEAR-class danger |
| Mark ink | `#14080a` | Type on red |

Not IMP `#E10600`. Cobalt is not in the system. Harvest amber is not identity. Cream cassette is not the plate. Black housing is. Dark is native; paper invert is not identity.

## Typography

Helvetica Neue / Helvetica / Arial on work. Oswald 700 on plaques (lane names, project window, project name, FIND). Job titles 13px / 700 / tracked / uppercase. Nested rows and satellite slugs 12px / 400 / sentence case. Directory 13px / row 22. FIND 14px. No JetBrains, Space Grotesk, Inter, VT323, or pixel novelty faces.

## Layout

Desktop (~1440). Main column is the deck (~52% height) over the directory. Transport strip: cassette window (project select) + RECORD ADD, Oswald project name, then five gutters (PENDING · R&D · ACTIVE · DONE · DUSTED) divided by chrome hairlines — no plate box, no fasteners, no CRT wells. Right sidebar 320px: FIND, snap-reorderable notes, inert `_ LINK` `_ PIC` `_ FILE`. Scratch blocks reorder vertically; the three main regions stay put.

## Elevation & Depth

No soft shadows, no glass, no whole-OS grain/scan overlay. Depth is slate steps on charcoal. Quiet grain in the DUSTED gutter only. Live slab: 1px orange hairline. Leash: dark jacket + orange conductor, slack catenary, live tension, ~220ms settle. Drag ghost: opacity. Origin dims while the ghost is live.

## Shapes

Radius 0 on job slabs, satellite slugs, scratch blocks. The only radius is the jack hole (ring + dark hole; orange pin when that cable is live). Directory name block is square. Selection is an orange rectangle behind the directory name — not an oval, not a pill overlay. PM GUI never draws nest stems.

## Components

- **Transport** — cassette window for PROJECT select; ADD as a small RECORD control (red dot = danger, not a VU). Project name as an Oswald plaque on the deck.
- **Job slab** — square, uppercase title (click to rename). No empty inner well. Click body to add a nested ledger line. First nested promotes PENDING → ACTIVE. Drag between gutters to stage; nested children follow; loose satellites stay.
- **Nested line** — sentence case, left rule / type indent. Pull onto a gutter to make a satellite (`LOOSE`). Preview leash while the row is mid-pull.
- **Satellite slug** — half height, sentence case, jack hole, no empty inner box. Nest list only if it has nested children.
- **Leash** — quadratic slack patch-cable. Rest sag ≈ `min(42px, 0.18 * distance)`, floor 8px. Drag tightens with tension, never perfectly straight. Drop springs for ~220ms.
- **Directory row** — ascii stem `│ ├── └──`, name, hover shovel `→`. Live name sits on orange with dark type. Trailing `└── _` adds a child. Full catalogue, all projects.
- **FIND** — one command field. Label FIND or NOTE. Echo line. Bare line searches; NOTE appends when a scratch block is live. `CLEAR` restores seed.
- **Scratch block** — square, date + textarea. Vertical snap-reorder. Ghost media slots inert.
- **Field editor** — native input on the live title, orange caret, no second dock slab.

## Do's and Don'ts

**Do:** one graph, two costumes (deck slabs + directory); click-and-type; FIND searches; shovel or lane-drop to stage; nest as type; pull into slugs; slack leashes; snap-reorder notes; charcoal / slate / live orange / danger red.

**Don't:** DateBlocks, SaaS kanban chrome, rounded-in-rect, five CRT wells, fasteners-as-frame, taut tuner-needle filaments, section billboards, paper/IMP canvas, salt organs, organ PLACE-drag, DOS `>` dock, dump-parser, cobalt, harvest amber as identity, cream cassette OS, 3D knobs, VU KPIs, PM nest stems, CLIP-copy, month-as-OS as home.
