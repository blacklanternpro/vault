import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import { boardCards, byId, childrenOf, daysUntil, depthOf, inSubtree, isCard, laneOf, logEvent, moveCard, progressOf, projectOf, projectsOf, pullCard, reparentNode, setStatus, updateNode } from '../model/doc'
import { seedDoc } from '../model/seed'
import { importText } from '../model/store'
import { LANE_LABEL, type Doc, type Lane, type Node } from '../model/types'
import { commitAsProject, commitDraft, draftStats, lineKey, parseTree, SAMPLE_PUSH, type Draft, type DraftLine } from './draft'

/*
 * PROTOTYPE — the pivot and the drop.
 *
 * One set of rows, two arrangements. The tree is home; `v` pivots every card
 * row into lanes by status and back, animated so a card is visibly its row.
 * Rows drag like files; a rail of lanes on the right takes drops; DONE is a
 * chute that feeds a counter. A pasted or pushed tree waits in inbox/ as a
 * draft until it is dragged onto a folder.
 *
 * Throwaway: it reuses src/model and keeps its own storage key, so the real
 * board is never touched.
 */

const DOC_KEY = 'vault-proto:doc'
const PUSHED_KEY = 'vault-proto:pushed'
const VIEW_KEY = 'vault-proto:view'
const BOARD_LANES: Lane[] = ['pending', 'rnd', 'active']
const STEP: Lane[] = ['pending', 'rnd', 'active', 'done']
const ACTIVE_CAP = 3
const MAX_MORPHS = 90

const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches
const pad = (n: number) => String(n).padStart(2, '0')
function isoIn(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function sample(): Doc {
  let doc = seedDoc()
  const due = (title: string, days: number) => {
    const id = doc.nodes.find((n) => n.title === title)?.id
    if (id != null) doc = updateNode(doc, id, { due: isoIn(days) })
  }
  due('SITE REDESIGN', 3)
  due('NAV RESTRUCTURE', -2)
  due('AESTHETIC PASS', 0)
  return doc
}

function read<T>(key: string, parse: (raw: string) => T, fallback: () => T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return parse(raw)
  } catch {
    /* unreadable: fall back */
  }
  return fallback()
}
function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* quota or private mode: the prototype carries on in memory */
  }
}

const WEEKDAY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
function dueWords(due?: string): string {
  if (!due) return ''
  const n = daysUntil(due)
  if (n < 0) return `${-n}d late`
  if (n === 0) return 'today'
  if (n === 1) return 'tmrw'
  if (n < 7) return WEEKDAY[new Date(`${due}T00:00`).getDay()]
  return due.slice(5).replace('-', '.')
}

/* ------------------------------------------------------------------ rows */

type Row =
  | { kind: 'project'; key: string; node: Node; count: number }
  | { kind: 'task' | 'subtask'; key: string; node: Node; prefix: string; buried: boolean }
  | { kind: 'dotdir'; key: string; project: Node; prefix: string; count: number }

function treeRows(doc: Doc, showDust: boolean): Row[] {
  const rows: Row[] = []
  const walk = (node: Node, lead: string, last: boolean, buried: boolean) => {
    rows.push({ kind: depthOf(doc, node.id) === 1 ? 'task' : 'subtask', key: `n${node.id}`, node, prefix: lead + (last ? '└── ' : '├── '), buried })
    const kids = childrenOf(doc, node.id)
    kids.forEach((k, i) => walk(k, lead + (last ? '    ' : '│   '), i === kids.length - 1, buried))
  }
  for (const p of projectsOf(doc)) {
    const kids = childrenOf(doc, p.id)
    const live = kids.filter((k) => k.status !== 'dusted')
    const dust = kids.filter((k) => k.status === 'dusted')
    rows.push({ kind: 'project', key: `p${p.id}`, node: p, count: live.length })
    live.forEach((k, i) => walk(k, '', i === live.length - 1 && !dust.length, false))
    if (dust.length) {
      rows.push({ kind: 'dotdir', key: `d${p.id}`, project: p, prefix: '└── ', count: dust.length })
      if (showDust) dust.forEach((k, i) => walk(k, '    ', i === dust.length - 1, true))
    }
  }
  return rows
}

/** Is there a line after `i` at `level` before the list climbs above it? */
function laterSibling(lines: DraftLine[], i: number, level: number): boolean {
  for (let j = i + 1; j < lines.length; j++) {
    if (lines[j].level < level) return false
    if (lines[j].level === level) return true
  }
  return false
}
function draftPrefixes(lines: DraftLine[]): string[] {
  return lines.map((l, i) => {
    let lead = ''
    for (let lv = 0; lv < l.level; lv++) lead += laterSibling(lines, i, lv) ? '┆   ' : '    '
    return lead + (laterSibling(lines, i, l.level) ? '├╌╌ ' : '└╌╌ ')
  })
}

