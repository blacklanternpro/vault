# vault

Foundational layout for a Neo-Brutalist TUI (Terminal User Interface) — built
with React, TypeScript, Vite, and Tailwind CSS v4.

## Aesthetic

- Off-white canvas (`#F4F4F0`), pure black ink, Electric Cobalt accent
  (`#0000FF`), Terminal Green (`#00B050`) for the inverted NOTES block.
- No rounded corners, no soft shadows, no standard UI components.
- An "Architectural Grid": faint 1px hairlines (`#E5E5DF`) split the screen
  into major quadrants instead of boxes/cards.
- JetBrains Mono everywhere, dense and small for data (`text-[10px]` /
  `text-xs`), restrained and tightly kerned for headers (`text-2xl` /
  `text-3xl`, `font-black`, `tracking-tighter`, uppercase).
- Section dividers are literal repeated ASCII characters (`/`, `*`) instead
  of `<hr>` elements or borders.

## Structure

```
src/
  components/
    Layout.tsx           structural shell: header quadrants, typography
                          anchor, zone slot, status bar
    tui/
      AsciiRule.tsx       full-width repeated-character divider
      VaultPlate.tsx      top-left "hardware serial plate" status block
      IndexPanel.tsx      top-right nav / system index quadrant
      Zone.tsx            unboxed architectural zone (title + content)
      CalendarList.tsx    CALENDAR zone content
      TaskList.tsx        EXTENDED TASKS zone content
      NotesTerminal.tsx   inverted black/green terminal block for NOTES
      StatusBar.tsx       footer status bar with a live clock
  data/tui.ts             seed data for every zone
  hooks/useClock.ts        ticking HH:MM:SS clock hook
  App.tsx                  composes Layout + zones into the full page
```

## Development

```bash
npm install
npm run dev       # start the Vite dev server
npm run build     # typecheck + production build
npm run lint      # oxlint
```
