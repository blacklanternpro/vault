import { useEffect, useMemo, useState, type KeyboardEvent, type RefObject } from 'react'
import { paletteKind, paletteRows, type PaletteRow, type ShellResult } from '../model/shell'
import type { Doc, Lane } from '../model/types'
import { Cross, Glass } from './Glyph'

export type FilterPatch = { project?: number | null; lane?: Lane | null; urgent?: boolean }

type PaletteProps = {
  doc: Doc
  /** The one input's text. Plain words search; `>` or a verb runs; `p:` `s:` `!` filter. */
  text: string
  /** How many cards the search matches, or null when not searching. */
  hits: number | null
  inputRef: RefObject<HTMLInputElement | null>
  onChange: (text: string) => void
  onOpenNode: (id: number) => void
  onRunCommand: (line: string) => ShellResult
  onApplyFilter: (patch: FilterPatch) => void
}

type Out = { text: string; error: boolean }

/**
 * The one input, and the rows under it. Focusing the search field opens the
 * panel (so Ctrl+K and a click are the same thing); what is typed decides what
 * the rows are: tasks that match, the command to run, or the filters to apply.
 * Up and Down move, Enter runs the row, Esc clears and closes.
 */
export function Palette(p: PaletteProps) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const [out, setOut] = useState<Out | null>(null)
  const rows = useMemo(() => paletteRows(p.doc, p.text), [p.doc, p.text])
  const kind = paletteKind(p.text)
  const text = p.text

  useEffect(() => {
    setActive(0)
    // Typing again moves on from the last command's output; an emptied line keeps it to be read.
    if (text) setOut(null)
  }, [text])

  function close() {
    setOpen(false)
    p.inputRef.current?.blur()
  }

  function run(row: PaletteRow) {
    if (row.kind === 'task') {
      p.onOpenNode(row.id)
      close()
    } else if (row.kind === 'command') {
      const res = p.onRunCommand(row.line)
      setOut(res.clear || !res.text ? null : { text: res.text, error: !res.ok })
      p.onChange('')
    } else if (row.kind === 'filter') {
      p.onApplyFilter({ project: row.project, lane: row.lane, urgent: row.urgent })
      p.onChange('')
      close()
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      p.onChange('')
      setOut(null)
      close()
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!rows.length) return
      e.preventDefault()
      setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length)
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const row = rows[active]
      if (row && row.kind !== 'none') run(row)
    }
  }

  return (
    <form
      className="find studio-find"
      role="search"
      onSubmit={(e) => e.preventDefault()}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <Glass className="find-glass" />
      <input
        ref={p.inputRef}
        className="find-input"
        type="text"
        value={text}
        placeholder="Search, or > a command, or p: s: ! to filter"
        aria-label="Search"
        role="combobox"
        aria-expanded={open}
        aria-controls="palette-list"
        aria-autocomplete="list"
        aria-activedescendant={open && rows[active] ? `palette-row-${active}` : undefined}
        autoComplete="off"
        spellCheck={false}
        data-testid="search"
        onFocus={() => setOpen(true)}
        onChange={(e) => p.onChange(e.target.value)}
        onKeyDown={onKeyDown}
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
          <button type="button" className="find-clear" aria-label="Clear search" onClick={() => p.onChange('')}>
            <Cross />
          </button>
        </>
      )}

      {open ? (
        <div className="palette" data-testid="palette" id="palette-list" role="listbox" aria-label="Results">
          {kind === 'empty' && !out ? (
            <p className="palette-hint">
              type to search · <code>&gt;</code> runs a command · <code>p:</code> <code>s:</code> <code>!</code> filter
            </p>
          ) : null}
          {kind === 'search' && !rows.length ? <p className="palette-hint">no match for “{text.trim()}”</p> : null}
          {rows.map((row, i) => (
            <div key={i} className="palette-slot">
              {row.kind === 'task' && (i === 0 || (rows[i - 1] as { project?: string }).project !== row.project) ? (
                <p className="palette-group">{row.project}/</p>
              ) : null}
              <button
                type="button"
                id={`palette-row-${i}`}
                role="option"
                aria-selected={i === active}
                disabled={row.kind === 'none'}
                className={`palette-row is-${row.kind}${i === active ? ' is-active' : ''}`}
                data-testid={`palette-row-${i}`}
                onPointerDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActive(i)}
                onClick={() => run(row)}
              >
                {row.kind === 'task' ? (
                  <>
                    <span className="palette-title">{row.title}</span>
                    {row.snippet ? (
                      <span className="palette-snippet">
                        {row.where === 'subtask' ? 'subtask' : 'description'} · {row.snippet}
                      </span>
                    ) : null}
                  </>
                ) : row.kind === 'command' ? (
                  <>
                    <span className="palette-prompt" aria-hidden="true">
                      $
                    </span>
                    <span className="palette-command">{row.line}</span>
                    <span className="palette-key">Enter runs</span>
                  </>
                ) : row.kind === 'filter' ? (
                  <>
                    <span className="palette-filter">{row.label}</span>
                    <span className="palette-key">filter</span>
                  </>
                ) : (
                  <span className="palette-none">{row.label}</span>
                )}
              </button>
            </div>
          ))}
          {out ? (
            <pre className={`palette-out${out.error ? ' is-error' : ''}`} data-testid="palette-out">
              {out.text}
            </pre>
          ) : null}
        </div>
      ) : null}
    </form>
  )
}
