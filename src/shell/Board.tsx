import { useMemo, useRef, useState, type FocusEvent, type KeyboardEvent, type RefObject } from 'react'
import { boardCards, projectOf, projectsOf, progressOf, satellitesOf } from '../model/doc'
import { LANES, LANE_LABEL, type Doc, type Lane, type Node } from '../model/types'
import { Filament, type LiveLeash } from './Filament'
import { Chevron, Plus, Ring } from './Glyph'
import { InlineEdit } from './InlineEdit'
import { Mark } from './Mark'
import type { Draft, Editing } from './Studio'
import { useBoardFlip, type Settling } from './useBoardFlip'
import type { JobDrag } from './useJobDrag'

type BoardProps = {
  doc: Doc
  query: string
  selectedId: number | null
  editing: Editing | null
  draft: Draft | null
  /** null shows every project's tasks. */
  filterId: number | null
  /** null keeps all five lanes; a lane name empties the others. */
  laneFilter: Lane | null
  urgentOnly: boolean
  /** Cards that match the search, or null when not searching. */
  hits: Set<number> | null
  openId: number | null
  drag: JobDrag
  liveRef: RefObject<LiveLeash | null>
  settling: RefObject<Settling>
  dragging: boolean
  onOpen: (id: number) => void
  onDelete: (id: number) => void
  onAdvance: (id: number, lane: Lane) => void
  onStartTask: (lane: Lane) => void
  onDraftCommit: (title: string, lane: Lane, project: number | null) => void
  onRename: (id: number, title: string) => void
  onEditTitle: (id: number) => void
}

function nextOf(lane: Lane): Lane | null {
  return LANES[LANES.indexOf(lane) + 1] ?? null
}

