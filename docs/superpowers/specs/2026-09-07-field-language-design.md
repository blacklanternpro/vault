# Field language (juice)

Date: 2026-09-07  
Instance: VAULT WORLDWIDE  
Status: locked for implementation

## Thesis

The field is an office sheet that speaks. Paper is the ground. Black 1px windows are the machine. Power red is the only lash. Grain, scan, oval, display grotesque, skull, globe, and calendar are letters of one tongue — not a junk drawer on a silent black sheet.

Home stays PIPE / NEST. Month is an organ. The operator stays the one REPL. A legend rail sits above it. Pare later by HIT, not by deleting the language.

## Approaches (closed)

- A. Costume overlay (CSS grain, watermark skull) — rejected. Not SPECK. Still silent.
- B. Language invert — **shipped direction.** Paper `INV`, black windows, live paint ops, PLACE-able salt, legend rail.
- C. Dual theme with black default — rejected. Shy flag. Default seed is juice on.

## Ground

- Canvas ground is paper `#F4F4F0` when source contains `INV`.
- Black `#000000` is ink and organ plate.
- Power red `#E10600` is oval, caret, live ticks, strike, URGENT, `[+]` / shovel.
- Envelope (`html` / `body` / host) follows the sheet so the dock is not a black trench under white.
- `INV` off (legend HIT, or drop the source line) restores black field / paper type.
- This is not CSS `filter: invert(1)`.

## Paint ops

Live: `FILL` `GLYPH` `LINE` `CHIP` `STRIKE` `STEM` `GRAIN` `SCAN` `INV` `OVAL`.

- `GRAIN amount` — film salt. Deterministic. Visible. Source `GRAIN 0.14`.
- `SCAN amount` — IMP scanlines on black organ fills and the PIPE spine meter. Source `SCAN 0.1`.
- `INV` — marker + compile paper fill.
- `OVAL` — power-red ellipse around the live CHIP. Rectangular CHIP stays inside.

Material pass: one grain+scan overlay (WebGL if the context lives, 2D ImageData / hashed specks if it does not). No hot RAF. Dirty + caret interval. Grain is hashed, not animated soup.

`CLIP` stays dead. `WORDS` advertises the live ops.

## Type

- **Display:** Oswald 700, self-hosted. Plaques `PIPE // vault` at 32–40px. Shouts and organ titles.
- **Work:** Helvetica Neue / Helvetica / Arial at 16–18px. Row height 26–28.
- **Chrome crumbs:** `[x] ···` Helvetica. No pixel novelty face on titles.
- Dock operator 18px. Cell input matches the row.
- Wait `document.fonts.ready` before first paint.
- Forbidden: Inter, Space Grotesk, Playfair, VT323, Orbitron, JetBrains.

## Chrome

Organ windows: black plates, 1px paper hairline, filled title bar, Oswald plaque, `[x] ···`, denser tick ruler, larger octagon counters. Live organ: power-red ticks.

PIPE spine: scanline meter + FOCUS / GATEWAY. Paper field: corner registration ticks, dashed register through the binder spine. Dither is 1×1 salt, more of it, still salt. Overlap legal. Radius 0.

## Salt organs

`OrganName`: `PIPE` `NEST` `DUMP` `SEAL` `SKULL` `CAL`.

All `PLACE`-able, all `[x]`-collapsible, none is identity.

- **SKULL** — pixel skull as `FILL` cells in a small window. Drag and close only.
- **SEAL** — wireframe meridians + laurel ticks + stencil `VAULT WORLDWIDE`. Not the beige UN icon as the OS.
- **CAL** — month digits inside a window, 7-across, day 1 top-left, no weekday offset. Power-red hairline under a day that has a DUMP `NOTE`. HIT a day lists those notes in the window. HIT empty field dismisses. DUMP remains the store. Not month-as-OS. Not DateBlocks. Not cobalt.

## Legend rail

Read-only strip above the operator. Not a second `<input>`. Never three forms.

`GRAIN SCAN INV OVAL · PIPE NEST DUMP SEAL SKULL CAL · FOCUS <id>`

HIT `GRAIN` / `SCAN` / `INV` toggles the matching source line. Operator still dumps and runs commands. `···` stays organ chrome.

## Machine (unchanged)

One graph. PIPE / NEST lenses. DUMP tape. TAB field editor. SHOVEL. FOCUS. In-place expand. Persistence `speck-os-v1`. React is the envelope.

Cell on black rows: paper-on-black. CHIP invert: white-on-red. `editBox` only from the active lens.

## Seed (sketch)

```
INV
GRAIN 0.14
SCAN 0.1
PIPE vault
  COL backlog
  COL active
  COL staging
  COL done
NEST
  NODE …
DUMP
  NOTE 09.07.26 "ridge"
PLACE PIPE …
PLACE NEST …
PLACE DUMP …
PLACE SEAL …
PLACE SKULL …
PLACE CAL …
GLYPH … "VAULT"
```

## Still veto

DateBlocks cards, cobalt as theme, harvest amber, SaaS kanban, Win95 gray as the whole skin, three stacked prompt forms, beige cassette as OS identity.

## Verify

- `WORDS` / `PAINT_OPS` include `GRAIN SCAN INV OVAL`; paper is the default field fill
- SKULL, SEAL, CAL compile, hit-test, `[x]` collapse, PLACE drag
- Legend rail has no `<input>`; operator still dumps and runs commands
- Type is large; grain/scan visible
- Binder still usable: click-type, dump line, expand reflow, SHOVEL
- `npm test`, `npm run lint`, `npm run build`
