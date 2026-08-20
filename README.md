# vault

VAULT — a task slip whose line items branch. Local only, installable, one screen.

The field is a **SPECK** machine: a canvas runtime that compiles a source string into a display list
and paints it. React is the host envelope (one canvas, one native input). Tasks persist as SPECK
source in `localStorage` (`speck-tree-v1`).

Design language: [`docs/LANGUAGE.md`](docs/LANGUAGE.md). Short law: [`.cursorrules`](.cursorrules).

## The slip

Paper column on a black field, bleeding off the top and bottom.

```
             VAULT
    Wed 19 / 08 / 2026   22:41
           SLIP #0231
::::::::::::::::::::::::::::::::
ITEM                       TIME

●  ops ................  4/7  +
 \
  ●  flush resolvers ... 22:41 +
   \
    ●  check dns ....... --,-- +
  ●  scout ridge a ..... --,-- +
--------------------------------
ITEMS 12  SETTLED 5  OPEN 7  DEPTH 3

OPEN ——   SETTLED ——   STALE ——

      KEEP FOR YOUR RECORDS
           (BAD FORM)
```

## Working it

| Gesture | Does |
| --- | --- |
| tap the ring dot | settle / unsettle. A red hand strike crosses it and the time prints |
| tap the text | select. Cobalt band, paper type, red `[X]` appears |
| tap `[X]` | kill the branch. The dock offers `UNDO` |
| tap `+` | arm that task as the parent. The dock reads `+ under ops` |
| tap the ratio (`4/7`) | fold the branch away. It becomes `+3` with a cut wire |
| long-press a row | print the slip from that branch. Tap the path to climb out |
| tap empty paper | disarm and deselect |

Type in the dock and press return to add. Whole-line commands: `SEE` `WORDS` `CLEAR` (drop settled
leaves) `WIPE` `UNDO` `OUT`. A lone word is a command; anything longer is a task, so `clear the desk`
is work and `CLEAR` is a verb.

Children hang off diagonal wires, jittered from a hash of the task text — chaotic, but identical on
every frame. Depth is capped at 4; a child added deeper lands as a sibling instead of vanishing.

## Source

```
STEM "ops" 08.19.26
  STEM "flush resolvers" STRIKE 08.19.26 22:41
    STEM "check dns" 08.19.26
```

Indent is depth. `STRIKE` is settled. The dates are born / settled, and a leaf open more than seven
days prints a red dashed underline (stale).

```
src/speck/
  Field.tsx    host: canvas, dock input, long-press
  tree.ts      nodes, paths, mutations, counts
  compile.ts   slip layout -> display list
  paint.ts     wires, hand strike, mis-registered stamp
  machine.ts   settle, select, arm, fold, kill, focus, undo
  noise.ts     seeded chaos
```

## Development

```
npm install
npm run dev       # http://localhost:5173 (strictPort)
npm run build
npm run lint
node scripts/make-icons.mjs   # regenerate PWA icons
node scripts/make-stamp.mjs   # extract BAD FORM stamp to public/brand/
```

Runtime checks live in `src/speck/check.ts` and run in the console on every dev boot.

## Install

Add to Home Screen on iOS. `standalone`, black status bar, offline shell via `public/sw.js`.
