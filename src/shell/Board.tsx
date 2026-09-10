import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import {
  boardCards,
  boardSatellites,
  byId,
  folderOf,
  laneOf,
  type Doc,
  type GraphNode,
} from '../speck/doc'
import { matchesFind, type Session } from '../speck/ir'
import { COL_ORDER, LANE_PLAQUE, isBinderStatus, type ColName, type NodeStatus } from '../speck/tokens'
import { Filament, type LiveLeash } from './Filament'
import { Plus, Ring } from './Glyph'
import { Mark } from './Mark'

const THRESH = 7

type BoardProps = {
  doc: Doc
  session: Session
  /** null shows every folder's jobs, which is the top bar's default. */
  filterId: number | null
  /** null keeps all five lanes; a lane name empties the others. */
  laneFilter: ColName | null
  urgentOnly: boolean
  onStage: (id: number, status: NodeStatus, beforeId: number | null | undefined) => void
  onPull: (id: number, status: NodeStatus, beforeId: number | null | undefined) => void
  onOpen: (id: number) => void
  onRename: (id: number) => void
  onDock: (id: number, parentId: number) => void
  onCreateJob: (status: ColName) => void
  onTitle: (value: string) => void
  onTitleCommit: () => void
  onFieldBlur: (id: number, slot: 'title' | 'body' | 'subtask' | 'status') => void
}

type Drag = {
  id: number
  kind: 'card' | 'nested'
  startX: number
  startY: number
  live: boolean
}

