import { useEffect, useLayoutEffect, useRef, type PointerEvent } from 'react'
import { byId } from '../model/doc'
import type { Doc } from '../model/types'
import { Plus } from './Glyph'

const THRESH = 6

type ScratchProps = {
  doc: Doc
  /** A note that was just created and wants the caret. */
  focusNote: string | null
  onFocused: () => void
  onAdd: () => void
  /** `session` names one stay in a note, so everything typed in it undoes as one step. */
  onEdit: (id: string, text: string, session: string) => void
  /** `hadText` is false for a note that was opened and left empty, which goes quietly. */
  onRemove: (id: string, hadText: boolean, session: string) => void
  onReorder: (from: number, to: number) => void
  onHitch: (id: string, nodeId: number | null) => void
}

type Drag = { id: string; from: number; startY: number; live: boolean; height: number }

/**
 * The dump: loose text notes. Each one is a plain textarea that keeps whatever
 * you type, newlines and all. A note left empty is removed when you leave it.
 * Drag a note to reorder it, or drop it on a card or a directory row to hitch it there.
 */
export function Scratch({ doc, focusNote, onFocused, onAdd, onEdit, onRemove, onReorder, onHitch }: ScratchProps) {
  const dragRef = useRef<Drag | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  /** What each note said when it was entered, so leaving it empty can tell "cleared" from "never written". */
  const startText = useRef(new Map<string, string>())
  const session = useRef(new Map<string, string>())
  const sessionOf = (id: string) => session.current.get(id) ?? id

  // Each note is as tall as its text, wrapped lines included.
  useLayoutEffect(() => {
    listRef.current?.querySelectorAll<HTMLTextAreaElement>('.note-text').forEach((el) => {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    })
  }, [doc.notes])

  useEffect(() => {
    if (!focusNote) return
    const el = listRef.current?.querySelector<HTMLTextAreaElement>(`[data-note-id="${focusNote}"] textarea`)
    el?.focus()
    onFocused()
  }, [focusNote, onFocused])

  function snapTo(clientY: number, from: number): number {
    const blocks = [...(listRef.current?.querySelectorAll('[data-note-id]') ?? [])]
    for (let i = 0; i < blocks.length; i++) {
      const r = blocks[i].getBoundingClientRect()
      if (clientY < r.top + r.height / 2) return i
    }
    return blocks.length ? blocks.length - 1 : from
  }

  function onDown(e: PointerEvent<HTMLElement>, id: string, index: number) {
    if (e.button !== 0 || (e.target as HTMLElement).closest('textarea, button')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { id, from: index, startY: e.clientY, live: false, height: e.currentTarget.getBoundingClientRect().height }
  }

  function onMove(e: PointerEvent<HTMLElement>) {
    const drag = dragRef.current
    if (!drag) return
    if (!drag.live && Math.abs(e.clientY - drag.startY) < THRESH) return
    drag.live = true
    const to = snapTo(e.clientY, drag.from)
    listRef.current?.querySelectorAll<HTMLElement>('[data-note-id]').forEach((el, i) => {
      if (i === drag.from) {
        el.style.transform = `translateY(${e.clientY - drag.startY}px)`
        el.style.zIndex = '5'
        el.style.opacity = '0.92'
        return
      }
      let shift = 0
      if (drag.from < to && i > drag.from && i <= to) shift = -drag.height - 2
      if (drag.from > to && i >= to && i < drag.from) shift = drag.height + 2
      el.style.transform = shift ? `translateY(${shift}px)` : ''
    })
  }

  function hitchAt(x: number, y: number, skip: HTMLElement): number | 'unhitch' | null {
    skip.style.pointerEvents = 'none'
    const el = document.elementFromPoint(x, y)
    skip.style.pointerEvents = ''
    if (!(el instanceof Element)) return null
    const target = el.closest('[data-card-id], [data-node-id]')
    if (target) {
      const id = Number(target.getAttribute('data-card-id') ?? target.getAttribute('data-node-id'))
      if (Number.isFinite(id)) return id
    }
    if (el.closest('.notes') && !el.closest('[data-note-id]')) return 'unhitch'
    return null
  }

  function onUp(e: PointerEvent<HTMLElement>) {
    const drag = dragRef.current
    dragRef.current = null
    listRef.current?.querySelectorAll<HTMLElement>('[data-note-id]').forEach((el) => {
      el.style.transform = ''
      el.style.zIndex = ''
      el.style.opacity = ''
    })
    if (!drag?.live) return
    const hitch = hitchAt(e.clientX, e.clientY, e.currentTarget)
    if (hitch === 'unhitch') return onHitch(drag.id, null)
    if (typeof hitch === 'number') return onHitch(drag.id, hitch)
    const to = snapTo(e.clientY, drag.from)
    if (to !== drag.from) onReorder(drag.from, to)
  }

  return (
    <section className="dump" data-testid="dump" aria-label="Dump">
      <div className="section-head">
        <h2 className="section-name">Dump</h2>
        <span className="section-note">{doc.notes.length === 1 ? '1 note' : `${doc.notes.length} notes`}</span>
      </div>

      <div className="notes" ref={listRef}>
        {doc.notes.map((note, index) => (
          <article
            key={note.id}
            className="note"
            data-note-id={note.id}
            onPointerDown={(e) => onDown(e, note.id, index)}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
          >
            <p className="note-date">{note.date || '—'}</p>
            <textarea
              className="note-text"
              value={note.text}
              rows={Math.max(1, Math.min(10, note.text.split('\n').length))}
              aria-label="Note"
              placeholder="_"
              onFocus={() => {
                startText.current.set(note.id, note.text)
                session.current.set(note.id, `${note.id}:${Date.now()}`)
              }}
              onChange={(e) => onEdit(note.id, e.target.value, sessionOf(note.id))}
              onBlur={(e) => {
                if (e.target.value.trim()) return
                onRemove(note.id, Boolean(startText.current.get(note.id)?.trim()), sessionOf(note.id))
              }}
              onKeyDown={(e) => {
                if (e.key === 'Escape') (e.target as HTMLTextAreaElement).blur()
              }}
            />
            {note.node != null ? (
              <button
                type="button"
                className="note-leash"
                aria-label="Unhitch note"
                title="Unhitch"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onHitch(note.id, null)}
              >
                → {byId(doc, note.node)?.title.trim() || '_'}
              </button>
            ) : null}
          </article>
        ))}
      </div>

      <button type="button" className="dump-add" data-testid="new-note" onClick={onAdd}>
        <Plus className="dump-add-glyph" />
        New note
      </button>
    </section>
  )
}
