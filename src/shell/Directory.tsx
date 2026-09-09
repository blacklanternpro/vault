import { useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import { childrenOf, isBoardVisible, type Doc } from '../speck/doc'
import { matchesFind, type Session } from '../speck/ir'
import { isBinderStatus, type ColName, type NodeStatus } from '../speck/tokens'
import { nestRows, type NestRow } from '../speck/tree'
import { Mark } from './Mark'

const THRESH = 6

type Props = {
  doc: Doc
  session: Session
  onSelect: (id: number) => void
  onRename: (id: number) => void
  onToggle: (id: number) => void
  onAdd: (parent: number | null) => void
  onStage: (id: number, status: NodeStatus) => void
  onShovel: (id: number) => void
  onClearFocus: () => void
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

function columnsOf(rows: NestRow[]): NestRow[][] {
  const cols: NestRow[][] = []
  for (const row of rows) {
    if (row.depth === 0) cols.push([row])
    else cols[cols.length - 1]?.push(row)
  }
  return cols
}

export function Directory({
  doc,
  session,
  onSelect,
  onRename,
  onToggle,
  onAdd,
  onStage,
  onShovel,
  onClearFocus,
  onTitle,
  onTitleCommit,
}: Props) {
  const dragRef = useRef<Drag | null>(null)
  const ghostRef = useRef<HTMLDivElement | null>(null)
  const skipClick = useRef(false)
  const rows = nestRows(doc, session)
  const cols = columnsOf(rows)
  const selectedId = session.selected?.kind === 'NODE' ? session.selected.id : null

  function dropLane(clientX: number, clientY: number): ColName | null {
    const node = document.elementFromPoint(clientX, clientY)
    const laneEl = node instanceof Element ? node.closest('[data-lane]') : null
    if (!laneEl) return null
    const lane = laneEl.getAttribute('data-lane')
    if (!lane || !isBinderStatus(lane)) return null
    return lane
  }

  function finishDrag(e: PointerEvent<HTMLElement>, id: number) {
    const drag = dragRef.current
    dragRef.current = null
    ghostRef.current?.remove()
    ghostRef.current = null
    if (!drag) return
    skipClick.current = true
    if (!drag.live) {
      if (selectedId === id) onRename(id)
      else onSelect(id)
      return
    }
    const lane = dropLane(e.clientX, e.clientY)
    if (lane) onStage(id, lane)
  }

  function onRowMove(e: PointerEvent<HTMLElement>) {
    const drag = dragRef.current
    if (!drag) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    if (!drag.live && dx * dx + dy * dy < THRESH * THRESH) return
    drag.live = true
    drag.x = e.clientX
    drag.y = e.clientY
    if (!ghostRef.current) {
      const origin = e.currentTarget.closest('[data-node-id]')
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
        ghost.querySelectorAll('*').forEach((n) => {
          ;(n as HTMLElement).style.pointerEvents = 'none'
        })
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

  function beginRow(e: PointerEvent<HTMLElement>, id: number) {
    if (e.button !== 0) return
    if ((e.target as HTMLElement).closest('.dir-stem, .dir-on, input')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { id, x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, live: false }
  }

  function onPane(e: MouseEvent<HTMLElement>) {
    if (e.target === e.currentTarget) onClearFocus()
  }

  function renderRow(row: NestRow) {
    const id = row.node.id
    const kids = childrenOf(doc, id)
    const selected = selectedId === id
    const editing =
      session.field?.id === id &&
      session.field.slot === 'title' &&
      !isBoardVisible(doc, session.projectId, id)
    const found = matchesFind(session, row.node.title)
    const closed = session.nestClosed.includes(id)
    const staged = isBoardVisible(doc, session.projectId, id)
    const stem = `${row.prefix}${closed && kids.length ? '+ ' : ''}`
    return (
      <div
        key={id}
        className={`dir-row${selected ? ' is-selected' : ''}${found ? ' is-found' : ''}${row.node.urgent ? ' is-urgent' : ''}`}
        data-node-id={id}
        data-testid={`dir-row-${id}`}
        onPointerDown={(e) => beginRow(e, id)}
        onPointerMove={onRowMove}
        onPointerUp={(e) => finishDrag(e, id)}
        onPointerCancel={(e) => finishDrag(e, id)}
      >
        <button
          type="button"
          className={`dir-stem${kids.length ? ' is-fold' : ''}`}
          aria-hidden={!kids.length && !stem}
          aria-label={kids.length ? (closed ? 'Expand' : 'Collapse') : undefined}
          tabIndex={kids.length ? 0 : -1}
          onClick={(e) => {
            e.stopPropagation()
            if (kids.length) onToggle(id)
          }}
        >
          {stem}
        </button>
        {editing ? (
          <input
            className="dir-input"
            value={session.fieldBuffer}
            autoFocus
            aria-label="Task title"
            placeholder="_"
            onChange={(e) => onTitle(e.target.value)}
            onBlur={onTitleCommit}
            onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onTitleCommit()
              }
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <button
            type="button"
            className={`dir-name${selected ? ' is-on' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              if (skipClick.current) {
                skipClick.current = false
                return
              }
              if (selected) onRename(id)
              else onSelect(id)
            }}
            onKeyDown={(e: KeyboardEvent<HTMLButtonElement>) => {
              if (e.key === 'Enter' && selected) {
                e.preventDefault()
                onRename(id)
              }
            }}
          >
            <Mark text={row.node.title} query={session.find} />
          </button>
        )}
        <button
          type="button"
          className={`dir-on${staged ? ' is-live' : ''}`}
          data-testid={`dir-on-${id}`}
          aria-label="Stage"
          onClick={(e) => {
            e.stopPropagation()
            onShovel(id)
          }}
        >
          ON
        </button>
      </div>
    )
  }

  return (
    <section className="directory" data-testid="directory" aria-label="Tasks" onClick={onPane}>
      <div className="dir-forest">
        {cols.map((col) => {
          const root = col[0]?.node
          const ids = new Set(col.map((r) => r.node.id))
          const addParent =
            selectedId != null && ids.has(selectedId)
              ? selectedId
              : root
                ? root.id
                : session.nestFocus
          return (
            <div key={root?.id ?? 'col'} className="dir-col">
              {col.map(renderRow)}
              <button
                type="button"
                className="dir-ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onAdd(addParent ?? null)
                }}
              >
                {col.length && root?.parent == null ? '└── _' : '_'}
              </button>
            </div>
          )
        })}
      </div>
      {cols.length === 0 ? (
        <button
          type="button"
          className="dir-ghost"
          onClick={(e) => {
            e.stopPropagation()
            onAdd(null)
          }}
        >
          _
        </button>
      ) : null}
    </section>
  )
}
