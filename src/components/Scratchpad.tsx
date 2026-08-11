import { useCrdtState } from '../hooks/useCrdtState'

export function Scratchpad() {
  const { notes } = useCrdtState()

  return (
    <div className="space-y-3">
      {notes.length === 0 ? (
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink/35">
          DUMP_EMPTY
        </p>
      ) : (
        notes.map((note) => (
          <article
            key={note.id}
            className="min-w-0 border-b border-ink/20 pb-3 last:border-b-0"
          >
            <div className="mb-1 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <time className="font-mono text-[10px] uppercase tracking-[0.2em] text-cobalt">
                {note.date}
              </time>
              {note.attachment ? (
                <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink/45">
                  [{note.attachment}]
                </span>
              ) : null}
            </div>
            <p className="whitespace-pre-wrap break-words font-mono text-[12px] leading-relaxed text-ink sm:text-[13px]">
              {note.text}
            </p>
          </article>
        ))
      )}
    </div>
  )
}
