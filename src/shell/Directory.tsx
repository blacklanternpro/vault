import type { KeyboardEvent, MouseEvent } from 'react'
import { childrenOf, type Doc } from '../speck/doc'
import { matchesFind, type Session } from '../speck/ir'
import { nestRows } from '../speck/tree'
import { Mark } from './Mark'

type Props = {
  doc: Doc
  session: Session
  onSelect: (id: number) => void
  onRename: (id: number) => void
  onToggle: (id: number) => void
  onAdd: (parent: number | null) => void
  onShovel: (id: number) => void
  onClearFocus: () => void
  onTitle: (value: string) => void
  onTitleCommit: () => void
}

export function Directory({
  doc,
  session,
  onSelect,
  onRename,
  onToggle,
  onAdd,
  onShovel,
  onClearFocus,
  onTitle,
  onTitleCommit,
}: Props) {
  const rows = nestRows(doc, session)
  const selectedId = session.selected?.kind === 'NODE' ? session.selected.id : null
  const addParent = selectedId != null ? selectedId : session.nestFocus != null ? session.nestFocus : null

  function onPane(e: MouseEvent<HTMLElement>) {
    if (e.target === e.currentTarget) onClearFocus()
  }

  return (
    <section className="directory" data-testid="directory" aria-label="Tasks" onClick={onPane}>
      {rows.map((row) => {
        const id = row.node.id
        const kids = childrenOf(doc, id)
        const selected = selectedId === id
        const editing = session.field?.id === id && session.field.slot === 'title'
        const found = matchesFind(session, row.node.title)
        const closed = session.nestClosed.includes(id)
        const stem = `${row.prefix}${closed && kids.length ? '+ ' : ''}`
        return (
          <div
            key={id}
            className={`dir-row${selected ? ' is-selected' : ''}${found ? ' is-found' : ''}${row.node.urgent ? ' is-urgent' : ''}`}
            data-node-id={id}
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
                  if (selected) onRename(id)
                  else onSelect(id)
                }}
              >
                <Mark text={row.node.title} query={session.find} />
              </button>
            )}
            <button
              type="button"
              className="dir-shovel"
              aria-label="Stage"
              onClick={(e) => {
                e.stopPropagation()
                onShovel(id)
              }}
            >
              →
            </button>
          </div>
        )
      })}
      <button
        type="button"
        className="dir-ghost"
        onClick={(e) => {
          e.stopPropagation()
          onAdd(addParent)
        }}
      >
        {rows.length ? '└── _' : '_'}
      </button>
    </section>
  )
}
