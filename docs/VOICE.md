# VAULT — the voice sheet

Every string VAULT shows, so every agent writes the same way. The rules come from [`LANGUAGE.md`](LANGUAGE.md) §8; the actions that produce these strings are in [`ACTIONS.md`](ACTIONS.md).

If you need a string that isn't here, write it by these rules and add its row in the same commit.

---

## 1. Principles

1. **Lower-case machine voice.** `saved 21:14`, not "Saved at 9:14 PM". Caps are for names (`SITE REDESIGN`, `ACTIVE`), never for sentences.
2. **Plain honesty about state.** Say what is true and measurable — the time, the count, the size, the rev. No reassurance ("All good!"), no hedging ("Something went wrong").
3. **Rationed irreverence.** At most **one** line with attitude on screen at a time. The canonical lines in §2 are the budget; don't add jokes.
4. **Never joke about lost or at-risk data.** Save failures, refused writes, conflicts, imports, restores, token problems: flat, exact, with the way out. No `gone.` flourish, no `not a thing.`, no wit.
5. **No exclamation marks. No emoji. No "AI" talk.** Claude is named `claude`, in mono, as the author of a row. Never "AI", "assistant", "magic", "smart", "✨", "generated".
6. **Echo, then say.** A message about a change starts with the machine's echo of what ran (mono), then the short word: `rm SITE REDESIGN · gone. undo`.
7. **Counts, not prose.** `4/3`, `3 unpushed`, `9 lines`. Not "You have 4 tasks".
8. **Empty is `_`.** Never "Nothing here yet", never an apology, never a tutorial in an empty state.
9. **Short.** One line. If it needs two, the second is a link-word (`undo`, `show`, `restore mine`, `export now`).
10. **Actions inside messages are bare words** in the accent: `undo`, `show`, `open`, `restore mine`, `y` `n`. Not buttons that say "Click here".

**Where strings appear**

| Place | What goes there | Face |
| --- | --- | --- |
| status line | the last thing that happened; shell output; exit code | mono, ink-2; exit code ink-3 |
| row | inline marks and columns (`3d late`, `← claude`, `left to rot since 2 Oct`) | mono |
| lane head / rail slot | counts (`4/3`, `today 3`) | mono |
| notice | sticky, data-related, needs an answer (`not saved…`, `restore mine`) | sans, ink |
| sheet | `?`, `man`, weekly review, snapshots | heading mono, body sans |
| confirm | the one question (`rm -r`) | mono |
| menu | `vault.json · 184 KB`, labels | sans; values mono |

The status line keeps one message at a time; a newer one replaces it. A message carrying `undo` stays until the next action or 8 s, whichever is later *(call: G4)*. A notice about data stays until answered.

---

## 2. Canonical lines (from the plan — use exactly)

| id | String | When | Where |
| --- | --- | --- | --- |
| empty | `_` | an empty lane, folder count, Tonight slot, search with nothing | lane, row, slot |
| deleted | `gone. undo` | a task, subtask, empty folder, note, draft or batch is deleted | status line, after the echo |
| overdue | `3d late` | due date passed, not done (`1d late`, `12d late`) | `ls -l` due column, card meta |
| active-full | `no. finish something.` | a card goes into ACTIVE past the cap; the head shows `4/3` in red | status line |
| unknown-command | `not a thing.` | the shell or palette gets a verb it doesn't know | status line, prompt output |
| rm-r | `this takes 14 things with it. sure?` | `rm -r` / Delete on a folder with things in it (14 = every row inside) | the one confirm; answers `y` `n` |
| review-heading | `what actually happened` | the weekly review sheet | sheet heading |
| rot | `left to rot since 2 Oct` | a row untouched for four weeks | row, card meta, review |

`not a thing.` is only for an unknown verb. It is never used for a bad file, a bad paste or anything about data.

---

## 3. Full table — every message class

`Was` is today's string in the retiring shell (`src/shell`, `src/model`), where there is one. Phase 2 replaces it with `Now`.

### 3.1 State (raw seams)

