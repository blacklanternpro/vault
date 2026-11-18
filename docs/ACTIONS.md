# VAULT — the action table

Every verb, with its three ways in: a **mouse** path, a **key** and a **command**. Phase 2 builds against this table and a test parses it: an action without all three does not ship, and a feature ships with its row here (see [`AGENTS.md`](../AGENTS.md)). The rules behind it — the focus model, why nothing is scary — are in [`LANGUAGE.md`](LANGUAGE.md) §7; the strings each action prints are in [`VOICE.md`](VOICE.md).

## How to read the table

There is exactly **one** markdown table in this file, below. The parser can rely on:

- The header row is fixed: `id | verb | kind | mouse | key | focus | command | phase | today | undo | notes`.
- One row per action. `id` is kebab-case and stable: tests and code refer to it, so never rename one; retire it with a note instead.
- **kind**: `action` (must have mouse, key and command) or `entry` (a way in itself — the palette, the prompt, the right-click menu; must have mouse and key, command is `—`).
- **key**: one or more keys in backticks, alternatives separated by ` · `. `Shift+`, `Ctrl+`, `Alt+` are written out. `then` means a second step (`m` then pick).
- **focus**: where the key works — `tree`, `board`, `field` (tree, board or drawer), `drawer`, `inbox` (cursor on a row in `inbox/`), `any` (anywhere except a text field), `all` (anywhere), `notice` (a notice is showing).
- **command**: the shell/palette line, in backticks. Capitals are placeholders (`PATH`, `DEST/`, `NAME`). A literal pipe is written `\|`.
- **phase**: when it must work in the new home — `P1` (this phase), `P2`, `P3` (the Wire), `P4` (second wave).
- **today**: what the retiring shell (`src/shell`, kept at `/classic`) already has — `yes` (all three ways), `part` (one or two), `no`.
- **undo**: `y` (one Ctrl+Z takes it back; a batch or pipe is one step), `n` (not undoable — never used for something that changes the board), `-` (changes no board data).
- Conflicts with today's keys, and calls this file makes that the plan didn't, are marked in **notes**; the calls are also listed under "Calls" at the end.

## The table

