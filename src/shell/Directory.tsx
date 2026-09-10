import { useRef, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import { childrenOf, isBoardVisible, laneOf, type Doc } from '../speck/doc'
import { matchesFind, type Session } from '../speck/ir'
import { LANE_PLAQUE, isBinderStatus, type ColName, type NodeStatus } from '../speck/tokens'
import { nestRows, type NestRow } from '../speck/tree'
import { Mark } from './Mark'

const THRESH = 6

type DirectoryProps = {
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
}: DirectoryProps) {
  const dragRef = useRef<Drag | null>(null)
  const ghostRef = useRef<HTMLElement | null>(null)
  const skipClick = useRef(false)
  const rows = nestRows(doc, session)
  const cols = columnsOf(rows)
  const selectedId = session.selected?.kind === 'NODE' ? session.selected.id : null

  function dropLane(clientX: number, clientY: number): ColName | null {
    const el = document.elementFromPoint(clientX, clientY)
    const laneEl = el instanceof Element ? el.closest('[data-lane]') : null
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
    if (!ghostRef.current) {
      const origin = e.currentTarget.closest('[data-node-id]')
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
    if ((e.target as HTMLElement).closest('.stem-fold, input')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, live: false }
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
    const project = row.node.parent == null
    const lane = laneOf(row.node.status)

    return (
      <div
        key={id}
        className={`stem${selected ? ' is-live' : ''}${found ? ' is-found' : ''}${project ? ' is-project' : ' is-job'}`}
        data-node-id={id}
        data-testid={`dir-row-${id}`}
        onPointerDown={(e) => beginRow(e, id)}
        onPointerMove={onRowMove}
        onPointerUp={(e) => finishDrag(e, id)}
        onPointerCancel={(e) => finishDrag(e, id)}
      >
        <span className="stem-rule" aria-hidden="true">
          {row.prefix}
        </span>
        {kids.length ? (
          <button
            type="button"
            className="stem-fold"
            aria-label={closed ? `Expand ${row.node.title}` : `Collapse ${row.node.title}`}
            aria-expanded={!closed}
            onClick={(e) => {
              e.stopPropagation()
              onToggle(id)
            }}
          >
            {closed ? '+' : '-'}
          </button>
        ) : (
          <span className="stem-fold" aria-hidden="true" />
        )}
        {editing ? (
          <input
            className="stem-input"
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
          <span
            className="stem-name"
            onClick={(e) => {
              e.stopPropagation()
              if (skipClick.current) {
                skipClick.current = false
                return
              }
              if (selected) onRename(id)
              else onSelect(id)
            }}
          >
            <Mark text={row.node.title.trim() || '_'} query={session.find} />
          </span>
        )}
        {project ? null : (
          <button
            type="button"
            className="stem-status"
            data-testid={`dir-on-${id}`}
            aria-label={`Advance ${row.node.title} from ${LANE_PLAQUE[lane]}`}
            onClick={(e) => {
              e.stopPropagation()
              onShovel(id)
            }}
          >
            {LANE_PLAQUE[lane]}
          </button>
        )}
      </div>
    )
  }

  return (
    <section className="directory" data-testid="directory" aria-label="Catalogue" onClick={onPane}>
      <div className="section-head">
        <h2 className="section-name">Catalogue</h2>
        <span className="section-note">
          {cols.length === 1 ? '1 folder' : `${cols.length} folders`}
        </span>
        <button type="button" className="section-act" onClick={() => onAdd(null)}>
          New folder
        </button>
      </div>

      <div className="forest">
        {cols.map((col) => {
          const root = col[0]?.node
          const ids = new Set(col.map((r) => r.node.id))
          const addParent =
            selectedId != null && ids.has(selectedId) ? selectedId : root ? root.id : session.nestFocus
          return (
            <div key={root?.id ?? 'col'} className="forest-col">
              {col.map(renderRow)}
              <button
                type="button"
                className="stem stem-ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  onAdd(addParent ?? null)
                }}
              >
                <span className="stem-rule" aria-hidden="true">
                  {'└── '}
                </span>
                <span className="stem-name">New job</span>
              </button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
