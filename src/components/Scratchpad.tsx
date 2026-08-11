import { useCrdtState } from '../hooks/useCrdtState'

export function Scratchpad() {
  const { notes } = useCrdtState()

  return (
    <div className="min-w-0 space-y-2">
      <div className="font-mono text-[9px] uppercase tracking-[0.28em] text-ink/40">
        dump://scratch
      </div>
      {notes.length === 0 ? (
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/35">
          _
        </p>
      ) : (
        notes.map((note) => (
          <article
            key={note.id}
            className="min-w-0 border-b border-ink/15 pb-2 last:border-b-0"
          >
            <div className="mb-0.5 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <time className="font-mono text-[9px] uppercase tracking-[0.2em] text-cobalt">
                {note.date}
              </time>
              {note.attachment ? (
                <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink/40">
                  [{note.attachment}]
                </span>
              ) : null}
            </div>
            <p className="whitespace-pre-wrap break-words font-mono text-[11px] leading-snug text-ink sm:text-[12px]">
              {note.text}
            </p>
          </article>
        ))
      )}
    </div>
  )
}
