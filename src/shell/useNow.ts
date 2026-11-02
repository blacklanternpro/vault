import { useEffect, useState } from 'react'
import { MINUTE } from './time'

/**
 * The clock the chips and the trail read from. It ticks once a minute, which
 * is as often as "4m ago" or "today" can change, so a board left open overnight
 * wakes up saying the right thing without anything else re-rendering for it.
 */
export function useNow(every = MINUTE): Date {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const t = window.setInterval(() => setNow(new Date()), every)
    return () => window.clearInterval(t)
  }, [every])
  return now
}
