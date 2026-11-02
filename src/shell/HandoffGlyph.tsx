import type { LinkKind } from '../model/brief'

/*
 * Marks for the handoff: what a link points at, and the actions around a
 * brief. Drawn to the set in Glyph.tsx — 15px boxes, 1.4–1.6 strokes on
 * currentColor, round caps and joins — and kept in their own file so the
 * base set stays the base set.
 */

type GlyphProps = {
  className?: string
}

const stroke = { stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

/** A chain link: a link of no particular kind, and the count on a card. */
export function LinkMark({ className }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M6.3 8.7a2.6 2.6 0 0 0 3.7 0l1.9-1.9a2.6 2.6 0 0 0-3.7-3.7l-.9.9" {...stroke} />
      <path d="M8.7 6.3a2.6 2.6 0 0 0-3.7 0L3.1 8.2a2.6 2.6 0 0 0 3.7 3.7l.9-.9" {...stroke} />
    </svg>
  )
}

/** A branch: a repository. */
export function RepoMark({ className }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="4.2" cy="3.4" r="1.5" {...stroke} />
      <circle cx="4.2" cy="11.6" r="1.5" {...stroke} />
      <circle cx="10.8" cy="4.6" r="1.5" {...stroke} />
      <path d="M4.2 4.9v5.2M10.8 6.1c0 2.4-2.2 3-4.6 3.6" {...stroke} />
    </svg>
  )
}

/** An arrow up out of a tray: a deploy. */
export function DeployMark({ className }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M7.5 10V2.8M4.6 5.7l2.9-2.9 2.9 2.9M2.8 9.6v1.9c0 .6.5 1.1 1.1 1.1h7.2c.6 0 1.1-.5 1.1-1.1V9.6" {...stroke} />
    </svg>
  )
}

/** A pen nib: a design file. */
export function FigmaMark({ className }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M7.5 2.4 3.2 5.5l1.6 5.6h5.4l1.6-5.6-4.3-3.1Z" {...stroke} />
      <circle cx="7.5" cy="7.3" r="1.2" {...stroke} />
      <path d="M7.5 8.5v2.6" {...stroke} />
    </svg>
  )
}

/** An envelope: a mail thread. */
export function MailMark({ className }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="2.2" y="3.6" width="10.6" height="7.8" rx="1.2" {...stroke} />
      <path d="m2.6 4.4 4.9 3.7 4.9-3.7" {...stroke} />
    </svg>
  )
}

/** A page with lines: a document. */
export function DocMark({ className }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M4 2.4h4.6l3 3v6.7c0 .6-.5 1.1-1.1 1.1H4c-.6 0-1.1-.5-1.1-1.1V3.5c0-.6.5-1.1 1.1-1.1Z" {...stroke} />
      <path d="M8.6 2.4v3h3M5.3 8h4.4M5.3 10.3h4.4" {...stroke} />
    </svg>
  )
}

/** The mark for a link of a given kind. */
export function KindMark({ kind, className }: GlyphProps & { kind: LinkKind }) {
  if (kind === 'repo') return <RepoMark className={className} />
  if (kind === 'deploy') return <DeployMark className={className} />
  if (kind === 'figma') return <FigmaMark className={className} />
  if (kind === 'mail') return <MailMark className={className} />
  if (kind === 'doc') return <DocMark className={className} />
  return <LinkMark className={className} />
}

/** Two plates, one over the other: copy. */
export function CopyMark({ className }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="5.4" y="5.4" width="7.2" height="7.2" rx="1.2" {...stroke} />
      <path d="M9.6 5.4V3.5c0-.6-.5-1.1-1.1-1.1H3.5c-.6 0-1.1.5-1.1 1.1v5c0 .6.5 1.1 1.1 1.1h1.9" {...stroke} />
    </svg>
  )
}

/** An arrow down into a tray: download. */
export function DownloadMark({ className }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M7.5 2.6v7.2M4.6 7l2.9 2.9L10.4 7M2.8 9.6v1.9c0 .6.5 1.1 1.1 1.1h7.2c.6 0 1.1-.5 1.1-1.1V9.6" {...stroke} />
    </svg>
  )
}

/** A clipboard: paste. */
export function PasteMark({ className }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M5.2 3.4H4.1c-.6 0-1.1.5-1.1 1.1v7.1c0 .6.5 1.1 1.1 1.1h6.8c.6 0 1.1-.5 1.1-1.1V4.5c0-.6-.5-1.1-1.1-1.1H9.8" {...stroke} />
      <rect x="5.2" y="2.2" width="4.6" height="2.4" rx=".8" {...stroke} />
      <path d="M5.4 8h4.2M5.4 10.3h2.8" {...stroke} />
    </svg>
  )
}

/** A wedge: start. */
export function PlayMark({ className }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path d="M4.6 3.2v8.6l7-4.3-7-4.3Z" {...stroke} />
    </svg>
  )
}

/** A block: stop. */
export function StopMark({ className }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <rect x="3.6" y="3.6" width="7.8" height="7.8" rx="1.2" {...stroke} />
    </svg>
  )
}

/** A dial: time. */
export function ClockMark({ className }: GlyphProps) {
  return (
    <svg className={className} viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <circle cx="7.5" cy="7.5" r="5.3" {...stroke} />
      <path d="M7.5 4.6v3.1l2 1.4" {...stroke} />
    </svg>
  )
}
