import { useEffect, useState } from 'react'
import { byId } from '../model/doc'
import type { Doc } from '../model/types'
import type { Session } from './useSession'

type ClockProps = {
  doc: Doc
  session: Session | null
  onOpen: (id: number) => void
  onStop: () => void
}

function hms(seconds: number): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(Math.floor(seconds / 3600))}:${p(Math.floor((seconds % 3600) / 60))}:${p(seconds % 60)}`
}

/**
 * The running session in the top bar: a live dot, the task's plaque, the
 * clock, and Stop. It ticks on its own so nothing else re-renders by the
 * second. Below 1600px the plaque steps aside (the chips need the room) and
 * the task is named on hover and one click away.
 */
export function SessionClock({ doc, session, onOpen, onStop }: ClockProps) {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!session) return
    const t = window.setInterval(() => setTick((n) => n + 1), 1000)
    return () => window.clearInterval(t)
  }, [session])

  const node = session ? byId(doc, session.id) : undefined
  if (!session || !node) return null
  const seconds = Math.max(0, Math.floor((Date.now() - session.startedAt) / 1000))
  const name = node.title.trim() || '_'

  return (
    <div className="clock" data-testid="clock" role="status" aria-label={`Session on ${name}, ${hms(seconds)}`}>
      <button type="button" className="clock-task" title={`Session on ${name} — open it`} onClick={() => onOpen(node.id)}>
        <span className="clock-dot" aria-hidden="true" />
        <span className="clock-name">{name}</span>
        <span className="clock-sep" aria-hidden="true">
          ·
        </span>
        <span className="clock-time" data-testid="clock-time">
          {hms(seconds)}
        </span>
      </button>
      <button type="button" className="clock-stop" data-testid="clock-stop" onClick={onStop}>
        Stop
      </button>
    </div>
  )
}
