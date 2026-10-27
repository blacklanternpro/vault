import { useEffect, useRef, useState, type FormEvent } from 'react'
import { listBackups } from '../model/store'
import { LANES, LANE_LABEL, isLane, type Lane, type Node } from '../model/types'
import { BrandMark, Caret, Cross, Dots, Glass, Plus } from './Glyph'

type TopBarProps = {
  query: string
  hits: number | null
  projects: Node[]
  filterId: number | null
  laneFilter: Lane | null
  urgentOnly: boolean
  onQueryChange: (value: string) => void
  onQuerySubmit: () => void
  onFilterChange: (projectId: number | null) => void
  onLaneFilterChange: (lane: Lane | null) => void
  onUrgentOnlyChange: (urgentOnly: boolean) => void
  onNewTask: () => void
  onExport: () => void
  onImport: (file: File) => void
  onRestore: (at: number) => void
  canUndo: boolean
  canRedo: boolean
  onUndo: () => void
  onRedo: () => void
}

export function TopBar(p: TopBarProps) {
  const [menu, setMenu] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menu) return
    const close = (e: PointerEvent) => {
      if (!menuRef.current?.contains(e.target as globalThis.Node)) setMenu(false)
    }
    // Caught on the way down, so Esc closes the menu and nothing else (not the drawer behind it).
    const esc = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      setMenu(false)
    }
    window.addEventListener('pointerdown', close)
    window.addEventListener('keydown', esc, true)
    return () => {
      window.removeEventListener('pointerdown', close)
      window.removeEventListener('keydown', esc, true)
    }
  }, [menu])

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    p.onQuerySubmit()
  }

  const project = p.filterId == null ? null : p.projects.find((x) => x.id === p.filterId)
  const backups = menu ? listBackups().slice(0, 8) : []

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <BrandMark className="brand-mark" />
        <p className="brand-name">Vault Worldwide</p>
      </div>

      <form className="find studio-find" role="search" onSubmit={onSubmit}>
        <Glass className="find-glass" />
        <input
          className="find-input"
          type="text"
          value={p.query}
          placeholder="Search tasks, subtasks, descriptions"
          aria-label="Search"
          data-testid="search"
          onChange={(e) => p.onQueryChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              e.stopPropagation()
              p.onQueryChange('')
              e.currentTarget.blur()
            }
          }}
        />
        {p.hits == null ? (
          <span className="find-keys" aria-hidden="true">
            Ctrl K
          </span>
        ) : (
          <>
            <span className="find-count" data-testid="search-count">
              {p.hits === 1 ? '1 task' : `${p.hits} tasks`}
            </span>
            <button type="button" className="find-clear" aria-label="Clear search" onClick={() => p.onQueryChange('')}>
              <Cross />
            </button>
          </>
        )}
      </form>

      <div className="topbar-filters">
        <label className="chip">
          <span className="chip-label">{project ? project.title.trim() || '_' : 'All projects'}</span>
          <Caret className="chip-caret" />
          <select
            className="chip-select"
            aria-label="Project"
            data-testid="project-filter"
            value={p.filterId ?? 'all'}
            onChange={(e) => p.onFilterChange(e.target.value === 'all' ? null : Number(e.target.value))}
          >
            <option value="all">All projects</option>
            {p.projects.map((x) => (
              <option key={x.id} value={x.id}>
                {x.title.trim() || '_'}
              </option>
            ))}
          </select>
        </label>

        <label className="chip">
          <span className="chip-label">{p.laneFilter ? `Status: ${LANE_LABEL[p.laneFilter]}` : 'Status: any'}</span>
          <Caret className="chip-caret" />
          <select
            className="chip-select"
            aria-label="Status"
            data-testid="status-filter"
            value={p.laneFilter ?? 'any'}
            onChange={(e) => p.onLaneFilterChange(isLane(e.target.value) ? e.target.value : null)}
          >
            <option value="any">Status: any</option>
            {LANES.map((l) => (
              <option key={l} value={l}>
                {LANE_LABEL[l]}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          className={`chip chip-toggle${p.urgentOnly ? ' is-on' : ''}`}
          aria-pressed={p.urgentOnly}
          data-testid="urgent-filter"
          onClick={() => p.onUrgentOnlyChange(!p.urgentOnly)}
        >
          Urgent only
        </button>
      </div>

      <button type="button" className="new-job" data-testid="new-task" onClick={p.onNewTask}>
        <Plus className="new-job-glyph" />
        New task
      </button>

      <div className="menu" ref={menuRef}>
        <button
          type="button"
          className="menu-button"
          aria-label="More"
          aria-haspopup="menu"
          aria-expanded={menu}
          data-testid="menu"
          onClick={() => setMenu((m) => !m)}
        >
          <Dots />
        </button>
        {menu ? (
          <div className="menu-list" role="menu">
            <button type="button" role="menuitem" disabled={!p.canUndo} onClick={() => p.onUndo()}>
              Undo <kbd>Ctrl Z</kbd>
            </button>
            <button type="button" role="menuitem" disabled={!p.canRedo} onClick={() => p.onRedo()}>
              Redo <kbd>Ctrl ⇧ Z</kbd>
            </button>
            <hr />
            <button
              type="button"
              role="menuitem"
              data-testid="menu-export"
              onClick={() => {
                setMenu(false)
                p.onExport()
              }}
            >
              Export to file…
            </button>
            <button type="button" role="menuitem" data-testid="menu-import" onClick={() => fileRef.current?.click()}>
              Import from file…
            </button>
            {backups.length ? (
              <>
                <hr />
                <p className="menu-label">Restore a snapshot</p>
                {backups.map((b) => (
                  <button
                    key={b.at}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenu(false)
                      p.onRestore(b.at)
                    }}
                  >
                    {new Date(b.at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    <span className="menu-meta">{b.doc.nodes.length} items</span>
                  </button>
                ))}
              </>
            ) : null}
          </div>
        ) : null}
        <input
          ref={fileRef}
          type="file"
          accept=".json,.txt,application/json,text/plain"
          hidden
          data-testid="import-file"
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            setMenu(false)
            if (file) p.onImport(file)
          }}
        />
      </div>
    </header>
  )
}
