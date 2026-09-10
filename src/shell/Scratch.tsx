import { useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { byId, type Doc } from '../speck/doc'
import type { Session } from '../speck/ir'
import { Plus } from './Glyph'

const THRESH = 6

type ScratchProps = {
  doc: Doc
  session: Session
  onAddNote: () => void
  onNoteFocus: (index: number) => void
  onNoteEdit: (index: number, text: string) => void
  onReorder: (from: number, to: number) => void
  onHitch: (index: number, nodeId: number) => void
  onUnhitch: (index: number) => void
}

type Drag = {
  from: number
  startY: number
  live: boolean
  height: number
}

export function Scratch({
  doc,
  session,
  onAddNote,
  onNoteFocus,
  onNoteEdit,
  onReorder,
  onHitch,
  onUnhitch,
}: ScratchProps) {
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
    if ((e.target as HTMLElement).closest('textarea, button')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    const r = e.currentTarget.getBoundingClientRect()
    dragRef.current = { from: index, startY: e.clientY, live: false, height: r.height }
  }

  function onMove(e: PointerEvent<HTMLElement>) {
    const drag = dragRef.current
    if (!drag) return
    if (!drag.live && Math.abs(e.clientY - drag.startY) < THRESH) return
    drag.live = true
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
      if (drag.from < to && i > drag.from && i <= to) shift = -drag.height - 2
      if (drag.from > to && i >= to && i < drag.from) shift = drag.height + 2
      node.style.transform = shift ? `translateY(${shift}px)` : ''
    })
  }

  /** A note dropped on a job leashes to it; dropped on empty tape it comes loose. */
  function hitchAt(clientX: number, clientY: number, skip: HTMLElement): number | 'unhitch' | null {
    skip.style.pointerEvents = 'none'
    const node = document.elementFromPoint(clientX, clientY)
    skip.style.pointerEvents = ''
    if (!(node instanceof Element)) return null
    if (node.closest('[data-unhitch]')) return 'unhitch'
    const job = node.closest('[data-card-id], [data-node-id]')
    if (job) {
      const id = Number(job.getAttribute('data-card-id') || job.getAttribute('data-node-id'))
      if (Number.isFinite(id)) return id
    }
    if (node.closest('.notes') && !node.closest('[data-note-index]')) return 'unhitch'
    return null
  }

  function onUp(e: PointerEvent<HTMLElement>, index: number) {
    const drag = dragRef.current
    dragRef.current = null
    const block = e.currentTarget
    listRef.current?.querySelectorAll('[data-note-index]').forEach((el) => {
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

  return (
    <section className="dump" data-testid="scratch" aria-label="Dump">
      <div className="section-head">
        <h2 className="section-name">Dump</h2>
        <span className="section-note">
          {doc.notes.length === 1 ? '1 note' : `${doc.notes.length} notes`}
        </span>
      </div>

      <div className="notes" ref={listRef}>
        {doc.notes.map((note, index) => (
          <article
            key={`${note.date}-${index}`}
            className={`note${noteIndex === index ? ' is-live' : ''}`}
            data-note-index={index}
            onPointerDown={(e) => onDown(e, index)}
            onPointerMove={onMove}
            onPointerUp={(e) => onUp(e, index)}
            onPointerCancel={(e) => onUp(e, index)}
          >
            <p className="note-date">{note.date || '—'}</p>
            <textarea
              className="note-text"
              value={note.text}
              rows={Math.max(1, Math.min(8, note.text.split('\n').length))}
              aria-label="Note"
              onChange={(e) => onNoteEdit(index, e.target.value)}
              onFocus={() => onNoteFocus(index)}
              onKeyDown={(e: KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === 'Escape') (e.target as HTMLTextAreaElement).blur()
              }}
            />
            {note.node != null ? (
              <button
                type="button"
                className="note-leash"
                data-unhitch
                data-testid={`hitch-plaque-${index}`}
                aria-label="Unleash note"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onUnhitch(index)}
              >
                leashed to {byId(doc, note.node)?.title.trim() || '_'}
              </button>
            ) : null}
          </article>
        ))}
      </div>

      <button type="button" className="dump-add" data-testid="scratch-add" onClick={onAddNote}>
        <Plus className="dump-add-glyph" />
        New note
      </button>
    </section>
  )
}
