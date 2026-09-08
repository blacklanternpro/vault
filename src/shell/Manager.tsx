import { useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'
import { laneOf, managerCards, nestedOf, projectIdOf, type Doc, type GraphNode } from '../speck/doc'
import { matchesFind, type Session } from '../speck/ir'
import { COL_ORDER, LANE_PLAQUE, isBinderStatus, type ColName, type NodeStatus } from '../speck/tokens'
import { Filament } from './Filament'
import { Mark } from './Mark'

const THRESH = 7

type Props = {
  doc: Doc
  session: Session
  onStage: (id: number, status: NodeStatus, beforeId: number | null | undefined) => void
  onPull: (id: number, status: NodeStatus, beforeId: number | null | undefined) => void
  onFocus: (id: number) => void
  onRename: (id: number) => void
  onAddNested: (parentId: number) => void
  onCreateJob: () => void
  onTitle: (value: string) => void
  onTitleCommit: () => void
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
  onAddNested,
  onCreateJob,
  onTitle,
  onTitleCommit,
}: Props) {
  const dragRef = useRef<Drag | null>(null)
  const ghostRef = useRef<HTMLDivElement | null>(null)
  const rackRef = useRef<HTMLElement | null>(null)

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

  function finishDrag(e: PointerEvent<HTMLElement>) {
    const drag = dragRef.current
    dragRef.current = null
    ghostRef.current?.remove()
    ghostRef.current = null
    e.stopPropagation()
    if (!drag) return
    if (!drag.live) {
      const target = e.target as HTMLElement
      if (drag.kind === 'nested') onFocus(drag.id)
      else if (target.closest('[data-title]')) onRename(drag.id)
      else onAddNested(drag.id)
      return
    }
    const hit = dropAt(e.clientX, e.clientY)
    if (!hit) return
    const before = hit.beforeId === drag.id ? undefined : hit.beforeId
    if (drag.kind === 'nested') onPull(drag.id, hit.lane, before)
    else onStage(drag.id, hit.lane, before)
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
          onBlur={onTitleCommit}
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

  function nestedTree(parentId: number, depth: number): ReactNode {
    return nestedOf(doc, parentId).map((node) => (
      <div key={node.id} className="nested-block">
        <div
          className={`nested-row${node.urgent ? ' is-urgent' : ''}`}
          data-nested-id={node.id}
          style={{ paddingLeft: 4 + depth * 10 }}
          onPointerDown={(e) => {
            e.stopPropagation()
            beginDrag(e, node.id, 'nested')
          }}
          onPointerMove={onCardMove}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
        >
          {titleField(node, 'nested')}
          <span className="jack" data-jack={node.id} aria-hidden="true" />
        </div>
        {nestedTree(node.id, depth + 1)}
      </div>
    ))
  }

  return (
    <section className="manager" ref={rackRef} data-testid="manager" aria-label="Jobs">
      <span className="fastener fastener-tl" aria-hidden="true" />
      <span className="fastener fastener-tr" aria-hidden="true" />
      <span className="fastener fastener-bl" aria-hidden="true" />
      <span className="fastener fastener-br" aria-hidden="true" />
      <Filament doc={doc} projectId={projectId} hostRef={rackRef} />
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
              const nested = nestedOf(doc, node.id)
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
                  onPointerDown={(e) => beginDrag(e, node.id, 'card')}
                  onPointerMove={onCardMove}
                  onPointerUp={finishDrag}
                  onPointerCancel={finishDrag}
                >
                  <span className="jack" data-jack={node.id} aria-hidden="true" />
                  {titleField(node, sat ? 'sat' : 'job')}
                  <div className="job-well" data-well>
                    {nestedTree(node.id, 0)}
                    {nested.length === 0 ? <span className="well-ghost">_</span> : null}
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
            <div className="lane-empty">_</div>
          </div>
        )
      })}
    </section>
  )
}
