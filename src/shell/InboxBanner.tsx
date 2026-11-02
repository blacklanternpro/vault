import { byId } from '../model/doc'
import type { Doc } from '../model/types'
import { Cross } from './Glyph'
import type { InboxEntry } from './useInbox'

type InboxBannerProps = {
  doc: Doc
  entries: InboxEntry[]
  onReview: (entry: InboxEntry) => void
  onDismiss: (entry: InboxEntry) => void
}

/** One banner per report left in the inbox, each opening the Paste-report panel already filled in. */
export function InboxBanner({ doc, entries, onReview, onDismiss }: InboxBannerProps) {
  if (!entries.length) return null
  return (
    <div className="banners inbox-banners" data-testid="inbox">
      {entries.map((entry, i) => {
        const task = entry.taskId != null ? byId(doc, entry.taskId) : undefined
        return (
          <div key={`${entry.at}-${i}`} className="banner" role="status" data-testid="inbox-banner">
            <span>
              1 report waiting{task ? ` for ${task.title.trim() || '_'}` : ''}
              {entry.at ? <span className="banner-meta"> · {new Date(entry.at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</span> : null}
            </span>
            <button type="button" className="banner-action is-accent" data-testid="inbox-review" onClick={() => onReview(entry)}>
              Review
            </button>
            <button type="button" className="banner-close" aria-label="Dismiss report" onClick={() => onDismiss(entry)}>
              <Cross />
            </button>
          </div>
        )
      })}
    </div>
  )
}
