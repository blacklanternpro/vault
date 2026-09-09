---
name: VAULT WORLDWIDE
description: Local-first personal OS as a dark DOM studio — BAD FORM cassette theatre, elite TUI directory, scratch, FIND.
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
  folio:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "28px"
    fontWeight: 700
    lineHeight: "1.15"
    letterSpacing: "0.04em"
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
    lineHeight: "20px"
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
  boxed-line:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.nested}"
    rounded: "{rounded.card}"
    padding: "5px 14px 4px 8px"
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

VAULT is a dark desktop studio, not a dashboard and not a canvas organ field. Maker: **BAD FORM**. Charcoal ground, slate slabs, off-white type. Two signals: safety orange for live/select/leash, highlighter red for URGENT/RECORD/CLEAR. The Manager is a black cassette **theatre**: housing, transport plaques, RECORD, jacks, five hairline gutters, square slabs. HIT a slab enters the **folio** (the job as a document). Nested work is sleek boxed lines — never unix stems. Pulled subtasks are slugs on slack patch-cables; drop a slug on a parent card to dock it back. Directory under the deck is an elite TUI listing. Scratch sidebar with FIND (search only). SPECK source is the save format. Sections do not drag.

## Colors

| Token | Hex | Use |
| --- | --- | --- |
| Ground | `#111318` | Studio field |
| Panel | `#181b22` | Scratch sidebar |
| Card | `#22262f` | Job / satellite / boxed line / note slabs |
| Card 2 | `#2a2f3a` | Slab hover |
| Well | `#0a0b0e` | Cassette transport window, nest well |
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

Helvetica Neue / Helvetica / Arial on work. Oswald 700 on plaques (lane names, project window, project name, FIND, transport). Job titles 13px / 700 / tracked / uppercase. Folio title 28px / 700 / uppercase. Boxed lines and satellite slugs 12px / 400 / sentence case. Directory 13px / row 20. FIND 14px. No JetBrains, Space Grotesk, Inter, VT323, or pixel novelty faces.

## Layout

Desktop (~1440). Main column is the deck (~52% height) over the directory. Transport strip: cassette window (project select) + RECORD, Oswald project name, then five gutters (PENDING · R&D · ACTIVE · DONE · DUSTED) divided by chrome hairlines — or an entered folio with a thin lane rail. No plate box, no fasteners-as-frame, no CRT wells, no NEXUS HUD, no VU KPIs. Right sidebar 320px: FIND, snap-reorderable notes, pointer `_`, inert `_ LINK` `_ PIC` `_ FILE`. Scratch blocks reorder vertically; the three main regions stay put.

## Elevation & Depth

No soft shadows, no glass, no whole-OS grain/scan overlay. Depth is slate steps on charcoal. Quiet grain in the DUSTED gutter only. Live slab: 1px orange hairline. Leash: dark jacket + orange conductor, slack catenary, live tension, ~220ms settle. Drag ghost: opacity. Origin dims while the ghost is live. Cassette housing is a 1px chrome inset around the gutters.

## Shapes

Radius 0 on job slabs, satellite slugs, boxed lines, scratch blocks. The only radius is the jack hole (ring + dark hole; orange pin when that cable is live). Directory name block is square. Selection is an orange rectangle behind the directory name — not an oval, not a pill overlay. PM GUI never draws nest stems. Directory never draws boxed job homes.

## Components

- **Transport** — cassette window for PROJECT select; RECORD as a small control (red dot = danger, not a VU). TAPE / REC plaques. Project name as an Oswald plaque on the deck.
- **Job slab** — square, uppercase title. HIT enters the folio (does not rename). No empty inner well. Click body to write. `[+]` adds a boxed line. First nested promotes PENDING → ACTIVE. Drag between gutters to stage; nested children follow; loose satellites stay.
- **Folio** — entered job. Large title, real writing surface, boxed-line outline, hitch strip. Esc / plaque / `[x]` returns. Second click on the title renames. Thin lane rail stays a drop target (pull / stage), not five CRT wells.
- **Boxed line** — radius 0, inset slate, hairline. Sentence case. Pull onto a gutter to make a satellite (`LOOSE`). Drop a satellite onto a parent slab to dock (drop `LOOSE`). Preview leash while the row is mid-pull.
- **Satellite slug** — half height, sentence case, jack hole, no empty inner box. Nest list only if it has nested children.
- **Leash** — quadratic slack patch-cable. Rest sag ≈ `min(42px, 0.18 * distance)`, floor 8px. Drag tightens with tension, never perfectly straight. Drop springs for ~220ms.
- **Directory row** — ascii stem `│ ├── └──`, name, `ON`. First click selects (orange block). Second click / Enter renames. `ON` / drag onto a gutter stages. Space is a silent shortcut. Trailing `_` adds a child. Full catalogue as columns of stem text if the pane is wide. No boxes.
- **FIND** — one search field. Echo line. Bare line searches. Pointer `_` in scratch adds a note. Hitch is drop. Not a codebook.
- **Scratch block** — square, date + textarea. Vertical snap-reorder. Ghost media slots inert.
- **Field editor** — native input on the live title / body, orange caret, no second dock slab.

## Do's and Don'ts

**Do:** one graph, two languages (cassette theatre + TUI directory); enter the job; boxed nest on the PM; stems only in the directory; pointer-first; FIND searches; ON or lane-drop to stage; dock back; slack leashes; snap-reorder notes; charcoal / slate / live orange / danger red.

**Don't:** DateBlocks, SaaS kanban chrome, rounded-in-rect, five CRT wells, fasteners-as-frame, taut tuner-needle filaments, section billboards, paper/IMP canvas, salt organs, organ PLACE-drag, DOS `>` dock, dump-parser, cobalt, harvest amber as identity, cream cassette OS, 3D knobs, VU KPIs, NEXUS HUD, PM nest stems, unix-on-cards, boxed directory rows, CLIP-copy, month-as-OS as home, sit-down verb codebook, BLACK LANTERN as maker.
