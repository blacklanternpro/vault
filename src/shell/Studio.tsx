import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  addNode,
  addNote,
  boardCards,
  byId,
  cardHits,
  cardOf,
  dockCard,
  hitchNote,
  isCard,
  moveCard,
  moveNote,
  projectOf,
  projectsOf,
  pullCard,
  removeNode,
  removeNote,
  setNoteText,
  setStatus,
  subtreeIds,
  toggleDone,
  updateNode,
} from '../model/doc'
import { exportFileName, exportText, importText, listBackups, load, save, snapshot, subscribe } from '../model/store'
import type { Lane } from '../model/types'
import { Board } from './Board'
import { Directory } from './Directory'
import { Drawer } from './Drawer'
import type { LiveLeash } from './Filament'
import { Notices, type Toast } from './Notices'
import { Scratch } from './Scratch'
import { TopBar } from './TopBar'
import type { Settling } from './useBoardFlip'
import { useHistory } from './useHistory'
import { useJobDrag } from './useJobDrag'

/** Where a not-yet-created item is being typed. Drafts live here, never in the doc. */
export type Draft =
  | { where: 'board'; lane: Lane; project: number | null }
  | { where: 'drawer'; parent: number }
  | { where: 'tree'; parent: number | null }

export type Editing = { id: number; field: 'title' | 'body'; where: 'board' | 'drawer' | 'tree' }

