import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { byId, childrenOf, depthOf, indentNode, kindOf, laneOf, outdentNode, projectsOf, searchPaths, shiftNode } from '../model/doc'
import { treeRows, type TreeRow } from '../model/tree'
import { LANES, LANE_LABEL, isLane, type Doc, type Lane } from '../model/types'
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

type RowDrag = { id: number; startX: number; startY: number; live: boolean }

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
  const columns = roots.map((root) => treeRows(doc, root.id, collapsed, keep))
  const flat = columns.flat()
  const taskCount = doc.nodes.filter((n) => n.parent != null && kindOf(doc, n.id) === 'task').length

  // Keep the selected row in view as the keyboard moves it.
  useEffect(() => {
    if (selectedId == null) return
    document.getElementById(`tree-${selectedId}`)?.scrollIntoView({ block: 'nearest' })
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
      handled()
      const next = e.shiftKey ? outdentNode(doc, id) : indentNode(doc, id)
      if (next !== doc) props.onCommit(next)
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

  function beginRow(e: PointerEvent<HTMLElement>, id: number) {
    if (e.button !== 0 || depthOf(doc, id) === 0) return
    if ((e.target as HTMLElement).closest('button, input, select')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { id, startX: e.clientX, startY: e.clientY, live: false }
  }

  function moveRow(e: PointerEvent<HTMLElement>) {
    const drag = dragRef.current
    if (!drag) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY
    if (!drag.live && dx * dx + dy * dy < THRESH * THRESH) return
    drag.live = true
    if (!ghostRef.current) {
      const r = e.currentTarget.getBoundingClientRect()
      const ghost = stripIds(e.currentTarget.cloneNode(true) as HTMLElement)
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
    const drag = dragRef.current
    dragRef.current = null
    ghostRef.current?.remove()
    ghostRef.current = null
    if (!drag?.live) return
    const lane = dropLane(e.clientX, e.clientY)
    if (!lane) return
    if (depthOf(doc, drag.id) >= 2) props.onPull(drag.id, lane)
    else props.onStage(drag.id, lane)
  }

  /* ------------------------------------------------------------------ render */

  function renderRow(row: TreeRow) {
    const { node, depth } = row
    const id = node.id
    const kind = depth === 0 ? 'project' : depth === 1 ? 'task' : 'subtask'
    const isEditing = editing?.id === id && editing.where === 'tree'
    const selected = selectedId === id
    const hit = keep && query.trim() ? matches(node.title, node.body, query) : false
    const lane = laneOf(node.status)
    const done = node.status === 'done'

    return (
      <div
        key={id}
        id={`tree-${id}`}
        role="treeitem"
        aria-level={depth + 1}
        aria-selected={selected}
        aria-expanded={row.hasChildren ? row.open : undefined}
        className={`stem is-${kind}${selected ? ' is-live' : ''}${hit ? ' is-found' : ''}${done && kind === 'subtask' ? ' is-done' : ''}${node.loose ? ' is-loose' : ''}`}
        data-node-id={id}
        data-testid={`tree-row-${id}`}
        onPointerDown={(e) => beginRow(e, id)}
        onPointerMove={moveRow}
        onPointerUp={endRow}
        onPointerCancel={endRow}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button, input, select')) return
          if (selected && (e.target as HTMLElement).closest('.stem-name')) props.onEdit(id)
          else props.onSelect(id)
        }}
        onDoubleClick={(e) => {
          if ((e.target as HTMLElement).closest('button, input, select')) return
          props.onEdit(id)
        }}
      >
        <span className="stem-rule" aria-hidden="true">
          {row.stem.trimEnd()}
        </span>
        {row.hasChildren ? (
          <button
            type="button"
            tabIndex={-1}
            className="stem-fold"
            aria-label={row.open ? `Collapse ${node.title}` : `Expand ${node.title}`}
            onClick={() => props.onToggle(id)}
          >
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
            aria-label={done ? `Reopen ${node.title}` : `Complete ${node.title}`}
            aria-pressed={done}
            onClick={() => props.onToggleDone(id)}
          >
            {done ? '[x]' : '[ ]'}
          </button>
        ) : null}
        {isEditing ? (
          <InlineEdit
            className="stem-input"
            value={node.title}
            ariaLabel={`Rename ${kind}`}
            selectAll
            testId={`tree-input-${id}`}
            onCommit={(v, how) => {
              props.onRename(id, v)
              if (how !== 'blur') refocus()
            }}
          />
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
          <button type="button" tabIndex={-1} className="stem-tool" aria-label={`Add inside ${node.title}`} title="Add inside (+)" onClick={() => props.onStartDraft(id)}>
            <Plus />
          </button>
          <button type="button" tabIndex={-1} className="stem-tool is-danger" aria-label={`Delete ${node.title}`} title="Delete (Del)" onClick={() => props.onDelete(id)}>
            <Cross />
          </button>
        </span>
        {kind === 'task' || node.loose ? (
          <label className="stem-status">
            <span>{LANE_LABEL[lane]}</span>
            <select tabIndex={-1} aria-label={`Status of ${node.title}`} value={lane} onChange={(e) => props.onSetLane(id, e.target.value as Lane)}>
              {LANES.map((l) => (
                <option key={l} value={l}>
                  {LANE_LABEL[l]}
                </option>
              ))}
            </select>
          </label>
        ) : kind === 'project' ? (
          <span className="stem-count">{childrenOf(doc, id).length}</span>
        ) : null}
      </div>
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
        onPointerDownCapture={() => {
          pointing.current = true
        }}
        onPointerUpCapture={() => {
          pointing.current = false
        }}
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
