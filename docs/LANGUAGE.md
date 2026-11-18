# BAD FORM — Design Language (tree-first)

**Canon.** Copy this file into another repo and the language still holds.
Short law: `.cursorrules`. Values as numbers: [`DESIGN.md`](../DESIGN.md). Product truth: [`PRODUCT.md`](../PRODUCT.md).
Every string: [`docs/VOICE.md`](VOICE.md). Every verb, key and command: [`docs/ACTIONS.md`](ACTIONS.md).

Maker: **BAD FORM**. BLACK LANTERN is dead. First instance: **VAULT** (wordmark `VAULT_`; long name VAULT WORLDWIDE) — one person's ledger that Jake and every Claude write to.

Rewritten 18 Nov 2026 for the tree-first home (plan: "VAULT — Phase 2 build plan", decided 16–18 Nov). Where this file and an older doc disagree, this file wins. If a thing cannot be said in this language, it is not in the work.

---

## 0. The test

Before you add a feature, a colour, a font, a panel, a motion, a word, a key:

1. **Storable.** Can it live in the model (`src/model`, one JSON document) without loss?
2. **Undoable.** Can one Ctrl+Z take it back — and does a batch or a pipe undo as one step?
3. **On the light field.** Does it live on the field: one ink ramp, one blue, one red, hairlines, one radius — and nowhere else?
4. **Three ways in.** Does it have a mouse path, a key and a command, and a row in `docs/ACTIONS.md`?
5. **In budget.** Keypress to paint under 50 ms; the pivot at 60 fps on a 1,000-item board.
6. **Straight, not costume.** Is it the category standard (or a unix idea) played straight, or a costume smuggled in as personality?
7. **Not dead.** Is it on the dead list (§13)? Would Jake almost throw up?

Fail any one: cut it. Don't argue for it.

---

## 1. World

1. The program lives on a **light field**: cool near-white ground, white panels, hairline rules, one blue, uppercase plaques on names. The category standard played straight, at the craft level of Linear, Things and Height.
2. **The directory is home.** The board is a pivot of it: one set of rows, two arrangements, `v` turns between them.
3. **Unix is the grammar, not the costume.** `ls -l`, `mv`, `rm -r`, pipes, `tail -f`, `man` are used because they are exact and short. No green-on-black, no phosphor, no CRT, no terminal skin. The field stays light.
4. **The lack of costume is the position.** Character comes from three places a costume can't reach: who wrote it (§4), raw seams (§6), and the voice, rationed (§8).
5. **Desktop first** (~1440), one column below 900px. Phone: Claude first (the Wire), a tree-only PWA after Phase 4. Not mobile-first.
6. Playing the standard straight is not permission to be careless: geometry measured, contrast held, type sized by ink width, motion that explains what moved. A quiet field shows every loose value.

---

## 2. Taste stack (locked)

Four layers. Don't flatten them into one costume and don't add a fifth.

| Layer | Role | Overdone looks like |
| --- | --- | --- |
| Light field | The plate. Ground, white panels, hairlines, 8px radius | Grey soup, nested boxes, card-in-card, shadows doing a border's job |
| Quiet type | Three faces, each with one job (§3.2) | Billboard headings, letterspaced body, four weights in a row |
| One accent | The signal. Blue for live, cursor, found, primary | Rainbow chips, a second brand colour, coloured fills as decoration |
| Terse machine voice | The attitude, in the words | Slogans, emoji, "Welcome back", apologetic empty states, AI talk |

---

## 3. Tokens (their jobs)

`DESIGN.md` carries the values. This is what each token is *for*.

### 3.1 Colour

| Token | Job |
| --- | --- |
| ground | The field. The tree and the board sit on it |
| surface | Panels: top bar, rail, drawer, status line, cards |
| ink | Primary text; the cursor's reverse-video plate |
| ink-2 | Secondary text: subtasks, meta, counts, the status line |
| ink-3 | The faintest **word**: hints, `_`, done rows, path lines. Word-safe (≥4.5:1) |
| tint | **Marks only, never a word**: stems `│ ├── └──`, rules drawn as glyphs, the `░` rot edge |
| line / line-2 | Hairlines, two strengths |
| accent | Live, cursor caret, found, primary, drop target |
| accent-deep | The accent when it is **text** on the ground or a wash (a blue word) |
| accent-wash / accent-line | The accent at panel strength: hover, drop zone, draft border |
| urgent | `^` urgent, `!` late, `4/3` over cap, strike |
| status inks | pending · r&d · active · done · dusted — spent on the **status word** only |

