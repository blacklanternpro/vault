/** Night Shift's marks, drawn to the set in Glyph.tsx: one stroke weight, round caps, currentColor. */

type GlyphProps = {
  className?: string
}

/** A pennant on a pole: the shelf mark. Triangular where the urgent flag is notched, so the two never read as one. */
export function Pennant({ className }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M3.5 13V2.5m0 .5 8 3.2-8 3.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/** A page with its binding: the due-date mark. */
export function Calendar({ className }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="2.3" y="3.3" width="10.4" height="9.4" rx="1.4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 6.6h10M5.3 2v2.4M9.7 2v2.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

/** A clock face, hands at ten past: the trail's mark. */
export function Clock({ className }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="5.4" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7.5 4.6v3.1l2 1.3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
