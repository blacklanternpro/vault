import { describe, expect, it } from 'vitest'
import { DAY, HOUR, MINUTE, daysSince, dueDate, dueLabel, dueTone, dueWord, relTime, spanLabel, stampTime, weekKey } from './time'

// Monday 2 Nov 2026, 21:14 local.
const now = new Date(2026, 10, 2, 21, 14)

describe('due words', () => {
  it('names the day as it comes', () => {
    expect(dueLabel('2026-11-02', now)).toBe('today')
    expect(dueLabel('2026-11-03', now)).toBe('tomorrow')
    expect(dueLabel('2026-11-07', now)).toBe('Sat 7 Nov')
    expect(dueLabel('2026-10-30', now)).toBe('3d overdue')
    expect(dueLabel('2027-01-05', now)).toBe('Tue 5 Jan 2027')
    expect(dueDate('2026-11-02', now)).toBe('Mon 2 Nov')
  })

  it('warms by distance', () => {
    expect(dueTone(-1)).toBe('overdue')
    expect(dueTone(0)).toBe('today')
    expect(dueTone(3)).toBe('near')
    expect(dueTone(4)).toBe('far')
  })

  it('reads as a weekday inside the week', () => {
    expect(dueWord('2026-11-06', now)).toBe('Friday')
    expect(dueWord('2026-11-03', now)).toBe('tomorrow')
    expect(dueWord('2026-11-20', now)).toBe('Fri 20 Nov')
  })
})

describe('clock words', () => {
  it('relative times step from minutes to days to dates', () => {
    const t = now.getTime()
    expect(relTime(t - 10_000, t)).toBe('just now')
    expect(relTime(t - 4 * MINUTE, t)).toBe('4m ago')
    expect(relTime(t - 2 * HOUR, t)).toBe('2h ago')
    expect(relTime(t - 3 * DAY, t)).toBe('Fri')
    expect(relTime(t - 20 * DAY, t)).toBe('13 Oct')
  })

  it('stamps, spans, day counts and week keys', () => {
    expect(stampTime(now.getTime())).toBe('Mon 21:14')
    expect(spanLabel(20 * MINUTE)).toBe('20 minutes')
    expect(spanLabel(5 * HOUR)).toBe('5 hours')
    expect(spanLabel(2 * DAY + HOUR)).toBe('2 days')
    expect(spanLabel(DAY)).toBe('1 day')
    expect(daysSince(now.getTime() - 16 * DAY - 1000, now.getTime())).toBe(16)
    expect(weekKey(now)).toBe('2026-11-01')
    expect(weekKey(new Date(2026, 10, 1))).toBe('2026-11-01')
  })
})
