# Product

<!-- impeccable:product-schema 1 -->

Rewritten 18 Nov 2026 for the tree-first home. Source of truth for scope: the plan, "VAULT — Phase 2 build plan" (https://claude.ai/artifact/RG53xfnrCoBXJaKAEqmA73). Rules: [`docs/LANGUAGE.md`](docs/LANGUAGE.md). Values: [`DESIGN.md`](DESIGN.md). Strings: [`docs/VOICE.md`](docs/VOICE.md). Actions: [`docs/ACTIONS.md`](docs/ACTIONS.md). Where things are: [`docs/HANDOFF.md`](docs/HANDOFF.md).

## Platform

Web. A desktop field (~1440) that restacks to one column below 900px. Phone: Claude first (through the Wire), then a tree-only PWA after Phase 4.

## Users

One person: Jake, who runs BAD FORM, a solo design-and-build studio — plus every Claude he works with, writing in. Not a team tool, not a SaaS, not a grocery list.

## Product Purpose

**VAULT is one person's ledger that Jake and every Claude write to.** Today it is a good board in one browser on one PC. Phase 2 makes it the one place work lives: Jake drives it with the mouse, the keys or a line of shell; Claude files into it from any chat with "vault it".

The daily sit-down: open the tree, see what's live, start one thing, finish one thing, file what Claude sent, leave. Not a status meeting, not a month view.

## The surface

1. **Home is the tree.** The directory, full height: folders (`r1i/`), tasks, subtasks (`[ ]`/`[x]`), with `ls -l` columns — status, progress (`2/5`), due (`fri`, `3d late`). A reverse-video cursor with `_`. Rows drag like files: onto a folder, above a row, onto the status rail beside the tree.
2. **The board is a pivot** (`v`): the same rows turned into cards, morphing there and back. Three live lanes — PENDING, R&D, ACTIVE. **ACTIVE has a cap of 3, as a nudge**: a fourth still goes in, the head shows `4/3` in red and the line says `no. finish something.`; `ulimit active 0` turns it off, `ulimit active 5` raises it. **DONE is a chute** that feeds a `done today` counter. **DUSTED is `.dusted/`**, a hidden folder at the foot of each folder (`ls -a` shows it).
3. **The drawer docks beside the tree** as a live preview of the row under the cursor, and slides over the board's edge on the board. It holds the next action, left-off note, due, description, subtasks, links, the handoff (brief out, report in, session clock) and the trail.
4. **`inbox/`** sits at the top of the tree: captured lines, **drafts** (a pasted or pushed tree, editable, dashed until filed — drag it onto a folder or press `m`) and **proposals** (Claude's automatic writes, `y` takes, `n` drops).
5. **Paste a tree.** Paste any indented list, checklist or `tree` output and it becomes a draft in `inbox/`. `export --tree` prints the board back the same way — also the fallback for any Claude without the connector.
6. **The shell and the palette** run one grammar: `ls -l`, `mv`, `rm -r`, `touch r1i/NETWORK MAP !fri ^urgent > redraw the hero`, pipes (`grep hero | done`), `tail -f`, `man`. Plain words search; a verb runs; nothing creates without showing the line first.
7. **Tonight** (three at most), **since last time**, the **weekly review** (`what actually happened`), dust and rot, night mode — carried over from today's board into the new home.

## The Wire (what it is, not how it's built)

1. **One home off the PC.** The board lives as one private JSON file in Vercel Blob next to the site, with a version check on every write. No database.
2. **One door for Claude.** A remote MCP connector (`/api/mcp`), added to Claude once, so "vault it" (also "vault this", "put it in the vault", `/vault`) works in any chat, in Cowork and on the phone. Tools: the eleven existing `vault_*` tools plus `vault_push` (a whole tree in one call; matches existing names, so pushing twice updates), `vault_capture` (one line into `inbox/`) and `vault_status` (Tonight, due soon, stuck, rotting). The receipt: `→ r1i/ · NETWORK MAP · 4 subtasks · due Fri`.
3. **vault-agent on the PC** becomes a client of the Wire and keeps `~/.vault/vault.json` as a local backup.
4. **Automatic routes:** Claude Projects map to folders (names are Jake's call, still open); Claude Code hooks mirror task lists into subtasks; a 07:30 morning line and a Sunday review; later, commit messages like `vault:SITE/hero` tick subtasks.
5. **Auth:** OAuth with a single passphrase login; the browser uses the same login. One person, one login — not accounts.
6. **Local-first stays.** The Wire is a switch. Off, nothing leaves the browser.

### Trust rules

1. **Asked writes land** — one undo step, set in mono until Jake touches them.
2. **Automatic writes propose** in `inbox/`: `y` takes, `n` drops.
3. **Claude never deletes or renames Jake's work.** A Claude delete moves the row to `.dusted/`.
4. **Every write is signed** in the trail (Jake or Claude, and when).
5. **Board text is data, never orders.** Nothing in a task title or report is ever executed as an instruction.
6. **No silent overwrite.** A write based on an old version is refused; taking an outside copy snapshots Jake's first and offers `restore mine` (Phase 1, G1).

## The bar

1. **Three ways in.** Every action has a mouse path, a key and a command (`docs/ACTIONS.md`); a test checks the table so none goes missing.
2. **The mouse teaches the keys.** Hover shows what a row can do; right-click lists every action with its key. Nobody needs a key; everyone learns them.
3. **Nothing is scary.** Esc backs out one level, Ctrl+Z undoes anything, and nothing asks "are you sure" except `rm -r` on a folder with things in it.
4. **Speed budget.** Keypress to paint under 50 ms, the pivot at 60 fps on a 1,000-item board, measured on every push.
5. **The first five minutes.** Make a folder, add three tasks, start one, finish one, file a push — timed by an agent each phase, and by Jake on the preview.

Anything that fails the §0 test in `docs/LANGUAGE.md` or the speed budget gets cut, not argued for.

## Positioning

The category standard played straight — the craft of Linear, Things and Height — with unix ideas played straight as the grammar: the directory is the way the tool thinks, not a skin. Character comes from who wrote it (sans vs mono), raw seams (real state, not reassurance) and a voice rationed to one line a screen. No costume.

## Operating Context

- React 19 + Vite 8 + TypeScript, Tailwind v4 in the retiring shell. Model: `src/model`, pure functions with tests.
- Persistence: versioned JSON in `localStorage` (`vault:doc`), snapshots in `vault:backups` (one per 10 minutes, last 30), an unreadable save set aside rather than overwritten, export/import to a `.json` file, two tabs in step, undo/redo for every change.
- `agent/` — vault-agent: file store `~/.vault/vault.json` with a write counter (`rev`), HTTP bridge on :7331 (token and Host check from Phase 1, G3), MCP stdio server, CLI.
- The Wire (Phase 3): `/api/doc` + Vercel Blob + login; `/api/mcp`.
- Live: https://vault-lilac-six.vercel.app (`main` deploys to production). Every pushed branch gets a preview.

## Capabilities and Constraints

**In:** everything under "The surface", "The Wire" and "The bar" above, and the second wave (Phase 4): symlinks for blockers (`ln`), `crontab` in a `cron/` folder, receipts, `ulimit`, rot (grey at two weeks, a `░` edge at four, the review asks to bury at eight), `log` and `blame`, a fourteen-day pulse sparkline in the top bar (`▁▂▅▇▅▂`, one line, not a dashboard), `man` pages.

**Parked, on purpose:**
- A tree-only PWA (after Phase 4).
- Client status pages, assignees, sharing — the team tool Jake chose not to build.
- Folder names for Claude Projects (Jake's call, later).

**Vetoed (still stand):**
- Assignees, avatars, teams, presence, mentions, "shared with".
- Estimates, story points, velocity, burndown, KPI rows.
- **Progress bars.** The one form of progress is the text `2/5` in the `ls -l` progress column and on a card's meta line. It is a count, not a bar, and it never grows a fill, a ring or a percentage.
- Dashboards. The pulse is one line of characters in the top bar.
- A settings app. Settings are commands: `theme`, `ulimit`, `wire`.
- A calendar or month view; month-as-OS; DateBlocks.
- CRDT; a database.
- AI inside the app. VAULT is a dumb, fast ledger; Claude lives outside and writes in.
- Demo fluff: `BUY MILK`, lorem, fake data on a real surface.
- Every dead world in `docs/LANGUAGE.md` §14.

**Overturned at Jake's request (no longer vetoed):** a second input (there is a shell prompt and a Ctrl+K palette, one grammar), pointer-first / no typed commands (now three ways in), FIND that only searches (the palette may run commands, visibly), no backend / accounts / cloud (the Wire, one login, a switch), the five-lane board, "two languages must not share chrome", a PWA ever (parked for after Phase 4).

## Phase status

| Phase | What | State |
| --- | --- | --- |
| 1 (now) | G1 merge, not overwrite · G3 lock the PC bridge · G6 tests that run themselves (CI on every push) · G4 this law · W0 the Wire spike | in progress, on branches; nothing merges to `main` without Jake's yes |
| 2 | The new home, in new files beside the old screen: H1 the tree · H2 pivot and board · H3 the pane · H4 commands · H5 the drop. The old board moves to `/classic` | next |
| 3 | The Wire: W1 home (`/api/doc`, Blob, login) · W2 door (`/api/mcp`, push/capture/status) · W3 board side (the switch, proposals, signed trail), then the skill, Project routes, hooks, the morning line | |
| 4 | Salt: the voice sheet everywhere, the deletion pass (the stylesheet ends smaller), then the second-wave tricks | |

`src/shell/Studio.tsx` (~1,120 lines) and `src/index.css` (~4,430 lines) are retired, not refactored. The old board stays at `/classic` until Jake says kill it.

## Brand Commitments

- Maker: **BAD FORM**. Product: **VAULT**, wordmark `VAULT_`. BLACK LANTERN is dead.
- The light field, one blue, three faces with one job each, characters for icons.
- Voice: lower-case machine, plain about state, one line of attitude per screen, never about lost data. Empty is `_`.
- No customer logos, testimonials or pricing. Don't invent them.

## Evidence on Hand

- Model: `src/model` (types, doc ops, store, shell grammar, brief, report, bridge client). Tests: `npm test`.
- The retiring shell: `src/shell`, `src/index.css`. Browser tests: `e2e/`, `npm run e2e`.
- The approved prototype: branch `proto/pivot`, `src/proto/` (live at https://vault-git-proto-pivot-jake1987king-1642s-projects.vercel.app/proto/).
- vault-agent: `agent/`, its own tests.

## Product Principles

1. One graph, one set of rows, two arrangements. No second model.
2. The tree is home; the board is a lens on it.
3. Three ways in, one grammar. The mouse teaches the keys.
4. Everything storable, everything undoable, nothing scary.
5. Who wrote it shows in the face. Real state over reassurance.
6. Local-first; the Wire is a switch. Claude proposes, Jake disposes.
7. Fast enough to never think about it.

## Accessibility & Inclusion

- Keyboard: every action has a key (`docs/ACTIONS.md`); single keys act only with the tree, board or drawer focused, never in a text field; Esc backs out one level; Ctrl+Z undoes anything. Tab and Shift+Tab are captured by the tree for indent/outdent; Esc then Tab leaves it.
- Contrast is a floor: a word holds 4.5:1 on the ground, the surface and the wash; a meaningful mark holds 3:1; the tint never carries a word (values and ratios in `DESIGN.md`).
- Screen readers get full sentences (`aria-label="Delete SITE REDESIGN"`); the terse voice is for what is drawn.
- `prefers-reduced-motion` holds every animation, the pivot and the caret blink to nothing; the same change arrives instantly.
- Phase 1 (G6) adds an automated accessibility check and a test below 1200px.
