import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import {
  addNode,
  addNote,
  byId,
  cardHits,
  cardOf,
  dockCard,
  hitchNote,
  isCard,
  logEvent, // agent handoff
  laneOf,
  moveCard,
  moveNote,
  projectOf,
  projectsOf,
  pullCard,
  removeNode,
  removeNote,
  restoreNote,
  restoreRemoved,
  setNoteText,
  setStatus,
  subtreeIds,
  toggleDone,
  updateNode,
} from '../model/doc'
import { paletteKind, runShell, type ShellResult } from '../model/shell'
import { DOC_KEY, exportFileName, exportText, importText, listBackups, load, save, snapshot, subscribe } from '../model/store'
import type { Doc, Lane } from '../model/types'
import { Board } from './Board'
import { Directory } from './Directory'
import { Drawer } from './Drawer'
import type { LiveLeash } from './Filament'
import { Help } from './Help'
import { Notices, type Toast } from './Notices'
import type { FilterPatch } from './Palette'
import { PaneHandle } from './Pane'
import { readDirWidth, writeDirWidth } from './paneWidth'
import { Scratch } from './Scratch'
import { Shell } from './Shell'
import { TopBar } from './TopBar'
import type { Settling } from './useBoardFlip'
import { useHistory } from './useHistory'
import { useJobDrag } from './useJobDrag'
/* --- agent handoff --- */
import { briefOf, formatDuration, sessionText, slugOf, spentOf } from '../model/brief'
import { applyPlan, revertApplied, type PlanRow } from '../model/report'
import { copyText, downloadText } from './clipboard'
import { SessionClock } from './Clock'
import { InboxBanner } from './InboxBanner'
import { ReportModal } from './Report'
import { TimesheetModal } from './Timesheet'
import { INBOX_KEY, readInbox, useInbox, type InboxEntry } from './useInbox'
/* --- agent bridge --- */
import { useBridge } from './useBridge'
/* --- end agent bridge --- */
import { useSession } from './useSession'
/* --- end agent handoff --- */
/* ----- night shift ----- */
import { eventsSince, markSeen, tonightOf } from '../model/doc'
import { Review } from './Review'
import { Since } from './Since'
import { dueDate, weekKey } from './time'
import { Tonight } from './Tonight'
import { cardIdOf, laneArrow, note, quoted, stamp, TONIGHT_MAX } from './trail'
import { useNow } from './useNow'
import { useTheme } from './useTheme'

/** How long a drawer has to have been open before closing it asks where you got to. `?leftoffMs=100` shortens it for a test. */
const LEFTOFF_MS = 10 * 60 * 1000
const REVIEW_OFFERED_KEY = 'vault:review-offered'