| id | verb | kind | mouse | key | focus | command | phase | today | undo | notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| cursor-move | move the cursor | action | click a row or card | `j` · `k` · `↓` · `↑` · `g` · `G` · `Home` · `End` | field | `cd PATH` | P2 | part | - | `cd PATH` puts the cursor on PATH; on a folder it also narrows, as today. Board: `j`/`k` stay in the lane. `g`/`G` (call: G4) |
| cursor-lane | cursor to the next lane | action | click a card in another lane | `h` · `l` | board | `cd PATH` | P2 | part | - | today: `vim.ts` h/l, kept |
| fold | fold a row | action | click the row's stem · right-click → fold | `h` · `←` | tree | `fold PATH` | P2 | part | - | on a folded or leaf row, goes to the parent. Today: ← only |
| unfold | unfold a row | action | click the row's stem · right-click → unfold | `l` · `→` | tree | `unfold PATH` | P2 | part | - | on an open row, goes to the first child. Today: → only. Conflict: the prototype used `l` for `ls -l`, now `c` |
| jump-inbox | go to inbox/ | action | click `inbox/` | `i` | field | `cd inbox/` | P2 | no | - | (call: G4) |
| new-folder | new folder | action | click `+ new folder` at the foot of the tree · right-click empty ground → new folder | `N` | field | `mkdir NAME` | P2 | part | y | `N` (call: G4). Today: `mkdir`, ghost row |
| new-task | new task | action | click the `_` ghost row at the end of a folder · hover `+` on a folder · click `_` at the foot of a lane | `+` on a folder · `o` on a task | field | `touch FOLDER/NAME` | P2 | part | y | `o` adds below the cursor at the same level; `+` adds inside. Board: `o` adds a card to the cursor's lane and folder. Conflict: today `o` opens a card on the board (`vim.ts`); Enter now opens |
| new-subtask | new subtask | action | click the `_` ghost row under a task · hover `+` on a task · `_` in the drawer's SUBTASKS | `+` on a task · `o` on a subtask | field | `touch FOLDER/TASK/NAME` | P2 | part | y | today: `+` in the tree, `touch`, drawer add |
| capture | one-line capture | action | type sigils into any new row or the palette's create row | `o` · `+` then type `NAME !fri ^urgent > next` | field | `touch PATH/NAME !DATE ^urgent > NEXT` | P2 | no | y | same grammar from Claude (`vault_capture`). See Grammar |
| rename | rename | action | double-click the title · right-click → rename | `r` · `F2` | field | `rename PATH "NAME"` | P2 | part | y | Conflict: today Enter renames in the tree; Enter now opens. `r` (call: G4) |
| drawer-open | open the drawer / go into it | action | tree: click inside the docked drawer · board: click a card | `Enter` | field | `open PATH` | P2 | part | - | tree: the drawer already previews the cursor row; Enter moves focus into it. Board: slides over the right edge |
| drawer-close | close the drawer / back out | action | click `x` on the drawer · click the tree or an empty lane | `Esc` | drawer | `close` | P2 | part | - | Esc backs out one level (LANGUAGE §7.3) |
| delete | delete a row | action | hover `x` · right-click → delete | `x` · `Delete` · `Backspace` | field | `rm PATH` | P2 | part | y | prints `gone. undo`; never asks. A task with subtasks: `rm -r` in the shell, plain Delete by key. Conflict: today `x` ticks in the tree; tick is now `d` |
| rm-r-folder | delete a folder with things in it | action | hover `x` on a folder · right-click → delete | `x` · `Delete` · `Backspace` on a non-empty folder | field | `rm -r FOLDER` | P2 | part | y | the one confirm: `this takes 14 things with it. sure?` — `y` / `n`, focus on `n`, Esc = `n` |
| move | move into a folder or task | action | drag onto a folder or task | `m` then pick a target | field | `mv PATH DEST/` | P2 | part | y | the picker is a filtered list of folders and tasks; Enter files, Esc cancels. Today: `mv`, lane drag |
| reorder | move above or below a sibling | action | drag above a row | `Alt+↑` · `Alt+↓` | field | `mv PATH --above ROW` | P2 | part | y | today: Alt+↑↓ in the tree. `--above` (call: G4). Board: reorders within the lane |
| indent | indent | action | drag onto the row above it | `Tab` | tree | `mv PATH SIBLING/` | P2 | part | y | today: Tab |
| outdent | outdent | action | drag out onto its folder | `Shift+Tab` | tree | `mv PATH .` | P2 | part | y | today: Shift+Tab, `mv PATH .` |
| dock | dock a loose card back | action | drag the loose card onto its parent card | `m` then pick its parent | field | `mv PATH PARENT/` | P2 | part | y | clears `loose`; the card becomes a subtask line again |
| set-pending | set PENDING | action | drag onto PENDING (rail slot or lane) | `1` | field | `st PATH pending` | P2 | part | y | `mv PATH pending` works too (a bare lane word is a lane). `1` (call: G4) |
| set-rnd | set R&D | action | drag onto R&D | `2` | field | `st PATH rnd` | P2 | part | y | `2` (call: G4) |
| set-active | set ACTIVE | action | drag onto ACTIVE | `3` | field | `st PATH active` | P2 | part | y | the cap is a nudge: a fourth goes in, the head shows `4/3` in red, `no. finish something.` `3` (call: G4) |
| set-done | done (into the chute) | action | drag into the chute or onto the DONE slot | `d` | field | `done PATH` | P2 | part | y | `d` toggles: on a done row it goes back to PENDING (`undone PATH`). Feeds `done today` |
| set-dusted | dust (into .dusted/) | action | drag onto the `.dusted/` slot | `D` | field | `mv PATH dusted` | P2 | part | y | `st PATH dusted` works too. `D` (call: G4). Claude's deletes land here |
| shove | one lane along | action | drag onto the next lane | `Shift+H` · `Shift+L` | field | `st PATH next` | P2 | part | y | order PENDING → R&D → ACTIVE → DONE. Today: `vim.ts` Shift+H/L. `st PATH next` / `prev` (call: G4) |
| tick | tick a subtask | action | click its `[ ]` | `d` | field | `done PATH` | P2 | part | y | `undone PATH` unticks. Conflict: today `x` ticks in the tree; the prototype's `x` ticked too. `x` now deletes everywhere, as on today's board |
| mark | mark rows | action | `Ctrl+click` · `Shift+click` for a range | `Space` · `Shift+↓` · `Shift+↑` · `J` · `K` · `Ctrl+A` | field | `mark PATH` | P2 | no | - | `grep hero \| mark` marks by search. Esc clears marks |
| batch | act on marked rows | action | right-click a marked row → any action | any data key while rows are marked | field | `grep hero \| done` | P2 | no | y | the whole batch is one undo step |
| yank | yank (copy) rows | action | right-click → copy | `y` · `Ctrl+C` | field | `yank PATH` | P2 | no | - | also puts the rows on the clipboard as tree text (the `export --tree` format) |
| put | put yanked rows | action | right-click → paste here | `p` (after the cursor) · `P` (inside it) | field | `put DEST/` | P2 | no | y | lands directly — it's yours. Clipboard text from elsewhere goes to `inbox/` (paste-tree) |
| pivot | tree / board | action | click `tree / board` in the top bar | `v` | field | `pivot` | P2 | no | - | rows morph into cards and back; interruptible; nothing morphs under reduced motion |
| find | find / grep | action | click the find field | `/` | any | `grep WORD` | P2 | part | - | narrows the tree and the board. Filters: `p:FOLDER` `s:LANE` `^` (urgent) `!late` `!week`. Conflict: today `!` means urgent in the palette; urgent is now `^`, `!` is due |
| palette | the palette | entry | click the find field | `Ctrl+K` | all | — | P2 | part | - | the same grammar as the prompt; `>` or a verb + space runs a command |
| prompt | the shell prompt | entry | click the `$` on the status line | `:` | any | — | P2 | part | - | `:` (call: G4). Tab completes a path, ↑↓ recall |
| context-menu | the right-click menu | entry | right-click a row, card or empty ground | `Shift+F10` · `ContextMenu` | field | — | P2 | no | - | lists every action for that row with its key |
| undo | undo | action | click `undo` on the status line · ⋯ → undo | `Ctrl+Z` · `u` | any | `undo` | P2 | part | - | in a text field Ctrl+Z is the field's own undo. `u` (call: G4) |
| redo | redo | action | ⋯ → redo | `Ctrl+Shift+Z` · `Ctrl+Y` | any | `redo` | P2 | part | - | today: Ctrl+Shift+Z, Ctrl+Y, ⋯ menu |
| set-due | set or clear a due date | action | click the due column · drawer due field | `!` then type a date | field | `due PATH fri` | P2 | part | y | `due PATH -` clears. Dates: see Grammar |
| set-urgent | toggle urgent | action | right-click → urgent · drawer `^` | `^` | field | `urgent PATH` | P2 | part | y | today: `urgent`, drawer flag |
| set-next | set the next action | action | drawer NEXT field | `>` then type | field | `next PATH "TEXT"` | P2 | part | y | today: drawer only |
| left-off | set the left-off note | action | drawer LEFT OFF field · answer `where did you get to?` | `<` then type | field | `leftoff PATH "TEXT"` | P2 | part | y | today: asked on close after ten minutes, kept |
| link | add a link | action | drawer LINKS `+` | `@` then paste | field | `link PATH URL [LABEL]` | P2 | part | y | remove: `x` on the link line in the drawer |
| brief | copy the task as a brief | action | drawer HANDOFF → copy as brief | `B` | field | `brief PATH` | P2 | part | - | `brief -o PATH` downloads `.md`. Format unchanged (`src/model/brief.ts`) |
| report | paste a report | action | drawer HANDOFF → paste report | `R` | field | `report PATH` | P2 | part | y | shows the plan before applying; one undo step |
| clock | start / stop the session clock | action | drawer HANDOFF → start / stop | `s` | field | `clock PATH` | P2 | part | y | `clock stop` stops whichever runs. Stopping adds to `spent` |
| timesheet | time this month | action | ⋯ → time | `T` | any | `time [MONTH]` | P2 | part | - | today: ⋯ → time this month. `T` (call: G4) |
| tonight | on / off Tonight | action | drag onto `tonight/` · drawer pennant | `t` | field | `tonight PATH` | P2 | part | y | three at most (a hard limit). Pipe sink: `ls -u \| tonight` |
| review | weekly review | action | ⋯ → review · `open` on the Sunday line | `W` | any | `review` | P2 | part | - | heading `what actually happened` |
| paste-tree | paste a tree | action | top bar `paste a tree` · right-click a folder → paste a tree here | `Ctrl+V` | any | `paste` | P2 | no | y | any indented list, checklist or `tree` output becomes a draft in `inbox/` |
| file-draft | file a draft | action | drag the draft's head row onto a folder or `+ new folder` | `m` on the draft's head then pick | inbox | `mv inbox/NAME DEST/` | P2 | no | y | filed rows type in once and stay mono until touched |
| discard-draft | discard a draft | action | `x` on the draft's head row | `x` | inbox | `rm inbox/NAME` | P2 | no | y | `draft dropped. undo` |
| file-line | file a captured line | action | drag the line onto a folder or task | `m` then pick | inbox | `mv inbox/LINE DEST/` | P2 | part | y | onto a folder it becomes a task, onto a task a subtask. Replaces today's note hitch (call: G4) |
| take | take a proposal | action | `y` on the proposal row | `y` | inbox | `take ID` | P2 | part | y | `take all`. Conflict: elsewhere `y` yanks; on a proposal it takes |
| drop | drop a proposal | action | `n` on the proposal row | `n` | inbox | `drop ID` | P2 | part | y | today: dismiss on the report banner |
| export-tree | print the board as a tree | action | ⋯ → export --tree · right-click a folder → copy as tree | `E` | any | `export --tree [PATH]` | P2 | no | - | copies the same format paste-tree reads |
| export-file | export to a file | action | ⋯ → export | `Ctrl+S` | all | `export` | P2 | part | - | `vault-YYYY-MM-DD.json` |
| import-file | import a file | action | ⋯ → import | `Ctrl+O` | all | `import` | P2 | part | y | VAULT export or SPECK save |
| snapshots | restore a snapshot | action | ⋯ → snapshots | `S` | any | `snapshots` | P2 | part | y | `restore N` restores the Nth listed |
| ls-l | toggle the ls -l columns | action | top bar `ls -l` | `c` | field | `ls -l` | P2 | no | - | Conflict: the prototype used `l`. `c` (call: G4) |
| ls-a | show .dusted/ | action | top bar `ls -a` · click a `.dusted/` row | `a` | field | `ls -a` | P2 | no | - | from the prototype |
| pipe | run a pipe | action | mark rows, then right-click → action | `Space` to mark, then any action key | field | `find -stale \| mv dusted` | P2 | no | y | one undo step. Sources and sinks: see Grammar |
| tail-f | the live write strip | action | click `tail -f` on the status line | `F` | any | `tail -f` | P2 | no | - | shows Jake's and Claude's writes as they land. `F` (call: G4) |
| ulimit | set the ACTIVE cap | action | click `n/3` on the ACTIVE head or rail slot | `=` then a number | field | `ulimit active 3` | P4 | no | y | `ulimit active 0` turns it off. The cap itself (3, a nudge) ships in P2. `=` (call: G4) |
| theme | night / day | action | ⋯ → night | `I` | any | `theme night` | P2 | part | - | `theme day`, `theme auto`. `I` = invert (call: G4) |
| help | keys and man pages | action | click `?` in the top bar · right-click → man | `?` | any | `man VERB` | P2 | part | - | `help` lists verbs; `man vault` is the whole sheet |
| wire | the Wire / bridge switch | action | ⋯ → wire · click the wire state in the top bar | `w` | any | `wire on` | P3 | part | - | `wire off`, `wire status`. `w` opens the panel; the switch is in it, never a bare toggle. Until P3 the same switch is the local bridge (`bridge on`). `w` (call: G4) |
| restore-mine | restore mine | action | click `restore mine` in the notice | `M` | notice | `restore mine` | P1 | no | y | after a merge or an adopted outside copy (G1). `M` (call: G4) |
| link-blocker | wait on another task | action | `Alt`+drag a task onto the task it waits on | `b` then pick the blocker | field | `ln PATH BLOCKER` | P4 | no | y | tree shows `->`; ticking the blocker wakes the waiter. `b` (call: G4) |
| log | the trail as a log | action | drawer TRAIL → show all | `e` | field | `log [PATH]` | P4 | part | - | `blame PATH` adds who (Jake or Claude) per line. `e` (call: G4) |
| receipt | print a receipt | action | right-click a folder → receipt | `$` | field | `receipt PATH [MONTH]` | P4 | no | - | plain text: what got done, hours, dates. `$` (call: G4) |