export function Studio() {
  const [boot] = useState(load)
  const history = useHistory(boot.doc)
  const doc = history.doc

  const [selected, setSelected] = useState<number | null>(null)
  const [openId, setOpenId] = useState<number | null>(null)
  const [editing, setEditing] = useState<Editing | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [collapsed, setCollapsed] = useState<ReadonlySet<number>>(() => new Set())
  const [projectFilter, setProjectFilter] = useState<number | null>(null)
  const [laneFilter, setLaneFilter] = useState<Lane | null>(null)
  const [urgentOnly, setUrgentOnly] = useState(false)
  const [query, setQuery] = useState('')
  const [focusNote, setFocusNote] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>(() => (boot.notice ? [{ id: 1, text: boot.notice, sticky: true }] : []))
  const [saveFailed, setSaveFailed] = useState(false)

  const liveRef = useRef<LiveLeash | null>(null)
  const settlingRef = useRef<Settling>(null)
  const toastSeq = useRef(10)
  /** What is already on disk, so a doc that came from another tab is not written straight back. */
  // An untouched seed is not written; a migrated or recovered board is, so the next load reads it directly.
  const lastSaved = useRef(boot.origin === 'saved' || boot.origin === 'seed' ? JSON.stringify(boot.doc) : '')

  /* ------------------------------------------------------------ persistence */

  useEffect(() => {
    const json = JSON.stringify(doc)
    if (json === lastSaved.current) return
    const ok = save(doc)
    if (ok) lastSaved.current = json
    setSaveFailed(!ok)
  }, [doc])

  const { replace } = history
  useEffect(
    () =>
      subscribe((remote) => {
        lastSaved.current = JSON.stringify(remote)
        replace(remote)
      }),
    [replace],
  )

  /* ---------------------------------------------------------------- derived */

  // Anything pointing at a node that no longer exists (deleted, undone, changed in another tab) reads as nothing.
  const openCard = openId != null ? byId(doc, openId) : undefined
  const open = openCard && isCard(doc, openCard) ? openCard : undefined
  const selectedId = selected != null && byId(doc, selected) ? selected : null
  const projects = projectsOf(doc)
  const filterId = projectFilter != null && byId(doc, projectFilter)?.parent === null ? projectFilter : null
  const hits = useMemo(() => (query.trim() ? cardHits(doc, query) : null), [doc, query])

  /* ---------------------------------------------------------------- notices */

  const toast = useCallback((text: string, undo = false) => {
    const id = ++toastSeq.current
    setToasts((list) => [...list.filter((t) => t.sticky), { id, text, undo }])
  }, [])

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  /* ----------------------------------------------------------------- writes */

  const { commit } = history

  function deleteNode(id: number) {
    const node = byId(history.ref.current, id)
    if (!node) return
    const inside = subtreeIds(history.ref.current, id).length - 1
    commit(removeNode(history.ref.current, id))
    setEditing(null)
    const name = node.title.trim() || 'untitled'
    toast(`Deleted “${name}”${inside ? ` and ${inside} inside` : ''}`, true)
  }

  /** Which project a new task belongs in: the filter, else wherever you are, else the first one. */
  function projectForNew(): number | null {
    if (filterId != null) return filterId
    const here = open?.id ?? selectedId
    if (here != null) return projectOf(doc, here)?.id ?? null
    return projects[0]?.id ?? null
  }

  function startTask(lane: Lane = laneFilter ?? 'pending') {
    setEditing(null)
    setDraft({ where: 'board', lane, project: projectForNew() })
  }

  function createTask(title: string, lane: Lane, project: number | null) {
    let next = history.ref.current
    let pid = project != null && byId(next, project) ? project : null
    if (pid == null) {
      const made = addNode(next, { parent: null, title: 'inbox' })
      next = made.doc
      pid = made.id
    }
    const made = addNode(next, { parent: pid, title, status: lane })
    commit(made.doc)
    setSelected(made.id)
  }

  function rename(id: number, title: string) {
    const clean = title.trim()
    if (!clean) return
    const node = byId(history.ref.current, id)
    if (!node || node.title === clean) return
    commit(updateNode(history.ref.current, id, { title: clean }))
  }

  /* ---------------------------------------------------------------- reading */

  function openNode(id: number) {
    const card = cardOf(history.ref.current, id)
    setSelected(id)
    setOpenId(card ? card.id : null)
  }

  function runSearch() {
    const first = boardCards(doc, filterId).find((c) => hits?.has(c.id))
    if (first) openNode(first.id)
  }

  /* ------------------------------------------------------------------- keys */

  const { undo, redo } = history
  const keyState = useRef({ draft, editing, openId, selected })
  keyState.current = { draft, editing, openId, selected }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        document.querySelector<HTMLInputElement>('.find-input')?.focus()
        return
      }
      // Anything typed into a field belongs to that field: its own undo, its own Backspace.
      if (t?.closest('input, textarea, select, [contenteditable="true"]')) return
      if (mod && (e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'y')) {
        e.preventDefault()
        const again = e.key.toLowerCase() === 'y' || e.shiftKey
        const did = again ? redo() : undo()
        if (did) toast(again ? 'Redone' : 'Undone')
        return
      }
      if (e.key === 'Escape') {
        const s = keyState.current
        if (s.draft) setDraft(null)
        else if (s.editing) setEditing(null)
        else if (s.openId != null) setOpenId(null)
        else setSelected(null)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo, redo, toast])

  /* ------------------------------------------------------------------- drag */

  const drag = useJobDrag({
    doc,
    liveRef,
    settling: settlingRef,
    setDragging,
    onStage: (id, lane, beforeId) => commit(moveCard(history.ref.current, id, lane, beforeId)),
    onPull: (id, lane, beforeId) => commit(pullCard(history.ref.current, id, lane, beforeId)),
    onDock: (id, parentId) => commit(dockCard(history.ref.current, id, parentId)),
    onTap: (id, target) => {
      const inDrawer = Boolean(target.closest('[data-nested-id]'))
      if (inDrawer) {
        setEditing({ id, field: 'title', where: 'drawer' })
        return
      }
      if (target.closest('[data-title]') && keyState.current.openId === id) {
        setEditing({ id, field: 'title', where: 'board' })
        return
      }
      openNode(id)
    },
  })

  /* --------------------------------------------------------- export/import */

  function exportFile() {
    const blob = new Blob([exportText(history.ref.current)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = exportFileName()
    a.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    toast(`Exported ${a.download}`)
  }

  async function importFile(file: File) {
    try {
      const next = importText(await file.text())
      snapshot(history.ref.current, true)
      replace(next)
      setOpenId(null)
      setSelected(null)
      toast(`Imported ${next.nodes.length} items from ${file.name}`, true)
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't read that file.")
    }
  }

  function restore(at: number) {
    const found = listBackups().find((b) => b.at === at)
    if (!found) return
    snapshot(history.ref.current, true)
    replace(found.doc)
    toast(`Restored the snapshot from ${new Date(at).toLocaleString()}`, true)
  }

  /* ---------------------------------------------------------------- render */

  const shared = { doc, query, selectedId, editing, draft }

  return (
    <div className={`studio${open ? ' has-drawer' : ''}`} data-testid="studio">
      <TopBar
        query={query}
        hits={hits ? hits.size : null}
        projects={projects}
        filterId={filterId}
        laneFilter={laneFilter}
        urgentOnly={urgentOnly}
        onQueryChange={setQuery}
        onQuerySubmit={runSearch}
        onFilterChange={setProjectFilter}
        onLaneFilterChange={setLaneFilter}
        onUrgentOnlyChange={setUrgentOnly}
        onNewTask={() => startTask()}
        onExport={exportFile}
        onImport={importFile}
        onRestore={restore}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onUndo={() => undo()}
        onRedo={() => redo()}
      />

      <Notices
        toasts={toasts}
        saveFailed={saveFailed}
        onUndo={() => {
          undo()
          setToasts((list) => list.filter((t) => t.sticky))
        }}
        onDismiss={dismiss}
        onExport={exportFile}
      />

      <main className="stage">
        <Board
          {...shared}
          filterId={filterId}
          laneFilter={laneFilter}
          urgentOnly={urgentOnly}
          hits={hits}
          openId={open?.id ?? null}
          drag={drag}
          liveRef={liveRef}
          settling={settlingRef}
          dragging={dragging}
          onOpen={openNode}
          onDelete={deleteNode}
          onAdvance={(id, lane) => commit(setStatus(history.ref.current, id, lane))}
          onStartTask={startTask}
          onDraftCommit={(title, lane, project) => {
            setDraft(null)
            if (title.trim()) createTask(title.trim(), lane, project)
          }}
          onRename={(id, title) => {
            setEditing(null)
            rename(id, title)
          }}
          onEditTitle={(id) => setEditing({ id, field: 'title', where: 'board' })}
        />

        <section className="catalogue">
          <Directory
            {...shared}
            filterId={filterId}
            collapsed={collapsed}
            onSelect={openNode}
            onFocusRow={setSelected}
            onToggle={(id) =>
              setCollapsed((set) => {
                const next = new Set(set)
                if (next.has(id)) next.delete(id)
                else next.add(id)
                return next
              })
            }
            onEdit={(id) => {
              setDraft(null)
              setEditing({ id, field: 'title', where: 'tree' })
            }}
            onRename={(id, title) => {
              setEditing(null)
              rename(id, title)
            }}
            onStartDraft={(parent) => {
              setEditing(null)
              setDraft({ where: 'tree', parent })
              if (parent != null) setCollapsed((set) => (set.has(parent) ? new Set([...set].filter((x) => x !== parent)) : set))
            }}
            onDraftCommit={(parent, title, keepGoing) => {
              if (title.trim()) {
                const made = addNode(history.ref.current, { parent, title: title.trim() })
                commit(made.doc)
                if (!keepGoing) setSelected(made.id)
              }
              if (!keepGoing || !title.trim()) setDraft(null)
            }}
            onDelete={deleteNode}
            onCommit={(next) => commit(next)}
            onSetLane={(id, lane) => commit(setStatus(history.ref.current, id, lane))}
            onToggleDone={(id) => commit(toggleDone(history.ref.current, id))}
            onStage={(id, lane) => commit(moveCard(history.ref.current, id, lane))}
            onPull={(id, lane) => commit(pullCard(history.ref.current, id, lane))}
          />
          <Scratch
            doc={doc}
            focusNote={focusNote}
            onFocused={() => setFocusNote(null)}
            onAdd={() => {
              const made = addNote(history.ref.current)
              commit(made.doc)
              setFocusNote(made.id)
            }}
            onEdit={(id, text, session) => commit(setNoteText(history.ref.current, id, text), `note:${session}`, Infinity)}
            onRemove={(id, hadText, session) => {
              // Same step as the typing that emptied it, so Undo brings the note back with its words.
              commit(removeNote(history.ref.current, id), `note:${session}`, Infinity)
              if (hadText) toast('Note removed', true)
            }}
            onReorder={(from, to) => commit(moveNote(history.ref.current, from, to))}
            onHitch={(id, nodeId) => commit(hitchNote(history.ref.current, id, nodeId))}
          />
        </section>
      </main>

      {open ? (
        <Drawer
          key={open.id}
          {...shared}
          node={open}
          drag={drag}
          onClose={() => setOpenId(null)}
          onSetLane={(lane) => commit(setStatus(history.ref.current, open.id, lane))}
          onToggleUrgent={() => commit(updateNode(history.ref.current, open.id, { urgent: !open.urgent }))}
          onDelete={() => {
            deleteNode(open.id)
            setOpenId(null)
          }}
          onEdit={(id, field) => {
            setDraft(null)
            setEditing({ id, field, where: 'drawer' })
          }}
          onRename={(id, title) => {
            setEditing(null)
            rename(id, title)
          }}
          onBody={(body) => {
            setEditing(null)
            if (body !== (open.body ?? '')) commit(updateNode(history.ref.current, open.id, { body }))
          }}
          onToggleDone={(id) => commit(toggleDone(history.ref.current, id))}
          onDeleteLine={deleteNode}
          onStartLine={() => {
            setEditing(null)
            setDraft({ where: 'drawer', parent: open.id })
          }}
          onLineCommit={(title, keepGoing) => {
            if (title.trim()) commit(addNode(history.ref.current, { parent: open.id, title: title.trim() }).doc)
            if (!keepGoing || !title.trim()) setDraft(null)
          }}
          onOpenProject={(id) => setProjectFilter(id)}
        />
      ) : null}
    </div>
  )
}