function leftOffThreshold(): number {
  try {
    const v = Number(new URLSearchParams(window.location.search).get('leftoffMs'))
    if (Number.isFinite(v) && v > 0) return v
  } catch {
    /* no window, no search: the default holds */
  }
  return LEFTOFF_MS
}
/* ----- end night shift ----- */

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
  const [holdSave, setHoldSave] = useState(Boolean(boot.holdSave))
  const [toasts, setToasts] = useState<Toast[]>(() =>
    boot.notice
      ? [
          {
            id: 1,
            text: boot.notice,
            sticky: true,
            action: boot.holdSave
              ? {
                  label: 'Save over it',
                  run: () => {
                    setHoldSave(false)
                    setToasts((list) => list.filter((t) => t.id !== 1))
                  },
                }
              : undefined,
          },
        ]
      : [],
  )
  const [saveFailed, setSaveFailed] = useState(false)
  /* Hellish directory: the shortcut sheet, the last good save, the directory pane's width. */
  const [help, setHelp] = useState(false)
  const [savedAt, setSavedAt] = useState<number | null>(null)
  const [dirWidth, setDirWidth] = useState(readDirWidth)

  /* --- agent handoff: the session clock, the report panel, the month's hours, the inbox --- */
  const clock = useSession()
  const [report, setReport] = useState<{ taskId: number | null; text: string; entry?: InboxEntry } | null>(null)
  const [timesheet, setTimesheet] = useState(false)
  const inbox = useInbox()
  /* --- end agent handoff --- */

  const liveRef = useRef<LiveLeash | null>(null)
  const settlingRef = useRef<Settling>(null)
  const toastSeq = useRef(10)
  /** What is already on disk, so a doc that came from another tab is not written straight back. */
  // An untouched seed is not written; a migrated or recovered board is, so the next load reads it directly.
  const lastSaved = useRef(boot.origin === 'saved' || boot.origin === 'seed' ? JSON.stringify(boot.doc) : '')

  /* ======================================================= night shift: state */
  const now = useNow()
  const { theme, toggle: toggleTheme } = useTheme()
  /** The shelf dims the rest of the board until Esc or "show all" lifts it, for the session. */
  const [dimLifted, setDimLifted] = useState(false)
  const [review, setReview] = useState(false)
  /** A drawer that has been open a while is closing: ask where you got to, then do `then`. */
  const [leftOff, setLeftOff] = useState<{ id: number; then: () => void } | null>(null)
  const openedAt = useRef<number | null>(null)
  const [leftOffMs] = useState(leftOffThreshold)
  /** What happened since the board was last left, read once at boot. */
  const [since] = useState(() => {
    const at = boot.doc.lastSeen
    if (at == null) return null
    const events = eventsSince(boot.doc, at)
    return events.length ? { at, events } : null
  })
  const [sinceShown, setSinceShown] = useState(true)
  /** The card the open drawer came from, so closing it can hand focus back. */
  const lastOpen = useRef<number | null>(null)
  const seenAt = useRef(0)
  /* ======================================================= end night shift */

  /* ------------------------------------------------------------ persistence */

  useEffect(() => {
    if (holdSave) return
    const json = JSON.stringify(doc)
    if (json === lastSaved.current) return
    const ok = save(doc)
    if (ok) lastSaved.current = json
    setSaveFailed(!ok)
    if (ok) setSavedAt(Date.now())
  }, [doc, holdSave])

  const { replace, adopt } = history
  useEffect(
    () =>
      subscribe((remote) => {
        lastSaved.current = JSON.stringify(remote)
        // Another tab's change is not this tab's to undo, so it does not go on this tab's undo stack.
        adopt(remote)
      }),
    [adopt],
  )

  /* ======================================================= night shift: last seen */
  /*
   * Leaving the board stamps it as seen, synchronously, since there is no later
   * for a page that is going. It is bookkeeping, not an edit: it goes into the
   * doc without a step on the undo stack, and an untouched seed is still not
   * written over a save that is not there yet.
   */
  const { amend } = history
  useEffect(() => {
    const mark = () => {
      const t = Date.now()
      if (t - seenAt.current < 1000) return
      // Nothing has been written yet and nothing has happened: a seed has no "since last time" to keep.
      if (boot.origin === 'seed' && lastSaved.current === JSON.stringify(boot.doc)) return
      // A board that is not on disk (never saved, or storage cleared under us) is not put there on the way out.
      try {
        if (localStorage.getItem(DOC_KEY) == null) return
      } catch {
        return
      }
      seenAt.current = t
      const next = markSeen(history.ref.current, t)
      if (!holdSave) {
        const json = JSON.stringify(next)
        if (save(next)) lastSaved.current = json
      }
      amend(next)
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') mark()
    }
    window.addEventListener('pagehide', mark)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', mark)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [amend, boot, history.ref, holdSave])
  /* ======================================================= end night shift */

  /* ---------------------------------------------------------------- derived */

  // Anything pointing at a node that no longer exists (deleted, undone, changed in another tab) reads as nothing.
  const openCard = openId != null ? byId(doc, openId) : undefined
  const open = openCard && isCard(doc, openCard) ? openCard : undefined
  const selectedId = selected != null && byId(doc, selected) ? selected : null
  const projects = projectsOf(doc)
  const filterId = projectFilter != null && byId(doc, projectFilter)?.parent === null ? projectFilter : null
  // Hellish directory: the one input also takes `>` commands and `p:` `s:` `!` filter words; only plain text searches.
  const search = paletteKind(query) === 'search' ? query : ''
  const hits = useMemo(() => (search.trim() ? cardHits(doc, search) : null), [doc, search])

  /* ---------------------------------------------------------------- notices */

  const toast = useCallback((text: string, action?: Toast['action']) => {
    const id = ++toastSeq.current
    setToasts((list) => [...list.filter((t) => t.sticky), { id, text, action }])
  }, [])

  const dismiss = useCallback((id: number) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  /* --- agent bridge: the board kept in step with `vault-agent serve`, when it is turned on --- */
  const bridge = useBridge({
    doc,
    adopt: (d) => {
      lastSaved.current = ''
      adopt(d)
    },
    notify: (text) => toast(text),
  })
  // Reports an agent left on the bridge join the browser's own inbox, where the banner already reads them.
  const { inbox: bridgeInbox, dismissInbox: dismissBridgeInbox } = bridge
  useEffect(() => {
    if (!bridgeInbox.length) return
    const local = readInbox()
    for (const e of bridgeInbox) {
      if (!local.some((l) => l.at === e.at && l.text === e.text)) local.push(e)
    }
    try {
      window.localStorage.setItem(INBOX_KEY, JSON.stringify(local))
      window.dispatchEvent(new Event('vault:inbox'))
    } catch {
      return
    }
    // Taken: remove from the bridge, last first so the indexes stay right.
    for (let i = bridgeInbox.length - 1; i >= 0; i--) void dismissBridgeInbox(i)
  }, [bridgeInbox, dismissBridgeInbox])
  /* --- end agent bridge --- */

  /* ----------------------------------------------------------------- writes */

  const { commit } = history

  /**
   * The Undo on a toast takes back that change and only that one: a plain undo
   * while nothing has happened since, otherwise a targeted restore into the doc as it now is.
   */
  function undoOf(after: Doc, restore: (current: Doc) => Doc): Toast['action'] {
    return {
      label: 'Undo',
      run: () => {
        if (history.ref.current === after) history.undo()
        else commit(restore(history.ref.current))
      },
    }
  }

  function deleteNode(id: number) {
    const before = history.ref.current
    const node = byId(before, id)
    if (!node) return
    const ids = subtreeIds(before, id)
    const name = node.title.trim() || 'untitled'
    /* night shift: the trail keeps the delete (the node is gone, so the line stands on its own) and the restore */
    const after = note(removeNode(before, id), 'deleted', `deleted ${quoted(name)}`)
    commit(after)
    setEditing(null)
    const inside = ids.length - 1
    const own = cardIdOf(before, id) === id
    toast(
      `Deleted “${name}”${inside ? ` and ${inside} inside` : ''}`,
      undoOf(after, (cur) => stamp(restoreRemoved(cur, before, ids), id, 'restored', own ? 'restored' : `restored ${quoted(name)}`)),
    )
  }

  /** A new task hidden by a filter is a task you cannot see you made: clear whatever hides it, and say so. */
  function reveal(next: Doc, id: number, lane: Lane) {
    const cleared: string[] = []
    if (filterId != null && projectOf(next, id)?.id !== filterId) {
      setProjectFilter(null)
      cleared.push('project')
    }
    if (laneFilter && laneFilter !== lane) {
      setLaneFilter(null)
      cleared.push('status')
    }
    if (urgentOnly) {
      setUrgentOnly(false)
      cleared.push('urgent')
    }
    if (search.trim() && !cardHits(next, search).has(id)) {
      setQuery('')
      cleared.push('search')
    }
    if (cleared.length) toast(`Cleared the ${cleared.join(' and ')} filter so you can see the new task`)
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
    const after = created(made.doc, made.id)
    commit(after)
    setSelected(made.id)
    reveal(after, made.id, lane)
  }

  function rename(id: number, title: string) {
    const clean = title.trim()
    if (!clean) return
    const node = byId(history.ref.current, id)
    if (!node || node.title === clean) return
    const own = cardIdOf(history.ref.current, id) === id
    commit(
      stamp(updateNode(history.ref.current, id, { title: clean }), id, 'renamed', own ? `renamed from ${quoted(node.title)}` : `renamed ${quoted(node.title)} to ${quoted(clean)}`),
    )
  }

  /* ======================================================= night shift: trail writers */
  /*
   * Every change is written to the trail after it is made, inside the same
   * commit, so an undo takes the line back with the change. A line goes on the
   * card it happened to (a subtask's tick on its card) and stamps it touched.
   */

  /** A node just made: "created" on a card, "added" on the card a new line went into. */
  function created(next: Doc, id: number): Doc {
    const node = byId(next, id)
    if (!node) return next
    return stamp(next, id, 'created', cardIdOf(next, id) === id ? 'created' : `added ${quoted(node.title)}`)
  }

  /** A lane change by any verb. Nothing is written when the lane is the same one. */
  function moved(cur: Doc, id: number, lane: Lane, next: Doc): Doc {
    const was = byId(cur, id)?.status
    if (next === cur || was === lane) return next
    return stamp(next, id, 'moved', laneArrow(lane))
  }

  function ticked(cur: Doc, id: number): Doc {
    const node = byId(cur, id)
    const next = toggleDone(cur, id)
    if (next === cur || !node) return next
    return stamp(next, id, 'ticked', `${byId(next, id)?.status === 'done' ? 'ticked' : 'unticked'} ${quoted(node.title)}`)
  }

  function toggleTonight(id: number) {
    const cur = history.ref.current
    const cardId = cardIdOf(cur, id)
    const node = byId(cur, cardId)
    if (!node || !isCard(cur, node)) return
    if (node.tonight) {
      commit(stamp(updateNode(cur, cardId, { tonight: false }), cardId, 'tonight', "off tonight's shelf"))
      return
    }
    if (tonightOf(cur).length >= TONIGHT_MAX) {
      toast('Tonight holds three. Finish or drop one first.')
      return
    }
    commit(stamp(updateNode(cur, cardId, { tonight: true }), cardId, 'tonight', "on tonight's shelf"))
  }

  function setDue(id: number, due: string) {
    const cur = history.ref.current
    if ((byId(cur, id)?.due ?? '') === due) return
    commit(stamp(updateNode(cur, id, { due }), id, 'due', due ? `due ${dueDate(due, now)}` : 'due date cleared'))
  }

  function setNext(id: number, next: string) {
    const cur = history.ref.current
    if ((byId(cur, id)?.next ?? '') === next.trim()) return
    commit(updateNode(cur, id, { next: next.trim(), touched: Date.now() }))
  }

  /** The shelf dims the board; Esc with nothing open, or "show all", lifts it for the session. */
  function liftDim() {
    if (tonightOf(history.ref.current).length) setDimLifted(true)
  }

  /**
   * Closing a drawer that has been open a while first asks where you got to.
   * `then` is what the close was going to do, and runs once the question is
   * answered or skipped. A second close request while the question is up just
   * replaces what happens after.
   */
  function requestClose(then: () => void) {
    const id = keyState.current.openId
    const at = openedAt.current
    const node = id != null ? byId(history.ref.current, id) : undefined
    if (id != null && node && at != null && Date.now() - at >= leftOffMs) {
      setLeftOff({ id, then })
      return
    }
    then()
  }

  function resolveLeftOff(text: string | null) {
    const pending = leftOff
    if (!pending) return
    setLeftOff(null)
    const clean = text?.trim() ?? ''
    const cur = history.ref.current
    if (clean && byId(cur, pending.id)) {
      commit(stamp(updateNode(cur, pending.id, { leftOff: clean }), pending.id, 'leftoff', `left off: ${clean}`))
    }
    pending.then()
  }
  /* ======================================================= end night shift */

  /* ---------------------------------------------------------------- reading */

  /**
   * Hellish directory: one selection, two views. Selecting from the board (or
   * the shell) unfolds the directory down to the row, so it can be scrolled to
   * and lit; the Directory does the scrolling when its selected row changes.
   */
  function unfold(id: number) {
    setCollapsed((set) => {
      const cur = history.ref.current
      const next = new Set(set)
      let node = byId(cur, id)
      while (node && node.parent != null) {
        node = byId(cur, node.parent)
        if (node) next.delete(node.id)
      }
      return next.size === set.size ? set : next
    })
  }

  function openNode(id: number) {
    const card = cardOf(history.ref.current, id)
    const go = () => {
      setSelected(id)
      unfold(id)
      setOpenId(card ? card.id : null)
    }
    /* night shift: leaving one card for another is a close too, and may ask where you got to */
    const leaving = keyState.current.openId != null && (card?.id ?? null) !== keyState.current.openId
    if (leaving) requestClose(go)
    else go()
  }

  /* ---------------------------------------------- hellish directory: shell */

  /**
   * One line of the prompt (or a `>` line in the palette). The shell is pure
   * and hands back what changed; it is applied here so every mutation goes
   * through commit (undoable, toasted) and a delete gets the usual Undo.
   */
  function runShellLine(line: string): ShellResult {
    const before = history.ref.current
    const res = runShell(line, { doc: before, cwd: filterId })
    if (res.doc) {
      commit(res.doc)
      toast(res.text)
      const made = res.select != null && !byId(before, res.select) ? byId(res.doc, res.select) : undefined
      if (made && made.parent != null) reveal(res.doc, made.id, laneOf(made.status))
      else if (made && filterId != null) {
        setProjectFilter(null)
        toast('Cleared the project filter so you can see the new project')
      }
    }
    if (res.remove != null) deleteNode(res.remove)
    if (res.cwd !== undefined) setProjectFilter(res.cwd)
    if (res.open != null) openNode(res.open)
    else if (res.select != null) {
      setSelected(res.select)
      unfold(res.select)
    }
    return res
  }

  /** A filter row from the palette: `p:homepage`, `s:active`, `!`. Only the words given change. */
  function applyFilter(patch: FilterPatch) {
    if (patch.project !== undefined) setProjectFilter(patch.project)
    if (patch.lane !== undefined) setLaneFilter(patch.lane)
    if (patch.urgent !== undefined) setUrgentOnly(patch.urgent)
  }

  /* ------------------------------------------------------------------- keys */

  const { undo, redo } = history
  const keyState = useRef({ draft, editing, openId, selected, leftOff })
  keyState.current = { draft, editing, openId, selected, leftOff }
  /* night shift: the Esc branches below reach these through a ref, so the listener is bound once */
  const nightKeys = useRef({ requestClose, resolveLeftOff, liftDim })
  nightKeys.current = { requestClose, resolveLeftOff, liftDim }

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
      // Hellish directory: `/` goes to the one input, `?` lists the shortcuts. Neither touches data.
      if (!mod && !e.altKey && e.key === '/') {
        e.preventDefault()
        document.querySelector<HTMLInputElement>('.find-input')?.focus()
        return
      }
      if (!mod && !e.altKey && e.key === '?') {
        e.preventDefault()
        setHelp(true)
        return
      }
      if (mod && (e.key.toLowerCase() === 'z' || e.key.toLowerCase() === 'y')) {
        e.preventDefault()
        const again = e.key.toLowerCase() === 'y' || e.shiftKey
        const did = again ? redo() : undo()
        if (did) toast(again ? 'Redone' : 'Undone')
        return
      }
      if (e.key === 'Escape') {
        const s = keyState.current
        const n = nightKeys.current
        /* night shift: a pending "where did you get to?" is skipped; a close may ask it; nothing open lifts the shelf's dim */
        if (s.leftOff) n.resolveLeftOff(null)
        else if (s.draft) setDraft(null)
        else if (s.editing) setEditing(null)
        else if (s.openId != null) n.requestClose(() => setOpenId(null))
        else {
          setSelected(null)
          n.liftDim()
        }
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
    onStage: (id, lane, beforeId) => {
      const cur = history.ref.current
      commit(moved(cur, id, lane, moveCard(cur, id, lane, beforeId)))
    },
    onPull: (id, lane, beforeId) => {
      const cur = history.ref.current
      const next = pullCard(cur, id, lane, beforeId)
      commit(next === cur ? cur : stamp(next, id, 'moved', `pulled ${laneArrow(lane)}`))
    },
    onDock: (id, parentId) => {
      const cur = history.ref.current
      const next = dockCard(cur, id, parentId)
      const child = byId(cur, id)
      commit(next === cur || !child ? next : stamp(next, parentId, 'moved', `docked ${quoted(child.title)}`))
    },
    onShelf: (id) => {
      // Dropping a card that is already on the shelf puts it nowhere new.
      if (!byId(history.ref.current, id)?.tonight) toggleTonight(id)
    },
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
      const before = history.ref.current
      snapshot(before, true)
      replace(next)
      setOpenId(null)
      setSelected(null)
      toast(`Imported ${next.nodes.length} items from ${file.name}`, undoOf(next, () => before))
    } catch (err) {
      toast(err instanceof Error ? err.message : "Couldn't read that file.")
    }
  }

  function restore(at: number) {
    const found = listBackups().find((b) => b.at === at)
    if (!found) return
    const before = history.ref.current
    snapshot(before, true)
    replace(found.doc)
    toast(`Restored the snapshot from ${new Date(at).toLocaleString()}`, undoOf(found.doc, () => before))
  }

  /* --------------------------------------------------------- agent handoff
   * A task goes out as a brief, comes back as a report, and the clock runs
   * in between. The ⋯ menu's items act on `target`: the open card, else the
   * selected one's card.
   */

  const target = open ?? (selectedId != null ? cardOf(doc, selectedId) : undefined)

  function copyBrief(id: number) {
    const cur = history.ref.current
    if (!byId(cur, id)) return
    const text = briefOf(cur, id)
    void copyText(text).then((ok) => {
      if (!ok) {
        toast("Couldn't reach the clipboard", { label: 'Download .md', run: () => downloadBrief(id) })
        return
      }
      if (byId(history.ref.current, id)) commit(logEvent(history.ref.current, 'report', 'brief copied', id))
      toast(`Brief copied (${text.trimEnd().split('\n').length} lines)`)
    })
  }

  function downloadBrief(id: number) {
    const cur = history.ref.current
    const node = byId(cur, id)
    if (!node) return
    const name = `${slugOf(node.title)}-brief.md`
    downloadText(name, briefOf(cur, id))
    commit(logEvent(cur, 'report', 'brief downloaded', id))
    toast(`Downloaded ${name}`)
  }

  function openReport(taskId: number | null, text = '', entry?: InboxEntry) {
    setReport({ taskId, text, entry })
  }

  /** One commit for the whole report, so one Ctrl+Z takes all of it back. */
  function applyReport(taskId: number, rows: PlanRow[]) {
    const entry = report?.entry
    setReport(null)
    if (entry) inbox.remove(entry)
    const before = history.ref.current
    const applied = applyPlan(before, taskId, rows)
    if (applied.doc === before) {
      toast(applied.summary)
      return
    }
    commit(applied.doc)
    toast(applied.summary, undoOf(applied.doc, (cur) => revertApplied(cur, taskId, applied)))
  }

  /** Stops the clock and books its seconds to the task it ran on. */
  function stopSession() {
    const stopped = clock.stop()
    if (!stopped) return
    const before = history.ref.current
    const node = byId(before, stopped.id)
    if (!node || stopped.seconds < 1) {
      toast('Session stopped')
      return
    }
    const was = node.spent ?? 0
    const at = Date.now()
    const after = logEvent(updateNode(before, stopped.id, { spent: was + stopped.seconds, touched: at }), 'note', sessionText(stopped.seconds), stopped.id, at)
    commit(after)
    toast(`${formatDuration(stopped.seconds)} logged to ${node.title.trim() || '_'}`, undoOf(after, (cur) => updateNode(cur, stopped.id, { spent: was })))
  }

  function startSession(id: number) {
    if (clock.session?.id === id) return
    if (clock.session) stopSession()
    const node = byId(history.ref.current, id)
    if (!node) return
    clock.start(id)
    toast(`Session started on ${node.title.trim() || '_'}`)
  }

  function toggleSession() {
    if (clock.session) stopSession()
    else if (target) startSession(target.id)
  }

  // A clock on a task that is no longer there has nothing to run for.
  const { session, stop: stopClock } = clock
  useEffect(() => {
    if (session && !byId(doc, session.id)) stopClock()
  }, [doc, session, stopClock])

  /* ------------------------------------------------------ end agent handoff */
  /* ======================================================= night shift: effects */

  // How long the drawer has been on this card, for the left-off question.
  const openCardId = open?.id ?? null
  useEffect(() => {
    openedAt.current = openCardId != null ? Date.now() : null
  }, [openCardId])

  // The drawer took focus on its title when it opened; closing hands it back to the card it came from.
  // Only when the focus went with the drawer: a reader working in the tree keeps their place there.
  useEffect(() => {
    if (openCardId == null && lastOpen.current != null) {
      const active = document.activeElement
      if (!active || active === document.body) {
        document.querySelector<HTMLElement>(`[data-card-id="${lastOpen.current}"]`)?.focus({ preventScroll: true })
      }
    }
    lastOpen.current = openCardId
  }, [openCardId])

  // Sunday's first open offers the review, once a week. A test runner is never offered it.
  useEffect(() => {
    if (new Date().getDay() !== 0 || navigator.webdriver) return
    const key = weekKey()
    try {
      if (localStorage.getItem(REVIEW_OFFERED_KEY) === key) return
      localStorage.setItem(REVIEW_OFFERED_KEY, key)
    } catch {
      return
    }
    toast('Sunday. Weekly review?', { label: 'Open', run: () => setReview(true) })
  }, [toast])

  const tonight = tonightOf(doc)
  const focusMode = tonight.length > 0 && !dimLifted
  /* ======================================================= end night shift */

  /* ---------------------------------------------------------------- render */

  const shared = { doc, query: search, selectedId, editing, draft }

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
        doc={doc}
        savedAt={savedAt}
        onOpenNode={openNode}
        onRunCommand={runShellLine}
        onApplyFilter={applyFilter}
        onHelp={() => setHelp(true)}
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
        /* --- agent handoff --- */
        clock={<SessionClock doc={doc} session={clock.session} onOpen={openNode} onStop={stopSession} />}
        hasTarget={Boolean(target)}
        sessionRunning={Boolean(clock.session)}
        onCopyBrief={() => target && copyBrief(target.id)}
        onPasteReport={() => target && openReport(target.id)}
        onToggleSession={toggleSession}
        onTimesheet={() => setTimesheet(true)}
        /* --- end agent handoff --- */
        /* ----- night shift ----- */
        onReview={() => setReview(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
        /* --- agent bridge --- */
        bridgeOn={bridge.settings.enabled}
        bridgeStatus={bridge.status}
        onToggleBridge={() => bridge.setSettings({ ...bridge.settings, enabled: !bridge.settings.enabled })}
      />

      {/* --- agent handoff: reports left in the inbox --- */}
      <InboxBanner
        doc={doc}
        entries={inbox.entries}
        onReview={(e) => openReport(e.taskId != null && byId(doc, e.taskId) ? e.taskId : null, e.text, e)}
        onDismiss={inbox.remove}
      />
      {/* --- end agent handoff --- */}

      {/* ----- night shift: since last time ----- */}
      {since && sinceShown ? <Since doc={doc} since={since.at} events={since.events} now={now} onDismiss={() => setSinceShown(false)} /> : null}

      <Notices
        toasts={toasts}
        saveFailed={saveFailed}
        onAction={(t) => {
          t.action?.run()
          if (!t.sticky) setToasts((list) => list.filter((x) => x.sticky))
        }}
        onDismiss={dismiss}
        onExport={exportFile}
      />

      {/* Hellish directory: on a wide field the stage splits — directory pane left (--dir-width), board right. */}
      <main className="stage" style={{ '--dir-width': `${dirWidth}px` } as CSSProperties}>
        {/* ----- night shift: tonight's shelf ----- */}
        <Tonight
          doc={doc}
          cards={tonight}
          now={now}
          openId={open?.id ?? null}
          focus={focusMode}
          dragging={dragging}
          onOpen={openNode}
          onRemove={toggleTonight}
          onToggleFocus={() => setDimLifted((lifted) => !lifted)}
        />
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
          now={now}
          focus={focusMode}
          onToggleTonight={toggleTonight}
          onOpen={openNode}
          onDelete={deleteNode}
          onAdvance={(id, lane) => {
            const cur = history.ref.current
            commit(moved(cur, id, lane, setStatus(cur, id, lane)))
          }}
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
              // A new row has to be seen to be typed: a search would hide it.
              if (query.trim()) setQuery('')
              setDraft({ where: 'tree', parent })
              if (parent != null) setCollapsed((set) => (set.has(parent) ? new Set([...set].filter((x) => x !== parent)) : set))
            }}
            onDraftCommit={(parent, title, keepGoing) => {
              if (title.trim()) {
                const made = addNode(history.ref.current, { parent, title: title.trim() })
                commit(created(made.doc, made.id))
                if (!keepGoing) setSelected(made.id)
                if (parent == null && filterId != null) {
                  setProjectFilter(null)
                  toast('Cleared the project filter so you can see the new project')
                }
              }
              if (!keepGoing || !title.trim()) setDraft(null)
            }}
            onDelete={deleteNode}
            onCommit={(next) => commit(next)}
            onSetLane={(id, lane) => {
              const cur = history.ref.current
              commit(moved(cur, id, lane, setStatus(cur, id, lane)))
            }}
            onToggleDone={(id) => commit(ticked(history.ref.current, id))}
            onStage={(id, lane) => {
              const cur = history.ref.current
              commit(moved(cur, id, lane, moveCard(cur, id, lane)))
            }}
            onPull={(id, lane) => {
              const cur = history.ref.current
              const next = pullCard(cur, id, lane)
              commit(next === cur ? cur : stamp(next, id, 'moved', `pulled ${laneArrow(lane)}`))
            }}
            onToggleTonight={toggleTonight}
            /* Hellish directory: the dump is the listing's first folder, inbox/. */
            inbox={
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
                onRemove={(id, original, session) => {
                  const before = history.ref.current
                  const after = removeNote(before, id)
                  // Same step as the typing that emptied it, so Undo brings the note back with its words.
                  commit(after, `note:${session}`, Infinity)
                  if (original.trim()) {
                    toast('Note removed', undoOf(after, (cur) => setNoteText(restoreNote(cur, before, id), id, original)))
                  }
                }}
                onReorder={(from, to) => commit(moveNote(history.ref.current, from, to))}
                onHitch={(id, nodeId) => {
                  const cur = history.ref.current
                  const next = hitchNote(cur, id, nodeId)
                  const text = cur.notes.find((n) => n.id === id)?.text.split('\n')[0]?.trim()
                  /* night shift: a note hitched to a card goes on its trail */
                  commit(nodeId != null && next !== cur ? stamp(next, nodeId, 'note', `note hitched${text ? `: ${quoted(text)}` : ''}`) : next)
                }}
              />
            }
          />
          {/* Hellish directory: the prompt at the foot of the pane, and the handle that sets its width. */}
          <Shell doc={doc} cwd={filterId} onRun={runShellLine} />
          <PaneHandle
            width={dirWidth}
            onWidth={(w) => {
              setDirWidth(w)
              writeDirWidth(w)
            }}
          />
        </section>
      </main>

      {open ? (
        <Drawer
          key={open.id}
          {...shared}
          node={open}
          drag={drag}
          onClose={() => requestClose(() => setOpenId(null))}
          onSetLane={(lane) => {
            const cur = history.ref.current
            commit(moved(cur, open.id, lane, setStatus(cur, open.id, lane)))
          }}
          onToggleUrgent={() => commit(updateNode(history.ref.current, open.id, { urgent: !open.urgent, touched: Date.now() }))}
          onDelete={() => {
            setLeftOff(null)
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
            if (body !== (open.body ?? '')) {
              const cur = history.ref.current
              const text = !body.trim() ? 'description cleared' : open.body?.trim() ? 'description edited' : 'description added'
              commit(stamp(updateNode(cur, open.id, { body }), open.id, 'note', text))
            }
          }}
          onToggleDone={(id) => commit(ticked(history.ref.current, id))}
          onDeleteLine={deleteNode}
          onStartLine={() => {
            setEditing(null)
            setDraft({ where: 'drawer', parent: open.id })
          }}
          onLineCommit={(title, keepGoing) => {
            if (title.trim()) {
              const made = addNode(history.ref.current, { parent: open.id, title: title.trim() })
              commit(created(made.doc, made.id))
            }
            if (!keepGoing || !title.trim()) setDraft(null)
          }}
          onOpenProject={(id) => setProjectFilter(id)}
          /* --- agent handoff --- */
          spent={spentOf(doc, open.id)}
          sessionRunning={clock.session?.id === open.id}
          onLinks={(links) => commit(updateNode(history.ref.current, open.id, { links }))}
          onCopyBrief={() => copyBrief(open.id)}
          onDownloadBrief={() => downloadBrief(open.id)}
          onPasteReport={() => openReport(open.id)}
          onStartSession={() => startSession(open.id)}
          onStopSession={stopSession}
          /* --- end agent handoff --- */
          /* ----- night shift ----- */
          now={now}
          onDue={(due) => setDue(open.id, due)}
          onNext={(next) => setNext(open.id, next)}
          onToggleTonight={() => toggleTonight(open.id)}
          onDust={() => {
            const cur = history.ref.current
            commit(moved(cur, open.id, 'dusted', setStatus(cur, open.id, 'dusted')))
          }}
          leftOff={leftOff && leftOff.id === open.id ? { onSave: resolveLeftOff, onSkip: () => resolveLeftOff(null) } : null}
        />
      ) : null}

      {/* ----- night shift: the weekly review ----- */}
      {review ? (
        <Review
          doc={doc}
          now={now}
          onClose={() => setReview(false)}
          onOpen={(id) => {
            setReview(false)
            openNode(id)
          }}
          onDust={(id) => {
            const cur = history.ref.current
            commit(moved(cur, id, 'dusted', setStatus(cur, id, 'dusted')))
          }}
        />
      ) : null}

      {/* --- agent handoff: the report panel and the month's hours --- */}
      {report ? <ReportModal doc={doc} taskId={report.taskId} initialText={report.text} onApply={applyReport} onClose={() => setReport(null)} /> : null}
      {timesheet ? <TimesheetModal doc={doc} onClose={() => setTimesheet(false)} /> : null}
      {/* --- end agent handoff --- */}

      {/* Hellish directory: every shortcut, from `?` or the ⋯ menu. */}
      <Help open={help} onClose={() => setHelp(false)} />
    </div>
  )
}

