import { type KeyboardEvent } from 'react'
import { folderOf, laneOf, nestedOf, type Doc, type GraphNode } from '../speck/doc'
import type { Session } from '../speck/ir'
import { LANE_PLAQUE, type NodeStatus } from '../speck/tokens'
import { Check, Cross, Folder, Plus } from './Glyph'

type DrawerProps = {
  doc: Doc
  session: Session
  node: GraphNode
  onClose: () => void
  onShovel: (id: number) => void
  onRename: (id: number) => void
  onEditBody: (id: number) => void
  onAddNested: (parentId: number) => void
  onSetStatus: (id: number, status: NodeStatus) => void
  /** Narrows the board to the folder this job hangs under. */
  onOpenFolder: (projectId: number) => void
  onTitle: (value: string) => void
  onTitleCommit: () => void
  onFieldBlur: (id: number, slot: 'title' | 'body' | 'subtask' | 'status') => void
}

export function Drawer({
  doc,
  session,
  node,
  onClose,
  onShovel,
  onRename,
  onEditBody,
  onAddNested,
  onSetStatus,
  onOpenFolder,
  onTitle,
  onTitleCommit,
  onFieldBlur,
}: DrawerProps) {
  const lane = laneOf(node.status)
  const folder = folderOf(doc, node.id)
  const nested = nestedOf(doc, node.id)
  const editingTitle = session.field?.id === node.id && session.field.slot === 'title'
  const editingBody = session.field?.id === node.id && session.field.slot === 'body'
  const addingSubtask = session.field?.id === node.id && session.field.slot === 'subtask'
  const paragraphs = (node.body ?? '').split('\n').filter((p) => p.trim())

  function onFieldKey(e: KeyboardEvent<HTMLElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onTitleCommit()
    }
  }

  return (
    <aside className="drawer" data-testid="folio" aria-label="Job detail">
      <div className="drawer-top">
        <button
          type="button"
          className={`drawer-status is-${lane}`}
          data-testid="drawer-status"
          aria-label={`Status ${LANE_PLAQUE[lane]}, advance`}
          onClick={() => onShovel(node.id)}
        >
          <span className="drawer-dot" aria-hidden="true" />
          {LANE_PLAQUE[lane]}
        </button>
        <button
          type="button"
          className="drawer-close"
          data-testid="folio-close"
          aria-label="Close job detail"
          onClick={onClose}
        >
          <Cross />
        </button>
      </div>

      {editingTitle ? (
        <input
          className="drawer-title-input"
          value={session.fieldBuffer}
          autoFocus
          aria-label="Job title"
          placeholder="_"
          onChange={(e) => onTitle(e.target.value)}
          onBlur={() => onFieldBlur(node.id, 'title')}
          onKeyDown={onFieldKey}
        />
      ) : (
        <h1 className="drawer-title" data-title onClick={() => onRename(node.id)}>
          {node.title.trim() || '_'}
        </h1>
      )}

      {folder ? (
        <button
          type="button"
          className="drawer-folder"
          aria-label={`Show only ${folder.title}`}
          onClick={() => onOpenFolder(folder.id)}
        >
          <Folder />
          {folder.title.trim() || '_'}
        </button>
      ) : null}

      <hr className="drawer-rule" />

      <h2 className="drawer-label">Description</h2>
      {editingBody ? (
        <textarea
          className="drawer-body-input"
          data-testid={`body-${node.id}`}
          value={session.fieldBuffer}
          autoFocus
          rows={6}
          aria-label="Description"
          placeholder="_"
          onChange={(e) => onTitle(e.target.value)}
          onBlur={() => onFieldBlur(node.id, 'body')}
        />
      ) : (
        <div className="drawer-body" data-testid={`body-${node.id}`} onClick={() => onEditBody(node.id)}>
          {paragraphs.length ? (
            paragraphs.map((line, i) => <p key={i}>{line}</p>)
          ) : (
            <p className="drawer-body-empty">Add a description</p>
          )}
        </div>
      )}

      <h2 className="drawer-label">Subtasks</h2>
      <ul className="subtasks">
        {nested.map((child) => {
          const done = child.status === 'done'
          const editing = session.field?.id === child.id && session.field.slot === 'title'
          return (
            <li key={child.id} className={`subtask${done ? ' is-done' : ''}`}>
              <button
                type="button"
                className="subtask-tick"
                data-testid={`subtask-tick-${child.id}`}
                aria-label={done ? `Reopen ${child.title}` : `Complete ${child.title}`}
                aria-pressed={done}
                onClick={() => onSetStatus(child.id, done ? 'pending' : 'done')}
              >
                <Check />
              </button>
              {editing ? (
                <input
                  className="subtask-input"
                  value={session.fieldBuffer}
                  autoFocus
                  aria-label="Subtask title"
                  placeholder="_"
                  onChange={(e) => onTitle(e.target.value)}
                  onBlur={() => onFieldBlur(child.id, 'title')}
                  onKeyDown={onFieldKey}
                />
              ) : (
                <span className="subtask-name" onClick={() => onRename(child.id)}>
                  {child.title.trim() || '_'}
                </span>
              )}
            </li>
          )
        })}
        <li className="subtask">
          {addingSubtask ? (
            <>
              <span className="subtask-add-glyph" aria-hidden="true" />
              <input
                className="subtask-input"
                data-testid={`nest-add-${node.id}`}
                value={session.fieldBuffer}
                autoFocus
                aria-label="New subtask"
                placeholder="_"
                onChange={(e) => onTitle(e.target.value)}
                onBlur={() => onFieldBlur(node.id, 'subtask')}
                onKeyDown={onFieldKey}
              />
            </>
          ) : (
            <button
              type="button"
              className="subtask-add"
              data-testid={`nest-add-${node.id}`}
              onClick={() => onAddNested(node.id)}
            >
              <Plus className="subtask-add-glyph" />
              Add subtask
            </button>
          )}
        </li>
      </ul>
    </aside>
  )
}
