import { useEffect, useRef } from 'react'
import { boardCards, byId, daysUntil, projectOf, staleCards } from '../model/doc'
import type { Doc, Node } from '../model/types'
import { DueChip } from './DueChip'
import { Cross } from './Glyph'
import { DAY, dayMonth, daysSince, relTime } from './time'
import { STUCK_DAYS } from './trail'

type ReviewProps = {
  doc: Doc
  now: Date
  onClose: () => void
  /** Open a card's drawer, leaving the review. */
  onOpen: (id: number) => void
  /** Shelve a stuck card. */
  onDust: (id: number) => void
}

/** Cards moved to DONE in the last seven days, newest first, each once. */
function doneThisWeek(doc: Doc, now: Date): Array<{ node: Node; at: number }> {
  const cutoff = now.getTime() - 7 * DAY
  const seen = new Set<number>()
  const out: Array<{ node: Node; at: number }> = []
  for (let i = doc.events.length - 1; i >= 0; i--) {
    const e = doc.events[i]
    if (e.at < cutoff) break
    if (e.kind !== 'moved' || e.node == null || !e.text.endsWith('→ DONE') || seen.has(e.node)) continue
    const node = byId(doc, e.node)
    if (!node || node.status !== 'done') continue
    seen.add(e.node)
    out.push({ node, at: e.at })
  }
  return out
}

/** Live cards due inside the next seven days (overdue ones first), soonest first. */
function dueThisWeek(doc: Doc, now: Date): Node[] {
  return boardCards(doc, null)
    .filter((n) => n.due && n.status !== 'done' && n.status !== 'dusted' && daysUntil(n.due, now) <= 7)
    .sort((a, b) => a.due!.localeCompare(b.due!))
}

/**
 * Sunday's sit-down: one light sheet over the field with three columns — what
 * got done, what has stopped moving, what is coming due. Esc puts it away.
 */
export function Review({ doc, now, onClose, onOpen, onDust }: ReviewProps) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const closeFn = useRef(onClose)
  closeFn.current = onClose

  useEffect(() => {
    const was = document.activeElement
    closeRef.current?.focus({ preventScroll: true })
    // Caught on the way down, so Esc closes the review and nothing behind it.
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      e.preventDefault()
      closeFn.current()
    }
    window.addEventListener('keydown', esc, true)
    return () => {
      window.removeEventListener('keydown', esc, true)
      if (was instanceof HTMLElement) was.focus({ preventScroll: true })
    }
  }, [])

  const done = doneThisWeek(doc, now)
  const stuck = staleCards(doc, STUCK_DAYS, now.getTime())
  const due = dueThisWeek(doc, now)
  const weekStart = new Date(now.getTime() - 6 * DAY)

  const folder = (node: Node) => {
    const p = projectOf(doc, node.id)
    return p && p.id !== node.id ? p.title.trim() || '_' : ''
  }

  return (
    <div className="review" data-testid="review" role="dialog" aria-modal="true" aria-label="Weekly review">
      <header className="review-head">
        <h1 className="review-name">Weekly review</h1>
        <p className="review-range">
          {dayMonth(weekStart, now)} – {dayMonth(now, now)}
        </p>
        <button ref={closeRef} type="button" className="review-close" aria-label="Close review" title="Close (Esc)" data-testid="review-close" onClick={onClose}>
          <Cross />
        </button>
      </header>

      <div className="review-columns">
        <section className="review-col" data-testid="review-done" aria-label="Done this week">
          <h2 className="review-label">
            Done this week <span className="review-count">{done.length}</span>
          </h2>
          <ul className="review-list">
            {done.map(({ node, at }) => (
              <li key={node.id} className="review-row">
                <button type="button" className="review-title" onClick={() => onOpen(node.id)}>
                  {node.title.trim() || '_'}
                </button>
                <span className="review-meta">
                  {folder(node)}
                  {folder(node) ? ' · ' : ''}
                  {relTime(at, now.getTime())}
                </span>
              </li>
            ))}
            {!done.length ? <li className="review-empty">_</li> : null}
          </ul>
        </section>

        <section className="review-col" data-testid="review-stuck" aria-label="Stuck">
          <h2 className="review-label">
            Stuck <span className="review-count">{stuck.length}</span>
          </h2>
          <ul className="review-list">
            {stuck.map((node) => (
              <li key={node.id} className="review-row" data-testid={`review-stuck-${node.id}`}>
                <button type="button" className="review-title" onClick={() => onOpen(node.id)}>
                  {node.title.trim() || '_'}
                </button>
                <span className="review-meta">
                  {folder(node)}
                  {folder(node) ? ' · ' : ''}
                  {daysSince(node.touched ?? now.getTime(), now.getTime())}d untouched
                </span>
                <span className="review-actions">
                  <button type="button" className="review-action" data-testid={`review-dust-${node.id}`} onClick={() => onDust(node.id)}>
                    → DUSTED
                  </button>
                  <button type="button" className="review-action" onClick={() => onOpen(node.id)}>
                    open
                  </button>
                </span>
              </li>
            ))}
            {!stuck.length ? <li className="review-empty">_</li> : null}
          </ul>
        </section>

        <section className="review-col" data-testid="review-due" aria-label="Due next 7 days">
          <h2 className="review-label">
            Due next 7 days <span className="review-count">{due.length}</span>
          </h2>
          <ul className="review-list">
            {due.map((node) => (
              <li key={node.id} className="review-row">
                <button type="button" className="review-title" onClick={() => onOpen(node.id)}>
                  {node.title.trim() || '_'}
                </button>
                <span className="review-meta">
                  {folder(node)}
                  {folder(node) ? ' · ' : ''}
                  <DueChip due={node.due!} now={now} />
                </span>
              </li>
            ))}
            {!due.length ? <li className="review-empty">_</li> : null}
          </ul>
        </section>
      </div>
    </div>
  )
}