export function Board({
  doc,
  session,
  filterId,
  laneFilter,
  urgentOnly,
  onStage,
  onPull,
  onOpen,
  onRename,
  onDock,
  onCreateJob,
  onTitle,
  onTitleCommit,
  onFieldBlur,
}: BoardProps) {
  const dragRef = useRef<Drag | null>(null)
  const ghostRef = useRef<HTMLElement | null>(null)
  const originRef = useRef<HTMLElement | null>(null)
  const boardRef = useRef<HTMLDivElement | null>(null)
  const liveRef = useRef<LiveLeash | null>(null)
  const [dragging, setDragging] = useState(false)

  const cards = boardCards(doc, filterId)
  const satellites = useMemo(() => boardSatellites(doc, filterId), [doc, filterId])
  const query = session.find

  function cardsIn(col: ColName) {
    if (laneFilter && laneFilter !== col) return []
    return cards.filter((n) => laneOf(n.status) === col && (!urgentOnly || Boolean(n.urgent)))
  }

  function dropAt(clientX: number, clientY: number): { lane: ColName; beforeId: number | null } | null {
    const el = document.elementFromPoint(clientX, clientY)
    const laneEl = el instanceof Element ? el.closest('[data-lane]') : null
    if (!laneEl) return null
    const lane = laneEl.getAttribute('data-lane')
    if (!lane || !isBinderStatus(lane)) return null
    for (const item of laneEl.querySelectorAll('[data-card-id]')) {
      const id = Number(item.getAttribute('data-card-id'))
      const r = item.getBoundingClientRect()
      if (clientY < r.top + r.height / 2) return { lane, beforeId: id }
    }
    return { lane, beforeId: null }
  }

  /** Smallest slab under the pointer, so a satellite docks onto the card it lands on. */
  function dropDock(clientX: number, clientY: number, dragId: number): number | null {
    let best: { id: number; area: number } | null = null
    for (const el of document.querySelectorAll('[data-card-id]')) {
      const id = Number(el.getAttribute('data-card-id'))
      if (!Number.isFinite(id) || id === dragId) continue
      const r = el.getBoundingClientRect()
      if (clientX < r.left || clientX > r.right || clientY < r.top || clientY > r.bottom) continue
      const area = r.width * r.height
      if (!best || area < best.area) best = { id, area }
    }
    return best?.id ?? null
  }

  /**
   * Where the dragged card's leash end sits while it is airborne. A satellite
   * pays out from its left edge; a parent card feeds from its right.
   */
  function pinFromGhost(kind: Drag['kind'], id: number, ghost: HTMLElement) {
    const r = ghost.getBoundingClientRect()
    const sat = kind === 'nested' || Boolean(byId(doc, id)?.loose)
    liveRef.current = {
      id,
      parentId: byId(doc, id)?.parent ?? null,
      kind,
      x: sat ? r.left + 2 : r.right - 2,
      y: r.top + 14,
    }
  }

  function releaseOrigin() {
    if (!originRef.current) return
    originRef.current.classList.remove('is-away')
    originRef.current.style.pointerEvents = ''
    originRef.current = null
  }

  function beginDrag(e: PointerEvent<HTMLElement>, id: number, kind: Drag['kind']) {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('input, textarea, button')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { id, kind, startX: e.clientX, startY: e.clientY, live: false }
  }

  function onMove(e: PointerEvent<HTMLElement>) {
    const drag = dragRef.current
    if (!drag) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    if (!drag.live && dx * dx + dy * dy < THRESH * THRESH) return
    drag.live = true
    if (!ghostRef.current) {
      const origin = e.currentTarget.closest('[data-card-id]')
      if (origin instanceof HTMLElement) {
        const r = origin.getBoundingClientRect()
        const ghost = origin.cloneNode(true) as HTMLElement
        ghost.style.position = 'fixed'
        ghost.style.left = `${r.left}px`
        ghost.style.top = `${r.top}px`
        ghost.style.width = `${r.width}px`
        ghost.style.pointerEvents = 'none'
        ghost.style.zIndex = '80'
        ghost.classList.add('is-ghost')
        origin.classList.add('is-away')
        origin.style.pointerEvents = 'none'
        originRef.current = origin
        document.body.appendChild(ghost)
        ghostRef.current = ghost
        drag.startX = e.clientX - r.left
        drag.startY = e.clientY - r.top
        setDragging(true)
      }
    }
    if (ghostRef.current) {
      ghostRef.current.style.left = `${e.clientX - drag.startX}px`
      ghostRef.current.style.top = `${e.clientY - drag.startY}px`
      pinFromGhost(drag.kind, drag.id, ghostRef.current)
    }
  }

  function finishDrag(e: PointerEvent<HTMLElement>) {
    const drag = dragRef.current
    dragRef.current = null
    ghostRef.current?.remove()
    ghostRef.current = null
    liveRef.current = null
    if (dragging) setDragging(false)
    e.stopPropagation()
    if (!drag) {
      releaseOrigin()
      return
    }
    if (!drag.live) {
      releaseOrigin()
      const el = document.elementFromPoint(e.clientX, e.clientY)
      const target = el instanceof Element ? el : (e.target as Element)
      if (target.closest('[data-title]') && session.pipeOpen === drag.id) {
        onRename(drag.id)
        return
      }
      onOpen(drag.id)
      return
    }
    const dockId = dropDock(e.clientX, e.clientY, drag.id)
    const hit = dropAt(e.clientX, e.clientY)
    releaseOrigin()
    if (dockId != null && (drag.kind === 'nested' || Boolean(byId(doc, drag.id)?.loose))) {
      onDock(drag.id, dockId)
      return
    }
    if (!hit) return
    const before = hit.beforeId === drag.id ? undefined : hit.beforeId
    if (drag.kind === 'nested') onPull(drag.id, hit.lane, before)
    else onStage(drag.id, hit.lane, before)
  }

  function titleOf(node: GraphNode) {
    const editing = session.field?.id === node.id && session.field.slot === 'title'
    if (editing) {
      return (
        <input
          className="slab-input"
          value={session.fieldBuffer}
          autoFocus
          aria-label="Job title"
          placeholder="_"
          onChange={(e) => onTitle(e.target.value)}
          onBlur={() => onFieldBlur(node.id, 'title')}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onTitleCommit()
            }
          }}
          onPointerDown={(e) => e.stopPropagation()}
        />
      )
    }
    return (
      <h3 className="slab-title" data-title>
        <Mark text={node.title.trim() || '_'} query={query} />
      </h3>
    )
  }

  /** A jack shows only where a cable actually lands: on a satellite or its parent. */
  function jackOf(node: GraphNode) {
    if (node.loose && node.parent != null) return 'jack is-sat'
    if (satellites.some((sat) => sat.parent === node.id)) return 'jack is-host'
    return 'jack-anchor'
  }

  return (
    <div
      className={`board${dragging ? ' is-dragging' : ''}`}
      data-testid="manager"
      role="list"
      aria-label="Jobs by status"
      ref={boardRef}
    >
      <Filament
        doc={doc}
        satellites={satellites}
        hostRef={boardRef}
        liveRef={liveRef}
        dragging={dragging}
      />
      {COL_ORDER.map((col) => {
        const items = cardsIn(col)
        return (
          <section
            key={col}
            className="lane"
            data-lane={col}
            data-testid={`lane-${col}`}
            role="listitem"
            aria-label={LANE_PLAQUE[col]}
          >
            <header className="lane-head">
              <h2 className="lane-name">{LANE_PLAQUE[col]}</h2>
              <span className="lane-count">{items.length}</span>
            </header>
            <div className="lane-stack">
              {items.map((node) => {
                const open = session.pipeOpen === node.id
                const live = session.selected?.kind === 'NODE' && session.selected.id === node.id
                const found = matchesFind(session, node.title)
                const folder = folderOf(doc, node.id)
                return (
                  <article
                    key={node.id}
                    className={`slab${open ? ' is-open' : ''}${live ? ' is-live' : ''}${found ? ' is-found' : ''}${node.urgent ? ' is-urgent' : ''}${node.loose ? ' is-loose' : ''}`}
                    data-card-id={node.id}
                    onPointerDown={(e) => beginDrag(e, node.id, 'card')}
                    onPointerMove={onMove}
                    onPointerUp={finishDrag}
                    onPointerCancel={finishDrag}
                  >
                    <span className={jackOf(node)} data-jack={node.id} aria-hidden="true" />
                    <div className="slab-head">
                      {col === 'done' ? <Ring className="slab-tick" /> : null}
                      {titleOf(node)}
                    </div>
                    {folder ? (
                      <p className="slab-folder">{folder.title.trim() || '_'}</p>
                    ) : null}
                    {node.urgent ? <span className="slab-flag">URGENT</span> : null}
                  </article>
                )
              })}
              {items.length === 0 ? <div className="lane-void" /> : null}
              <button
                type="button"
                className="lane-add"
                data-testid={col === 'pending' ? 'ghost-plus' : `lane-add-${col}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onCreateJob(col)}
              >
                <Plus className="lane-add-glyph" />
                New job
              </button>
            </div>
          </section>
        )
      })}
    </div>
  )
}
