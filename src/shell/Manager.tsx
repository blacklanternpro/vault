import { useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { childrenOf, laneOf, managerCards, type Doc } from '../speck/doc'
import { matchesFind, type Session } from '../speck/ir'
import { COL_ORDER, isBinderStatus, type ColName, type NodeStatus } from '../speck/tokens'
import { Mark } from './Mark'

const THRESH = 7

type Props = {
  doc: Doc
  session: Session
  onStage: (id: number, status: NodeStatus, beforeId: number | null | undefined) => void
  onFocus: (id: number) => void
  onRename: (id: number) => void
  onCreate: (status: ColName) => void
  onTitle: (value: string) => void
  onTitleCommit: () => void
}

type Drag = {
  id: number
  x: number
  y: number
  startX: number
  startY: number
  live: boolean
}

export function Manager({
  doc,
  session,
  onStage,
  onFocus,
  onRename,
  onCreate,
  onTitle,
  onTitleCommit,
}: Props) {
  const dragRef = useRef<Drag | null>(null)
  const ghostRef = useRef<HTMLDivElement | null>(null)

  const cards = managerCards(doc, null)
  const query = session.find

  function cardsIn(col: ColName) {
    return cards.filter((n) => laneOf(n.status) === col)
  }

  function dropAt(clientX: number, clientY: number): { lane: ColName; beforeId: number | null } | null {
    const node = document.elementFromPoint(clientX, clientY)
    const laneEl = node instanceof Element ? node.closest('[data-lane]') : null
    if (!laneEl) return null
    const lane = laneEl.getAttribute('data-lane')
    if (!lane || !isBinderStatus(lane)) return null
    const items = [...laneEl.querySelectorAll('[data-card-id]')]
    for (const item of items) {
      const id = Number(item.getAttribute('data-card-id'))
      const r = item.getBoundingClientRect()
      if (clientY < r.top + r.height / 2) return { lane, beforeId: id }
    }
    return { lane, beforeId: null }
  }

  function finishDrag(e: PointerEvent<HTMLElement>) {
    const drag = dragRef.current
    dragRef.current = null
    ghostRef.current?.remove()
    ghostRef.current = null
    e.stopPropagation()
    if (!drag) return
    if (!drag.live) {
      const target = e.target as HTMLElement
      if (target.closest('[data-title]')) onRename(drag.id)
      else onFocus(drag.id)
      return
    }
    const hit = dropAt(e.clientX, e.clientY)
    if (!hit) return
    const before = hit.beforeId === drag.id ? undefined : hit.beforeId
    onStage(drag.id, hit.lane, before)
  }

  function onCardDown(e: PointerEvent<HTMLElement>, id: number) {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { id, x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, live: false }
  }

  function onCardMove(e: PointerEvent<HTMLElement>) {
    const drag = dragRef.current
    if (!drag) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    if (!drag.live && dx * dx + dy * dy < THRESH * THRESH) return
    drag.live = true
    drag.x = e.clientX
    drag.y = e.clientY
    if (!ghostRef.current) {
      const origin = e.currentTarget.closest('[data-card-id]')
      if (origin instanceof HTMLElement) {
        const ghost = origin.cloneNode(true) as HTMLDivElement
        const r = origin.getBoundingClientRect()
        ghost.style.position = 'fixed'
        ghost.style.left = `${r.left}px`
        ghost.style.top = `${r.top}px`
        ghost.style.width = `${r.width}px`
        ghost.style.pointerEvents = 'none'
        ghost.style.zIndex = '80'
        ghost.style.opacity = '0.92'
        ghost.classList.add('is-ghost')
        document.body.appendChild(ghost)
        ghostRef.current = ghost
        drag.startX = e.clientX - r.left
        drag.startY = e.clientY - r.top
      }
    }
    if (ghostRef.current) {
      ghostRef.current.style.left = `${e.clientX - drag.startX}px`
      ghostRef.current.style.top = `${e.clientY - drag.startY}px`
    }
  }

  function onLaneUp(e: PointerEvent<HTMLElement>, col: ColName) {
    if (e.button !== 0) return
    const t = e.target as HTMLElement
    if (!t.closest('.lane-empty')) return
    onCreate(col)
  }

  return (
    <section className="manager" data-testid="manager" aria-label="Projects">
      {COL_ORDER.map((col) => (
        <div
          key={col}
          className="lane"
          data-lane={col}
          onPointerUp={(e) => onLaneUp(e, col)}
        >
          {cardsIn(col).map((node) => {
            const count = childrenOf(doc, node.id).length
            const editing = session.field?.id === node.id && session.field.slot === 'title'
            const live = session.nestFocus === node.id
            const found = matchesFind(session, node.title)
            return (
              <article
                key={node.id}
                className={`card${live ? ' is-live' : ''}${found ? ' is-found' : ''}${node.urgent ? ' is-urgent' : ''}${node.status === 'done' ? ' is-done' : ''}`}
                data-card-id={node.id}
                onPointerDown={(e) => onCardDown(e, node.id)}
                onPointerMove={onCardMove}
                onPointerUp={finishDrag}
                onPointerCancel={finishDrag}
              >
                {editing ? (
                  <input
                    className="card-input"
                    value={session.fieldBuffer}
                    autoFocus
                    aria-label="Project title"
                    placeholder="_"
                    onChange={(e) => onTitle(e.target.value)}
                    onBlur={onTitleCommit}
                    onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        onTitleCommit()
                      }
                    }}
                    onPointerDown={(e) => e.stopPropagation()}
                  />
                ) : (
                  <h2 className="card-title" data-title>
                    <Mark text={node.title} query={query} />
                  </h2>
                )}
                {count > 0 ? <p className="card-count">{count}</p> : null}
              </article>
            )
          })}
          <div className="lane-empty">_</div>
        </div>
      ))}
    </section>
  )
}
