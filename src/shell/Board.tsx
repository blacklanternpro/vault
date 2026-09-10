import { useMemo, useRef, type KeyboardEvent, type RefObject } from 'react'
import { boardCards, boardSatellites, folderOf, laneOf, type Doc, type GraphNode } from '../speck/doc'
import { matchesFind, type Session } from '../speck/ir'
import { COL_ORDER, LANE_PLAQUE, type ColName } from '../speck/tokens'
import { Filament, type LiveLeash } from './Filament'
import { Plus, Ring } from './Glyph'
import { Mark } from './Mark'
import type { JobDrag } from './useJobDrag'

type BoardProps = {
  doc: Doc
  session: Session
  /** null shows every folder's jobs, which is the top bar's default. */
  filterId: number | null
  /** null keeps all five lanes; a lane name empties the others. */
  laneFilter: ColName | null
  urgentOnly: boolean
  drag: JobDrag
  /** Shared with the drawer, so a subtask pulled from it pays out a cable too. */
  liveRef: RefObject<LiveLeash | null>
  dragging: boolean
  onCreateJob: (status: ColName) => void
  onTitle: (value: string) => void
  onTitleCommit: () => void
  onFieldBlur: (id: number, slot: 'title' | 'body' | 'subtask' | 'status') => void
}

export function Board({
  doc,
  session,
  filterId,
  laneFilter,
  urgentOnly,
  drag,
  liveRef,
  dragging,
  onCreateJob,
  onTitle,
  onTitleCommit,
  onFieldBlur,
}: BoardProps) {
  const boardRef = useRef<HTMLDivElement | null>(null)

  const cards = boardCards(doc, filterId)
  const satellites = useMemo(() => boardSatellites(doc, filterId), [doc, filterId])
  const query = session.find

  function cardsIn(col: ColName) {
    if (laneFilter && laneFilter !== col) return []
    return cards.filter((n) => laneOf(n.status) === col && (!urgentOnly || Boolean(n.urgent)))
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
                    onPointerDown={(e) => drag.beginDrag(e, node.id, 'card', '[data-card-id]')}
                    onPointerMove={drag.onMove}
                    onPointerUp={drag.finishDrag}
                    onPointerCancel={drag.finishDrag}
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
