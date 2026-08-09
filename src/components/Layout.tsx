import type { ReactNode } from 'react';
import { AsciiRule } from './tui/AsciiRule';
import { StatusBar } from './tui/StatusBar';

interface LayoutProps {
  /** Top-left header quadrant -- the VAULT micro-graphic. */
  vault: ReactNode;
  /** Top-right header quadrant -- nav / system index. */
  index: ReactNode;
  /** The architectural zones, stacked and separated by AsciiRule dividers. */
  children: ReactNode;
}

/**
 * Structural shell for the Neo-Brutalist TUI. Owns the "Architectural
 * Grid": a frame of 1px hairlines splitting the screen into major
 * quadrants (header) and a typographic anchor row, leaving the zone
 * content itself (passed as `children`) free to float on the canvas.
 */
export function Layout({ vault, index, children }: LayoutProps) {
  return (
    <div className="min-h-screen w-full bg-canvas text-ink">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col border-x border-grid-line">
        {/* HEADER -- two quadrants split by the grid spine */}
        <header className="grid grid-cols-1 border-b border-grid-line md:grid-cols-2">
          <div className="border-b border-grid-line p-4 sm:p-5 md:border-b-0 md:border-r">
            {vault}
          </div>
          <div className="p-4 sm:p-5">{index}</div>
        </header>

        {/* TYPOGRAPHY ANCHOR */}
        <section className="border-b border-grid-line px-4 py-6 sm:px-5">
          <h1 className="text-2xl font-black uppercase leading-none tracking-tighter sm:text-3xl">
            TUI <span className="text-cobalt">/</span> OS
          </h1>
          <AsciiRule
            char="/"
            className="mt-3 text-[10px] text-cobalt sm:text-xs"
          />
        </section>

        {/* ZONES -- rendered by the caller, separated by AsciiRule dividers */}
        <main className="flex flex-1 flex-col">{children}</main>

        <StatusBar />
      </div>
    </div>
  );
}

export default Layout;
