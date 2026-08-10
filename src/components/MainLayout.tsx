import type { ReactNode } from 'react';

/**
 * Jagged grid layout container for the date blocks.
 *
 * - Mobile: a single column; blocks stretch full width.
 * - Desktop (md+): auto-fill columns, each at least 280px wide.
 * - `items-start` (align-items: flex-start) is critical: blocks are NOT
 *   stretched to match the tallest cell in their row -- each dictates its own
 *   height, producing a jagged, uneven layout as dropdowns open and close.
 * - A harsh `gap-8` separates blocks.
 */
export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <main className="max-w-4xl mx-auto px-4 md:px-8 grid items-start gap-8 grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(280px,1fr))]">
      {children}
    </main>
  );
}
