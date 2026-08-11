# vault

VAULT WORLDWIDE — local-first personal OS shell.
React 19 + Vite 8 + Tailwind CSS v4 + Yjs / IndexedDB.

## Composition

Mobile-first continuous field:

1. Centered sleaze micrographic seal
2. Half-scale ungridded calendar (MO ↔ YR + month nav)
3. Dense Unix file-tree nest
4. Scratch dump
5. Fixed bottom prompt — context from what you click

```
src/
  App.tsx
  components/
    VaultSeal.tsx     centered WORLDWIDE mark
    Calendar.tsx      month/year TUI calendar
    TaskNest.tsx      ASCII tree nest
    Scratchpad.tsx    dump
    PromptDock.tsx    fixed OS prompt
  workers/sync.worker.ts
```

## Development

```bash
npm install
npm run dev       # http://localhost:5173 (strictPort)
npm run build
npm run lint
```

State in IndexedDB (`tui-os-vault`). Seed version bumps wipe legacy demo data.
