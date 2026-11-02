import { useCallback, useEffect, useRef, useState } from 'react'

/*
 * The session clock: one task at a time, from when you pressed Start. It is
 * kept in localStorage so a reload — or a second tab — picks the same clock
 * up where it was; the seconds themselves are only written to the task's
 * `spent` when the clock is stopped, which is the shell's job.
 */

export const SESSION_KEY = 'vault:session'

export type Session = { id: number; startedAt: number }

export function readSession(): Session | null {
  try {
    const raw = window.localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const s = JSON.parse(raw) as Partial<Session> | null
    if (!s || typeof s.id !== 'number' || !Number.isInteger(s.id) || s.id <= 0) return null
    if (typeof s.startedAt !== 'number' || !Number.isFinite(s.startedAt) || s.startedAt <= 0) return null
    return { id: s.id, startedAt: Math.min(s.startedAt, Date.now()) }
  } catch {
    return null
  }
}

function writeSession(s: Session | null): void {
  try {
    if (s) window.localStorage.setItem(SESSION_KEY, JSON.stringify(s))
    else window.localStorage.removeItem(SESSION_KEY)
  } catch {
    /* a clock that cannot be saved still runs for this tab */
  }
}

export type SessionClock = {
  session: Session | null
  start: (id: number, at?: number) => void
  /** Stops the clock and says what it was: the task and the whole seconds on it. Null when none was running. */
  stop: (at?: number) => { id: number; seconds: number } | null
}

export function useSession(): SessionClock {
  const [session, setSession] = useState<Session | null>(readSession)
  const ref = useRef(session)
  ref.current = session

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === SESSION_KEY || e.key === null) setSession(readSession())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const start = useCallback((id: number, at = Date.now()) => {
    const next = { id, startedAt: at }
    writeSession(next)
    ref.current = next
    setSession(next)
  }, [])

  const stop = useCallback((at = Date.now()) => {
    const cur = ref.current
    writeSession(null)
    ref.current = null
    setSession(null)
    if (!cur) return null
    return { id: cur.id, seconds: Math.max(0, Math.round((at - cur.startedAt) / 1000)) }
  }, [])

  return { session, start, stop }
}