**The ink law (reconciled, audit 10).**
1. A **word** holds 4.5:1 on the ground, the surface *and* the wash. ink, ink-2 and ink-3 all clear it.
2. A **mark that carries meaning** holds 3:1. That is the tint's floor, and it is below what a word may be set in.
3. The tint never spells. Find every use of `tint`: if one is a word, it is the wrong token.
4. The old shell broke rule 1: its `ink-3` was the tint and ended up carrying words at ~3.6:1. In the new home `ink-3` is a word-safe grey and the old value is renamed `tint`. Don't port the old `ink-3` value into a word.

**One accent.** Blue is the signal. Red is urgent/late/over. Status inks name a state in a word. That is the whole palette; there is no third signal colour.

**Status colour lives on the word, never on the plate.** The status inks may colour the `ls -l` status column, a lane plaque, a rail slot's plaque and the drawer's plaque. Never a card fill, a card border, a row background or a chip. The board stays monochrome plates; the lane says the state.

### 3.2 Type — three faces, one job each

| Face | This instance | Job |
| --- | --- | --- |
| UI sans | Public Sans Variable | **What a person typed**: titles, subtasks, descriptions, notes, inputs |
| Plaque | Sofia Sans Semi Condensed Variable | **Names in caps**: task names, lane names, drawer labels, the wordmark. Nothing else shouts |
| Mono | JetBrains Mono Variable | **What the machine wrote, and the directory's structure**: stems, `ls -l` columns, counts, timestamps, trail lines, receipts, the shell, the status line, and every task Claude pushed until you touch it |

1. No display faces, no fourth face.
2. Caps are names. `PENDING` is a name; `+ new` is not.
3. Every number beside a name is tabular, so a changing count doesn't move the name.
4. Size plaques by measured ink width, not by derived cap height.

### 3.3 Surface

1. **One radius.** 8px on anything you can see the edge of (panels, cards, controls, slots, drafts). 4px on chrome inside it (kbd, the row plate). Circles only where a thing is a dot. Nothing else.
2. **Hairlines separate.** 1px. Not a shadow, not a heavy border.
3. **Nothing at rest casts a shadow.** A dragged row is reverse video (ink plate, surface text) — that is how it reads as lifted. If a production drag ghost needs a shadow, it gets the one airborne shadow and only while airborne.
4. **Dashes mean "not filed yet".** A draft in `inbox/`, a drop zone during a drag, an empty rail slot. Nothing else is dashed.
5. No gradients, glass, blur, grain, scan lines, texture, watermarks.

---

## 4. Who wrote it decides the face