| id | Now | When | Where | Was |
| --- | --- | --- | --- | --- |
| saved | `saved 21:14` | after every save to this browser | top bar, right | `saved · 2s ago` (`Saved.tsx`) |
| saving | `saving` | a write is in flight longer than 300 ms | top bar | — |
| unpushed | `3 unpushed` | the Wire is on and local changes haven't reached it | top bar, beside `saved` | — |
| size | `vault.json · 184 KB` | always | ⋯ menu, first line | — |
| rev | `rev 41` | Wire on | ⋯ menu, beside size | — |
| done-today | `done today 3` | always (`_` at zero is wrong here: show `0`) | top bar, chute | `done today` (proto) |
| done-all | `112 all time` | board arrangement | under the chute | `N all time` (proto) |
| cap | `2/3` · `4/3` (red) | ACTIVE head and rail slot | lane head, rail | — |
| exit-code | `0` · `1` · `127` | after every shell or palette line (`127` = unknown verb) | status line, right edge, ink-3 *(call: G4)* | — |
| pulse | `▁▂▅▇▅▂` | fourteen days of ticks (Phase 4) | top bar | — |

### 3.2 Edits (echo · word)

| id | Now | When | Where | Was |
| --- | --- | --- | --- | --- |
| delete | `rm SITE REDESIGN · gone. undo` | delete one row | status line | `Deleted “SITE REDESIGN” and 4 inside` + Undo |
| delete-inside | `rm -r SITE REDESIGN (+4) · gone. undo` | a task with subtasks | status line | same |
| delete-batch | `rm 6 rows · gone. undo` | marked rows or a pipe | status line | — |
| note-delete | `rm note · gone. undo` | a line in `inbox/` | status line | `Note removed` + Undo |
| undo | `undone: rm SITE REDESIGN` | Ctrl+Z | status line | `Undone` |
| redo | `redone: rm SITE REDESIGN` | Ctrl+Shift+Z / Ctrl+Y | status line | `Redone` |
| nothing-to-undo | `nothing to undo.` | Ctrl+Z on an empty stack | status line | — |
| make | `mkdir r1i/` · `touch r1i/NETWORK MAP` | a row is created | status line | `made r1i/` · `created X in r1i/` |
| rename | `rename NAV → NAV RESTRUCTURE` | rename | status line | `renamed X → Y` |
| move | `mv NETWORK MAP → r1i/` | moved into a folder or task | status line | `moved X → Y` |
| move-above | `mv NETWORK MAP ↑ above HERO` | dropped above a row | status line | (proto) |
| status | `NETWORK MAP → ACTIVE` | status set | status line | `X → ACTIVE` |
| done | `done. NETWORK MAP ↓` | into the chute | status line | (proto) |
| undone | `undone NETWORK MAP → PENDING` | `d` on a done row | status line | `undone X` |
| dust | `NETWORK MAP → .dusted/` | dusted | status line | (proto) |
| pull | `NETWORK MAP → R&D · own card now` | a subtask sent to a lane | status line | (proto: "pulled out as its own card") |
| tick | `[x] wireframes` · `[ ] wireframes` | tick / untick | status line | — |
| urgent | `^ NETWORK MAP` · `no ^ NETWORK MAP` | toggle urgent | status line | `X is urgent` / `no longer urgent` |
| due | `NETWORK MAP !fri` · `no due` | set / clear due | status line | — |
| next | `NETWORK MAP > redraw the hero` | next action set | status line | — |
| left-off-ask | `where did you get to?` | drawer closed after ten minutes open | drawer foot | `Where did you get to?` |
| tonight | `→ tonight 2/3` | put on Tonight | status line | — |
| tonight-full | `tonight holds three. drop one first.` | a fourth onto Tonight (a hard limit, unlike ACTIVE) | status line | `Tonight holds three. Finish or drop one first.` |
| filter-cleared | `cleared p:homepage to show it` | a new row would be hidden by a filter | status line | `Cleared the project filter so you can see the new task` |
| batch | `grep hero | done · 4 rows · undo` | a pipe or batch ran | status line | — |
| yank | `yanked 5 rows` | `y` | status line | — |
| put | `put 5 rows → r1i/` | `p` / `P` | status line | — |
| ulimit | `ulimit active 3` · `ulimit active 0 · no cap` | `ulimit` | status line | — |
| theme | `night.` · `day.` · `theme follows the system` | `I` / `theme` | status line | — |

