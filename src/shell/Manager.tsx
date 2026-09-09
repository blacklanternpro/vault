import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import {
  byId,
  childrenOf,
  laneOf,
  managerCards,
  nestedOf,
  projectIdOf,
  type Doc,
  type GraphNode,
} from '../speck/doc'
import { matchesFind, type Session } from '../speck/ir'
import { COL_ORDER, LANE_PLAQUE, isBinderStatus, type ColName, type NodeStatus } from '../speck/tokens'
import { Filament, type LiveLeash } from './Filament'
import { Mark } from './Mark'

const THRESH = 7

type Props = {
  doc: Doc
  session: Session
  onStage: (id: number, status: NodeStatus, beforeId: number | null | undefined) => void
  onPull: (id: number, status: NodeStatus, beforeId: number | null | undefined) => void
  onFocus: (id: number) => void
  onRename: (id: number) => void
  onEditBody: (id: number) => void
  onAddNested: (parentId: number) => void
  onCreateJob: () => void
  onTitle: (value: string) => void
  onTitleCommit: () => void
  onFieldBlur: (id: number, slot: 'title' | 'body' | 'subtask' | 'status') => void
}

type Drag = {
  kind: 'card' | 'nested'
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
  onPull,
  onFocus,
  onRename,
  onEditBody,
  onAddNested,
  onCreateJob,
  onTitle,
  onTitleCommit,
  onFieldBlur,
}: Props) {
  const dragRef = useRef<Drag | null>(null)
  const ghostRef = useRef<HTMLDivElement | null>(null)
  const originRef = useRef<HTMLElement | null>(null)
  const rackRef = useRef<HTMLElement | null>(null)
  const liveRef = useRef<LiveLeash | null>(null)
  const [dragging, setDragging] = useState(false)

  const projectId = projectIdOf(doc, session.projectId)
  const cards = managerCards(doc, projectId)
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

  function pinFromGhost(kind: Drag['kind'], id: number, ghost: HTMLElement) {
    const r = ghost.getBoundingClientRect()
    const sat = kind === 'nested' || Boolean(byId(doc, id)?.loose)
    liveRef.current = {
      id,
      parentId: byId(doc, id)?.parent ?? null,
      kind,
      x: sat ? r.left + 2 : r.right - 2,
      y: r.top + (sat ? 12 : 14),
    }
  }

  function finishDrag(e: PointerEvent<HTMLElement>) {
    const drag = dragRef.current
    dragRef.current = null
    ghostRef.current?.remove()
    ghostRef.current = null
    originRef.current?.classList.remove('is-away')
    originRef.current = null
    liveRef.current = null
    if (dragging) setDragging(false)
    e.stopPropagation()
    if (!drag) return
    if (!drag.live) {
      const target = e.target as HTMLElement
      if (target.closest('[data-nest-add]')) return
      if (target.closest('[data-body]')) {
        onEditBody(drag.id)
        return
      }
      if (target.closest('[data-title]')) {
        onRename(drag.id)
        return
      }
      onFocus(drag.id)
      return
    }
    const hit = dropAt(e.clientX, e.clientY)
    if (!hit) return
    const before = hit.beforeId === drag.id ? undefined : hit.beforeId
    if (drag.kind === 'nested') onPull(drag.id, hit.lane, before)
    else onStage(drag.id, hit.lane, before)
  }

  function beginCardDrag(e: PointerEvent<HTMLElement>, id: number) {
    if ((e.target as HTMLElement).closest('[data-nested-id], [data-body], [data-nest-add], input, textarea, button')) {
      return
    }
    beginDrag(e, id, 'card')
  }

  function livePair(): Set<number> {
    const ids = new Set<number>()
    const drag = dragRef.current
    if (!dragging || !drag) return ids
    ids.add(drag.id)
    const parent = byId(doc, drag.id)?.parent
    if (parent != null) ids.add(parent)
    return ids
  }

  function showsJack(node: GraphNode) {
    if (node.loose) return true
    if (childrenOf(doc, node.id).some((c) => c.loose)) return true
    const drag = dragRef.current
    if (dragging && drag?.kind === 'nested' && byId(doc, drag.id)?.parent === node.id) return true
    return false
  }

  function jackClass(id: number) {
    return livePair().has(id) ? 'jack is-live' : 'jack'
  }

  function beginDrag(e: PointerEvent<HTMLElement>, id: number, kind: Drag['kind']) {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { kind, id, x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, live: false }
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
      const origin =
        drag.kind === 'nested'
          ? e.currentTarget.closest('[data-nested-id]')
          : e.currentTarget.closest('[data-card-id]')
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
        origin.classList.add('is-away')
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

  function titleField(node: GraphNode, kind: 'job' | 'sat' | 'nested') {
    const editing = session.field?.id === node.id && session.field.slot === 'title'
    const inputClass = kind === 'nested' ? 'nested-input' : 'card-input'
    const titleClass = kind === 'nested' ? 'nested-title' : 'card-title'
    const label = kind === 'nested' ? 'Subtask title' : kind === 'sat' ? 'Satellite title' : 'Job title'
    if (editing) {
      return (
        <input
          className={inputClass}
          value={session.fieldBuffer}
          autoFocus
          aria-label={label}
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
    const Tag = kind === 'nested' ? 'p' : 'h2'
    return (
      <Tag className={titleClass} data-title>
        <Mark text={node.title} query={query} />
      </Tag>
    )
  }

  function bodyField(node: GraphNode, kind: 'job' | 'sat' | 'nested', live: boolean) {
    const editing = session.field?.id === node.id && session.field.slot === 'body'
    const show = editing || Boolean(node.body) || (kind !== 'nested' && live)
    if (!show) return null
    const inputClass = kind === 'nested' ? 'nested-body-input' : 'card-body-input'
    const bodyClass = kind === 'nested' ? 'nested-body' : 'card-body'
    if (editing) {
      return (
        <input
          className={inputClass}
          data-body
          data-testid={`body-${node.id}`}
          value={session.fieldBuffer}
          autoFocus
          aria-label="Body"
          placeholder="_"
          onChange={(e) => onTitle(e.target.value)}
          onBlur={() => onFieldBlur(node.id, 'body')}
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
      <p
        className={bodyClass}
        data-body
        data-testid={`body-${node.id}`}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onEditBody(node.id)}
      >
        {node.body || '_'}
      </p>
    )
  }

  function statusField(node: GraphNode) {
    if (session.field?.id !== node.id || session.field.slot !== 'status') return null
    return (
      <input
        className="card-body-input"
        value={session.fieldBuffer}
        autoFocus
        aria-label="Status"
        onChange={(e) => onTitle(e.target.value)}
        onBlur={() => onFieldBlur(node.id, 'status')}
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

  function nestTick(id: number) {
    const editing = session.field?.id === id && session.field.slot === 'subtask'
    if (editing) {
      return (
        <input
          className="nested-input"
          data-nest-add
          data-testid={`nest-add-${id}`}
          value={session.fieldBuffer}
          autoFocus
          aria-label="Subtask"
          placeholder="+"
          onChange={(e) => onTitle(e.target.value)}
          onBlur={() => onFieldBlur(id, 'subtask')}
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
      <button
        type="button"
        className="nest-tick"
        data-nest-add
        data-testid={`nest-add-${id}`}
        aria-label="Add nested"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={() => onAddNested(id)}
      >
        +
      </button>
    )
  }

  function hitchType(id: number) {
    const n = doc.notes.filter((note) => note.node === id).length
    if (n === 0) return null
    return (
      <p className="card-hitch">
        {n} hitch
      </p>
    )
  }

  function nestedTree(parentId: number, depth: number): ReactNode {
    return nestedOf(doc, parentId).map((node) => (
      <div key={node.id} className="nested-block">
        <div
          className={`nested-row${node.urgent ? ' is-urgent' : ''}`}
          data-nested-id={node.id}
          style={{ paddingLeft: 6 + depth * 10 }}
          onPointerDown={(e) => {
            e.stopPropagation()
            if ((e.target as HTMLElement).closest('[data-body], [data-nest-add], input, button')) return
            beginDrag(e, node.id, 'nested')
          }}
          onPointerMove={onCardMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
        >
          {titleField(node, 'nested')}
          {showsJack(node) ? <span className={jackClass(node.id)} data-jack={node.id} aria-hidden="true" /> : (
            <span data-jack={node.id} className="jack-anchor" aria-hidden="true" />
          )}
        </div>
        {bodyField(node, 'nested', false)}
        {statusField(node)}
        {nestedTree(node.id, depth + 1)}
        {nestTick(node.id)}
      </div>
    ))
  }

  return (
    <section className="manager" ref={rackRef} data-testid="manager" aria-label="Jobs">
      <Filament doc={doc} projectId={projectId} hostRef={rackRef} liveRef={liveRef} dragging={dragging} />
      {COL_ORDER.map((col) => {
        const items = cardsIn(col)
        return (
          <div
            key={col}
            className={`lane${col === 'dusted' ? ' is-dusted' : ''}`}
            data-lane={col}
            data-testid={`lane-${col}`}
          >
            <div className="lane-plaque">
              <span>{LANE_PLAQUE[col]}</span>
              <span className="lane-count">{items.length}</span>
            </div>
            {items.map((node) => {
              const live =
                session.nestFocus === node.id ||
                (session.selected?.kind === 'NODE' && session.selected.id === node.id)
              const found = matchesFind(session, node.title)
              const sat = Boolean(node.loose)
              return (
                <article
                  key={node.id}
                  className={`card${sat ? ' is-sat' : ' is-job'}${live ? ' is-live' : ''}${found ? ' is-found' : ''}${node.urgent ? ' is-urgent' : ''}${node.status === 'done' || node.status === 'dusted' ? ' is-quiet' : ''}`}
                  data-card-id={node.id}
                  onPointerDown={(e) => beginCardDrag(e, node.id)}
                  onPointerMove={onCardMove}
                  onPointerUp={finishDrag}
                  onPointerCancel={finishDrag}
                >
                  {showsJack(node) ? (
                    <span className={jackClass(node.id)} data-jack={node.id} aria-hidden="true" />
                  ) : (
                    <span data-jack={node.id} className="jack-anchor" aria-hidden="true" />
                  )}
                  {titleField(node, sat ? 'sat' : 'job')}
                  {bodyField(node, sat ? 'sat' : 'job', live)}
                  {statusField(node)}
                  {hitchType(node.id)}
                  <div className="nest-list">
                    {nestedTree(node.id, 0)}
                    {nestTick(node.id)}
                  </div>
                </article>
              )
            })}
            {col === 'pending' ? (
              <button
                type="button"
                className="ghost-plus"
                data-testid="ghost-plus"
                aria-label="Add job"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => onCreateJob()}
              >
                +
              </button>
            ) : null}
            {items.length === 0 && col !== 'pending' ? <div className="lane-empty">_</div> : null}
          </div>
        )
      })}
    </section>
  )
}