1. **Sans = Jake typed it.** Any title, subtask, description or note a person typed is set in the UI sans (task names in the plaque, which is the sans family's caps voice).
2. **Mono = the machine wrote it.** Trail lines, timestamps, counts, receipts, exit codes, the status line, the shell — and **every row Claude pushed, until Jake touches it**.
3. **Touching takes ownership.** Rename, retick, move, set status or edit a Claude row and it becomes Jake's: it drops to the sans and loses its `← claude` marker. The trail keeps who wrote it.
4. No badge, no avatar, no sparkle, no "AI" label. The face is the whole signal, plus the plain `← claude` marker on rows that arrived and haven't been touched.

---

## 5. Composition: one set of rows, two arrangements

### 5.1 The graph

1. One graph: every node has `id`, `title`, `status` (`pending|rnd|active|done|dusted|none`), `parent`, ordered children, and the optional fields in `src/model/types.ts`. Depth 0 is a **folder**, depth 1 a **task**, depth 2+ a **subtask**. IDs stay in source, not on the surface.
2. Folders have no status. Tasks and subtasks do.

### 5.2 The tree (home)

1. Full height. `ls -l` columns at the right of each task row: **status** (a word), **progress** (`2/5`, text), **due** (`fri`, `today`, `3d late`). `c` toggles the columns.
2. A **reverse-video cursor**: the row under it is an ink plate with surface text and a `_` caret after the title.
3. Folders end in `/` (`r1i/`) with a count at the right (`_` when empty). Subtasks carry `[ ]` / `[x]`.
4. **`.dusted/`** sits at the foot of each folder that has dust, hidden until `ls -a` (`a`). DUSTED is not a lane.
5. **`inbox/`** sits at the top: captured lines, pasted or pushed drafts (dashed, editable, not yet filed) and Claude's proposals (`y` takes, `n` drops).
6. The **status rail** stands beside the tree: PENDING · R&D · ACTIVE `n/3` · DONE `↓ today n` · `.dusted/ n`. It is a drop target and a count, nothing more.
7. The **drawer docks** beside the tree as a live preview of the row under the cursor. Enter goes into it.
8. The **status line** is the foot: the `$` prompt, the last message, the exit code. `tail -f` (`F`) opens a live strip above it showing writes as they land.

**The tree may show:** stems, `name/`, `[ ]`/`[x]`, `ls -l` columns, the cursor and `_`, a hover strip (`+ → x`), `← claude`, `^` and `!` marks, `.dusted/`, dashed drafts.
**The tree may not show:** cards, boxes around filed rows, plaques on folders, status colour on a plate, progress bars, avatars.

### 5.3 The board (the pivot, `v`)

1. **Three live lanes**: PENDING · R&D · ACTIVE. The ACTIVE head shows `n/3`; a fourth card still goes in and the head turns red (`4/3`) with `no. finish something.` on the status line. `ulimit active 0` turns the cap off.
2. **DONE is a chute**, not a lane: a card dropped (or `d`'d) there falls in and feeds the `done today` counter. `n all time` sits underneath.
3. A card: mono path line (`r1i/`), the name (plaque for Jake, mono for Claude), a mono meta line (`2/5 · fri · ^ · ← claude`). Nothing else.
4. The drawer slides over the board's right edge; the lanes never reshuffle.

**The board may show:** lanes, the chute, cards, the path line (it replaces stems), progress as text, due, `^`, `← claude`.
**The board may not show:** stems, `[ ]` ticks, `ls -l` columns, DONE or DUSTED as lanes, status colour on a card, progress bars.

### 5.4 Shared by both

1. Same rows, same cursor, same marks, same keys. A card **is** its row: the pivot morphs each row into its card and back.
2. Drag works in both: onto a folder, above a row, onto a lane or a rail slot, into the chute.
3. A subtask sent to a lane is pulled out as its own card (`loose`); its path line names its parent (`r1i/network map/`). The path line is the leash; the drawn leash retires with `/classic`.
4. The old board survives at `/classic` after Phase 2 until Jake kills it. Nothing new is built in it.

---

## 6. Raw seams: the marks

Show real state where other apps show reassurance: `saved 21:14`, `3 unpushed`, `vault.json · 184 KB` in the menu, exit codes in the shell.

### 6.1 The ASCII set (the icons)

Icons give way to the characters the tree already speaks. Set in mono, in the colour of the job.

| Mark | Means | Where |
| --- | --- | --- |
| `+` | add / new inside | hover strip, ghost rows, `+ new folder` |
| `x` | remove: delete, close, cut a draft line | hover strip, drawer close, draft lines |
| `→` | goes to: move, filed to, receipts | hover strip, messages, receipts |
| `_` | empty, cursor, the signature | empty lanes and folders, the caret, `VAULT_` |
| `!` | due is today or past | before a late due when columns are off; the `!date` sigil |
| `░` | rot: untouched four weeks | the row's left edge (Phase 4) |
| `^` | urgent | after the title; the `^urgent` sigil *(call: G4 — the plan's set is `+ x → _ ! ░`; `^` is added so the screen, the keys and the capture grammar use one sigil each)* |

### 6.2 Structure (typography, not icons)

Box-drawing stems `│ ├── └──` (and the draft's dashed `┆ ├╌╌ └╌╌`), ticks `[ ]` `[x]`, the folder slash `/`, the prompt `$`, the separator `·`, `←` (arrived from: `← claude`) and `↓` (fell into the chute). These are type set in mono, not icons.

### 6.3 The old glyph rule, reconciled

The old law said "no Unicode glyph characters as icons" because a `▸` beside drawn chrome read as a different system. The tree-first home has no drawn chrome to clash with: **the characters are the system.** The rule becomes:

1. Every icon is a character from §6.1, set in mono. No drawn SVG icons in the new home, no icon font, no emoji.
2. Nothing outside §6.1–6.2. No `▸ ⇄ ⇢ × ✓ ★ ⚑` or any other decorative Unicode. (The prototype's `⇄`, `⇢`, `×` and `::` grip are replaced: `/` between `tree` and `board`, ` →` after a loose row, `x` on a draft line, the whole head row as the draft's handle.)
3. The retiring shell keeps its drawn SVG icons until it is deleted. Don't add new ones.

### 6.4 Plaque, card, cursor, tick

- **Plaque** — uppercase condensed caps on a name. Lane names, task names, drawer labels, rail slots.
- **Card** — white plate, hairline, 8px radius, path line, plaque name, meta line. Not a deal card: no avatar, no assignee, no progress bar.
- **Cursor** — reverse video (ink plate, surface text) with the `_` caret.
- **Tick** — `[x]` is the whole signal. A done subtask in the tree is struck with a `line-2` rule and set in ink-3; in the drawer it keeps full-strength text, because greying the sentence there reads as cancelled.
- **`_`** — every empty thing: an empty lane, an empty folder's count, the ghost row that writes.

---

## 7. Input: three ways in, nothing scary

### 7.1 Three ways in

1. Every action has a **mouse path**, a **key** and a **command**, listed in `docs/ACTIONS.md`. A test parses that table; an action without all three does not ship.
2. **The mouse teaches the keys.** Hovering a row shows what it can do (`+ → x`, each with its key in the tooltip). Right-click lists every action for that row with its key. Nobody needs to know a key; everyone learns them.
3. **One grammar, two inputs.** The shell prompt (`:`, or click `$`) and the palette (Ctrl+K, or `/`) run the same lines. Claude's captures use the same grammar. (This replaces the old "no second input" rule: there are two inputs and one language.)

### 7.2 Focus decides what a key does

| Focus | Keys that act |
| --- | --- |
| **Tree** (the stage has focus, no text field) | The single keys in `ACTIONS.md`, on the cursor row or on the marked rows |
| **Board** | The same keys on the same rows; `h`/`l` cross lanes instead of folding |
| **Drawer** | The same keys on the focused line of the drawer (a subtask is a row anywhere), or on the drawer's task when focus is on its head |
| **Text field** (rename, new row, drawer fields, palette, prompt, draft line) | Only the field's own keys. Enter commits. Esc leaves (§7.3). Ctrl+Z is the field's own undo |
| **Menu or sheet** (right-click menu, `m` picker, `?`, the one confirm) | ↑↓ / `j` `k` move, Enter picks, Esc closes |
| **Anywhere but a text field** | `/` find, `:` prompt, `?` help, Ctrl+V paste a tree. None of these change data by themselves |
| **Anywhere** | Ctrl+K palette, Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y (outside a text field), Ctrl+S export, Ctrl+O import, Esc |

A single key that changes data acts **only** when the tree, the board or the drawer has focus — never while typing, never from a key pressed elsewhere on the page. (This replaces "no global single-key shortcut changes data".)

### 7.3 Why nothing is scary

1. **Esc backs out one level**: confirm or menu → text field (keeping what you typed; an empty new row is dropped) → drawer → marks → find/filter → cursor.
2. **Ctrl+Z undoes anything**, and a batch, a pipe, a paste or a filed draft is one step.
3. **Only one thing asks "are you sure"**: `rm -r` on a folder with things in it — `this takes 14 things with it. sure?` (`y` / `n`, focus starts on `n`). Deleting a task, a subtask, an empty folder or a marked batch never asks; it says `gone. undo`.
4. Every write prints what it did, in mono, on the status line. A key you didn't mean is visible and one Ctrl+Z away.

### 7.4 Typing creates, and says so first

The palette and the prompt may run commands, including ones that make things. That is how it stays unscary:

1. **Plain words search.** They never create on their own.
2. **A verb runs.** A line that starts with a verb and a space (`touch …`, `mv …`), or with `>`, is a command. The row under the input shows the exact line it will run before Enter.
3. **No match offers a create, visibly.** When plain words match nothing, the one row offered is `+ touch <here>/<WORDS>`, spelled out. Enter runs that line and nothing else; Ctrl+Z takes it back.
4. **When anything matches, the match is the default**, never the create row.
5. **One-line capture** sets fields as it creates: `touch r1i/NETWORK MAP !fri ^urgent > redraw the hero` (due, urgent, next action). The inline new row in the tree reads the same sigils.

---

## 8. The voice, rationed

1. Irreverence lives in the words, **one line per screen at most**, and **never** in a message about lost or at-risk data.
2. Lower-case machine voice. No exclamation marks, no emoji, no "AI" talk, no "Welcome back", no apologies.
3. Plain honesty about state beats reassurance: `saved 21:14`, not "All changes saved!".
4. Empty is `_`.
5. The full sheet, with every string: [`docs/VOICE.md`](VOICE.md). Write from it; don't invent new phrasing in a component.

---

## 9. The signature: the underscore

The `_` is the one mark to remember. Used everywhere, never decorated:

1. The wordmark is `VAULT_`, the `_` in the accent. It does not blink.
2. The live cursor's caret is `_`, and it is the one thing that blinks (1.1 s, stepped).
3. The favicon is `_`.
4. Every empty state is `_`.

---

## 10. Motion

1. Motion says **what moved**, and nothing else. No entrance animations, no parallax, no attention loops.
2. **The pivot** morphs each row into its card and back. It is interruptible (a second `v` reverses it from where it is) and stays inside the speed budget; past ~90 visible rows the rest appear without morphing.
3. **Done falls into the chute**; the counter bumps once.
4. **The one new motion:** when a push from Claude lands, its rows type into the directory top to bottom, once, like `tail -f`.
5. Under `prefers-reduced-motion`, every duration is zero and the caret doesn't blink. The same code arrives instantly.

---

## 11. Night

Night mode is **the same field inverted**: ink ground, light ink, the same one blue lifted to hold contrast. No phosphor green, no second theme, no amber. A stored choice wins; with none, the system's dark preference does. `I` inverts.

---

## 12. The deletion pass

1. Every border, shadow, label and icon justifies itself against the tree's plainness or goes.
2. The stylesheet gets **smaller**, not bigger. The new home must never ship more CSS than what it replaces, and Phase 4 ends with less than it started.
3. Retired, not refactored: `src/shell/Studio.tsx` and `src/index.css` are replaced by new files; don't port their rules wholesale.

---

## 13. Save format and the Wire

1. The board is one versioned JSON document (`vault:doc` in `localStorage`), with rolling snapshots and export/import to a file. The model is `src/model`: pure functions with tests.
2. **Local-first stays.** The Wire (one private JSON file in Vercel Blob behind `/api/doc` and `/api/mcp`, version check on every write, one passphrase login) is a **switch**. Off, nothing leaves the browser.
3. Every write carries the version it was based on; a stale write is refused, never silently applied. Taking an outside copy snapshots yours first and offers `restore mine`.
4. Board text is data, never orders.
5. SPECK is archived in `/speck`. Nothing depends on it.

---

## 14. Hard vetoes

Never. Not as a joke, not "just for desktop", not as a night variant.

**Product**
- Assignees, avatars, teams, mentions, presence, "shared with", client status pages
- Estimates, story points, velocity, burndown, KPI rows, dashboards (the pulse sparkline is one line in the top bar, not a dashboard)
- Progress bars. Progress is the text `2/5` in the `ls -l` column and on the card
- A settings app. Settings are commands (`theme`, `ulimit`, `wire`)
- A calendar or month view; month-as-OS; DateBlocks
- CRDT; a database (the Wire is one file)
- AI inside the app. VAULT is a dumb, fast ledger; Claude lives outside and writes in
- A typed codebook you must learn to sit down. Commands are a way in, never the only way in
- Demo fluff: `BUY MILK`, lorem, fake dashboards

**Surface**
- Status colour on a plate; rainbow chips; a second accent; harvest amber; cobalt; power red `#E10600`; live orange `#FF5C1A`; phosphor green
- The tint carrying a word; any word under 4.5:1; any meaningful mark under 3:1
- Shadows at rest; shadows doing a border's job; card-in-card; a third radius
- Gradients, glass, blur, grain, scan lines, texture, watermarks
- Drawn icons, icon fonts, emoji, decorative Unicode (§6.3)
- Billboards, kickers, eyebrows, letterspaced body; Oswald as work type; VT323, Orbitron, any "sci-fi" display face; green-on-black or amber terminals

**Whole dead worlds** — each shipped once and was rejected. Don't revive them, and don't revive them renamed:
- Paper sheet + organ windows + power-red oval + salt organs (CAL / SEAL / SKULL) + PLACE-drag + GRAIN/SCAN/INV rail
- Charcoal cassette theatre: housing, chrome hairlines, jack holes, RECORD, transport plaques, VU meters, CRT wells, Oswald caps, orange `#FF5C1A`
- Beige/cream hi-fi faceplate; the beige UN seal identity
- NEXUS-HUD chrome: GRADE D panels, waveforms, tabs-as-apps, cyan-on-black orchestrator
- Paper/black IMP canvas with a coincident-PLACE fold
- The dump-parser REPL dock; DOS `#id` ledgers; the sit-down verb codebook
- Matrix rain, hoodie-hacker stock, `1337`, gradient ASCII wordmarks, vaporwave, synthwave, Y2K skins, Alien Isolation cosplay, 3D knobs, modular console bays
- Rave-flyer maximalism as the brand system; Tailwind / v0 "editorial binder" templates; 2×3 card dashboards in a terminal skin
- BLACK LANTERN as maker

**Overturned at Jake's request (no longer law):** "no second input", "pointer-first / no typed commands", "FIND searches only", "no backend", "two languages don't share chrome / unix stems never on a card", "no global single-key shortcut that changes data" (replaced by §7.2), "five lanes", "no Unicode glyph characters as icons" (replaced by §6.3), the fold cue under the board, the drawn leash.

---

## 15. Refs — take / leave

Steal mechanics and craft, not costumes.

**Take:** Linear (lane board, right drawer, hairline density, restraint) · Things 3 (first click selects, the tick as the whole signal, how little chrome a list needs) · Height (one graph through two lenses) · ranger / nnn (the cursor, marks, `h j k l`, a block behind the live name) · unix itself (`ls -l`, `mv`, pipes, `tail -f`, `man` — the words, played straight) · vim (keys as a grammar, `y`/`p`, `:`) · iA Writer (entering a task is writing).
**Leave:** assignees, teams, cycles, estimates, triage theatre; any terminal or studio costume; template chrome; a month as home.

---

## 16. Porting this to another project

1. Copy this file. Keep §0, the ink law, one accent, the three-face split, one radius, shadows-never-at-rest, the ASCII set, the focus model and the vetoes.
2. Change world content only: what the rows are, what the folders hold.
3. If it can't live as one graph seen as a tree and a pivot, with one grammar behind every input, it is a different language.
4. Point `.cursorrules` at this file and keep it short. `DESIGN.md` carries measured values and is written from a build.

---

## 17. Authority

Further from the norm, firmly in utility, order from chaos. The ambition goes into execution. Propose bold changes inside this language; don't propose a new language because a costume seemed more expressive than a white field.

Short law: `.cursorrules` · values: `DESIGN.md` · product: `PRODUCT.md` · strings: `docs/VOICE.md` · actions: `docs/ACTIONS.md` · this file: the canon.