### 3.3 Shell and palette

| id | Now | When | Where | Was |
| --- | --- | --- | --- | --- |
| unknown | `frob: not a thing.` | unknown verb | prompt output | `unknown command "frob"; try help` |
| no-path | `wiref: no such row` | a path segment matches nothing | prompt output | `no such path: wiref` |
| ambiguous | `si: which one? SITE REDESIGN, SIGNAGE` | a prefix matches several | prompt output | `ambiguous "si": …` |
| needs-r | `SITE REDESIGN has 4 inside. rm -r takes them too` | `rm` on a row with children | prompt output | `X has 4 children; use rm -r` |
| into-itself | `can't move SITE REDESIGN into itself` | mv into own subtree | prompt output | `cannot move X into itself` |
| already | `NETWORK MAP is already in r1i/` | mv to where it is | prompt output | same idea |
| usage | `usage: mv path dest/` | a verb with missing arguments | prompt output | `mv path dest/ — or …` |
| bad-date | `!13.05: not a date. try fri, tmrw, +3d, 2026-12-05` | capture or `due` can't read a date | prompt output | — |
| bad-lane | `which lane? pending, rnd, active, done, dusted` | `st` with no or bad lane | prompt output | same |
| create-row | `+ touch r1i/NETWORK MAP` | palette words match nothing | palette's only row | — |
| search-count | `4 rows` | palette words match | palette, right | `N tasks` |
| pipe-empty | `grep zz | done · 0 rows. nothing changed` | a pipe source matched nothing | status line | — |
| man | see §5 | `man VERB`, `?` | sheet | `Keyboard shortcuts` sheet |

### 3.4 Arrivals: pushes, drafts, inbox, receipts

| id | Now | When | Where |
| --- | --- | --- | --- |
| claude-marker | `← claude` | a row Claude wrote and Jake hasn't touched | row end, card meta (accent-deep) |
| push-landed | `← claude pushed 4 rows → r1i/` | an asked write lands (rows type in) | status line |
| receipt | `→ r1i/ · NETWORK MAP · 4 subtasks · due Fri` | what "vault it" answers in the chat, and the trail line for the push | Claude's reply; trail (mono) |
| proposal | `← claude · tick "wireframes" in SITE REDESIGN · y n` | an automatic write waits in `inbox/` | `inbox/` row |
| proposal-report | `← claude · report for SITE REDESIGN: 2 ticked, 1 added · y n` | a report arrives | `inbox/` row (was `1 report waiting for X — Review`) |
| take | `took it: [x] wireframes` | `y` on a proposal | status line |
| drop-proposal | `dropped. undo` | `n` on a proposal | status line |
| take-all | `took 5 proposals` | `take all` | status line |
| pasted | `pasted a tree → inbox/ · 9 lines` | Ctrl+V of a tree, or the paste panel | status line |
| draft-pushed | `← claude pushed a draft → inbox/ · 9 lines` | `vault_push` to an unknown place, or a paste from a chat | status line |
| filed | `filed 9 rows → r1i/ · undo` | a draft dragged or `m`'d onto a folder | status line |
| draft-dropped | `draft dropped. undo` | `x` / discard on a draft | status line |
| not-a-tree | `can't read that as a tree. nothing changed.` | paste that isn't a list | status line |
| draft-meta | `3 tasks · 9 lines · drag onto a folder` | a draft's head row | `inbox/` |
| report-applied | `report: 2 ticked, 1 added · undo` | a report applied | status line (keeps `report.ts` summary) |
| report-empty | `report: nothing to apply` | a report that matched nothing | status line |

### 3.5 Sync: the local bridge (Phase 1) and the Wire (Phase 3) — data: plain, no jokes

**Phase 1 — the local bridge (what ships now, G1 + G3).** The bridge can't tell who wrote a change, so every string names `vault-agent`, never `claude`, and an outside copy that isn't merged goes to **snapshots**, not `inbox/`. These are the strings in `src/model/sync.ts` (`adoptMessage`), `src/shell/useBridge.ts` and `agent/src/http.ts`; keep them in step.

