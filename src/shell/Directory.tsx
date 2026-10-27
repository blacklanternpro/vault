import { memo, useEffect, useMemo, useRef, useState, type ChangeEvent, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react'
import { byId, childrenOf, depthOf, indentNode, kindOf, laneOf, outdentNode, projectsOf, searchPaths, shiftNode } from '../model/doc'
import { treeRows, type TreeRow } from '../model/tree'
import { LANES, LANE_LABEL, isLane, type Doc, type Lane, type Node } from '../model/types'
import { Caret, Chevron, Cross, Plus } from './Glyph'
import { InlineEdit } from './InlineEdit'
import { Mark } from './Mark'
import type { Draft, Editing } from './Studio'

type DirectoryProps = {
  doc: Doc
  query: string
  selectedId: number | null
  editing: Editing | null
  draft: Draft | null
  filterId: number | null
  collapsed: ReadonlySet<number>
  /** A click: select the row and open its card. */
  onSelect: (id: number) => void
  /** Keyboard movement: select only. */
  onFocusRow: (id: number | null) => void
  onToggle: (id: number) => void
  onEdit: (id: number) => void
  onRename: (id: number, title: string) => void
  onStartDraft: (parent: number | null) => void
  onDraftCommit: (parent: number | null, title: string, keepGoing: boolean) => void
  onDelete: (id: number) => void
  /** Structural edits (indent, outdent, reorder) computed here and handed up whole. */
  onCommit: (next: Doc) => void
  onSetLane: (id: number, lane: Lane) => void
  onToggleDone: (id: number) => void
  onStage: (id: number, lane: Lane) => void
  onPull: (id: number, lane: Lane) => void
}

const THRESH = 6

/** A press on a row: a tap (select, or rename if it lands on the name of the selected row) or the start of a drag. */
type RowDrag = { id: number; el: HTMLElement; startX: number; startY: number; live: boolean; onName: boolean }

export function Directory(props: DirectoryProps) {
  const { doc, query, selectedId, editing, draft, filterId, collapsed } = props
  const treeRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<RowDrag | null>(null)
  const ghostRef = useRef<HTMLElement | null>(null)
  const [draftKey, setDraftKey] = useState(0)
  /** Focus that arrives with a click selects the clicked row, not the first one. */
  const pointing = useRef(false)

  const keep = useMemo(() => (query.trim() ? searchPaths(doc, query) : undefined), [doc, query])
  const roots = projectsOf(doc).filter((p) => (filterId == null || p.id === filterId) && (!keep || keep.has(p.id)))
  // Rows only change with the doc, the folds or the search, so moving the selection re-renders two rows, not all of them.
  const columns = useMemo(() => roots.map((root) => treeRows(doc, root.id, collapsed, keep)), [doc, collapsed, keep, filterId]) // eslint-disable-line react-hooks/exhaustive-deps
  const flat = useMemo(() => columns.flat(), [columns])
  const taskCount = doc.nodes.filter((n) => n.parent != null && kindOf(doc, n.id) === 'task').length

  // Keep the selected row in view as the keyboard moves it.
  // (scrollIntoView is slow on a long multi-column tree, so measure and scroll only when it is actually off screen.)
  useEffect(() => {
    if (selectedId == null) return
    const r = document.getElementById(`tree-${selectedId}`)?.getBoundingClientRect()
    if (!r) return
    const top = 80
    if (r.top < top) window.scrollBy(0, r.top - top)
    else if (r.bottom > window.innerHeight - 16) window.scrollBy(0, r.bottom - window.innerHeight + 16)
  }, [selectedId])

  function refocus() {
    requestAnimationFrame(() => treeRef.current?.focus({ preventScroll: true }))
  }

  /* ---------------------------------------------------------------- keyboard */

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('input, textarea, select')) return
    const at = flat.findIndex((r) => r.node.id === selectedId)
    const row = at >= 0 ? flat[at] : undefined
    const id = row?.node.id
    const key = e.key

    const handled = () => {
      e.preventDefault()
      e.stopPropagation()
    }

    if (key === 'ArrowDown' || key === 'ArrowUp') {
      handled()
      if (e.altKey && id != null) {
        props.onCommit(shiftNode(doc, id, key === 'ArrowUp' ? -1 : 1))
        return
      }
      const next = flat[at < 0 ? 0 : Math.max(0, Math.min(flat.length - 1, at + (key === 'ArrowDown' ? 1 : -1)))]
      if (next) props.onFocusRow(next.node.id)
      return
    }
    if (key === 'Home' || key === 'End') {
      handled()
      const next = key === 'Home' ? flat[0] : flat[flat.length - 1]
      if (next) props.onFocusRow(next.node.id)
      return
    }
    if (key === '+' || key === '=' || key === 'Insert') {
      handled()
      props.onStartDraft(id ?? null)
      return
    }
    if (!row || id == null) return

    if (key === 'ArrowRight') {
      handled()
      if (row.hasChildren && !row.open) props.onToggle(id)
      else if (row.hasChildren) props.onFocusRow(flat[at + 1].node.id)
      return
    }
    if (key === 'ArrowLeft') {
      handled()
      if (row.hasChildren && row.open && !keep) props.onToggle(id)
      else if (row.node.parent != null) props.onFocusRow(row.node.parent)
      return
    }
    if (key === 'Enter' || key === 'F2') {
      handled()
      props.onEdit(id)
      return
    }
    if (key === 'Delete' || key === 'Backspace') {
      handled()
      const after = flat[at + 1]?.node.id ?? flat[at - 1]?.node.id ?? null
      props.onDelete(id)
      props.onFocusRow(after != null && !isInside(doc, id, after) ? after : row.node.parent)
      return
    }
    if (key === 'Tab') {
      // Only taken when it does something, so Tab still leaves the tree from a row that cannot move.
      const next = e.shiftKey ? outdentNode(doc, id) : indentNode(doc, id)
      if (next === doc) return
      handled()
      props.onCommit(next)
      return
    }
    if (key.toLowerCase() === 'x' && !e.metaKey && !e.ctrlKey && depthOf(doc, id) >= 2) {
      handled()
      props.onToggleDone(id)
    }
  }

  /* -------------------------------------------------------------------- drag */

  function dropLane(x: number, y: number): Lane | null {
    const el = document.elementFromPoint(x, y)
    const lane = el instanceof Element ? el.closest('[data-lane]')?.getAttribute('data-lane') : null
    return isLane(lane) ? lane : null
  }

  /*
   * Pointer, click and change events are handled once, on the tree, and find
   * their row by `data-node-id` — so rows carry no handlers of their own and
   * can skip re-rendering when nothing about them changed.
   */
  function rowOf(target: EventTarget | null): { el: HTMLElement; id: number } | null {
    const el = target instanceof Element ? target.closest<HTMLElement>('[data-node-id]') : null
    const id = Number(el?.dataset.nodeId)
    return el && Number.isFinite(id) ? { el, id } : null
  }

  function beginRow(e: PointerEvent<HTMLElement>) {
    pointing.current = true
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.closest('button, input, select')) return
    const hit = rowOf(target)
    if (!hit) return
    // Projects do not drag onto the board, so they are never captured; everything is still a tap.
    if (depthOf(doc, hit.id) > 0) hit.el.setPointerCapture(e.pointerId)
    dragRef.current = { id: hit.id, el: hit.el, startX: e.clientX, startY: e.clientY, live: false, onName: Boolean(target.closest('.stem-name')) }
  }

  function onAction(e: MouseEvent<HTMLElement>) {
    const button = (e.target as Element).closest<HTMLElement>('[data-action]')
    const hit = rowOf(button)
    if (!button || !hit) return
    const action = button.dataset.action
    if (action === 'fold') props.onToggle(hit.id)
    else if (action === 'done') props.onToggleDone(hit.id)
    else if (action === 'add') props.onStartDraft(hit.id)
    else if (action === 'delete') props.onDelete(hit.id)
  }

  function onLane(e: ChangeEvent<HTMLElement>) {
    const select = e.target as HTMLSelectElement
    const hit = rowOf(select)
    if (hit && select.dataset.lane != null && isLane(select.value)) props.onSetLane(hit.id, select.value)
  }

  function moveRow(e: PointerEvent<HTMLElement>) {
    const drag = dragRef.current
    if (!drag || depthOf(doc, drag.id) === 0) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    if (!drag.live && dx * dx + dy * dy < THRESH * THRESH) return
    drag.live = true
    if (!ghostRef.current) {
      const r = drag.el.getBoundingClientRect()
      const ghost = stripIds(drag.el.cloneNode(true) as HTMLElement)
      Object.assign(ghost.style, { position: 'fixed', left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, pointerEvents: 'none', zIndex: '80' })
      ghost.classList.add('is-ghost')
      document.body.appendChild(ghost)
      ghostRef.current = ghost
      drag.startX = e.clientX - r.left
      drag.startY = e.clientY - r.top
    }
    ghostRef.current.style.left = `${e.clientX - drag.startX}px`
    ghostRef.current.style.top = `${e.clientY - drag.startY}px`
  }

  function endRow(e: PointerEvent<HTMLElement>) {
    pointing.current = false
    const drag = dragRef.current
    dragRef.current = null
    ghostRef.current?.remove()
    ghostRef.current = null
    if (!drag) return
    if (!drag.live) {
      if (drag.onName && selectedId === drag.id) props.onEdit(drag.id)
      else props.onSelect(drag.id)
      return
    }
    const lane = dropLane(e.clientX, e.clientY)
    if (!lane) return
    if (depthOf(doc, drag.id) >= 2) props.onPull(drag.id, lane)
    else props.onStage(drag.id, lane)
  }

  /* ------------------------------------------------------------------ render */

  function renderRow(row: TreeRow) {
    const id = row.node.id
    const isEditing = editing?.id === id && editing.where === 'tree'
    return (
      <Row
        key={id}
        row={row}
        selected={selectedId === id}
        hit={Boolean(keep && matches(row.node.title, row.node.body, query))}
        query={keep ? query : ''}
        count={row.depth === 0 ? childrenOf(doc, id).length : 0}
        onRename={
          isEditing
            ? (v, how) => {
                props.onRename(id, v)
                if (how !== 'blur') refocus()
              }
            : undefined
        }
      />
    )
  }

  function renderDraft(parent: number | null) {
    const depth = parent == null ? 0 : depthOf(doc, parent) + 1
    const stem = depth === 0 ? '' : `${'    '.repeat(depth - 1)}└──`
    return (
      <div key="draft" className="stem is-draft" data-testid="tree-draft">
        <span className="stem-rule" aria-hidden="true">
          {stem}
        </span>
        <span className="stem-fold" aria-hidden="true" />
        <InlineEdit
          key={draftKey}
          className="stem-input"
          value=""
          ariaLabel={parent == null ? 'New project' : 'New item'}
          placeholder={parent == null ? 'project name, Enter' : 'name, Enter for another'}
          testId="tree-draft-input"
          onCommit={(v, how) => {
            const keepGoing = how === 'enter' && v.trim() !== ''
            props.onDraftCommit(parent, v, keepGoing)
            if (keepGoing) setDraftKey((k) => k + 1)
            else if (how !== 'blur') refocus()
          }}
        />
      </div>
    )
  }

  /** The column's rows, with the draft row slotted in after its parent's last descendant. */
  function renderColumn(rows: TreeRow[]) {
    const out = rows.map(renderRow)
    if (draft?.where === 'tree' && draft.parent != null && rows.some((r) => r.node.id === draft.parent)) {
      const at = rows.findIndex((r) => r.node.id === draft.parent)
      let end = at
      while (end + 1 < rows.length && rows[end + 1].depth > rows[at].depth) end += 1
      out.splice(end + 1, 0, renderDraft(draft.parent))
    }
    return out
  }

  return (
    <section className="directory" data-testid="directory" aria-label="Directory">
      <div className="section-head">
        <h2 className="section-name">Directory</h2>
        <span className="section-note">
          ~/vault · {roots.length === 1 ? '1 project' : `${roots.length} projects`} · {taskCount === 1 ? '1 task' : `${taskCount} tasks`}
        </span>
      </div>

      <div
        className="forest"
        role="tree"
        aria-label="Projects and tasks"
        tabIndex={0}
        ref={treeRef}
        data-testid="tree"
        aria-activedescendant={selectedId != null && flat.some((r) => r.node.id === selectedId) ? `tree-${selectedId}` : undefined}
        onKeyDown={onKeyDown}
        onPointerDown={beginRow}
        onPointerMove={moveRow}
        onPointerUp={endRow}
        onPointerCancel={endRow}
        onClick={onAction}
        onChange={onLane}
        onFocus={(e) => {
          if (pointing.current) return
          if (e.target === e.currentTarget && selectedId == null && flat[0]) props.onFocusRow(flat[0].node.id)
        }}
      >
        {columns.map((rows) => (
          <div key={rows[0]?.node.id} className="forest-col" role="group">
            {renderColumn(rows)}
            {!keep ? (
              <button type="button" tabIndex={-1} className="stem stem-ghost" onClick={() => props.onStartDraft(rows[0].node.id)}>
                <span className="stem-rule" aria-hidden="true">
                  └──
                </span>
                <Plus className="stem-add-glyph" />
                <span className="stem-name">new task</span>
              </button>
            ) : null}
          </div>
        ))}
        {keep && roots.length === 0 ? <p className="forest-empty">no match for “{query.trim()}”</p> : null}
        {!keep ? (
          <div className="forest-col">
            {draft?.where === 'tree' && draft.parent == null ? renderDraft(null) : null}
            <button type="button" tabIndex={-1} className="stem stem-ghost" data-testid="tree-new-project" onClick={() => props.onStartDraft(null)}>
              <Plus className="stem-add-glyph" />
              <span className="stem-name">new project</span>
            </button>
          </div>
        ) : null}
      </div>
      <p className="forest-keys" aria-hidden="true">
        ↑↓ move · ←→ fold · enter rename · + add inside · tab / ⇧tab indent · alt ↑↓ reorder · x done · del delete · ctrl z undo
      </p>
    </section>
  )
}