## Focus rules

The same rules as `LANGUAGE.md` §7.2, restated for builders:

1. **Field focus** (tree, board or drawer has focus; no text field is focused): single keys act on the cursor row, or on every marked row when any are marked.
2. **Tree vs board:** identical keys on identical rows. Only `h`/`l` differ (tree: fold and parent/child; board: cross lanes). Tree-only actions (indent, outdent, fold) on the board print `tree only. v` and change nothing.
3. **Drawer:** a subtask in the drawer is a row; keys act on the focused line. With focus on the drawer's head, keys act on its task. Esc returns focus to the row in the tree or the card on the board.
4. **inbox:** with the cursor on a proposal, `y` takes and `n` drops; on a draft's head, `x` discards and `m` files. Everywhere else `y` yanks and `n` does nothing.
5. **Text field:** only the field's keys. Enter commits; Esc leaves keeping what was typed (an empty new row is dropped); Ctrl+Z is the field's own undo. Ctrl+K, Ctrl+S and Ctrl+O still work.
6. **Menu or sheet:** ↑↓ or `j`/`k` move, Enter picks, Esc closes. The one confirm starts on `n`.
7. **any:** `/`, `:`, `?`, `Ctrl+V` (paste a tree), `u`, `T`, `W`, `E`, `S`, `F`, `I`, `w` work whenever no text field has focus. Of these only `u` and `Ctrl+V` change data, and both are undoable.
8. **Esc** backs out one level: confirm or menu → text field → drawer → marks → find/filter → cursor.
9. A key that changes data never fires from a text field and never asks, except `rm -r` on a non-empty folder.