| id | Now | When | Where | Was |
| --- | --- | --- | --- | --- |
| bridge-on | `bridge on · localhost:7331` | the local helper answers | status line | `Agent bridge connected` |
| bridge-offline | `bridge offline · working locally` | the local helper stopped answering | status line | `Agent bridge isn't answering; working locally` |
| token-saved | `bridge token saved` · `bridge token saved. turn the bridge on in the menu to connect` | the app read `#bridge-token=` from the link | status line | — |
| token-missing | `bridge refused: no token. run vault-agent token (or serve) for the link` | 401 with no stored token | notice | — |
| token-wrong | `bridge refused: wrong token. run vault-agent token (or serve) for the link` | 401 with a stored token | notice | — |
| token-server | `missing or wrong bridge token. Run vault-agent token on this PC and open the link it prints …` | the helper's own 401 body (for scripts and curl, not the app) | HTTP response | — |
| merged | `merged 3 changes from vault-agent (rev 41) · restore mine` | both sides changed, and the merge needed no choice | notice | `An agent changed the board first; took their version` |
| merged-back | `merged 3 changes from vault-agent (rev 41) · 1 you deleted came back · restore mine` | the merge kept a row you deleted because the agent changed it | notice | — |
| conflict | `you and vault-agent both changed NETWORK MAP. kept yours; theirs is in snapshots · restore mine` (`… and 2 more` when several) | the same field changed on both sides; yours wins, theirs is snapshotted | notice | — |
| took-theirs | `took vault-agent's copy (rev 41). yours is in snapshots · restore mine` | you changed nothing locally since the last agreed copy (or, on first contact, this tab had nothing saved), so theirs is taken whole after a snapshot | notice | — |
| restored-mine | `restored yours (21:12). theirs is in snapshots` | `restore mine` | status line | — |
| undid-adoption | `undid vault-agent's change · redo` | an undo that crosses an adopted outside copy (G1, landing) | notice | — |
| stale-refused | `write refused: rev 41 is newer. merging` | a 409 from a versioned write | status line, transient | — |

