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

**Night shift.**
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
  shell/        React: Studio (state, undo, keys), Board, Drawer, Directory, Scratch (dump), TopBar, Notices
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