function matches(title: string, body: string | undefined, query: string) {
  const q = query.trim().toLowerCase()
  return title.toLowerCase().includes(q) || (body ?? '').toLowerCase().includes(q)
}

function isInside(doc: Doc, rootId: number, id: number): boolean {
  let node = byId(doc, id)
  while (node) {
    if (node.id === rootId) return true
    node = byId(doc, node.parent)
  }
  return false
}

/** A drag ghost is a picture of the thing, not the thing: nothing should find it by id. */
function stripIds(el: HTMLElement): HTMLElement {
  for (const node of [el, ...el.querySelectorAll<HTMLElement>('*')]) {
    for (const attr of ['id', 'data-testid', 'data-card-id', 'data-nested-id', 'data-node-id', 'data-jack']) node.removeAttribute(attr)
  }
  return el
}

type RowProps = {
  row: TreeRow
  selected: boolean
  hit: boolean
  query: string
  count: number
  /** Present only while this row is being renamed. */
  onRename?: (value: string, how: 'enter' | 'blur' | 'escape') => void
}

/** One line of the listing. No handlers: the tree handles every event for it (see `rowOf`). */
const Row = memo(function Row({ row, selected, hit, query, count, onRename }: RowProps) {
  const { node, depth } = row
  const kind = depth === 0 ? 'project' : depth === 1 ? 'task' : 'subtask'
  const lane = laneOf(node.status)
  const done = node.status === 'done'
  return (
    <div
      id={`tree-${node.id}`}
      role="treeitem"
      aria-level={depth + 1}
      aria-selected={selected}
      aria-expanded={row.hasChildren ? row.open : undefined}
      className={`stem is-${kind}${selected ? ' is-live' : ''}${hit ? ' is-found' : ''}${done && kind === 'subtask' ? ' is-done' : ''}${node.loose ? ' is-loose' : ''}`}
      data-node-id={node.id}
      data-testid={`tree-row-${node.id}`}
    >
      <span className="stem-rule" aria-hidden="true">
        {row.stem.trimEnd()}
      </span>
      {row.hasChildren ? (
        <button type="button" tabIndex={-1} className="stem-fold" data-action="fold" aria-label={row.open ? `Collapse ${node.title}` : `Expand ${node.title}`}>
          {row.open ? <Caret /> : <Chevron />}
        </button>
      ) : (
        <span className="stem-fold" aria-hidden="true" />
      )}
      {kind === 'subtask' ? (
        <button
          type="button"
          tabIndex={-1}
          className="stem-check"
          data-action="done"
          aria-label={done ? `Reopen ${node.title}` : `Complete ${node.title}`}
          aria-pressed={done}
        >
          {done ? '[x]' : '[ ]'}
        </button>
      ) : null}
      {onRename ? (
        <InlineEdit className="stem-input" value={node.title} ariaLabel={`Rename ${kind}`} selectAll testId={`tree-input-${node.id}`} onCommit={onRename} />
      ) : (
        <span className="stem-name">
          <Mark text={node.title.trim() || '_'} query={query} />
          {kind === 'project' ? '/' : ''}
        </span>
      )}
      {node.urgent ? (
        <span className="stem-urgent" title="Urgent">
          !
        </span>
      ) : null}
      <span className="stem-tools">
        <button type="button" tabIndex={-1} className="stem-tool" data-action="add" aria-label={`Add inside ${node.title}`} title="Add inside (+)">
          <Plus />
        </button>
        <button type="button" tabIndex={-1} className="stem-tool is-danger" data-action="delete" aria-label={`Delete ${node.title}`} title="Delete (Del)">
          <Cross />
        </button>
      </span>
      {kind === 'task' || node.loose ? <LaneSelect node={node} lane={lane} /> : kind === 'project' ? <span className="stem-count">{count}</span> : null}
    </div>
  )
})

function LaneSelect({ node, lane }: { node: Node; lane: Lane }) {
  return (
    <label className="stem-status">
      <span>{LANE_LABEL[lane]}</span>
      <select tabIndex={-1} data-lane="" aria-label={`Status of ${node.title}`} value={lane} onChange={() => undefined}>
        {LANES.map((l) => (
          <option key={l} value={l}>
            {LANE_LABEL[l]}
          </option>
        ))}
      </select>
    </label>
  )
}
