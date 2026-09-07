---
name: VAULT WORLDWIDE
description: Local-first personal OS field — one work graph, two lenses, operator dock.
colors:
  field: "#000000"
  paper: "#F4F4F0"
  power: "#E10600"
  white: "#FFFFFF"
  rule: "rgba(244,244,240,0.18)"
  rule-dim: "rgba(244,244,240,0.08)"
typography:
  helvetica:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: "18px"
    letterSpacing: "normal"
  plaque:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "13px"
    fontWeight: 700
    lineHeight: "22px"
    letterSpacing: "normal"
  legend:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "11px"
    fontWeight: 400
    lineHeight: "16px"
    letterSpacing: "0.04em"
  glyph:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "72px"
    fontWeight: 400
    lineHeight: 1
    letterSpacing: "normal"
  dock:
    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "28px"
    letterSpacing: "normal"
rounded:
  none: "0px"
spacing:
  row: "18px"
  chrome-head: "22px"
  chrome-ticks: "8px"
  organ-gap: "16px"
  dock: "44px"
components:
  organ-plaque:
    backgroundColor: "{colors.field}"
    textColor: "{colors.paper}"
    typography: "{typography.plaque}"
    rounded: "{rounded.none}"
    height: "22px"
  selection-chip:
    backgroundColor: "{colors.power}"
    textColor: "{colors.white}"
    typography: "{typography.helvetica}"
    rounded: "{rounded.none}"
    height: "16px"
    padding: "0 6px"
  field-editor:
    backgroundColor: "{colors.power}"
    textColor: "{colors.white}"
    typography: "{typography.helvetica}"
    rounded: "{rounded.none}"
    height: "16px"
    padding: "0 4px"
  dock-caret:
    backgroundColor: "{colors.field}"
    textColor: "{colors.power}"
    typography: "{typography.dock}"
    rounded: "{rounded.none}"
    height: "44px"
  close-mark:
    backgroundColor: "{colors.field}"
    textColor: "{colors.power}"
    typography: "{typography.legend}"
    rounded: "{rounded.none}"
---

# DESIGN.md

## Overview

VAULT is a composed black desktop field, not a dashboard. Organs (PIPE, NEST, DUMP) are 1px windows on the canvas: double hairline, plaque, `[x] ···`, registration ticks, circle counters. One work graph. NEST is the tree; PIPE is the same nodes by status (FOCUS | GATEWAY). Power red is the only accent. The dock is an operator; titles are typed in a native input over the active cell.

## Colors

| Token | Hex | Use |
| --- | --- | --- |
| Field | `#000000` | Canvas, organ fill, dock |
| Paper | `#F4F4F0` | Type, organ outer hairline |
| Power | `#E10600` | Selection invert, caret, ticks, `[+]` / shovel, strike, legends |
| White | `#FFFFFF` | Type on power-red CHIP / field editor |
| Rule | `rgba(244,244,240,0.18)` | Ledger lines, inner hairline |

No second accent. Strike and URGENT are power red. Cobalt is not in the system.

## Typography

Helvetica Neue / Helvetica / Arial only. Binder and nest at 12px. Plaques 13px / 700. Legends 11px tracked. Dock 14px. Free `GLYPH` may be large (seed `07`). Uppercase for plaques, column legends, status ticks. No JetBrains, Space Grotesk, Inter, VT323, or pixel novelty faces.

## Layout

Desktop field. Organs sit at SPECK `PLACE` origins and may overlap. PIPE is a split page: FOCUS (backlog / active) left, GATEWAY (staging / done) right, double power-red spine. Empty ledger rows stay (6 minimum per column) and create. HIT a binder node expands in place — body, subtasks, status ticks — and everything below moves down. NEST is a unix tree under the plaque. DUMP is a short tape. One dock, 44px, locked to the viewport bottom. Cell editor is positioned on the compiled hit box of the active slot.

## Elevation & Depth

No shadows, no blur, no glass. Recess is a double hairline (paper outer, rule inner). Dither is a handful of 1×1 power-red specks in the chrome, not a texture layer. Overlap of organs and free glyphs is legal.

## Shapes

Radius 0 everywhere, including native inputs. Selection is a rectangular CHIP the height of one ledger row — never an overlay stack covering neighbors. Circle counters are octagon hairlines with a digit. Spine rings are `O` glyphs.

## Components

- **Organ window** — `PIPE // vault` plaque, tick ruler, circle count of open binder work, `···`, `[x]` (collapses that organ).
- **Project plaque** — tracked uppercase parent title above a group of binder rows.
- **Row** — `[ ]` / `[X]`, `#id`, title, shovel `->`. Done rows take a power-red strike.
- **Expand** — body line, child checklist, `+ subtask`, status words with the live status in power red.
- **Nest row** — fold `[-]`/`[+]`, stem prefix, title, `[+]` add. Live row inverts.
- **Field editor** — native `<input>` over the cell, power-red fill, white type. TAB: title → body → subtask → status.
- **Dock** — `>` caret, underline, `↵`. Echo line above when the operator speaks.

## Do's and Don'ts

**Do:** say new features in SPECK; keep one graph and two lenses; click-and-type in the cell; dump from the dock; shovel onto the binder; restamp office-sheet ticks, pixel-GUI chrome, and IMP plaques onto field / paper / power red.

**Don't:** DateBlocks, cards, rounded corners, shadows, cobalt, harvest amber, CLIP-copy, overlay CHIP dossiers, month-as-OS, globe seal, kanban boards, a second dock form, Win95 gray, 3D knobs, or novelty pixel fonts.
