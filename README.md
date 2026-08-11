# vault

Fried TUI maxi-minimalism — a local-first personal OS shell.
React 19 + Vite 8 + Tailwind CSS v4 + Yjs / IndexedDB.

## Aesthetic

- Canvas `#F4F4F0`, ink `#111`, cobalt `#0000FF`, urgent `#FF2B2B`, acid `#00FFCC` (month watermark only).
- Space Grotesk (display / numerals) + JetBrains Mono (all data).
- No cards, rounded corners, or soft shadows. Film grain + scanline overlays.
- Calendar is the **True Cram Grid** only — never DateBlocks or stacked day lists.

## Structure

```
src/
  App.tsx                 shell: invert, grain, modules
  index.css               tokens, grain, scanlines
  components/
    VaultHeader.tsx       globe seal + INVERT_OS + status
    Calendar.tsx          True Cram Grid + overlay logs + VCR logger
    TaskNest.tsx          Hybrid Nest tasks
    Scratchpad.tsx        raw append + media attach
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