## Grammar (the shell and the palette)

One grammar, two inputs: the prompt (`:` or click `$`) and the palette (`Ctrl+K` or `/`). Claude's `vault_capture` lines use the same grammar.

### What a line is

```
>LINE  or  :LINE         always a command
VERB ARGS                a command (a known verb followed by a space)
SOURCE | SINK [| SINK]   a pipe
p:FOLDER s:LANE ^ !late  filters (narrow the tree and the board)
anything else            search words
```

- Plain words **search**. They never create on their own.
- When search words match nothing, the palette's only row is `+ touch HERE/WORDS`, spelled out; Enter runs exactly that line and Ctrl+Z takes it back. When anything matches, a match is the default row, never the create row.
- The row under the input always shows the exact line Enter will run.
- Every line ends with an exit code on the status line: `0` done, `1` refused, `127` not a verb (call: G4).

### Paths

`folder/TASK/subtask`. Each segment is a case-insensitive prefix of a name, spaces and punctuation ignored; a unique prefix wins, an ambiguous one is refused with the candidates. `.` here, `..` up, `~` or `/` the top. A relative path that finds nothing under the working folder is tried from the top. Tab completes. (Unchanged from `src/model/shell.ts`.)

### Verbs

Today (`src/model/shell.ts`, keep): `ls cd touch mkdir mv rm done undone st urgent rename open pwd help clear`.
Phase 2 adds: `fold unfold close mark yank put pivot grep find due next leftoff link brief report clock time tonight review paste export import snapshots restore take drop tail man undo redo theme`.
Later: `wire bridge` (P3), `ulimit ln log blame receipt crontab` (P4).

