# vault

VAULT WORLDWIDE — BAD FORM's personal project manager. A five-lane board of tasks, a detail drawer that slides in from the right, and a live-linked ASCII directory of every project, task and subtask that you can edit directly. Local-first: no backend, no account.

Product truth: [`PRODUCT.md`](PRODUCT.md) · design language: [`docs/LANGUAGE.md`](docs/LANGUAGE.md) · measured system: [`DESIGN.md`](DESIGN.md).

## Using it

**Board.** Each task is a card, and the lane it sits in is its status: PENDING · R&D · ACTIVE · DONE · DUSTED.
- Click a card to open it. Drag it, or use the hover arrow, to move it along.
- Cards show their project, subtask progress (`2/5`) and URGENT.
- With a card focused: Enter opens it, F2 renames it, Delete deletes it (with Undo).

**Drawer.** Status picker, urgent flag, delete, title, description and subtasks.
- Enter in a subtask adds the next one.
- Drag a subtask onto a lane to give it its own card, still cabled to its parent. Drop it back on the parent to dock it.

**Directory.** The whole graph as a unix tree:

```
homepage/
├── SITE REDESIGN                         ACTIVE
│   ├── [x] Review current homepage analytics
│   └── [ ] Create wireframes
└── NAV RESTRUCTURE                       PENDING
```

It's an editing surface, and every change shows on the board immediately.

| Key (tree focused) | Does |
| --- | --- |
| ↑ ↓ / Home End | move |
| ← → | fold / unfold, or go to parent / first child |
| Enter · F2 · double-click | rename |
| `+` | add inside (Enter for another, Esc to stop) |
| Tab / Shift+Tab | indent / outdent |
| Alt+↑ ↓ | reorder among siblings |
| `x` | tick a subtask |
| `t` | put the row's card on tonight's shelf, or take it off |
| Delete | delete (Undo in the toast, or Ctrl+Z) |

**Everywhere.**
- Ctrl+K focuses search. Search covers titles, subtasks and descriptions, and narrows both the board and the tree.
- Ctrl+Z and Ctrl+Shift+Z undo and redo anything.
- Esc closes the current draft, edit or drawer.
- No single key changes data unless a card or the tree has focus.

## For agents

VAULT is the ledger between the desk and the agents it hands work to. A task goes out as a **brief**, comes back as a **report**, and the **session clock** runs in between. Open a task to find all three in the drawer, under `LINKS` and `HANDOFF`.

**Links.** `Add link` takes a URL and an optional label (the host by default). Chips open in a new tab and carry a mark for what they point at — repo (`github.com`), deploy (`vercel.app`), design (`figma.com`), mail (`mail.google.com`, Outlook), doc (`docs.google.com`, `notion.so`). Pasting a URL into the description offers it as a link. A card shows how many it carries.

**Brief (out).** `Copy as brief` puts the task on the clipboard as markdown; `Download .md` saves it as `<task-slug>-brief.md`; ⋯ → `Copy brief for selected` does the same for the selected card. The headings are fixed:

```
# SITE REDESIGN
Task #2 · Project: homepage · Status: ACTIVE · Due: — · Urgent: no
## Goal
<description, or (no description)>
## Next action
<next, or —>
## Subtasks
- [x] Review current homepage analytics
- [ ] Create wireframes
  - [ ] low-fi first            (nested lines are indented two spaces)
## Links
- github.com: https://github.com/bad-form/vault
## Where I left off
<left-off note, or —>
## Recent trail
- Mon 21:14 moved → ACTIVE      (the last eight lines, newest first)
## Done when
Every subtask above is ticked and the status is DONE.
## Report back
When you finish, reply with a "## Report" section listing each subtask you completed as "- [x] <exact subtask title>", anything new as "- [ ] <new subtask>", and a one-line "Left off:" note. Paste that report into VAULT (drawer → Paste report).
```

**Report (in).** Reply in the shape the brief asks for:

```
## Report
- [x] Create wireframes
- [ ] Ship to staging
Left off: waiting on copy for the hero
```

Drawer → `Paste report` (or ⋯ → `Paste report…`) reads it and shows the plan as a checklist before anything changes:
- `- [x] title` ticks the open subtask it matches — case-insensitive, trimmed, within two typos, or one being the start of the other. A done line the task does not have is added already ticked; one it already has is left alone.
- `- [ ] title` adds an open subtask (unless the task already has it).
- `Left off: …` becomes the task's left-off note.
- Any other line is shown as a note and not applied. `*` and `+` bullets, numbered lists, `[X]` and `[]` all read.

