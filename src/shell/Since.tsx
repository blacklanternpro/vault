import { useState } from 'react'
import { boardCards, daysUntil } from '../model/doc'
import type { Doc, Event, EventKind } from '../model/types'
import { Cross } from './Glyph'
import { dueWord, spanLabel, stampTime } from './time'
import { eventLine } from './trail'

type SinceProps = {
  doc: Doc
  /** When the board was last left, ms since epoch. */
  since: number
  /** What happened after that, newest first. */
  events: Event[]
  now: Date
  onDismiss: () => void
}

const WORDS: Partial<Record<EventKind, [one: string, many: string]>> = {
  moved: ['move', 'moves'],
  ticked: ['ticked', 'ticked'],
  created: ['made', 'made'],
  renamed: ['renamed', 'renamed'],
  deleted: ['deleted', 'deleted'],
  restored: ['restored', 'restored'],
  note: ['note', 'notes'],
  due: ['dated', 'dated'],
}

/** "3 moves, 2 ticked, 1 due Friday": the counts, then what is coming due this week. */
function summarize(doc: Doc, events: Event[], now: Date): string[] {
  const counts = new Map<EventKind, number>()
  for (const e of events) counts.set(e.kind, (counts.get(e.kind) ?? 0) + 1)
  const parts: string[] = []
  for (const kind of Object.keys(WORDS) as EventKind[]) {
    const n = counts.get(kind)
    if (!n) continue
    const [one, many] = WORDS[kind]!
    parts.push(`${n} ${n === 1 ? one : many}`)
  }
  const live = boardCards(doc, null).filter((n) => n.due && n.status !== 'done' && n.status !== 'dusted')
  const overdue = live.filter((n) => daysUntil(n.due!, now) < 0)
  const soon = live.filter((n) => daysUntil(n.due!, now) >= 0 && daysUntil(n.due!, now) <= 7).sort((a, b) => a.due!.localeCompare(b.due!))
  if (overdue.length) parts.push(`${overdue.length} overdue`)
  if (soon.length === 1) parts.push(`1 due ${dueWord(soon[0].due!, now)}`)
  else if (soon.length > 1) parts.push(`${soon.length} due this week`)
  return parts
}

/**
 * One line under the top bar on the first open after a stretch away: what
 * moved while you were gone, with the list behind a "show". Dismissed, it stays
 * gone for the session; it never writes anything.
 */
export function Since({ doc, since, events, now, onDismiss }: SinceProps) {
  const [open, setOpen] = useState(false)
  const parts = summarize(doc, events, now)
  return (
    <aside className="since" data-testid="since" aria-label="Since last time">
      <div className="since-line">
        <p className="since-text" data-testid="since-text">
          Since last time ({spanLabel(now.getTime() - since)}): {parts.length ? parts.join(', ') : `${events.length} changes`}
        </p>
        <button type="button" className="since-show" data-testid="since-show" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          {open ? 'hide' : 'show'}
        </button>
        <button type="button" className="since-close" aria-label="Dismiss" data-testid="since-close" onClick={onDismiss}>
          <Cross />
        </button>
      </div>
      {open ? (
        <ul className="since-list" data-testid="since-list">
          {events.map((e, i) => (
            <li key={`${e.at}-${i}`} className="since-item">
              <span className="since-what">{eventLine(doc, e)}</span>
              <span className="since-when">{stampTime(e.at)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </aside>
  )
}