export function Board(props: BoardProps) {
  const { doc, query, selectedId, editing, draft, filterId, laneFilter, urgentOnly, hits, openId, drag } = props
  const boardRef = useRef<HTMLDivElement | null>(null)
  const cards = boardCards(doc, filterId)
  const satellites = useMemo(() => satellitesOf(doc, filterId), [doc, filterId])
  const layout = useMemo(() => ({ doc, filterId, laneFilter, urgentOnly, hits }), [doc, filterId, laneFilter, urgentOnly, hits])
  useBoardFlip(boardRef, layout, props.settling)

  /*
   * The chevron is hidden until hover, which a tap synthesises along with the
   * click. Reading which pointer pressed lets the chevron decline a finger and
   * hand the gesture back to the card.
   */
  const pressedWith = useRef('mouse')

  function cardsIn(lane: Lane) {
    if (laneFilter && laneFilter !== lane) return []
    return cards.filter(
      (n) => (n.status === 'none' ? 'pending' : n.status) === lane && (!urgentOnly || n.urgent) && (!hits || hits.has(n.id)),
    )
  }

  function onCardKey(e: KeyboardEvent<HTMLElement>, node: Node) {
    if (e.target !== e.currentTarget) return
    if (e.key === 'Enter') {
      e.preventDefault()
      props.onOpen(node.id)
    } else if (e.key === 'F2') {
      e.preventDefault()
      props.onEditTitle(node.id)
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault()
      props.onDelete(node.id)
    }
  }

  function jackOf(node: Node) {
    if (node.loose && node.parent != null) return 'jack is-sat'
    if (satellites.some((sat) => sat.parent === node.id)) return 'jack is-host'
    return 'jack-anchor'
  }

  return (
    <div
      className={`board${props.dragging ? ' is-dragging' : ''}`}
      data-testid="board"
      role="list"
      aria-label="Tasks by status"
      ref={boardRef}
      onPointerDownCapture={(e) => {
        pressedWith.current = e.pointerType
      }}
    >
      <Filament doc={doc} satellites={satellites} hostRef={boardRef} liveRef={props.liveRef} dragging={props.dragging} />
      {LANES.map((lane) => {
        const items = cardsIn(lane)
        const shoveTo = nextOf(lane)
        const drafting = draft?.where === 'board' && draft.lane === lane ? draft : null
        return (
          <section key={lane} className="lane" data-lane={lane} data-testid={`lane-${lane}`} role="listitem" aria-label={LANE_LABEL[lane]}>
            <header className="lane-head">
              <h2 className="lane-name">{LANE_LABEL[lane]}</h2>
              <span className="lane-count">{items.length}</span>
            </header>
            <div className="lane-stack">
              {items.map((node) => {
                const isOpen = openId === node.id
                const live = selectedId === node.id
                const project = projectOf(doc, node.id)
                const { done, total } = progressOf(doc, node.id)
                const editingHere = editing?.id === node.id && editing.where === 'board'
                return (
                  <article
                    key={node.id}
                    tabIndex={0}
                    aria-label={`${node.title || 'untitled'}, ${LANE_LABEL[lane]}`}
                    className={`slab${isOpen ? ' is-open' : ''}${live ? ' is-live' : ''}${node.urgent ? ' is-urgent' : ''}${node.loose ? ' is-loose' : ''}`}
                    data-card-id={node.id}
                    data-testid={`card-${node.id}`}
                    onKeyDown={(e) => onCardKey(e, node)}
                    onDoubleClick={() => props.onEditTitle(node.id)}
                    onPointerDown={(e) => drag.beginDrag(e, node.id, 'card', '[data-card-id]')}
                    onPointerMove={drag.onMove}
                    onPointerUp={drag.finishDrag}
                    onPointerCancel={drag.finishDrag}
                  >
                    <span className={jackOf(node)} data-jack={node.id} aria-hidden="true" />
                    <div className="slab-head">
                      {lane === 'done' ? <Ring className="slab-tick" /> : null}
                      {editingHere ? (
                        <InlineEdit
                          className="slab-input"
                          value={node.title}
                          ariaLabel="Task title"
                          selectAll
                          onCommit={(v) => props.onRename(node.id, v)}
                        />
                      ) : (
                        <h3 className="slab-title" data-title>
                          <Mark text={node.title.trim() || '_'} query={query} />
                        </h3>
                      )}
                    </div>
                    {project && project.id !== node.id ? <p className="slab-folder">{project.title.trim() || '_'}</p> : null}
                    {total || node.urgent ? (
                      <p className="slab-meta">
                        {total ? (
                          <span className={`slab-progress${done === total ? ' is-complete' : ''}`} aria-label={`${done} of ${total} subtasks done`}>
                            {done}/{total}
                          </span>
                        ) : null}
                        {node.urgent ? <span className="slab-flag">URGENT</span> : null}
                      </p>
                    ) : null}
                    {shoveTo ? (
                      <button
                        type="button"
                        className="slab-shovel"
                        data-testid={`advance-${node.id}`}
                        aria-label={`Move ${node.title.trim() || 'task'} to ${LANE_LABEL[shoveTo]}`}
                        onPointerDown={(e) => {
                          if (e.pointerType === 'mouse') e.stopPropagation()
                        }}
                        onClick={(e) => {
                          if (e.detail !== 0 && pressedWith.current !== 'mouse') return
                          e.stopPropagation()
                          props.onAdvance(node.id, shoveTo)
                        }}
                      >
                        <Chevron className="slab-shovel-glyph" />
                      </button>
                    ) : null}
                  </article>
                )
              })}
              {drafting ? (
                <DraftCard doc={doc} lane={lane} project={drafting.project} onCommit={props.onDraftCommit} />
              ) : null}
              {items.length === 0 && !drafting ? <div className="lane-void">{hits ? 'no matches' : ''}</div> : null}
              {laneFilter && laneFilter !== lane ? null : (
              <button
                type="button"
                className="lane-add"
                data-testid={`lane-add-${lane}`}
                onPointerDown={(e) => e.stopPropagation()}
                onClick={() => props.onStartTask(lane)}
              >
                <Plus className="lane-add-glyph" />
                New task
              </button>
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}

/**
 * A card that is still being written. It holds its own title and project until
 * it is committed, so leaving it empty leaves nothing behind in the doc.
 */
function DraftCard({
  doc,
  lane,
  project,
  onCommit,
}: {
  doc: Doc
  lane: Lane
  project: number | null
  onCommit: (title: string, lane: Lane, project: number | null) => void
}) {
  const projects = projectsOf(doc)
  const [title, setTitle] = useState('')
  const [pid, setPid] = useState<number | null>(project ?? projects[0]?.id ?? null)
  const done = useRef(false)

  function finish() {
    if (done.current) return
    done.current = true
    onCommit(title, lane, pid)
  }

  function onBlur(e: FocusEvent<HTMLElement>) {
    // Moving between the title and the project picker is still writing the card.
    if (e.currentTarget.contains(e.relatedTarget as globalThis.Node | null)) return
    finish()
  }

  return (
    <article className="slab is-draft" data-testid="draft-card" onBlur={onBlur} onPointerDown={(e) => e.stopPropagation()}>
      <div className="slab-head">
        <input
          className="slab-input"
          autoFocus
          value={title}
          placeholder="Task name"
          aria-label="New task name"
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            e.stopPropagation()
            if (e.key === 'Enter' || e.key === 'Escape') {
              e.preventDefault()
              finish()
            }
          }}
        />
      </div>
      {projects.length ? (
        <label className="slab-project">
          <span className="sr-only">Project</span>
          <select value={pid ?? ''} aria-label="Project" onChange={(e) => setPid(Number(e.target.value))}>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title.trim() || '_'}
              </option>
            ))}
          </select>
        </label>
      ) : (
        <p className="slab-folder">inbox</p>
      )}
    </article>
  )
}