The app strings say `token (or serve)` because both `vault-agent token` and `vault-agent serve` print the link that hands the app its token. *(The app's current text names only `serve`; G1/G3 should align it to the strings above.)*

**Phase 3 — the Wire (target).** The Wire signs every write, so it does know who wrote: these strings name `claude`, and a clash goes to `inbox/` as a proposal instead of snapshots.

| id | Now | When | Where | Was |
| --- | --- | --- | --- | --- |
| wire-off | `wire off · local only` | the switch is off | ⋯ menu, `w` panel | — |
| wire-on | `wire on · synced 21:14` | connected and in step | top bar (replaces `saved`) | — |
| wire-offline | `wire offline · 3 unpushed · working locally` | can't reach it | top bar | — |
| wire-login | `wire: logged out. log in to sync` | the login expired | notice | — |
| wire-merged | `merged 3 changes from claude (rev 41) · restore mine` | both sides changed, no clash | notice | — |
| wire-conflict | `you and claude both changed NETWORK MAP. kept yours; theirs is in inbox/` | the same field changed on both sides | notice; theirs waits in `inbox/` as a proposal (`y` `n`) | — |

### 3.6 Files, snapshots, errors (data: plain, no jokes)

| id | Now | When | Where | Was |
| --- | --- | --- | --- | --- |
| save-failed | `not saved: this browser refused the write. export now` | `localStorage` write failed | notice, sticky | `VAULT couldn't save your last change to this browser.` |
| unreadable | `the saved board couldn't be read. set aside as vault:unreadable:…; loaded the 21:04 snapshot` | load found a broken save | notice, sticky | — |
| exported | `wrote vault-2026-11-18.json · 184 KB` | export | status line | `Exported vault-….json` |
| imported | `read board.json · 212 rows · undo puts yours back` | import | status line | `Imported N items from file` |
| import-bad | `board.json isn't a VAULT export or a SPECK save. nothing changed.` | import of a bad file | status line | `That file isn't a VAULT export or an old SPECK save.` |
| snapshot-restored | `restored the 21:04 14 Nov snapshot · undo puts the newer one back` | snapshot restore | status line | `Restored the snapshot from …` |
| snapshots-head | `snapshots · one per 10 min · last 30` | the snapshot list | sheet heading | `Restore a snapshot` |
| tree-copied | `copied the tree · 42 lines` | `export --tree` / `E` | status line | — |
| brief-copied | `brief copied · 24 lines` | `B` / copy as brief | status line | `Brief copied (24 lines)` |
| brief-written | `wrote site-redesign-brief.md` | brief download | status line | `Downloaded …` |
| no-clipboard | `no clipboard access. download .md instead` | clipboard refused | status line | `Couldn't reach the clipboard` |
| clock-on | `clock on SITE REDESIGN` | session start | status line | `Session started on X` |
| clock-off | `+1h 02m → SITE REDESIGN · undo` | session stop | status line | `1h 02m logged to X` |
| clock-running | `SITE REDESIGN · 0:42:10` | while a session runs | top bar | `Session on X, …` |

### 3.7 Review, rot, notices

| id | Now | When | Where | Was |
| --- | --- | --- | --- | --- |
| review-offer | `sunday. review the week? open` | first open on a Sunday | status line | `Sunday. Weekly review?` + Open |
| review-sections | `DONE THIS WEEK` · `STUCK` · `DUE NEXT 7 DAYS` · `ROTTING` | review sheet | plaques | `Done this week` · `Stuck` · `Due next 7 days` |
| since | `since 14 Nov: 4 moved, 2 done · show` | first open after a gap | status line | `Since last time (3 days): …` |
| grey | `untouched 15d` | two weeks (tooltip only) | row hover | `Untouched for 15 days` |
| bury | `left to rot since 2 Oct. bury it? y n` | eight weeks, in the review (Phase 4) | review sheet | — |
| tonight-empty | `_` | an empty Tonight slot | `tonight/` | `_ t on a card, or drop one here` |
| late-today | `today` · `tmrw` · `fri` · `21 Nov` | due column words: weekday within a week, else day and month as in `left to rot since 2 Oct` (never MM.DD) *(call: G4)* | due column, card | `Fri 7 Nov` / `11.20` |

---

## 4. Labels and controls

| Thing | Label | Was |
| --- | --- | --- |
| view switch | `tree / board` with `v` | `tree ⇄ board` (proto) |
| columns | `ls -l` | `ls -l` |
| show dust | `ls -a` | `ls -a` |
| paste | `paste a tree` | `paste a tree` |
| new folder ghost | `+ new folder` | `new project` |
| ghost row | `_` | `new task` / `New job` / `Add subtask` |
| find field placeholder | `find, or : a command` | `Search, or > a command, or p: s: ! to filter` |
| prompt | `$` | `$` |
| help | `?` → sheet titled `man vault` | `Keyboard shortcuts` |
| drawer sections | `NEXT` · `LEFT OFF` · `DESCRIPTION` · `SUBTASKS` · `LINKS` · `HANDOFF` · `TRAIL` | `Description` · `Subtasks` · `Links` · `Handoff` · `Trail` |
| confirm answers | `y` · `n` | — |
| proposal answers | `y` · `n` | `Apply` · `Dismiss` |
| ⋯ menu items | lower-case verbs: `export`, `import`, `snapshots`, `review`, `night`, `wire`, `man` | `Export to file…`, `Night mode`, `Local agent bridge`, … |

Accessible names (`aria-label`) stay full English sentences in sentence case (`Delete SITE REDESIGN`). The terse voice is for what is drawn, not for what a screen reader says.

---

## 5. Man-page tone

`?` opens `man vault`; `man VERB` opens one page. Same sheet, mono headings, sans body.

```
MV(1)

NAME
    mv — move a row

SYNOPSIS
    mv PATH DEST/          into a folder or task
    mv PATH LANE           set its status (pending rnd active done dusted)
    mv PATH .              outdent one level
    mv PATH --above ROW    reorder

KEYS
    m, then pick a target · drag onto a folder, above a row, or onto the rail

EXAMPLES
    mv r1i/net hero/
    grep hero | mv dusted

SEE ALSO
    rm, st, ls
```

1. Sections: `NAME`, `SYNOPSIS`, `KEYS`, `EXAMPLES`, `SEE ALSO`. Nothing else.
2. One line per form. No paragraphs. Examples are real lines that run.
3. Every page lists the mouse and the key, so the man page teaches all three ways in.
