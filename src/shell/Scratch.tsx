import { useRef, type FormEvent, type KeyboardEvent, type PointerEvent } from 'react'
import type { Doc } from '../speck/doc'
import type { Session } from '../speck/ir'

const THRESH = 6
const GHOSTS = ['_ LINK', '_ PIC', '_ FILE'] as const

type Props = {
  doc: Doc
  session: Session
  onFindChange: (value: string) => void
  onFindSubmit: () => void
  onFindFocus: () => void
  onNoteFocus: (index: number) => void
  onNoteEdit: (index: number, text: string) => void
  onReorder: (from: number, to: number) => void
}

type Drag = {
  from: number
  y: number
  startY: number
  live: boolean
  height: number
}

export function Scratch({
  doc,
  session,
  onFindChange,
  onFindSubmit,
  onFindFocus,
  onNoteFocus,
  onNoteEdit,
  onReorder,
}: Props) {
  const dragRef = useRef<Drag | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const noting = session.lens === 'dump' || session.selected?.kind === 'NOTE' || session.selected?.kind === 'DUMP'
  const noteIndex = session.selected?.kind === 'NOTE' ? session.selected.index : -1

  function snapTo(clientY: number, from: number): number {
    const list = listRef.current
    if (!list) return from
    const blocks = [...list.querySelectorAll('[data-note-index]')]
    if (blocks.length === 0) return 0
    for (let i = 0; i < blocks.length; i++) {
      const r = blocks[i].getBoundingClientRect()
      if (clientY < r.top + r.height / 2) return i
    }
    return blocks.length - 1
  }

  function onDown(e: PointerEvent<HTMLElement>, index: number) {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('textarea')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const r = e.currentTarget.getBoundingClientRect()
    dragRef.current = { from: index, y: e.clientY, startY: e.clientY, live: false, height: r.height }
  }

  function onMove(e: PointerEvent<HTMLElement>) {
    const drag = dragRef.current
    if (!drag) return
    if (!drag.live && Math.abs(e.clientY - drag.startY) < THRESH) return
    drag.live = true
    drag.y = e.clientY
    const list = listRef.current
    if (!list) return
    const to = snapTo(e.clientY, drag.from)
    list.querySelectorAll('[data-note-index]').forEach((el, i) => {
      const node = el as HTMLElement
      if (i === drag.from) {
        node.style.transform = `translateY(${e.clientY - drag.startY}px)`
        node.style.zIndex = '5'
        node.style.opacity = '0.92'
        return
      }
      let shift = 0
      if (drag.from < to && i > drag.from && i <= to) shift = -drag.height - 8
      if (drag.from > to && i >= to && i < drag.from) shift = drag.height + 8
      node.style.transform = shift ? `translateY(${shift}px)` : ''
    })
  }

  function onUp(e: PointerEvent<HTMLElement>, index: number) {
    const drag = dragRef.current
    dragRef.current = null
    const list = listRef.current
    list?.querySelectorAll('[data-note-index]').forEach((el) => {
      const node = el as HTMLElement
      node.style.transform = ''
      node.style.zIndex = ''
      node.style.opacity = ''
    })
    if (!drag) return
    if (!drag.live) {
      onNoteFocus(index)
      return
    }
    const to = snapTo(e.clientY, drag.from)
    if (to !== drag.from) onReorder(drag.from, to)
  }

  function submit(e: FormEvent) {
    e.preventDefault()
    onFindSubmit()
  }

  return (
    <aside className="sidebar" data-testid="scratch">
      <form className="studio-find" onSubmit={submit}>
        <label className="find-label" htmlFor="studio-find">
          {noting ? 'NOTE' : 'FIND'}
        </label>
        <input
          id="studio-find"
          className="find-input"
          value={session.buffer}
          placeholder={noting ? 'txt' : 'title'}
          autoComplete="off"
          spellCheck={false}
          aria-label={noting ? 'Note' : 'Find'}
          onChange={(e) => onFindChange(e.target.value)}
          onFocus={onFindFocus}
        />
        {session.echo ? <p className="find-echo">{session.echo}</p> : null}
      </form>
      <div className="scratch-list" ref={listRef}>
        {doc.notes.map((note, index) => (
          <article
            key={`${note.date}-${index}-${note.text.slice(0, 12)}`}
            className={`scratch-block${noteIndex === index ? ' is-on' : ''}`}
            data-note-index={index}
            onPointerDown={(e) => onDown(e, index)}
            onPointerMove={onMove}
            onPointerUp={(e) => onUp(e, index)}
            onPointerCancel={(e) => onUp(e, index)}
          >
            {note.date ? <p className="scratch-date">{note.date}</p> : null}
            <textarea
              className="scratch-text"
              value={note.text}
              rows={Math.max(2, Math.min(8, note.text.split('\n').length + 1))}
              aria-label="Scratch note"
              onChange={(e) => onNoteEdit(index, e.target.value)}
              onFocus={() => onNoteFocus(index)}
              onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === 'Escape') (e.target as HTMLTextAreaElement).blur()
              }}
            />
          </article>
        ))}
        {GHOSTS.map((label) => (
          <div key={label} className="scratch-ghost" aria-hidden>
            {label}
          </div>
        ))}
      </div>
    </aside>
  )
}