- `mv PATH DEST/` — a destination ending in `/` is always a folder or task. A bare lane word (`pending rnd r&d active done dusted .dusted`) is a lane. `mv PATH .` outdents. `mv PATH --above ROW` reorders.
- `rm PATH` refuses a row with children (`has 4 inside. rm -r takes them too`); `rm -r` on a task doesn't ask; `rm -r` on a non-empty folder asks once.
- Claude's writes go through the same verbs, with two limits: Claude never renames or deletes Jake's rows, and a Claude `rm` moves the row to `.dusted/`.

### One-line capture

```
touch r1i/NETWORK MAP !fri ^urgent > redraw the hero
```

- `!DATE` sets the due date. `^urgent` (or a bare `^`) flags urgent. `> TEXT` sets the next action and runs to the end of the line, so it comes last. `!` and `^` may come in any order before it.
- The same sigils work in the tree's inline new row and in the palette's create row.
- **Dates:** `today`, `tmrw` (`tomorrow`), `mon`…`sun` (the next one; today's weekday means a week from today), `+3d`, `+2w`, `2026-12-05`. Short numeric dates (`5/12`, `12.05`) are refused — `not a date. try fri, tmrw, +3d, 2026-12-05` — because day-month and month-day collide (call: G4).

### Pipes

```
find -stale | mv dusted
grep hero | done
ls -u | tonight
grep hero | mark
```

- **Sources:** `ls [PATH] [-l] [-a] [-u]` (`-u`: by last touched, most recent first), `grep WORD` (titles, subtasks, descriptions), `find [PATH] [-stale] [-late] [-due 7d] [-done] [-claude]` (`-stale`: untouched two weeks), `cat inbox/`.
- **Sinks:** `mv DEST`, `st LANE`, `done`, `undone`, `urgent`, `due DATE`, `tonight`, `mark`, `rm`, `head -N`.
- A pipe is one undo step and prints `N rows`. A pipe that matches nothing changes nothing and says so.

### Paste a tree / export --tree

What `paste` reads and `export --tree` prints: an indented list (tabs or spaces), `-`/`*`/numbered bullets, `[ ]`/`[x]` ticks, or `tree` output with box-drawing stems. Top level becomes tasks, deeper lines subtasks; a single top line ending in `/` names the folder. (Parser: `src/proto/draft.ts` on `proto/pivot`, moving into `src/model` in Phase 2.)

## Calls (made in this file, for Jake to see)

Keys the plan left open: `g`/`G`, `i`, `N`, `o`, `r`, `1` `2` `3`, `D`, `T`, `st PATH next/prev`, `u`, `:`, `c`, `F`, `=`, `I`, `w`, `M`, `b`, `e`, `$`, `mv --above`, the exit codes, refusing short numeric dates, filing a line replacing the note hitch.
Conflicts resolved against today's keys: Enter opens (was rename in the tree), `o` adds a row (was open on the board), `x` deletes everywhere (was tick in the tree), `d` ticks and finishes (was `x`), urgent's sigil is `^` (the palette used `!`), `ls -l` is `c` (the prototype used `l`).
