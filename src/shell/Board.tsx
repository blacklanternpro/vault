import { useMemo, useRef, type KeyboardEvent, type RefObject } from 'react'
import { boardCards, boardSatellites, folderOf, laneOf, type Doc, type GraphNode } from '../speck/doc'
import { type Session } from '../speck/ir'
import { COL_ORDER, LANE_PLAQUE, type ColName } from '../speck/tokens'
import { Filament, type LiveLeash } from './Filament'
import { Chevron, Plus, Ring } from './Glyph'
import { Mark } from './Mark'
import { useBoardFlip, type Settling } from './useBoardFlip'
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
  /** Set by the drag, read by the move animation: whose landing is already flying. */
  settling: RefObject<Settling>
  dragging: boolean
  onCreateJob: (status: ColName) => void
  /** Puts the job in the next lane along, which is the board's own verb. */
  onShovel: (id: number) => void
  onTitle: (value: string) => void
  onTitleCommit: () => void
  onFieldBlur: (id: number, slot: 'title' | 'body' | 'subtask' | 'status') => void
}

/** The lane a shovel moves a card into, or null at the end of the rack. */
function nextOf(col: ColName): ColName | null {
  return COL_ORDER[COL_ORDER.indexOf(col) + 1] ?? null
}

export function Board({
  doc,
  session,
  filterId,
  laneFilter,
  urgentOnly,
  drag,
  liveRef,
  settling,
  dragging,
  onCreateJob,
  onShovel,
  onTitle,
  onTitleCommit,
  onFieldBlur,
}: BoardProps) {
  const boardRef = useRef<HTMLDivElement | null>(null)

  const cards = boardCards(doc, filterId)
  const satellites = useMemo(() => boardSatellites(doc, filterId), [doc, filterId])
  const query = session.find

  /* Every one of these puts cards somewhere else, so all of them re-measure. */
  const layout = useMemo(() => ({ doc, filterId, laneFilter, urgentOnly }), [doc, filterId, laneFilter, urgentOnly])
  useBoardFlip(boardRef, layout, settling)

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
        const shoveTo = nextOf(col)
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
                const folder = folderOf(doc, node.id)
                return (
                  <article
                    key={node.id}
                    className={`slab${open ? ' is-open' : ''}${live ? ' is-live' : ''}${node.urgent ? ' is-urgent' : ''}${node.loose ? ' is-loose' : ''}`}
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
                    {/*
                      The lane a card sits in is its status, so the card's one
                      quick action is to put itself in the next lane along. The
                      last lane has nowhere to go, so it offers nothing.
                    */}
                    {shoveTo ? (
                      <button
                        type="button"
                        className="slab-shovel"
                        data-testid={`slab-shovel-${node.id}`}
                        aria-label={`Move ${node.title.trim() || 'job'} to ${LANE_PLAQUE[shoveTo]}`}
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation()
                          onShovel(node.id)
                        }}
                      >
                        <Chevron className="slab-shovel-glyph" />
                      </button>
                    ) : null}
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
