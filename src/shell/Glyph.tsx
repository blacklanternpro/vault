/** Icon-sized SVG glyphs. The comp draws no illustration; these are its chrome. */

type GlyphProps = {
  className?: string
}

export function BrandMark({ className }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 26 26" fill="none" aria-hidden="true">
      <path d="M2.6 3.1h6.9l5.1 13.4L19.7 3.1h3.7L15.6 22.9h-3.3L2.6 3.1Z" fill="currentColor" />
      <path d="M11.2 3.1h5.2l-2.6 6.8-2.6-6.8Z" fill="currentColor" opacity="0.45" />
    </svg>
  )
}

export function Glass({ className }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="7" cy="7" r="4.6" stroke="currentColor" strokeWidth="1.5" />
      <path d="m10.5 10.5 3.1 3.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function Caret({ className }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="m3.5 5.5 3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Plus({ className }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M7.5 2.6v9.8M2.6 7.5h9.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export function Chevron({ className }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="m6 4 3.5 3.5L6 11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Cross({ className }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="m3.4 3.4 8.2 8.2m0-8.2-8.2 8.2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function Folder({ className }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 17 17" fill="none" aria-hidden="true">
      <path
        d="M2.2 4.6c0-.7.6-1.3 1.3-1.3h2.8l1.5 1.7h5.7c.7 0 1.3.6 1.3 1.3v6.4c0 .7-.6 1.3-1.3 1.3H3.5c-.7 0-1.3-.6-1.3-1.3V4.6Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Check({ className }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="m2.2 6.2 2.4 2.4 5.2-5.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Ring({ className }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="6.3" stroke="currentColor" strokeWidth="1.4" />
      <path d="m5.3 8.2 1.9 1.9 3.6-3.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
