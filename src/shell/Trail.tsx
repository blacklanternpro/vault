import { useState } from 'react'
import type { Event } from '../model/types'
import { relTime } from './time'

const SHOWN = 8

/**
 * The foot of the drawer: what has happened to this task, newest first, in
 * the quiet grey. Eight lines, then "show all". Nothing here is a control —
 * the trail is read, and it is written by the Studio at every change.
 */
export function Trail({ events, now }: { events: Event[]; now: Date }) {
  const [all, setAll] = useState(false)
  if (!events.length) return null
  const shown = all ? events : events.slice(0, SHOWN)
  return (
    <section className="trail" data-testid="trail" aria-label="Trail">
      <h2 className="drawer-label">Trail</h2>
      <ol className="trail-list">
        {shown.map((e, i) => (
          <li key={`${e.at}-${i}`} className={`trail-line is-${e.kind}`} data-kind={e.kind}>
            <span className="trail-text">{e.text}</span>
            <time className="trail-when" dateTime={new Date(e.at).toISOString()} title={new Date(e.at).toLocaleString()}>
              {relTime(e.at, now.getTime())}
            </time>
          </li>
        ))}
      </ol>
      {events.length > SHOWN ? (
        <button type="button" className="trail-more" data-testid="trail-more" onClick={() => setAll((a) => !a)}>
          {all ? 'show less' : `show all ${events.length}`}
        </button>
      ) : null}
    </section>
  )
}
