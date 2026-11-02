import { useEffect, useState } from 'react'

type SavedProps = {
  /** When the last successful save happened, ms since epoch; null before the first one this session. */
  at: number | null
}

const TICK_MS = 10_000

function since(at: number, now: number): string {
  const s = Math.max(0, Math.round((now - at) / 1000))
  if (s < 10) return 'just now'
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h}h ago`
  return new Date(at).toLocaleDateString(undefined, { dateStyle: 'medium' })
}

/** A quiet `saved · 2s ago` at the right of the top bar, re-read every ten seconds and on every save. */
export function Saved({ at }: SavedProps) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (at == null) return
    setNow(Date.now())
    const t = window.setInterval(() => setNow(Date.now()), TICK_MS)
    return () => window.clearInterval(t)
  }, [at])

  if (at == null) return null
  return (
    <span className="saved" data-testid="saved" title={new Date(at).toLocaleTimeString()}>
      saved · {since(at, now)}
    </span>
  )
}
