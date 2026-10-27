# SPECK — archived

SPECK was a small, made-up programming language that VAULT ran on between August and September 2026. The idea: the whole app *is* a program. The project graph, the screen layout, the paper texture and even the keystrokes are all written as SPECK source text. That text is compiled into a list of drawing instructions and painted pixel by pixel onto a canvas, with no HTML layout at all.

It never quite became the thing in Jake's head. VAULT has since moved to a plain React app with a JSON save file, and SPECK lives here in case it's useful somewhere else. **Nothing in the app imports this folder.** It's excluded from the build, lint and tests.

## What's in here

```
speck/
  README.md          this file
  SPEC.md            the language spec as it stood (§7 of docs/LANGUAGE.md at a353657)
  runtime/           the full runtime, copied from commit a353657
    lex.ts           tokeniser: WORD / NUM / "STR" / DATE (MM.DD.YY) / 'YEAR
    parse.ts         dock commands: SEE WORDS CLEAR SHOVEL FOCUS STRIKE ADD FIND NOTE GLYPH HIT MOVE TYPE COMMIT
    parse-dump.ts    plain-English "dump" parser ("new website project, redesign homepage, need to create repo")
    doc.ts           the graph: parse/serialize the source (PIPE, COL, NEST, NODE, BODY, DUMP, NOTE, PLACE, GLYPH)
    machine.ts       the interpreter: (session, source, event) → (session, source)
    ir.ts            display-list ops + hit boxes + session shape
    compile.ts       source + session → display list (one layer for the field, one for the dock)
    organs/          each on-screen "organ" compiles itself: pipe (status binder), nest (unix tree),
                     dump (notes tape), cal (month digits), seal (wireframe globe), skull (pixel skull), chrome
    paint.ts         executes the display list on a 2D canvas
    material.ts      grain + scanline overlay
    Field.tsx        the React host: a canvas, a native <input> laid over the live cell, and the dock
    check.ts         ~100 assertions over the runtime (no test framework)
    source.ts        localStorage key speck-os-v1
    tokens.ts        colours, fonts, opcode list
    see.ts           SEE (echo source)
```

## The language in one screen

Source is line-based. Indenting by two spaces nests a line under the one above. Opcodes are case-insensitive words, payloads are quoted strings, and `//` or `\` starts a comment.

```
INV                         // paper ground instead of black
GRAIN 0.14                  // film grain amount
PIPE vault                  // the status binder (a view of the graph)
  COL backlog
  COL active
NEST                        // the tree (the same graph)
  NODE 1 "ops" status none
    NODE 104 "ingress routing" status backlog URGENT
      BODY "one paragraph per BODY line"
DUMP                        // scratch tape
  NOTE 09.07.26 "ridge"
PLACE PIPE 24 48            // where each organ sits on the field
GLYPH 16 16 56 "VAULT"      // free type painted on the field
```

**Display list.** The painter has ten stateless ops: `FILL GLYPH LINE CHIP STRIKE STEM GRAIN SCAN INV OVAL`. Every pixel on screen comes from one of them. Clicks are hit-tested against boxes emitted alongside the ops, highest z wins.

**Events are SPECK too.** A click becomes `HIT NODE 102` and a keystroke becomes `SHOVEL` or `TYPE "…"`. Everything is interpreted by `machine.ts`, which returns a new source string. The source *is* the save file.

**The dock** was a single command line. It ran the line as a command if it parsed as one (`SEE`, `WORDS`, `CLEAR`, `SHOVEL`, `FOCUS 104`…). Otherwise it treated the line as an English "dump" and turned it into a project with child tasks.

## Why it was retired (lessons, if you pick it up again)

- **No string escaping.** The format couldn't hold a `"` or a newline, so the app quietly removed them. A real string grammar (escapes or length prefixes) is the first thing to fix.
- **Re-parsing everything on every keystroke** made each small loss in the format compound silently.
- **Global key handling** (Space advanced a task's status, Tab re-parented it, Backspace deleted a subtree) was fine on a canvas with one cursor, but became a minefield once real inputs and buttons existed.
- Painting a whole UI on a canvas means rebuilding text input, selection, accessibility and scrolling by hand. That's where most of the time went.

## Running it

It isn't wired up any more. To see it run, check out the last commit where it was the whole app:

```
git checkout a353657
npm install
npm run dev
```
