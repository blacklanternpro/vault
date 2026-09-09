---
name: VAULT WORLDWIDE
description: Local-first personal OS as a paste-up mechanical — BAD FORM, elite TUI directory, tissue scratch, FIND.
colors:
  shop: "#E4E2DC"
  ground: "#F2F0EA"
  panel: "#E8E4DC"
  card: "#FAF8F3"
  card-2: "#F4F1EA"
  well: "#ECEAE4"
  ink: "#141414"
  muted: "#3F3D3A"
  hair: "#C4C0B8"
  chrome: "rgba(20, 20, 20, 0.16)"
  jacket: "#8A8680"
  live: "#ED1C24"
  live-ink: "#FAF8F3"
  mark: "#ED1C24"
  mark-ink: "#FAF8F3"
  blue: "#2F5A72"
  grid: "#8FB7C9"
typography:
  plaque:
    fontFamily: "Archivo Narrow, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 700
    lineHeight: "1.2"
    letterSpacing: "0.14em"
  project:
    fontFamily: "Archivo Narrow, Helvetica Neue, Helvetica, Arial, sans-serif"
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
  folio-sat:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "22px"
    fontWeight: 700
    lineHeight: "1.15"
    letterSpacing: "normal"
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
  body:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "24px"
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
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink}"
    typography: "{typography.directory}"
    rounded: "{rounded.card}"
    padding: "10px 12px 8px"
---

# DESIGN.md

## Overview

VAULT is a paste-up mechanical on a making desk, not a dashboard and not a canvas organ field. Maker: **BAD FORM**. Shop-dimmer field, mechanical-white board, process-black type. Two signals: process red for live/select/URGENT/RECORD, non-repro blue for register and marks. The Manager is paste-up **theatre**: crop-mark frame, BOARD / REG plaques, RECORD, register targets, five hairline gutters, square waxed slabs. HIT a slab enters the **folio** (the job as a document) and raises working light. Nested work is sleek boxed lines — never unix stems. Pulled subtasks are slugs on slack tape; drop a slug on a parent card to dock it back. Directory under the deck is an elite TUI listing. Tissue scratch sidebar with FIND (search only). SPECK source is the save format. Sections do not drag.

## Colors

| Token | Hex | Use |
| --- | --- | --- |
| Shop | `#E4E2DC` | Dimmer field around the board (rack) |
| Ground | `#F2F0EA` | Mechanical white; folio working light |
| Panel | `#E8E4DC` | Tissue scratch sidebar |
| Card | `#FAF8F3` | Waxed job / satellite / boxed line |
| Card 2 | `#F4F1EA` | Slab hover |
| Well | `#ECEAE4` | Nested well |
| Ink | `#141414` | Work type, keylines, crop marks |
| Muted | `#3F3D3A` | Counts, stems, ghosts |
| Hair | `#C4C0B8` | Quiet rules |
| Chrome | `rgba(20,20,20,0.16)` | Transport hairlines |
| Jacket | `#8A8680` | Tape leash jacket, tissue dash |
| Live | `#ED1C24` | Directory select, FIND mark, taut leash, caret, live slab, RECORD |
| Live ink | `#FAF8F3` | Type on process red |
| Mark | `#ED1C24` | URGENT (same ink as live) |
| Blue | `#2F5A72` | Register, plaques, FIND label, leash at rest |
| Grid | `#8FB7C9` | Non-repro blue baselines and gutter rules |

Not IMP `#E10600`. Cobalt is not in the system. Harvest amber is not identity. Cassette orange `#FF5C1A` and charcoal housing are discarded.

## Typography

Helvetica Neue / Helvetica / Arial on work. Archivo Narrow 700 on plaques (lane names, project window, project name, FIND, transport), self-hosted latin woff2. Job titles 13px / 700 / tracked / uppercase. Folio title 28px / 700 / uppercase. Satellite folio title 22px. Folio body 15px / 24px (on the non-repro grid). Boxed lines and satellite slugs 12px / 400 / sentence case. Directory 13px / row 20. FIND 14px. Counts and `ON` 11px. No JetBrains, Space Grotesk, Inter, Oswald, VT323, or pixel novelty faces.

## Layout

