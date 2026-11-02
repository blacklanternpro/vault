import { daysUntil } from '../model/doc'

/*
 * Night Shift's clock words. Everything here is pure and locale-fixed (the
 * day and month names are spelled out below rather than read from the browser),
 * so a chip says the same thing on every machine and in every test.
 */

export const MINUTE = 60_000
export const HOUR = 3_600_000
export const DAY = 86_400_000

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

const pad = (n: number) => String(n).padStart(2, '0')

/** A local calendar date out of an ISO YYYY-MM-DD, at midnight. */
export function dateOf(iso: string): Date {
  return new Date(iso + 'T00:00:00')
}

/** Today as ISO YYYY-MM-DD, in local time. */
export function isoToday(now = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}

/** "7 Nov", or "7 Nov 2027" once the year is not this one. */
export function dayMonth(d: Date, now = new Date()): string {
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`
  return d.getFullYear() === now.getFullYear() ? base : `${base} ${d.getFullYear()}`
}

/** How warm a due chip runs: quiet past a week out, ink inside three days, accent today, red once it has gone by. */
export type DueTone = 'far' | 'near' | 'today' | 'overdue'

export function dueTone(days: number): DueTone {
  if (days < 0) return 'overdue'
  if (days === 0) return 'today'
  if (days <= 3) return 'near'
  return 'far'
}

/** "today", "tomorrow", "3d overdue", or "Fri 7 Nov". */
export function dueLabel(due: string, now = new Date()): string {
  const days = daysUntil(due, now)
  if (days === 0) return 'today'
  if (days === 1) return 'tomorrow'
  if (days < 0) return `${-days}d overdue`
  return dueDate(due, now)
}

/** The date itself, "Fri 7 Nov": for a trail line, which has to read the same next month. */
export function dueDate(due: string, now = new Date()): string {
  const d = dateOf(due)
  return `${DAYS[d.getDay()]} ${dayMonth(d, now)}`
}

/** The word for a due date in a sentence: "today", "tomorrow", "Friday", else the chip's date. */
export function dueWord(due: string, now = new Date()): string {
  const days = daysUntil(due, now)
  if (days >= 2 && days <= 6) return DAYS_LONG[dateOf(due).getDay()]
  return dueLabel(due, now)
}

/** "just now", "4m ago", "2h ago", "Mon", "7 Nov". */
export function relTime(at: number, now = Date.now()): string {
  const gap = now - at
  if (gap < MINUTE) return 'just now'
  if (gap < HOUR) return `${Math.floor(gap / MINUTE)}m ago`
  if (gap < DAY) return `${Math.floor(gap / HOUR)}h ago`
  const d = new Date(at)
  if (gap < 7 * DAY) return DAYS[d.getDay()]
  return dayMonth(d, new Date(now))
}

/** "Mon 21:14", the trail's clock stamp. */
export function stampTime(at: number): string {
  const d = new Date(at)
  return `${DAYS[d.getDay()]} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** A stretch of time in one unit: "20 minutes", "5 hours", "2 days". */
export function spanLabel(ms: number): string {
  const one = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`
  if (ms < HOUR) return one(Math.max(1, Math.floor(ms / MINUTE)), 'minute')
  if (ms < DAY) return one(Math.floor(ms / HOUR), 'hour')
  return one(Math.floor(ms / DAY), 'day')
}

/** Whole days since a stamp, floored at zero. */
export function daysSince(at: number, now = Date.now()): number {
  return Math.max(0, Math.floor((now - at) / DAY))
}

/** The Sunday a date belongs to, as ISO YYYY-MM-DD — one key per week. */
export function weekKey(now = new Date()): string {
  const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
  return isoToday(sunday)
}