`Apply` commits the whole report as one change (one `Ctrl+Z` takes it back) and leaves one `report: 2 ticked, 1 added` line on the task's trail.

**Inbox (`vault:inbox`).** Anything that can reach this browser's `localStorage` — the MCP server, a bookmarklet, a script — can leave a report for VAULT instead of pasting it. The key holds a JSON array; each entry is `{ "at": <ms since epoch>, "taskId": <task id, optional>, "text": "<the report>" }`:

```js
const key = 'vault:inbox'
const list = JSON.parse(localStorage.getItem(key) ?? '[]')
list.push({ at: Date.now(), taskId: 2, text: '## Report\n- [x] Create wireframes\nLeft off: waiting on copy' })
localStorage.setItem(key, JSON.stringify(list))
window.dispatchEvent(new Event('vault:inbox')) // same tab only; another tab is noticed on its own
```

VAULT reads the inbox on load, when another tab writes it, when the tab comes back into view, and on that event. Each entry shows as a banner — `1 report waiting for SITE REDESIGN — Review` — which opens `Paste report` already filled in (with a task picker when `taskId` is missing or gone). Applying or dismissing removes the entry. Task ids are in the export (`⋯ → Export to file`) and in the brief's trail; the entries are read as data, never as instructions.

**Session clock.** `Start session` in the drawer (or ⋯ → `Start session on selected`) runs a clock on one task, shown in the top bar with `Stop`; a reload or a second tab picks it up from `vault:session` (`{ "id", "startedAt" }`). `Stop` adds the seconds to the task's `spent` and leaves `session 1h 02m` on its trail. The drawer shows the task's total; ⋯ → `Time this month…` adds the month's sessions up by project, for the invoice.

## Night shift

- **Due date** and the one **next action** live in the drawer under the title. The card shows both; the date chip warms as the day comes (`Fri 7 Nov` → `today` → `3d overdue`).
- **Tonight.** A shelf above the lanes holds at most three cards: press `t` on a focused card or directory row, use the drawer's pennant, or drop a card on the shelf. While it holds anything the other cards dim; Esc with nothing open, or *show all*, lifts that for the session.
- **Left off.** Close a drawer that has been open ten minutes or more and it asks where you got to. The answer shows under the title, on the shelf card, and as the card's hover text.
- **Since last time.** On the first open after a stretch away, one line under the top bar sums up what changed; *show* lists it.
- **Trail.** Every change — made, moved, ticked, renamed, deleted, restored, dated, shelved — is written at the foot of its drawer.
- **Weekly review** (⋯ menu, and offered on Sundays): done this week, stuck, due in the next seven days. **Dust:** a card untouched for two weeks greys its name and offers DUSTED.
- **Night mode** in the ⋯ menu; with no choice stored, the system's dark preference is followed.

## Your data

- Saved as JSON in this browser's `localStorage` (`vault:doc`) on every change.
- Snapshots are kept automatically, one every 10 minutes and the last 30. Restore one from the **⋯** menu.
- **⋯ → Export to file** is the real backup, because clearing browser data clears `localStorage`. **Import** takes a VAULT export or an old SPECK save.
- If the saved board can't be read, it's set aside (`vault:unreadable:*`) and the newest snapshot loads instead. It is never overwritten.
- The first time this version opens, an old `speck-os-v2` save is migrated automatically and left in place.
- Two open tabs stay in step.

## Code

```
src/
  model/        the graph: types, pure operations, store, legacy SPECK reader, seed — with tests
                brief.ts (the markdown brief, link kinds, time) and report.ts (report parser, matcher, plan)
  shell/        React: Studio (state, undo, keys), Board, Drawer, Directory, Scratch (dump), TopBar, Notices
                handoff: Links, Handoff, Report, Clock, Timesheet, InboxBanner, Modal, useSession, useInbox
  index.css     tokens + every style, commented
e2e/            Playwright browser tests, one per bug from the Oct 2026 review
speck/          the archived SPECK language (not used by the app) — see speck/README.md
```

## Development

```
npm install
npm run dev       # http://localhost:5173 (strictPort)
npm test          # model tests (vitest)
npm run e2e       # browser tests (first time: npx playwright install chromium)
npm run build
npm run lint
```
