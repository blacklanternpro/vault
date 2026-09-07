---
name: VAULT WORLDWIDE
description: Local-first personal OS field on a paper sheet — one work graph, two lenses, salt organs, operator dock.
colors:
  paper: "#F4F4F0"
  field: "#000000"
  power: "#E10600"
  white: "#FFFFFF"
  rule: "rgba(244,244,240,0.22)"
  ink-rule: "rgba(0,0,0,0.22)"
typography:
  work:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "26px"
    letterSpacing: "normal"
  plaque:
    fontFamily: "Oswald, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "32px"
    fontWeight: 700
    lineHeight: "44px"
    letterSpacing: "0.04em"
  legend:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: "22px"
    letterSpacing: "0.08em"
  glyph:
    fontFamily: "Oswald, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "56px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.04em"
  dock:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "18px"
    fontWeight: 400
    lineHeight: "36px"
    letterSpacing: "normal"
rounded:
  none: "0px"
spacing:
  row: "26px"
  chrome-head: "44px"
  chrome-ticks: "12px"
  organ-gap: "16px"
  dock: "70px"
  legend: "22px"
components:
  organ-plaque:
    backgroundColor: "{colors.field}"
    textColor: "{colors.paper}"
    typography: "{typography.plaque}"
    rounded: "{rounded.none}"
    height: "44px"
  selection-chip:
    backgroundColor: "{colors.power}"
    textColor: "{colors.white}"
    typography: "{typography.work}"
    rounded: "{rounded.none}"
    height: "24px"
    padding: "0 6px"
  field-editor:
    backgroundColor: "{colors.power}"
    textColor: "{colors.white}"
    typography: "{typography.work}"
    rounded: "{rounded.none}"
    height: "24px"
    padding: "0 6px"
  dock-caret:
    backgroundColor: "{colors.field}"
    textColor: "{colors.power}"
    typography: "{typography.dock}"
    rounded: "{rounded.none}"
    height: "70px"
  close-mark:
    backgroundColor: "{colors.field}"
    textColor: "{colors.power}"
    typography: "{typography.legend}"
    rounded: "{rounded.none}"
---

# DESIGN.md

## Overview

VAULT is a composed desktop field on an office sheet, not a dashboard. Default ground is paper `#F4F4F0` (`INV`). Organs are black 1px windows: filled title bar, Oswald plaque, `[x] ···`, tick ruler, octagon counters, scanlines. One work graph. NEST is the tree; PIPE is the same nodes by status (FOCUS | GATEWAY). Power red is the only accent. Grain and scan are SPECK plus one material overlay. The dock is an operator under a read-only legend rail. Titles are typed in a native input over the active cell. Salt organs SEAL, SKULL, and CAL sit where `PLACE` says. Home is PIPE / NEST.

## Colors

| Token | Hex | Use |
| --- | --- | --- |
| Paper | `#F4F4F0` | Sheet ground when `INV` is live |
| Field | `#000000` | Organ fill, dock slab, ink, ground when `INV` is off |
| Power | `#E10600` | Oval, caret, ticks, `[+]` / shovel, strike, live legend |
| White | `#FFFFFF` | Type on power-red CHIP / field editor |
| Rule | `rgba(244,244,240,0.22)` | Ledger lines inside black windows |

No second accent. Strike and URGENT are power red. Cobalt is not in the system. `INV` is a source line, not CSS invert.

## Typography

Oswald 700 for plaques and free `GLYPH` stamps (self-hosted woff2). Helvetica Neue / Helvetica / Arial for binder, nest, dump, dock, and `[x] ···`. Work 16px / row 26. Plaques 32px / title bar 44. Legends 11px tracked. Dock 18px. Uppercase for plaques, column legends, status ticks, legend rail. No JetBrains, Space Grotesk, Inter, VT323, or pixel novelty faces on titles.

## Layout

Desktop field. Organs sit at SPECK `PLACE` origins and may overlap. PIPE is a split page: FOCUS left, GATEWAY right, double power-red spine with a scanline meter. Empty ledger rows stay (6 minimum per column) and create. HIT a binder node expands in place and everything below moves down. NEST is a unix tree. DUMP is a short tape. CAL is a 7-across month inside a window. SEAL and SKULL are small theatre windows. Legend rail 22px + operator, locked to the viewport bottom. Cell editor is positioned on the compiled hit box of the active slot. Paper registration ticks sit on the sheet; a dashed register runs through the binder spine.

## Elevation & Depth

No shadows, no blur, no glass. Recess is a double hairline (paper outer, rule inner). Grain is hashed film salt. Scan is IMP lines on black plates. Dither is 1×1 power-red specks in chrome. Overlap of organs and free glyphs is legal. A WebGL (or 2D fallback) multiply overlay sits over the field canvas; pointer-events none.

## Shapes

Radius 0 everywhere, including native inputs. Selection is a rectangular CHIP the height of one ledger row inside a power-red oval — never an overlay stack covering neighbors. Counters are octagon hairlines with a digit. Spine rings are `O` glyphs. Globe meridians are line ovals, not a PNG seal.

## Components

- **Organ window** — Oswald `PIPE // vault` plaque, tick ruler, octagon count, `···`, `[x]` (collapses that organ).
- **Project plaque** — tracked uppercase parent title above a group of binder rows.
- **Row** — `[ ]` / `[X]`, `#id`, title, shovel `->`. Done rows take a power-red strike. Live row: CHIP + OVAL.
- **Expand** — body line, child checklist, `+ subtask`, status words with the live status in power red.
- **Nest row** — fold `[-]`/`[+]`, stem prefix, title, `[+]` add. Live row inverts + oval.
- **Field editor** — native `<input>` over the cell, power-red fill, white type. TAB: title → body → subtask → status.
- **Legend rail** — `GRAIN SCAN INV OVAL · PIPE NEST DUMP SEAL SKULL CAL · FOCUS`. HIT material words toggle source. Not an input.
- **Dock** — `>` caret, underline, `↵`. Echo line between legend and operator when the machine speaks.
- **CAL** — month digits, power-red underline on DUMP dates, drop list on HIT.
- **SEAL / SKULL** — wireframe globe + stencil mark; pixel skull. Drag and `[x]` only.

## Do's and Don'ts

**Do:** say new features in SPECK; keep one graph and two lenses; click-and-type in the cell; dump from the dock; shovel onto the binder; restamp office-sheet ticks, pixel-GUI chrome, and IMP plaques onto paper / black / power red; pare grain/scan with legend HIT.

**Don't:** DateBlocks cards, rounded corners, shadows, cobalt, harvest amber, CLIP-copy, overlay CHIP dossiers, month-as-OS as home, beige UN as identity, kanban boards, a second dock input, Win95 gray, 3D knobs, or novelty pixel fonts on titles.