/* ------------------------------------------------------------------ drag */

type Src = { type: 'node'; id: number; label: string } | { type: 'draft'; label: string }
type Drag = { src: Src; x0: number; y0: number; live: boolean; el: HTMLElement; ghost?: HTMLDivElement; over: HTMLElement | null }

function accepts(src: Src, drop: string): boolean {
  if (src.type === 'draft') return drop.startsWith('project:') || drop === 'newproject'
  return drop !== 'newproject' && drop !== `row:${src.id}` && drop !== `card:${src.id}`
}

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim()
}

/* ------------------------------------------------------------------ app */

export function Proto() {
  const [doc, setDoc] = useState<Doc>(() => read(DOC_KEY, importText, sample))
  const docRef = useRef(doc)
  docRef.current = doc
  const past = useRef<Doc[]>([])
  const future = useRef<Doc[]>([])
  const [view, setView] = useState<'tree' | 'board'>(() => read(VIEW_KEY, (r) => (r === 'board' ? 'board' : 'tree'), () => 'tree'))
  const [cols, setCols] = useState(true)
  const [showDust, setShowDust] = useState(false)
  const [cursor, setCursor] = useState<number | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const draftRef = useRef(draft)
  draftRef.current = draft
  const [pushed, setPushed] = useState<Set<number>>(() => read(PUSHED_KEY, (r) => new Set(JSON.parse(r) as number[]), () => new Set()))
  const [fresh, setFresh] = useState<Map<number, number>>(() => new Map())
  const [msg, setMsg] = useState({ text: 'prototype: the pivot and the drop. your real board is untouched.', n: 0 })
  const [phase, setPhase] = useState<'idle' | 'out' | 'in'>('idle')
  const [inFlight, setInFlight] = useState(0)
  const [bump, setBump] = useState(0)
  const [pasting, setPasting] = useState(false)
  const [pasteText, setPasteText] = useState('')
  const stageRef = useRef<HTMLDivElement>(null)
  const counterRef = useRef<HTMLSpanElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const flipFrom = useRef<Map<string, { r: DOMRect; label: string }> | null>(null)
  const dragRef = useRef<Drag | null>(null)

  useEffect(() => write(DOC_KEY, JSON.stringify({ app: 'vault', version: 1, savedAt: Date.now(), doc })), [doc])
  useEffect(() => write(PUSHED_KEY, JSON.stringify([...pushed])), [pushed])
  useEffect(() => write(VIEW_KEY, view), [view])
  useEffect(() => stageRef.current?.focus({ preventScroll: true }), [])

  const say = useCallback((text: string) => setMsg((m) => ({ text, n: m.n + 1 })), [])

  const commit = useCallback((next: Doc): boolean => {
    if (next === docRef.current) return false
    past.current.push(docRef.current)
    if (past.current.length > 200) past.current.shift()
    future.current = []
    docRef.current = next
    setDoc(next)
    return true
  }, [])

  const undo = useCallback(() => {
    const prev = past.current.pop()
    if (!prev) return say('nothing to undo.')
    future.current.push(docRef.current)
    docRef.current = prev
    setDoc(prev)
    say('undone.')
  }, [say])
  const redo = useCallback(() => {
    const next = future.current.pop()
    if (!next) return say('nothing to redo.')
    past.current.push(docRef.current)
    docRef.current = next
    setDoc(next)
    say('redone.')
  }, [say])

  const unpush = (id: number) =>
    setPushed((s) => {
      if (!s.has(id)) return s
      const n = new Set(s)
      n.delete(id)
      return n
    })

  const cards = useMemo(() => boardCards(doc, null), [doc])
  const rows = useMemo(() => treeRows(doc, showDust), [doc, showDust])
  const laneCount = (lane: Lane) => cards.filter((c) => c.status === lane).length
  const doneToday = useMemo(() => {
    const start = new Date()
    start.setHours(0, 0, 0, 0)
    return doc.events.filter((e) => e.kind === 'moved' && e.text.includes('DONE') && e.at >= start.getTime()).length
  }, [doc])
  const dustCount = doc.nodes.filter((n) => n.status === 'dusted' && n.parent != null).length

  const rectOf = (id: number): DOMRect | null => {
    const el = stageRef.current?.querySelector(`[data-node="${id}"]`)
    const body = el?.querySelector('.row-body') ?? el
    return body ? body.getBoundingClientRect() : null
  }

  /* ---- the chute: a finished card falls into the counter */
  const flyToCounter = (label: string, from: DOMRect | null) => {
    const to = counterRef.current?.getBoundingClientRect()
    if (!from || !to || reduced()) {
      setBump((b) => b + 1)
      return
    }
    setInFlight((n) => n + 1)
    const g = document.createElement('div')
    g.className = 'fly'
    g.textContent = label
    document.body.appendChild(g)
    const a = g.animate(
      [
        { left: `${from.left}px`, top: `${from.top}px`, opacity: 1, transform: 'scale(1) rotate(0deg)' },
        { left: `${to.left + 40}px`, top: `${to.top}px`, opacity: 0.15, transform: 'scale(.3) rotate(-4deg)' },
      ],
      { duration: 620, easing: 'cubic-bezier(.55,0,.8,.2)', fill: 'forwards' },
    )
    a.onfinish = () => {
      g.remove()
      setInFlight((n) => n - 1)
      setBump((b) => b + 1)
    }
  }

  /* ---- status: one function behind the rail, the lanes, the chute and the keys */
  const shove = (id: number, lane: Lane, before?: number | null, from?: DOMRect | null) => {
    const d = docRef.current
    const node = byId(d, id)
    if (!node || node.parent == null) return
    const was = node.status
    const fromRect = from ?? rectOf(id)
    const pull = depthOf(d, id) >= 2 && !node.loose && lane !== 'done'
    let next = pull ? pullCard(d, id, lane, before) : moveCard(d, id, lane, before)
    next = updateNode(next, id, { touched: Date.now() })
    if (was !== lane) next = logEvent(next, 'moved', `→ ${LANE_LABEL[lane]}`, id)
    if (!commit(next)) return
    unpush(id)
    const name = node.title.toLowerCase()
    if (lane === 'done' && was !== 'done') {
      flyToCounter(node.title, fromRect)
      say(`done. ${name} ↓`)
    } else if (lane === 'active' && was !== 'active' && laneCount('active') >= ACTIVE_CAP) {
      say(`no. finish something. active is ${laneCount('active') + 1}/${ACTIVE_CAP}`)
    } else if (lane === 'dusted' && was !== 'dusted') say(`${name} → .dusted/`)
    else if (was !== lane) say(`mv ${name} → ${LANE_LABEL[lane].toLowerCase()}${pull ? ' (pulled out as its own card)' : ''}`)
  }

  const step = (id: number, dir: 1 | -1) => {
    const node = byId(docRef.current, id)
    if (!node || node.parent == null) return
    const i = STEP.indexOf(laneOf(node.status))
    const to = STEP[Math.max(0, Math.min(STEP.length - 1, (i < 0 ? 0 : i) + dir))]
    if (to !== node.status) shove(id, to)
  }

  const tick = (id: number) => {
    const d = docRef.current
    const node = byId(d, id)
    if (!node || depthOf(d, id) < 2) return
    const to: Lane = node.status === 'done' ? 'pending' : 'done'
    if (commit(logEvent(setStatus(d, id, to), 'ticked', `${to === 'done' ? '[x]' : '[ ]'} ${node.title}`, id))) unpush(id)
  }

  /* ---- the drop */
  const takeDraft = (d: Draft, how: 'push' | 'paste') => {
    setDraft(d)
    say(how === 'push' ? `← claude pushed ${d.lines.length} lines to inbox/` : `pasted a tree → inbox/ (${d.lines.length} lines)`)
  }

  const fileDraft = (target: number | 'new') => {
    const d = draftRef.current
    if (!d) return
    const r = target === 'new' ? commitAsProject(docRef.current, d) : commitDraft(docRef.current, d, target)
    if (!r.ids.length || !commit(r.doc)) return
    setDraft(null)
    setPushed((s) => new Set([...s, ...r.ids]))
    setFresh(new Map(r.ids.map((id, i) => [id, i])))
    window.setTimeout(() => setFresh(new Map()), 900 + r.ids.length * 70)
    const folder = byId(r.doc, target === 'new' ? r.ids[0] : target)?.title ?? '?'
    say(`filed ${d.lines.length} lines → ${folder}/   ctrl+z takes it back`)
  }

  const editLine = (key: string, patch: Partial<DraftLine>) => setDraft((d) => d && { ...d, lines: d.lines.map((l) => (l.key === key ? { ...l, ...patch } : l)) })
  const focusLine = (key: string | undefined) => {
    if (key) requestAnimationFrame(() => document.querySelector<HTMLInputElement>(`[data-line="${key}"]`)?.focus())
  }
  const onLineKey = (e: KeyboardEvent<HTMLInputElement>, line: DraftLine, i: number) => {
    const lines = draft?.lines ?? []
    e.stopPropagation()
    if (e.key === 'Enter') {
      e.preventDefault()
      const key = lineKey()
      setDraft((d) => {
        if (!d) return d
        const at = d.lines.findIndex((l) => l.key === line.key)
        const next = [...d.lines]
        next.splice(at + 1, 0, { key, level: line.level, text: '' })
        return { ...d, lines: next }
      })
      focusLine(key)
    } else if (e.key === 'Backspace' && !line.text) {
      e.preventDefault()
      setDraft((d) => {
        if (!d) return d
        const rest = d.lines.filter((l) => l.key !== line.key)
        return rest.length ? { ...d, lines: rest } : null
      })
      focusLine(lines[i - 1]?.key)
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const max = i === 0 ? 0 : lines[i - 1].level + 1
      editLine(line.key, { level: Math.max(0, Math.min(max, line.level + (e.shiftKey ? -1 : 1))) })
    } else if (e.key === 'ArrowUp') focusLine(lines[i - 1]?.key)
    else if (e.key === 'ArrowDown') focusLine(lines[i + 1]?.key)
    else if (e.key === 'Escape') stageRef.current?.focus()
  }

  /* ---- dropping something somewhere */
  const drop = (src: Src, target: string, rect: DOMRect) => {
    const [kind, raw] = target.split(':')
    const val = Number(raw)
    if (src.type === 'draft') return fileDraft(kind === 'newproject' ? 'new' : val)
    const d = docRef.current
    const node = byId(d, src.id)
    if (!node) return
    if (kind === 'lane') return shove(src.id, raw as Lane, undefined, rect)
    if (kind === 'card') {
      const t = byId(d, val)
      if (t) shove(src.id, laneOf(t.status), t.id, rect)
      return
    }
    if (kind === 'project') {
      if (commit(reparentNode(d, src.id, val))) {
        unpush(src.id)
        say(`mv ${node.title.toLowerCase()} → ${byId(d, val)?.title}/`)
      }
      return
    }
    if (kind === 'row') {
      const t = byId(d, val)
      if (!t || t.parent == null || inSubtree(d, src.id, t.id)) return
      let next = node.parent === t.parent ? d : reparentNode(d, src.id, t.parent)
      const moved = byId(next, src.id)
      if (!moved) return
      next = moveCard(next, src.id, laneOf(moved.status), t.id)
      if (commit(next)) {
        unpush(src.id)
        say(`mv ${node.title.toLowerCase()} ↑ above ${t.title.toLowerCase()}`)
      }
    }
  }

  const startDrag = (e: PointerEvent<HTMLElement>, src: Src) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('input, button, textarea')) return
    dragRef.current = { src, x0: e.clientX, y0: e.clientY, live: false, el: e.currentTarget, over: null }
    const move = (ev: globalThis.PointerEvent) => {
      const dr = dragRef.current
      if (!dr) return
      if (!dr.live) {
        if (Math.hypot(ev.clientX - dr.x0, ev.clientY - dr.y0) < 5) return
        dr.live = true
        const g = document.createElement('div')
        g.className = 'drag-ghost'
        g.textContent = dr.src.label
        document.body.appendChild(g)
        dr.ghost = g
        dr.el.classList.add('lifted')
        document.body.classList.add('is-dragging', dr.src.type === 'draft' ? 'is-dragging-draft' : 'is-dragging-node')
      }
      dr.ghost!.style.left = `${ev.clientX}px`
      dr.ghost!.style.top = `${ev.clientY}px`
      const hit = document.elementFromPoint(ev.clientX, ev.clientY)?.closest<HTMLElement>('[data-drop]') ?? null
      const ok = hit && accepts(dr.src, hit.dataset.drop ?? '') ? hit : null
      if (ok !== dr.over) {
        dr.over?.classList.remove('drop-on')
        ok?.classList.add('drop-on')
        dr.over = ok
      }
    }
    const up = (ev: globalThis.PointerEvent) => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      const dr = dragRef.current
      dragRef.current = null
      if (!dr) return
      if (!dr.live) {
        if (dr.src.type === 'node') setCursor(dr.src.id)
        return
      }
      const rect = dr.ghost!.getBoundingClientRect()
      dr.ghost!.remove()
      dr.el.classList.remove('lifted')
      document.body.classList.remove('is-dragging', 'is-dragging-draft', 'is-dragging-node')
      dr.over?.classList.remove('drop-on')
      if (ev.type === 'pointercancel' || !dr.over) return
      drop(dr.src, dr.over.dataset.drop ?? '', rect)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
  }

  /* ---- the pivot: measure every card row, switch, morph each one to where it now lives */
  const pivot = () => {
    if (phase !== 'idle') return
    const to = view === 'tree' ? 'board' : 'tree'
    if (reduced()) {
      setView(to)
      return
    }
    setPhase('out')
    window.setTimeout(() => {
      const map = new Map<string, { r: DOMRect; label: string }>()
      stageRef.current?.querySelectorAll<HTMLElement>('[data-flip]').forEach((el) => map.set(el.dataset.flip!, { r: el.getBoundingClientRect(), label: el.dataset.label ?? '' }))
      flipFrom.current = map
      setView(to)
      setPhase('in')
    }, 140)
  }

  useLayoutEffect(() => {
    const from = flipFrom.current
    const stage = stageRef.current
    if (!from || !stage) return
    flipFrom.current = null
    const toBoard = view === 'board'
    const surface = cssVar('--surface')
    const line = cssVar('--line-2')
    const clear = 'rgba(0,0,0,0)'
    const sink = stage.querySelector<HTMLElement>('[data-sink]')?.getBoundingClientRect()
    const seen = new Set<string>()
    const ghosts: HTMLDivElement[] = []
    let i = 0
    const morph = (label: string, f: DOMRect, t: { left: number; top: number; width: number; height: number }, end: number, after?: () => void) => {
      const g = document.createElement('div')
      g.className = 'morph'
      g.textContent = label
      document.body.appendChild(g)
      ghosts.push(g)
      const box = (r: { left: number; top: number; width: number; height: number }) => ({ left: `${r.left}px`, top: `${r.top}px`, width: `${r.width}px`, height: `${r.height}px` })
      const rowLook = { backgroundColor: clear, borderColor: clear, borderRadius: '3px' }
      const cardLook = { backgroundColor: surface, borderColor: line, borderRadius: '8px' }
      const a = g.animate(
        [
          { ...box(f), ...(toBoard ? rowLook : cardLook), opacity: 1 },
          { ...box(t), ...(toBoard ? cardLook : rowLook), opacity: end },
        ],
        { duration: 520, delay: Math.min(i++ * 14, 300), easing: 'cubic-bezier(.2,.8,.15,1)', fill: 'both' },
      )
      a.onfinish = () => {
        after?.()
        g.animate([{ opacity: end }, { opacity: 0 }], { duration: 140, fill: 'forwards' }).onfinish = () => g.remove()
      }
    }
    stage.querySelectorAll<HTMLElement>('[data-flip]').forEach((el) => {
      const key = el.dataset.flip!
      const f = from.get(key)
      if (!f || i >= MAX_MORPHS) return
      seen.add(key)
      el.style.visibility = 'hidden'
      morph(f.label, f.r, el.getBoundingClientRect(), 1, () => {
        el.style.visibility = ''
      })
    })
    // Rows with no card to become (finished work) fall into the chute.
    if (sink) {
      for (const [key, f] of from) {
        if (seen.has(key) || i >= MAX_MORPHS) continue
        morph(f.label, f.r, { left: sink.left + sink.width / 2 - 30, top: sink.top + sink.height / 2, width: 60, height: 12 }, 0)
      }
    }
    const t = window.setTimeout(() => setPhase('idle'), 1000)
    return () => {
      window.clearTimeout(t)
    }
  }, [view])

  /* ---- keys */
  const order = useMemo(
    () => (view === 'tree' ? rows.flatMap((r) => (r.kind === 'dotdir' ? [] : [r.node.id])) : BOARD_LANES.flatMap((l) => cards.filter((c) => c.status === l).map((c) => c.id))),
    [view, rows, cards],
  )

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('input, textarea') || e.ctrlKey || e.metaKey || e.altKey) return
    const at = cursor == null ? -1 : order.indexOf(cursor)
    const go = (i: number) => {
      const id = order[Math.max(0, Math.min(order.length - 1, i))]
      if (id == null) return
      setCursor(id)
      requestAnimationFrame(() => stageRef.current?.querySelector(`[data-node="${id}"]`)?.scrollIntoView({ block: 'nearest' }))
    }
    switch (e.key) {
      case 'j':
      case 'ArrowDown':
        go(at + 1)
        break
      case 'k':
      case 'ArrowUp':
        go(at < 0 ? 0 : at - 1)
        break
      case 'v':
        pivot()
        break
      case 'l':
        setCols((c) => !c)
        break
      case 'a':
        setShowDust((s) => !s)
        break
      case 'H':
      case 'L':
        if (cursor != null) step(cursor, e.key === 'L' ? 1 : -1)
        break
      case 'd':
        if (cursor != null) shove(cursor, 'done')
        break
      case 'x':
        if (cursor != null) tick(cursor)
        break
      case 'Escape':
        setCursor(null)
        break
      default:
        return
    }
    e.preventDefault()
  }

  // Global: undo/redo, and pasting a tree anywhere outside a text field.
  const globals = useRef({ undo, redo, takeDraft })
  globals.current = { undo, redo, takeDraft }
  useEffect(() => {
    const onKeyDown = (e: globalThis.KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || (e.target as HTMLElement).closest?.('input, textarea')) return
      const k = e.key.toLowerCase()
      if (k === 'z') {
        e.preventDefault()
        if (e.shiftKey) globals.current.redo()
        else globals.current.undo()
      } else if (k === 'y') {
        e.preventDefault()
        globals.current.redo()
      }
    }
    const onPaste = (e: ClipboardEvent) => {
      if ((e.target as HTMLElement).closest?.('input, textarea')) return
      const d = parseTree(e.clipboardData?.getData('text/plain') ?? '')
      if (!d) return
      e.preventDefault()
      globals.current.takeDraft(d, 'paste')
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('paste', onPaste)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('paste', onPaste)
    }
  }, [])

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const next = importText(await file.text())
      commit(next)
      setPushed(new Set())
      say(`loaded ${file.name} · ${next.nodes.length} things. ctrl+z puts the sample back.`)
    } catch (err) {
      say(err instanceof Error ? err.message.toLowerCase() : 'not a thing.')
    }
  }

  const reset = () => {
    commit(sample())
    setDraft(null)
    setPushed(new Set())
    say('back to the sample board. ctrl+z brings yours back.')
  }

  const freshStyle = (id: number): CSSProperties | undefined => (fresh.has(id) ? ({ '--i': fresh.get(id) } as CSSProperties) : undefined)
  const prefixes = draft ? draftPrefixes(draft.lines) : []
  const stats = draft ? draftStats(draft) : null
  const shownDone = Math.max(0, doneToday - inFlight)
  const activeOver = laneCount('active') > ACTIVE_CAP

  /* ------------------------------------------------------------------ view */

  const tree = (
    <div className="tree">
      {draft && stats ? (
        <section className="draft" aria-label="Inbox draft">
          <div className="row draft-head" title="Drag onto a folder to file it" onPointerDown={(e) => startDrag(e, { type: 'draft', label: `inbox/ ${draft.name}/ · ${stats.lines} lines` })}>
            <span className="grip" aria-hidden="true">
              ::
            </span>
            <span className="title">inbox/</span>
            <input className="draft-name" value={draft.name} spellCheck={false} aria-label="Folder name, if filed as a new folder" onChange={(e) => setDraft((d) => d && { ...d, name: e.target.value })} onKeyDown={(e) => e.stopPropagation()} />
            <span className="fill" />
            <span className="draft-meta">
              {stats.tasks} tasks · {stats.lines} lines · drag onto a folder
            </span>
            <button
              type="button"
              className="tb"
              onClick={() => {
                setDraft(null)
                say('draft dropped. gone.')
              }}
            >
              discard
            </button>
          </div>
          {draft.lines.map((l, i) => (
            <div key={l.key} className={'row draft-line' + (l.level === 0 ? ' is-task' : '')}>
              <span className="stem">{prefixes[i]}</span>
              {l.level > 0 ? <span className="tick">{l.done ? '[x] ' : '[ ] '}</span> : null}
              <input data-line={l.key} className="line-in" value={l.text} spellCheck={false} aria-label="Draft line" onChange={(e) => editLine(l.key, { text: e.target.value })} onKeyDown={(e) => onLineKey(e, l, i)} />
              <button type="button" className="cut" aria-label="Cut this line" onClick={() => setDraft((d) => (d && d.lines.length > 1 ? { ...d, lines: d.lines.filter((x) => x.key !== l.key) } : null))}>
                ×
              </button>
            </div>
          ))}
        </section>
      ) : null}

      {rows.map((r) => {
        if (r.kind === 'project') {
          const sel = cursor === r.node.id
          return (
            <div key={r.key} className={'row project' + (sel ? ' sel' : '')} data-node={r.node.id} data-drop={`project:${r.node.id}`} onClick={() => setCursor(r.node.id)}>
              <span className="row-body">
                <span className="title">{r.node.title}/</span>
                {sel ? <span className="caret">_</span> : null}
                <span className="fill" />
                <span className="c-n">{r.count || '_'}</span>
              </span>
            </div>
          )
        }
        if (r.kind === 'dotdir') {
          return (
            <div key={r.key} className="row dotdir" data-drop="lane:dusted" onClick={() => setShowDust((s) => !s)}>
              <span className="stem">{r.prefix}</span>
              <span className="row-body">
                <span className="title">.dusted/</span>
                <span className="fill" />
                <span className="c-n">
                  {r.count}
                  {showDust ? '' : ' · a shows'}
                </span>
              </span>
            </div>
          )
        }
        const n = r.node
        const task = r.kind === 'task'
        const sel = cursor === n.id
        const flip = isCard(doc, n) && n.status !== 'dusted'
        const p = progressOf(doc, n.id)
        const late = n.due && n.status !== 'done' ? daysUntil(n.due) < 0 : false
        const cls = ['row', r.kind, `st-${n.status}`, sel && 'sel', r.buried && 'buried', fresh.has(n.id) && 'fresh', n.loose && 'loose'].filter(Boolean).join(' ')
        return (
          <div key={r.key} className={cls} data-node={n.id} data-drop={`row:${n.id}`} style={freshStyle(n.id)} onPointerDown={(e) => startDrag(e, { type: 'node', id: n.id, label: n.title })}>
            <span className="stem">{r.prefix}</span>
            {!task ? <span className={'tick' + (n.status === 'done' ? ' on' : '')}>{n.status === 'done' ? '[x] ' : '[ ] '}</span> : null}
            <span className="row-body" data-flip={flip ? `n${n.id}` : undefined} data-label={n.title}>
              <span className="title">{n.title}</span>
              {sel ? <span className="caret">_</span> : null}
              {pushed.has(n.id) && task ? <span className="by">← claude</span> : null}
              <span className="fill" />
              {cols && (task || n.loose) ? (
                <>
                  <span className={`c-status st-${n.status}`}>{LANE_LABEL[laneOf(n.status)]}</span>
                  <span className="c-prog">{p.total ? `${p.done}/${p.total}` : ''}</span>
                  <span className={'c-due' + (late ? ' late' : '')}>{n.status === 'done' ? '' : dueWords(n.due)}</span>
                </>
              ) : null}
            </span>
          </div>
        )
      })}

      {draft ? (
        <div className="row ghost-row" data-drop="newproject">
          <span className="stem">+ </span>
          <span className="row-body">
            <span className="title">new folder: {draft.name || 'untitled'}/</span>
            <span className="fill" />
            <span className="c-n">drop the draft here</span>
          </span>
        </div>
      ) : null}
    </div>
  )

  const board = (
    <div className="board">
      {BOARD_LANES.map((lane) => {
        const list = cards.filter((c) => c.status === lane)
        const over = lane === 'active' && list.length > ACTIVE_CAP
        return (
          <section key={lane} className={`lane lane-${lane}`} data-drop={`lane:${lane}`}>
            <header className="lane-head">
              <span className="plaque">{LANE_LABEL[lane]}</span>
              <span className={'lane-n' + (over ? ' over' : '')}>{lane === 'active' ? `${list.length}/${ACTIVE_CAP}` : list.length || '_'}</span>
            </header>
            {list.map((c) => {
              const p = progressOf(doc, c.id)
              const proj = projectOf(doc, c.id)
              const parent = c.loose ? byId(doc, c.parent) : undefined
              const late = c.due ? daysUntil(c.due) < 0 : false
              const cls = ['card', cursor === c.id && 'sel', fresh.has(c.id) && 'fresh', pushed.has(c.id) && 'by-claude'].filter(Boolean).join(' ')
              return (
                <article key={c.id} className={cls} data-node={c.id} data-flip={`n${c.id}`} data-label={c.title} data-drop={`card:${c.id}`} style={freshStyle(c.id)} onPointerDown={(e) => startDrag(e, { type: 'node', id: c.id, label: c.title })}>
                  <div className="card-path">
                    {proj?.title}/{parent ? `${parent.title.toLowerCase()}/` : ''}
                  </div>
                  <div className="card-title">{c.title}</div>
                  <div className="card-meta">
                    {p.total ? <span>{`${p.done}/${p.total}`}</span> : null}
                    {c.due ? <span className={late ? 'late' : ''}>{dueWords(c.due)}</span> : null}
                    {c.urgent ? <span className="urgent">URGENT</span> : null}
                    {pushed.has(c.id) ? <span className="by">← claude</span> : null}
                  </div>
                </article>
              )
            })}
            {list.length ? null : <p className="empty">_</p>}
          </section>
        )
      })}
      <section className="chute" data-drop="lane:done" data-sink>
        <span className="plaque">DONE</span>
        <span className="chute-arrow" aria-hidden="true">
          ↓
        </span>
        <span className="chute-n">today {shownDone}</span>
        <span className="chute-all">{laneCount('done')} all time</span>
      </section>
    </div>
  )

  return (
    <div className="proto">
      <header className="top">
        <span className="mark">
          VAULT<i>_</i>
        </span>
        <div className="seg" role="group" aria-label="View">
          <button type="button" aria-pressed={view === 'tree'} onClick={() => view !== 'tree' && pivot()}>
            tree
          </button>
          <span className="seg-sep" aria-hidden="true">
            ⇄
          </span>
          <button type="button" aria-pressed={view === 'board'} onClick={() => view !== 'board' && pivot()}>
            board
          </button>
          <kbd>v</kbd>
        </div>
        {view === 'tree' ? (
          <>
            <button type="button" className="tb" aria-pressed={cols} onClick={() => setCols((c) => !c)}>
              ls -l
            </button>
            <button type="button" className="tb" aria-pressed={showDust} onClick={() => setShowDust((s) => !s)}>
              ls -a
            </button>
          </>
        ) : null}
        <span className="gap" />
        {draft && view === 'board' ? (
          <button type="button" className="tb hot" onClick={pivot}>
            inbox/ has a draft · file it in the tree
          </button>
        ) : null}
        <button type="button" className="tb" onClick={() => takeDraft(parseTree(SAMPLE_PUSH)!, 'push')}>
          simulate a push
        </button>
        <button type="button" className="tb" aria-pressed={pasting} onClick={() => setPasting((p) => !p)}>
          paste a tree
        </button>
        <button type="button" className="tb" onClick={() => fileRef.current?.click()}>
          load my board
        </button>
        <button type="button" className="tb" onClick={reset}>
          reset
        </button>
        <span className="count" key={bump}>
          <span ref={counterRef} className={bump ? 'bump' : undefined}>
            done today <b>{shownDone}</b>
          </span>
        </span>
        <input ref={fileRef} type="file" accept=".json,application/json,text/plain" hidden onChange={onFile} />
      </header>

      {pasting ? (
        <div className="paste-panel">
          <textarea
            autoFocus
            value={pasteText}
            spellCheck={false}
            placeholder={'paste an indented list, a checklist or tree output\n\nNEW THING\n  first step\n  [x] already done\n  second step'}
            onChange={(e) => setPasteText(e.target.value)}
            onKeyDown={(e) => e.stopPropagation()}
          />
          <div className="paste-actions">
            <span>ctrl+v anywhere on the page works too</span>
            <button
              type="button"
              className="tb hot"
              onClick={() => {
                const d = parseTree(pasteText)
                if (!d) return say('not a thing.')
                takeDraft(d, 'paste')
                setPasting(false)
                setPasteText('')
                if (view === 'board') pivot()
              }}
            >
              drop it in inbox/
            </button>
          </div>
        </div>
      ) : null}

      <main className={`body is-${view}`}>
        <div
          ref={stageRef}
          className={`stage is-${view}${phase === 'out' ? ' pivot-out' : phase === 'in' ? ' pivot-in' : ''}`}
          tabIndex={0}
          aria-label={view === 'tree' ? 'Directory' : 'Board'}
          onKeyDown={onKey}
          onPointerDown={(e) => {
            if (!(e.target as HTMLElement).closest('input, textarea, button')) stageRef.current?.focus({ preventScroll: true })
          }}
        >
          {view === 'tree' ? tree : board}
        </div>
        {view === 'tree' ? (
          <aside className="rail" aria-label="Status">
            <p className="rail-label">drop to set status</p>
            {BOARD_LANES.map((lane) => (
              <div key={lane} className={`slot slot-${lane}`} data-drop={`lane:${lane}`}>
                <span className="plaque">{LANE_LABEL[lane]}</span>
                <b className={lane === 'active' && activeOver ? 'over' : undefined}>{lane === 'active' ? `${laneCount('active')}/${ACTIVE_CAP}` : laneCount(lane)}</b>
              </div>
            ))}
            <div className="slot chute-slot" data-drop="lane:done">
              <span className="plaque">DONE ↓</span>
              <b>today {shownDone}</b>
            </div>
            <div className="slot dust-slot" data-drop="lane:dusted">
              <span className="dust-name">.dusted/</span>
              <b>{dustCount}</b>
            </div>
          </aside>
        ) : null}
      </main>

      <footer className="status">
        <span className="prompt">$</span>
        <span className="msg" key={msg.n}>
          {msg.text}
        </span>
        <span className="gap" />
        <span className="keys">v pivot · j k move · ⇧H ⇧L shove · d done · x tick · l a ls · ctrl+v paste a tree · ctrl+z undo</span>
      </footer>
    </div>
  )
}
