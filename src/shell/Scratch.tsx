import { useRef, type FormEvent, type KeyboardEvent, type PointerEvent } from 'react'
import { byId, type Doc } from '../speck/doc'
import type { Session } from '../speck/ir'

const THRESH = 6
const GHOSTS = ['_ LINK', '_ PIC', '_ FILE'] as const

type Props = {
  doc: Doc
  session: Session
  onFindChange: (value: string) => void
  onFindSubmit: () => void
  onFindFocus: () => void
  onAddNote: () => void
  onNoteFocus: (index: number) => void
  onNoteEdit: (index: number, text: string) => void
  onReorder: (from: number, to: number) => void
  onHitch: (index: number, nodeId: number) => void
  onUnhitch: (index: number) => void
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
  onAddNote,
  onNoteFocus,
  onNoteEdit,
  onReorder,
  onHitch,
  onUnhitch,
}: Props) {
  const dragRef = useRef<Drag | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
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

  function hitchAt(clientX: number, clientY: number, skip: HTMLElement): number | 'unhitch' | null {
    skip.style.pointerEvents = 'none'
    const node = document.elementFromPoint(clientX, clientY)
    skip.style.pointerEvents = ''
    if (!(node instanceof Element)) return null
    if (node.closest('[data-unhitch]')) return 'unhitch'
    const job = node.closest('[data-card-id], [data-nested-id], [data-folio-id]')
    if (job) {
      const id = Number(
        job.getAttribute('data-card-id') ||
          job.getAttribute('data-nested-id') ||
          job.getAttribute('data-folio-id'),
      )
      if (Number.isFinite(id)) return id
    }
    if (node.closest('.scratch-ghost') || (node.closest('.scratch-list') && !node.closest('[data-note-index]'))) {
      return 'unhitch'
    }
    return null
  }

  function onUp(e: PointerEvent<HTMLElement>, index: number) {
    const drag = dragRef.current
    dragRef.current = null
    const list = listRef.current
    const block = e.currentTarget
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
    const hitch = hitchAt(e.clientX, e.clientY, block)
    if (hitch === 'unhitch') {
      onUnhitch(index)
      return
    }
    if (typeof hitch === 'number') {
      onHitch(index, hitch)
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
          FIND
        </label>
        <input
          id="studio-find"
          className="find-input"
          value={session.buffer}
          placeholder="_"
          autoComplete="off"
          spellCheck={false}
          aria-label="Find"
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
            {note.node != null ? (
              <p className="scratch-hitch" data-testid={`hitch-plaque-${index}`}>
                <span>→ {byId(doc, note.node)?.title.trim() || '_'}</span>
                <button
                  type="button"
                  className="scratch-unhitch"
                  data-unhitch
                  aria-label="Unhitch"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onUnhitch(index)}
                >
                  [x]
                </button>
              </p>
            ) : null}
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
        <button type="button" className="scratch-ghost is-add" data-testid="scratch-add" onClick={onAddNote}>
          _
        </button>
        {GHOSTS.map((label) => (
          <div key={label} className="scratch-ghost" aria-hidden>
            {label}
          </div>
        ))}
      </div>
    </aside>
  )
}
