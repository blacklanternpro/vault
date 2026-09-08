---
name: VAULT WORLDWIDE
description: Local-first personal OS as a dark DOM studio — racked manager, unix directory, scratch, FIND.
colors:
  ground: "#111318"
  panel: "#181b22"
  card: "#22262f"
  card-2: "#2a2f3a"
  well: "#0a0b0e"
  ink: "#eeeae4"
  muted: "#a8adb8"
  hair: "#2c313c"
  live: "#FF5C1A"
  live-ink: "#14080a"
  mark: "#ff3355"
  mark-ink: "#14080a"
typography:
  card:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: "1.35"
    letterSpacing: "0.06em"
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
    fontSize: "10px"
    fontWeight: 700
    lineHeight: "1.2"
    letterSpacing: "0.14em"
  count:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: "1"
    letterSpacing: "normal"
rounded:
  card: "10px"
  name: "2px"
spacing:
  studio-gap: "8px"
  card-pad: "14px 15px 12px"
  sidebar: "320px"
  manager: "52%"
components:
  project-card:
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

VAULT is a dark desktop studio, not a dashboard and not a canvas organ field. Charcoal ground, slate cards, off-white type. Two signals: safety orange for live/select/filament, highlighter red for URGENT/destroy/CLEAR. The Manager is a racked instrument: five inset wells, plaque labels, modest fasteners. Jobs nest in a card well. Pulled subtasks are satellite cards on a taut tuner-needle filament. Directory under the rack is the unix catalogue. Scratch sidebar with FIND. SPECK source is the save format. Sections do not drag.

## Colors

| Token | Hex | Use |
| --- | --- | --- |
| Ground | `#111318` | Studio field |
| Panel | `#181b22` | Scratch sidebar, rack plate |
| Card | `#22262f` | Job / satellite / note blocks |
| Card 2 | `#2a2f3a` | Card hover |
| Well | `#0a0b0e` | Inset column and job wells |
| Ink | `#eeeae4` | Work type |
| Muted | `#a8adb8` | Counts, stems, plaques |
| Hair | `#2c313c` | Separators, ghosts, bezels |
| Live | `#FF5C1A` | Directory select, FIND mark, filament, caret, live card |
| Live ink | `#14080a` | Type on orange |
| Mark | `#ff3355` | URGENT, strike, CLEAR-class danger |
| Mark ink | `#14080a` | Type on red |

Not IMP `#E10600`. Cobalt is not in the system. Harvest amber is not identity. Cream cassette is not the plate. Dark is native; paper invert is not identity.

## Typography

Helvetica Neue / Helvetica / Arial only. Job titles 13px / 700 / tracked / uppercase. Nested rows 12px / 400 / sentence case. Directory 13px / row 22. FIND 14px. Plaques 10px tracked. No Oswald, JetBrains, Space Grotesk, Inter, VT323, or pixel novelty faces.

## Layout

Desktop (~1440). Main column is the rack (~52% height) over the directory. Rack: control bar (project dropdown + ADD), project name, five wells (PENDING · R&D · ACTIVE · DONE · DUSTED). Right sidebar 320px: FIND, snap-reorderable notes, inert `_ LINK` `_ PIC` `_ FILE`. Scratch blocks reorder vertically; the three main regions stay put.

## Elevation & Depth

No soft shadows, no glass, no grain/scan overlay. Depth is inset wells and slate steps. Modest graphic fasteners on the rack plate (not 3D knobs). Live card: 1px orange hairline. Filament: taut glowing line, no sag. Drag ghost: opacity.

## Shapes

Radius 10px on job/satellite/scratch cards. Radius 2px on the directory name block. Wells and FIND stay square. Selection is an orange rectangle behind the directory name — not an oval, not a pill overlay. PM GUI never draws nest stems.

## Components

- **Rack bar** — PROJECT select + ADD. Project name under the bar.
- **Job card** — uppercase title (click to rename). Inset well of nested subtasks (indent by type, no `│ ├──`). Click body to add nested. First nested promotes PENDING → ACTIVE. Drag between wells to stage; nested children follow; loose satellites stay.
- **Satellite card** — smaller, own well/status, taut filament to immediate parent. Drag nested row out of a well onto a lane to pull (`LOOSE`).
- **Directory row** — ascii stem `│ ├── └──`, name, hover shovel `→`. Live name sits on orange with dark type. Trailing `└── _` adds a child. Full catalogue, all projects.
- **FIND** — one command field. Label FIND or NOTE. Echo line. Bare line searches; NOTE appends when a scratch block is live. `CLEAR` restores seed.
- **Scratch block** — date + textarea. Vertical snap-reorder. Ghost media slots inert.
- **Field editor** — native input on the live title, orange caret, no second dock slab.

## Do's and Don'ts

**Do:** one graph, two costumes (racked cards + directory); click-and-type; FIND searches; shovel or lane-drop to stage; pull nested into satellites; snap-reorder notes; charcoal / slate / live orange / danger red.

**Don't:** DateBlocks, SaaS kanban chrome, section billboards, paper/IMP canvas, salt organs, organ PLACE-drag, Oswald plaques, DOS `>` dock, dump-parser, cobalt, harvest amber as identity, cream cassette OS, 3D knobs, VU KPIs, brass patch-cables, PM nest stems, CLIP-copy, month-as-OS as home.
