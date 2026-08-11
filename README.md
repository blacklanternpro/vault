# vault

Burned-box TUI — local-first personal OS. One continuous typographic field.
React 19 + Vite 8 + Tailwind CSS v4 + Yjs / IndexedDB.

## Aesthetic

- Canvas `#F4F4F0`, ink `#111`, cobalt `#0000FF`, urgent `#FF2B2B`.
- JetBrains Mono for chrome/data; Space Grotesk only for calendar numerals.
- No cards, section billboards, DateBlocks, or teal watermarks.
- Film grain + scanline overlays.

## Composition

1. Sticky teletext HUD — micro VAULT + modes + INV
2. True Cram Grid calendar — parasite log overlays
3. Headerless Hybrid Nest + scratch dump (right rail)
4. Single sticky Prompt Dock — `DAY | NEST | DUMP`

```
src/
  App.tsx                 shell orchestration
  index.css               tokens, grain, scanlines
  components/
    TeletextBar.tsx       sticky HUD
    Calendar.tsx          True Cram Grid + parasite logs
    TaskNest.tsx          Hybrid Nest
    Scratchpad.tsx        receipt dump
    PromptDock.tsx        single context prompt
    Footer.tsx            local stamp + clock
  hooks/
    useCrdtState.ts       worker bridge
    useClock.ts           live HH:MM:SS
  lib/vault-types.ts      shared main↔worker types
  workers/sync.worker.ts  Y.Doc + IndexedDB persistence
```

## Development

```bash
npm install
npm run dev       # http://localhost:5173 (strictPort)
npm run build
npm run lint      # oxlint
```

All state persists in IndexedDB (`tui-os-vault`). No backend.