Desktop (~1440). Main column is the deck (~52% height) over the directory. Transport strip: BOARD + project window + RECORD, Archivo Narrow project name, then five gutters (PENDING · R&D · ACTIVE · DONE · DUSTED) divided by non-repro hairlines — or an entered folio with a thin lane rail (current gutter inked). Crop marks at the studio corners; register targets across the mechanical. No plate box, no fasteners-as-frame, no CRT wells, no NEXUS HUD, no VU KPIs. Right sidebar 320px: FIND, tissue notes, pointer `_`, inert `_ LINK` `_ PIC` `_ FILE`. Scratch blocks reorder vertically; the three main regions stay put.

## Elevation & Depth

No soft shadows, no glass, no whole-OS grain/scan overlay. Depth is waxed white on the board, keyline 1px ink. Quiet grain in the DUSTED gutter only. Live slab: 1px process-red keyline. Leash: tape jacket + blue conductor, process red when taut, slack catenary, ~220ms settle. Drag ghost: opacity. Origin dims while the ghost is live. Working light: shop `#E4E2DC` on the rack, ground `#F2F0EA` when a folio is open.

## Shapes

Radius 0 on job slabs, satellite slugs, boxed lines, scratch blocks. The only radius is the register target (circle + crosshair; process red when that tape is live). Directory name block is square. Selection is a process-red rectangle behind the directory name — not an oval, not a pill overlay. PM GUI never draws nest stems. Directory never draws boxed job homes.

## Components

- **Transport** — BOARD / PROJECT select; RECORD as a filled process-red control. REG plaque. Project name as an Archivo Narrow plaque on the deck.
- **Job slab** — square, uppercase title, ink keyline. HIT enters the folio (does not rename). No empty inner well. Click body to write. `[+]` adds a boxed line. First nested promotes PENDING → ACTIVE. Drag between gutters to stage; nested children follow; loose satellites stay.
- **Folio** — entered job. Large title, lined writing surface, boxed-line outline, hitch strip. Esc / plaque / `[x]` returns (Esc commits a live field first). Second click on the title renames. Thin lane rail stays a drop target; the job's gutter is inked (`is-now`).
- **Boxed line** — radius 0, inset well, hairline. Sentence case. Pull onto a gutter to make a satellite (`LOOSE`). Drop a satellite onto a parent slab to dock (drop `LOOSE`). Preview leash while the row is mid-pull.
- **Satellite slug** — half height, sentence case, register target, no empty inner box. Nest list only if it has nested children.
- **Leash** — quadratic slack tape. Rest sag ≈ `min(42px, 0.18 * distance)`, floor 8px. Drag tightens with tension, never perfectly straight. Drop springs for ~220ms.
- **Directory row** — ascii stem `│ ├── └──`, name, `ON`. First click selects (process-red block); other rows fade. Second click / Enter renames. `ON` / drag onto a gutter stages. Space is a silent shortcut. Trailing `_` adds a child. Full catalogue as columns of stem text if the pane is wide. No boxes.
- **FIND** — one search field. Echo line. Bare line searches. Pointer `_` in scratch adds a note. Hitch is drop. Not a codebook.
- **Scratch block** — tissue, dashed tape edge, date + textarea. Vertical snap-reorder. Ghost media slots inert.
- **Field editor** — native input on the live title / body, process-red caret, no second dock slab.

## Do's and Don'ts

**Do:** one graph, two languages (paste-up theatre + TUI directory); enter the job; boxed nest on the PM; stems only in the directory; pointer-first; FIND searches; ON or lane-drop to stage; dock back; slack leashes; snap-reorder notes; mechanical white / process black / non-repro blue / process red.

**Don't:** DateBlocks, SaaS kanban chrome, rounded-in-rect, five CRT wells, fasteners-as-frame, taut tuner-needle filaments, section billboards, paper/IMP canvas, salt organs, organ PLACE-drag, DOS `>` dock, dump-parser, cobalt, harvest amber as identity, cream cassette OS, charcoal cassette housing, live orange `#FF5C1A`, Oswald plaques, 3D knobs, VU KPIs, NEXUS HUD, PM nest stems, unix-on-cards, boxed directory rows, CLIP-copy, month-as-OS as home, sit-down verb codebook, BLACK LANTERN as maker.
