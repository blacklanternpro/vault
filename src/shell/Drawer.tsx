import { useState } from 'react'
import { laneOf, linesOf, projectOf } from '../model/doc'
import { LANES, LANE_LABEL, type Doc, type Lane, type Node } from '../model/types'
import { Caret, Check, Cross, Flag, Folder, Plus, Trash } from './Glyph'
import { InlineEdit } from './InlineEdit'
import { Mark } from './Mark'
import type { Draft, Editing } from './Studio'
import type { JobDrag } from './useJobDrag'

type DrawerProps = {
  doc: Doc
  query: string
  selectedId: number | null
  editing: Editing | null
  draft: Draft | null
  node: Node
  drag: JobDrag
  onClose: () => void
  onSetLane: (lane: Lane) => void
  onToggleUrgent: () => void
  onDelete: () => void
  onEdit: (id: number, field: 'title' | 'body') => void
  onRename: (id: number, title: string) => void
  onBody: (body: string) => void
  onToggleDone: (id: number) => void
  onDeleteLine: (id: number) => void
  onStartLine: () => void
  /** `keepGoing` after Enter, so a list of subtasks can be typed one after another. */
  onLineCommit: (title: string, keepGoing: boolean) => void
  onOpenProject: (projectId: number) => void
}

export function Drawer({
  doc,
  query,
  editing,
  draft,
  node,
  drag,
  onClose,
  onSetLane,
  onToggleUrgent,
  onDelete,
  onEdit,
  onRename,
  onBody,
  onToggleDone,
  onDeleteLine,
  onStartLine,
  onLineCommit,
  onOpenProject,
}: DrawerProps) {
  const lane = laneOf(node.status)
  const project = projectOf(doc, node.id)
  // Nested lines show indented under their parent line, so nothing in the card is out of sight.
  const lines = linesOf(doc, node.id)
  const editingTitle = editing?.id === node.id && editing.field === 'title' && editing.where === 'drawer'
  const editingBody = editing?.id === node.id && editing.field === 'body'
  const drafting = draft?.where === 'drawer' && draft.parent === node.id
  // A fresh key per committed line resets the input, so Enter goes straight on to the next one.
  const [lineKey, setLineKey] = useState(0)
  const paragraphs = (node.body ?? '').split('\n')

  return (
    <aside className="drawer" data-testid="drawer" aria-label="Task detail">
      <div className="drawer-top">
        <label className={`drawer-status is-${lane}`}>
          <span className="drawer-dot" aria-hidden="true" />
          {LANE_LABEL[lane]}
          <Caret className="drawer-status-caret" />
          <select aria-label="Status" data-testid="drawer-status" value={lane} onChange={(e) => onSetLane(e.target.value as Lane)}>
            {LANES.map((l) => (
              <option key={l} value={l}>
                {LANE_LABEL[l]}
              </option>
            ))}
          </select>
        </label>
        <div className="drawer-tools">
          <button
            type="button"
            className={`drawer-tool${node.urgent ? ' is-on' : ''}`}
            aria-pressed={Boolean(node.urgent)}
            aria-label={node.urgent ? 'Unmark urgent' : 'Mark urgent'}
            title={node.urgent ? 'Unmark urgent' : 'Mark urgent'}
            data-testid="drawer-urgent"
            onClick={onToggleUrgent}
          >
            <Flag />
          </button>
          <button type="button" className="drawer-tool" aria-label="Delete task" title="Delete task" data-testid="drawer-delete" onClick={onDelete}>
            <Trash />
          </button>
          <button type="button" className="drawer-tool" aria-label="Close task detail" title="Close (Esc)" data-testid="drawer-close" onClick={onClose}>
            <Cross />
          </button>
        </div>
      </div>

      {editingTitle ? (
        <InlineEdit className="drawer-title-input" value={node.title} ariaLabel="Task title" onCommit={(v) => onRename(node.id, v)} />
      ) : (
        <h1 className="drawer-title" data-title onClick={() => onEdit(node.id, 'title')}>
          <Mark text={node.title.trim() || '_'} query={query} />
        </h1>
      )}

      {project && project.id !== node.id ? (
        <button type="button" className="drawer-folder" aria-label={`Show only ${project.title}`} onClick={() => onOpenProject(project.id)}>
          <Folder />
          {project.title.trim() || '_'}
        </button>
      ) : null}

      <hr className="drawer-rule" />

      <h2 className="drawer-label">Description</h2>
      {editingBody ? (
        <InlineEdit
          className="drawer-body-input"
          value={node.body ?? ''}
          ariaLabel="Description"
          placeholder="Add a description"
          multiline
          rows={6}
          testId="drawer-body-input"
          onCommit={(v) => onBody(v)}
        />
      ) : (
        <div className="drawer-body" data-testid="drawer-body" onClick={() => onEdit(node.id, 'body')}>
          {node.body ? (
            paragraphs.map((line, i) => (line.trim() ? <p key={i}><Mark text={line} query={query} /></p> : <p key={i} className="drawer-body-gap" />))
          ) : (
            <p className="drawer-body-empty">Add a description</p>
          )}
        </div>
      )}

      <h2 className="drawer-label">
        Subtasks
        {lines.length ? (
          <span className="drawer-label-count">
            {lines.filter((l) => l.node.status === 'done').length}/{lines.length}
          </span>
        ) : null}
      </h2>
      <ul className="subtasks">
        {lines.map(({ node: child, depth }) => {
          const done = child.status === 'done'
          const editingLine = editing?.id === child.id && editing.where === 'drawer'
          return (
            <li
              key={child.id}
              className={`subtask${done ? ' is-done' : ''}`}
              style={depth > 1 ? { paddingLeft: `${(depth - 1) * 22}px` } : undefined}
              data-nested-id={child.id}
              onPointerDown={(e) => drag.beginDrag(e, child.id, 'nested', '[data-nested-id]')}
              onPointerMove={drag.onMove}
              onPointerUp={drag.finishDrag}
              onPointerCancel={drag.finishDrag}
            >
              <button
                type="button"
                className="subtask-tick"
                aria-label={done ? `Reopen ${child.title}` : `Complete ${child.title}`}
                aria-pressed={done}
                onClick={() => onToggleDone(child.id)}
              >
                <Check />
              </button>
              {editingLine ? (
                <InlineEdit className="subtask-input" value={child.title} ariaLabel="Subtask title" onCommit={(v) => onRename(child.id, v)} />
              ) : (
                <span className="subtask-name">
                  <Mark text={child.title.trim() || '_'} query={query} />
                </span>
              )}
              <button type="button" className="subtask-delete" aria-label={`Delete ${child.title}`} onClick={() => onDeleteLine(child.id)}>
                <Cross />
              </button>
            </li>
          )
        })}
        <li className="subtask is-add">
          {drafting ? (
            <>
              <Plus className="subtask-add-glyph" />
              <InlineEdit
                key={lineKey}
                className="subtask-input"
                value=""
                ariaLabel="New subtask"
                placeholder="Subtask, then Enter for the next"
                testId={`new-subtask-${node.id}`}
                onCommit={(v, how) => {
                  const keepGoing = how === 'enter' && v.trim() !== ''
                  onLineCommit(v, keepGoing)
                  if (keepGoing) setLineKey((k) => k + 1)
                }}
              />
            </>
          ) : (
            <button type="button" className="subtask-add" data-testid={`add-subtask-${node.id}`} onClick={onStartLine}>
              <Plus className="subtask-add-glyph" />
              Add subtask
            </button>
          )}
        </li>
      </ul>
    </aside>
  )
}
