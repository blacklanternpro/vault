# Racked Manager — theatre without nest stems

Date: 2026-09-08  
Instance: VAULT WORLDWIDE  
Status: implemented

## Thesis

The dark charcoal studio stays. The Manager becomes a racked instrument: five inset column wells, plaque labels, modest fasteners. Jobs nest in a card well. Pull makes a satellite. A taut tuner-needle filament leashes satellite to immediate parent. Directory stays the unix catalogue — stems live only there.

Cream hi-fi / beige cassette is anti-reference for the OS plate. No VU KPIs, no 3D knobs, no brass patch-cables, no PM nest stems.

## Product law

1. One project on the board. Header: project dropdown + ADD. Project name under the bar.
2. Job = main card, title ALL CAPS. Click card body (not title) to add a nested subtask (sentence case).
3. Five wells: PENDING (default) · R&D · ACTIVE · DONE · DUSTED.
4. New job stays PENDING until the first nested subtask → auto ACTIVE.
5. Nested children inherit the job’s stage until pulled.
6. Pull: nested row becomes a smaller satellite card, own column/status, parent unchanged in SPECK. Recursive; leash to immediate parent.
7. Physics A: job (or satellite card) moves → nested non-loose children follow; loose satellites stay; leashes stretch.
8. Directory = entire catalogue, all projects/depths. Stems only here. PM GUI never draws nest stems.
9. Leash is a taut glowing filament, not a sagging brass cable and not ASCII stems.

## Graph

Statuses: `pending | rnd | active | done | dusted`. `none` remains off-board (projects).

Legacy aliases when parsing: `backlog` → `pending`, `staging` → `rnd`.

`NODE` may carry `LOOSE`. Nested = child without `LOOSE`. Satellite = child with `LOOSE` + own `status`. Parent pointer never changes on pull.

Projects = `parent === null`. Jobs = direct non-loose children of the focused project. Satellites = `LOOSE` descendants of that project. Nested (non-loose) descendants render inside the parent card well, not as lane cards.

Moving a card rewrites that node’s status and all nested (non-loose) descendants. Loose descendants are skipped (not recursed into).

First nested child of a `pending` card promotes that card to `active`; the child inherits `active`.

## Surfaces

- Header: dark inset bar, project `<select>` + ADD. Helvetica plaques. No Oswald.
- Manager: charcoal plate, hairline bezel, modest corner fasteners (graphic, not 3D). Five equal inset black wells with plaque + count. Ghost `+` in PENDING creates a job. Empty is `_`.
- Job card: slate, uppercase title (click to rename), inset well of nested rows (weight/size indent only). Click empty body to add nested.
- Pull: drag a nested row out of the well onto a lane → `LOOSE` + satellite card.
- Filament: SVG straight glowing line, safety orange, jack-dots on parent and satellite. z-index under drag ghost, over wells.
- Directory: unix stems, full tree always. Safety-orange name block for selection. Highlighter red for URGENT / destroy / CLEAR.
- Scratch / FIND: quieter; inherit hairlines only.

## Palette

- Ground charcoal / slate cards stay.
- **Live / select / filament:** safety orange `#FF5C1A`.
- **Danger:** highlighter red `#ff3355` — URGENT, strike, CLEAR-class.
- DUSTED well: quieter, crushed type. Not a kanban “0 items”.

## Take / leave (refs)

- Hi-fi rack: inset wells, taut needle, RECORD red as danger. Leave cream plates, VU as KPI, cassette transport.
- TS19: black well, orange live, plaque labels, fasteners. Leave 3D knobs, beige module as OS.
- Library log: labeled lanes + counts, quiet cards. Leave genre pills, avatars, SaaS chrome.
- Unix tree: orange name-block, stems. Directory only.
- IMP: recessed panels, grouped zones. Leave UN seal, beige metal identity.
- Nuclear-lab poster: safety-orange live mark; DUSTED as abandon theatre. Leave paper OS.

## Anti-goals

DateBlocks, dump-parser, month-as-OS, CLIP-copy, cobalt, cream cassette OS, 3D knobs, VU meters as KPIs, family-follows physics, block-until-tuck, overlay CHIP dossier, media blobs, PM nest stems, sagging brass cables.
