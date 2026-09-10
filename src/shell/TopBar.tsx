import { type FormEvent, type KeyboardEvent } from 'react'
import type { GraphNode } from '../speck/doc'
import { COL_ORDER, LANE_PLAQUE, isBinderStatus, type ColName } from '../speck/tokens'
import { BrandMark, Caret, Chevron, Glass, Plus } from './Glyph'

type TopBarProps = {
  query: string
  hits: number | null
  projects: GraphNode[]
  filterId: number | null
  laneFilter: ColName | null
  urgentOnly: boolean
  onQueryChange: (value: string) => void
  onQuerySubmit: () => void
  onQueryFocus: () => void
  onFilterChange: (projectId: number | null) => void
  onLaneFilterChange: (lane: ColName | null) => void
  onUrgentOnlyChange: (urgentOnly: boolean) => void
  onNewJob: () => void
}

export function TopBar({
  query,
  hits,
  projects,
  filterId,
  laneFilter,
  urgentOnly,
  onQueryChange,
  onQuerySubmit,
  onQueryFocus,
  onFilterChange,
  onLaneFilterChange,
  onUrgentOnlyChange,
  onNewJob,
}: TopBarProps) {
  function onSubmit(e: FormEvent) {
    e.preventDefault()
    onQuerySubmit()
  }

  const folder = filterId == null ? null : projects.find((p) => p.id === filterId)
  const folderLabel = folder ? folder.title.trim() || '_' : 'All Projects'

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
          type="search"
          value={query}
          placeholder="Search tasks..."
          aria-label="Search tasks"
          onChange={(e) => onQueryChange(e.target.value)}
          onFocus={onQueryFocus}
          onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onQuerySubmit()
            }
          }}
        />
        {hits == null ? (
          <span className="find-keys" aria-hidden="true">
            &#8984; K
          </span>
        ) : (
          <span className="find-count">{hits} found</span>
        )}
      </form>

      <div className="topbar-filters">
        {/*
          The select carries the interaction and stays the focusable control; the
          span carries the width. Left to itself a select sizes to its longest
          option, which would let one long folder name stretch the whole bar.
        */}
        <label className="chip">
          <span className="chip-label">{folderLabel}</span>
          <Caret className="chip-caret" />
          <select
            className="chip-select"
            aria-label="Folder"
            data-testid="project-select"
            value={filterId ?? 'all'}
            onChange={(e) => onFilterChange(e.target.value === 'all' ? null : Number(e.target.value))}
          >
            <option value="all">All Projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title.trim() || '_'}
              </option>
            ))}
          </select>
        </label>

        <label className="chip">
          <span className="chip-label">
            {laneFilter ? `Status: ${LANE_PLAQUE[laneFilter]}` : 'Status: Any'}
          </span>
          <Caret className="chip-caret" />
          <select
            className="chip-select"
            aria-label="Status"
            data-testid="status-select"
            value={laneFilter ?? 'any'}
            onChange={(e) => {
              const next = e.target.value
              onLaneFilterChange(isBinderStatus(next) ? next : null)
            }}
          >
            <option value="any">Status: Any</option>
            {COL_ORDER.map((col) => (
              <option key={col} value={col}>
                {LANE_PLAQUE[col]}
              </option>
            ))}
          </select>
        </label>

        <label className="chip">
          <span className="chip-label">{urgentOnly ? 'Priority: Urgent' : 'Priority: Any'}</span>
          <Caret className="chip-caret" />
          <select
            className="chip-select"
            aria-label="Priority"
            data-testid="priority-select"
            value={urgentOnly ? 'urgent' : 'any'}
            onChange={(e) => onUrgentOnlyChange(e.target.value === 'urgent')}
          >
            <option value="any">Priority: Any</option>
            <option value="urgent">Priority: Urgent</option>
          </select>
        </label>
      </div>

      {/*
        Outside the filters, because it is not one: it keeps the bar's right
        edge on its own, and on a narrow screen it stays on the first row while
        the filters drop to the last.
      */}
      <button type="button" className="new-job" data-testid="project-add" onClick={onNewJob}>
        <Plus className="new-job-glyph" />
        New
        <Chevron className="new-job-chevron" />
      </button>
    </header>
  )
}
