import { useEffect, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import type { ShellResult } from '../model/shell'
import { listBackups } from '../model/store'
import { LANE_LABEL, type Doc, type Lane, type Node } from '../model/types'
import { BrandMark, Cross, Dots, Plus } from './Glyph'
import { Palette, type FilterPatch } from './Palette'
import { Saved } from './Saved'

type TopBarProps = {
  query: string
  hits: number | null
  projects: Node[]
  filterId: number | null
  laneFilter: Lane | null
  urgentOnly: boolean
  onQueryChange: (value: string) => void
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
  /* Hellish directory: the palette under the one input, filter chips, the saved stamp, the shortcut sheet. */
  doc: Doc
  savedAt: number | null
  onOpenNode: (id: number) => void
  onRunCommand: (line: string) => ShellResult
  onApplyFilter: (patch: FilterPatch) => void
  onHelp: () => void
}

export function TopBar(p: TopBarProps) {
  const [menu, setMenu] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const findRef = useRef<HTMLInputElement>(null)

  /* Hellish directory: the ⋯ menu walks with the keyboard — ↓ on the button opens it, ↑ ↓ Home End move between its items, Esc closes (above). */
  function onMenuKey(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (!menu) {
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
      e.preventDefault()
      setMenu(true)
      requestAnimationFrame(() => menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')?.focus())
      return
    }
    const items = [...e.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')]
    if (!items.length) return
    const at = items.indexOf(document.activeElement as HTMLButtonElement)
    let to = -1
    if (e.key === 'ArrowDown') to = at < 0 ? 0 : (at + 1) % items.length
    else if (e.key === 'ArrowUp') to = at < 0 ? items.length - 1 : (at - 1 + items.length) % items.length
    else if (e.key === 'Home') to = 0
    else if (e.key === 'End') to = items.length - 1
    if (to < 0) return
    e.preventDefault()
    items[to].focus()
  }

  function openFilter() {
    p.onQueryChange('p:')
    findRef.current?.focus()
  }

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

  const project = p.filterId == null ? null : p.projects.find((x) => x.id === p.filterId)
  const backups = menu ? listBackups().slice(0, 8) : []

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <BrandMark className="brand-mark" />
        <p className="brand-name">Vault Worldwide</p>
      </div>

      {/* Hellish directory: the one input is the palette's — search, `>` commands and p: s: ! filters, with its rows beneath. */}
      <Palette
        doc={p.doc}
        text={p.query}
        hits={p.hits}
        inputRef={findRef}
        onChange={p.onQueryChange}
        onOpenNode={p.onOpenNode}
        onRunCommand={p.onRunCommand}
        onApplyFilter={p.onApplyFilter}
      />

      {/* Hellish directory: the filters are chips drawn from what is active, each with its own ×; `Filter…` opens the palette on `p:`. */}
      <div className="topbar-filters" data-testid="filters">
        {project ? (
          <span className="chip is-filter" data-testid="chip-project">
            <span className="chip-label">{project.title.trim() || '_'}</span>
            <button type="button" className="chip-clear" aria-label="Remove the project filter" onClick={() => p.onFilterChange(null)}>
              <Cross />
            </button>
          </span>
        ) : null}
        {p.laneFilter ? (
          <span className="chip is-filter" data-testid="chip-status">
            <span className="chip-label">Status: {LANE_LABEL[p.laneFilter]}</span>
            <button type="button" className="chip-clear" aria-label="Remove the status filter" onClick={() => p.onLaneFilterChange(null)}>
              <Cross />
            </button>
          </span>
        ) : null}
        {p.urgentOnly ? (
          <span className="chip is-filter is-urgent" data-testid="chip-urgent">
            <span className="chip-label">Urgent only</span>
            <button type="button" className="chip-clear" aria-label="Remove the urgent filter" onClick={() => p.onUrgentOnlyChange(false)}>
              <Cross />
            </button>
          </span>
        ) : null}
        <button type="button" className="chip chip-open" data-testid="filter-open" aria-label="Filter by project, status or urgency" onClick={openFilter}>
          Filter…
        </button>
      </div>

      <Saved at={p.savedAt} />

      <button type="button" className="new-job" data-testid="new-task" onClick={p.onNewTask}>
        <Plus className="new-job-glyph" />
        New task
      </button>

      <div className="menu" ref={menuRef} onKeyDown={onMenuKey}>
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
            <button
              type="button"
              role="menuitem"
              data-testid="menu-help"
              onClick={() => {
                setMenu(false)
                p.onHelp()
              }}
            >
              Keyboard shortcuts <kbd>?</kbd>
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
