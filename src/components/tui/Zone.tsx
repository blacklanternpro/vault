import type { ReactNode } from 'react';

interface ZoneProps {
  /** Two-digit zone index, e.g. "01". */
  index: string;
  title: string;
  /** Small right-aligned status readout next to the title. */
  meta?: string;
  /**
   * When true, the zone body ignores the horizontal gutter so its content
   * can bleed edge-to-edge (used by the inverted NOTES terminal block).
   */
  bleed?: boolean;
  children: ReactNode;
}

/**
 * An architectural zone: text floats directly on the off-white canvas, no
 * bounding box, no border -- separation between zones is handled entirely
 * by <AsciiRule /> dividers rendered between <Zone /> instances.
 */
export function Zone({ index, title, meta, bleed = false, children }: ZoneProps) {
  return (
    <section className={bleed ? 'py-6 sm:py-7' : 'px-4 py-6 sm:px-5 sm:py-7'}>
      <div
        className={`mb-4 flex items-baseline justify-between gap-3 sm:mb-5 ${
          bleed ? 'px-4 sm:px-5' : ''
        }`}
      >
        <h2 className="flex items-baseline gap-2.5 text-lg font-black uppercase leading-none tracking-tighter sm:text-xl">
          <span className="text-cobalt">{index}</span>
          <span>{title}</span>
        </h2>
        {meta ? (
          <span className="whitespace-nowrap text-[9px] uppercase tracking-tighter text-ink/45 sm:text-[10px]">
            {meta}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}
