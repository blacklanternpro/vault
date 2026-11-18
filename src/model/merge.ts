import { sanitizeDoc } from './doc'
import { MAX_EVENTS, type Doc, type Event, type Node, type Note } from './types'

/*
 * Three-way merge of the board, for the agent bridge: `base` is the last doc
 * the browser and the bridge both had, `mine` is the browser's board, and
 * `theirs` is the bridge's file (what agents wrote). Pure: no clocks, no
 * randomness, the same inputs always give the same answer.
 *
 * The rules, in order:
 *
 *   1. Ids minted on both sides. Both sides take `max id + 1` for a new task,
 *      so the same new id can name two different tasks. Theirs keep their ids
 *      (an agent may already have quoted the id back to someone); mine move to
 *      fresh ids above everything, and every reference follows: children's
 *      `parent`, notes' `node`, trail events' `node`. A task added identically
 *      on both sides is one task. Notes collide the same way (rare: their ids
 *      are random) and mine get a suffix.
 *   2. Tasks and notes merge field by field against the base. A field changed
 *      on one side takes that side's value. Changed on both sides to the same
 *      value: no clash. Changed on both to different values: mine wins (the
 *      person at the screen; "Claude never overwrites Jake's work") and the
 *      clash is recorded in `conflicts`. Three fields are not clashes:
 *      `touched` and `lastSeen` take the later stamp, `spent` adds both
 *      sides' session time.
 *   3. Delete vs edit. Deleted on one side and untouched on the other: gone.
 *      Deleted on one side and edited on the other: the edit wins and the
 *      item stays (nothing anyone typed is dropped), recorded as a clash with
 *      field `deleted`. A task deleted on one side that still has a child on
 *      the other (an added subtask, say) comes back too.
 *   4. Moves. `parent` is a field like any other. Crossed moves that would
 *      make a loop keep mine for the task whose move came from theirs.
 *   5. Order (array order is sibling order). If mine reordered nothing, the
 *      order is theirs; otherwise it is mine. Items only the other side has
 *      are slotted in after the item they followed there.
 *   6. The trail is append-only: events from both sides are unioned by
 *      identity (time, kind, task, text), an event one side took back (an
 *      undo) stays gone, and the result is in time order, capped.
 *
 * The result goes through `sanitizeDoc`, so it holds every invariant the
 * model does (no dangling parents, no loops, normalized lanes, notes and
 * events pointing only at tasks that exist).
 */

export type Side = 'mine' | 'theirs'

/** A place where both sides changed the same thing. `kept` says whose version is in the result. */
export type Conflict = { on: 'node'; id: number; field: string; kept: Side } | { on: 'note'; id: string; field: string; kept: Side }

export type MergeResult = {
  doc: Doc
  conflicts: Conflict[]
  /** Mine's new task ids that collided with theirs, old → new. */
  remapped: Map<number, number>
  /** How many tasks and notes the other side added, changed or removed since the base (for "merged 3 changes from vault-agent"). */
  theirChanges: number
}

/* ------------------------------------------------------------ fingerprints */

/** JSON with sorted keys, so two docs that differ only in key order read the same. */
export function canonical(value: unknown): string {
  if (value === undefined) return 'undefined'
  if (value === null || typeof value !== 'object') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map((v) => (v === undefined ? 'null' : canonical(v))).join(',')}]`
  const obj = value as Record<string, unknown>
  const keys = Object.keys(obj)
    .filter((k) => obj[k] !== undefined)
    .sort()
  return `{${keys.map((k) => `${JSON.stringify(k)}:${canonical(obj[k])}`).join(',')}}`
}

const prints = new WeakMap<Doc, string>()

/**
 * What a doc says, independent of key order and of what the model's reader
 * would tidy away (a trail line pointing at a deleted task, say). Two docs
 * with the same fingerprint are the same board.
 */
export function fingerprint(doc: Doc): string {
  const cached = prints.get(doc)
  if (cached !== undefined) return cached
  const print = canonical(sanitizeDoc(doc))
  if (Object.isFrozen(doc)) prints.set(doc, print)
  return print
}

export function sameDoc(a: Doc, b: Doc): boolean {
  return a === b || fingerprint(a) === fingerprint(b)
}

/* ------------------------------------------------------------------ merge */

export function merge(base: Doc, mine: Doc, theirs: Doc): MergeResult {
  return mergeRaw(sanitizeDoc(base), sanitizeDoc(mine), sanitizeDoc(theirs))
}

/** Stands for "the two sides differ here and there is no base to say who changed it". */
const UNKNOWN = Object.freeze({ '\u0000unknown': true })

/**
 * Merge with no agreed base (first contact, or the stored base was lost).
 * The base is taken to be what the two boards have in common: a task with
 * the same id and title on both sides is the same task, its fields that
 * agree are the base and its fields that differ count as changed on both
 * sides (so mine wins, recorded as a clash). Everything else counts as added
 * by its side, so nothing either side has is dropped; a delete on one side
 * comes back. Safe, at the price of resurrecting deletes.
 */
export function mergeFresh(mine: Doc, theirs: Doc): MergeResult {
  const m = sanitizeDoc(mine)
  const t = sanitizeDoc(theirs)
  const tNodes = new Map(t.nodes.map((n) => [n.id, n]))
  const nodes: Node[] = []
  for (const mn of m.nodes) {
    const tn = tNodes.get(mn.id)
    if (tn && tn.title === mn.title) nodes.push(intersect(mn, tn) as Node)
  }
  const tNotes = new Map(t.notes.map((n) => [n.id, n]))
  const notes: Note[] = []
  for (const mn of m.notes) {
    const tn = tNotes.get(mn.id)
    if (tn) notes.push(intersect(mn, tn) as Note)
  }
  const tCount = countEvents(t.events)
  const events: Event[] = []
  for (const e of m.events) {
    const k = canonical(e)
    const left = tCount.get(k) ?? 0
    if (left > 0) {
      events.push(e)
      tCount.set(k, left - 1)
    }
  }
  return mergeRaw({ nodes, notes, events }, m, t)
}

function intersect<T extends object>(a: T, b: T): T {
  const out: Record<string, unknown> = {}
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  for (const k of keys) {
    const av = (a as Record<string, unknown>)[k]
    const bv = (b as Record<string, unknown>)[k]
    out[k] = canonical(av) === canonical(bv) ? av : UNKNOWN
  }
  return out as T
}

function same(a: unknown, b: unknown): boolean {
  return a === b || canonical(a) === canonical(b)
}

type Rec = Record<string, unknown>

function mergeRaw(b: Doc, mineIn: Doc, t: Doc): MergeResult {
  const conflicts: Conflict[] = []

  /* 1. ids minted on both sides: mine move */
  const bIds = new Set(b.nodes.map((n) => n.id))
  const tById = new Map(t.nodes.map((n) => [n.id, n]))
  const remapped = new Map<number, number>()
  let m = mineIn
  let fresh = Math.max(0, ...b.nodes.map((n) => n.id), ...m.nodes.map((n) => n.id), ...t.nodes.map((n) => n.id)) + 1
  for (let round = 0; round < 1000; round++) {
    const map = new Map<number, number>()
    for (const n of m.nodes) {
      if (bIds.has(n.id)) continue
      const tn = tById.get(n.id)
      if (tn && !same(n, tn)) map.set(n.id, fresh++)
    }
    if (!map.size) break
    for (const [from, to] of map) {
      const orig = [...remapped].find(([, v]) => v === from)?.[0] ?? from
      remapped.set(orig, to)
    }
    m = remapIds(m, map)
  }
  const bNoteIds = new Set(b.notes.map((n) => n.id))
  const tNoteById = new Map(t.notes.map((n) => [n.id, n]))
  const takenNoteIds = new Set([...b.notes, ...m.notes, ...t.notes].map((n) => n.id))
  if (m.notes.some((n) => !bNoteIds.has(n.id) && tNoteById.has(n.id) && !same(n, tNoteById.get(n.id)))) {
    m = {
      ...m,
      notes: m.notes.map((n) => {
        if (bNoteIds.has(n.id) || !tNoteById.has(n.id) || same(n, tNoteById.get(n.id))) return n
        let id = `${n.id}~`
        while (takenNoteIds.has(id)) id += '~'
        takenNoteIds.add(id)
        return { ...n, id }
      }),
    }
  }

  /* 2–3. tasks, field by field, with delete vs edit */
  const bNode = new Map(b.nodes.map((n) => [n.id, n]))
  const mNode = new Map(m.nodes.map((n) => [n.id, n]))
  const nodes = mergeItems<number, Node>('node', bNode, mNode, tById, conflicts)

  // 4. loops and missing parents, until stable.
  for (let pass = 0; pass < 10; pass++) {
    const looped = breakLoops(nodes, mNode, bNode, conflicts)
    const revived = revive(nodes, bNode, mNode, tById, conflicts)
    if (!looped && !revived) break
  }

  /* 2–3. notes */
  const bNote = new Map(b.notes.map((n) => [n.id, n]))
  const mNote = new Map(m.notes.map((n) => [n.id, n]))
  const notes = mergeItems<string, Note>('note', bNote, mNote, tNoteById, conflicts)

  /* 5. order */
  const nodeOrder = order(
    b.nodes.map((n) => n.id),
    m.nodes.map((n) => n.id),
    t.nodes.map((n) => n.id),
    new Set(nodes.keys()),
  )
  const noteOrder = order(
    b.notes.map((n) => n.id),
    m.notes.map((n) => n.id),
    t.notes.map((n) => n.id),
    new Set(notes.keys()),
  )

  /* 6. the trail */
  const events = mergeEvents(b.events, m.events, t.events)

  const doc: Doc = {
    nodes: nodeOrder.map((id) => nodes.get(id)!),
    notes: noteOrder.map((id) => notes.get(id)!),
    events,
  }
  const seen = [m.lastSeen, t.lastSeen].filter((x): x is number => typeof x === 'number')
  if (seen.length) doc.lastSeen = Math.max(...seen)

  return { doc: sanitizeDoc(doc), conflicts, remapped, theirChanges: countChanges(b, t) }
}

/** How many tasks and notes were added, changed or removed going from `a` to `b`. */
export function countChanges(a: Doc, b: Doc): number {
  let n = 0
  const diff = <K, T>(x: Map<K, T>, y: Map<K, T>) => {
    for (const id of new Set([...x.keys(), ...y.keys()])) if (!same(x.get(id), y.get(id))) n++
  }
  diff(new Map(a.nodes.map((x) => [x.id, x])), new Map(b.nodes.map((x) => [x.id, x])))
  diff(new Map(a.notes.map((x) => [x.id, x])), new Map(b.notes.map((x) => [x.id, x])))
  return n
}

function remapIds(doc: Doc, map: Map<number, number>): Doc {
  const to = (id: number | null | undefined) => (id != null && map.has(id) ? map.get(id)! : id)
  return {
    ...doc,
    nodes: doc.nodes.map((n) => ({ ...n, id: to(n.id)!, parent: to(n.parent) ?? null })),
    notes: doc.notes.map((n) => (n.node != null && map.has(n.node) ? { ...n, node: to(n.node)! } : n)),
    events: doc.events.map((e) => (e.node != null && map.has(e.node) ? { ...e, node: to(e.node)! } : e)),
  }
}

function mergeItems<K extends number | string, T extends { id: K }>(on: 'node' | 'note', b: Map<K, T>, m: Map<K, T>, t: Map<K, T>, conflicts: Conflict[]): Map<K, T> {
  const out = new Map<K, T>()
  const clash = (id: K, field: string, kept: Side) => conflicts.push({ on, id, field, kept } as Conflict)
  const ids = new Set<K>([...b.keys(), ...m.keys(), ...t.keys()])
  for (const id of ids) {
    const bv = b.get(id)
    const mv = m.get(id)
    const tv = t.get(id)
    if (!bv) {
      // Added: by one side, or (after the id step) identically by both.
      out.set(id, (mv ?? tv)!)
      continue
    }
    if (!mv && !tv) continue
    if (!tv) {
      if (same(mv, bv)) continue
      clash(id, 'deleted', 'mine')
      out.set(id, mv!)
      continue
    }
    if (!mv) {
      if (same(tv, bv)) continue
      clash(id, 'deleted', 'theirs')
      out.set(id, tv)
      continue
    }
    out.set(id, mergeFields(id, bv, mv, tv, clash))
  }
  return out
}

function mergeFields<K, T extends object>(id: K, b: T, m: T, t: T, clash: (id: K, field: string, kept: Side) => void): T {
  const B = b as Rec
  const M = m as Rec
  const T = t as Rec
  const out: Rec = {}
  const keys = new Set([...Object.keys(M), ...Object.keys(T), ...Object.keys(B)])
  for (const k of keys) {
    const bv = B[k]
    const mv = M[k]
    const tv = T[k]
    let v: unknown
    if (same(mv, tv)) v = mv
    else if (same(mv, bv)) v = tv
    else if (same(tv, bv)) v = mv
    else if (k === 'touched' || k === 'lastSeen') v = Math.max(num(mv), num(tv)) || undefined
    else if (k === 'spent') {
      // Session time logged on both sides adds up; with no known base, the larger stands.
      const known = bv === undefined || typeof bv === 'number'
      v = known ? num(mv) + num(tv) - num(bv) : Math.max(num(mv), num(tv))
      if (!((v as number) > 0)) v = undefined
    } else {
      v = mv
      clash(id, k, 'mine')
    }
    if (v !== undefined && v !== UNKNOWN) out[k] = v
  }
  return out as T
}

function num(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? v : 0
}

/** Crossed moves: for each loop, the tasks whose parent did not come from mine go back to mine's. */
function breakLoops(nodes: Map<number, Node>, m: Map<number, Node>, b: Map<number, Node>, conflicts: Conflict[]): boolean {
  let changed = false
  for (const start of nodes.values()) {
    const path: number[] = []
    const onPath = new Set<number>()
    let at: number | null = start.id
    while (at != null && nodes.has(at) && !onPath.has(at)) {
      onPath.add(at)
      path.push(at)
      at = nodes.get(at)!.parent
    }
    if (at == null || !onPath.has(at)) continue
    const loop = path.slice(path.indexOf(at))
    let fixed = false
    for (const id of loop) {
      const n = nodes.get(id)!
      const want = m.get(id)?.parent ?? b.get(id)?.parent ?? null
      if (n.parent !== want && (want == null || typeof want === 'number')) {
        nodes.set(id, { ...n, parent: want })
        conflicts.push({ on: 'node', id, field: 'parent', kept: 'mine' })
        fixed = true
      }
    }
    if (!fixed) nodes.set(loop[0], { ...nodes.get(loop[0])!, parent: null })
    changed = true
  }
  return changed
}

/** A task kept whose parent was deleted brings the parent back (from whichever side still has it). */
function revive(nodes: Map<number, Node>, b: Map<number, Node>, m: Map<number, Node>, t: Map<number, Node>, conflicts: Conflict[]): boolean {
  let changed = false
  for (let guard = 0; guard < 10_000; guard++) {
    let added = false
    for (const n of [...nodes.values()]) {
      const p = n.parent
      if (p == null || nodes.has(p)) continue
      const from = m.get(p) ?? t.get(p) ?? b.get(p)
      if (!from || typeof from.parent === 'object' && from.parent !== null) {
        nodes.set(n.id, { ...n, parent: null })
      } else {
        nodes.set(p, from)
        if (b.has(p)) conflicts.push({ on: 'node', id: p, field: 'deleted', kept: m.has(p) ? 'mine' : 'theirs' })
      }
      added = true
      changed = true
    }
    if (!added) break
  }
  return changed
}

/**
 * The merged order: theirs if mine reordered nothing that both still have,
 * else mine. Items only the other side (or only the base) has are slotted in
 * after the item they followed there.
 */
function order<K>(base: K[], mine: K[], theirs: K[], keep: Set<K>): K[] {
  const inM = new Set(mine)
  const inT = new Set(theirs)
  const inB = new Set(base)
  const shared = (list: K[]) => list.filter((id) => inB.has(id) && inM.has(id) && inT.has(id))
  const mineMoved = !same(shared(mine), shared(base))
  const [skeleton, other] = mineMoved ? [mine, theirs] : [theirs, mine]
  const out = skeleton.filter((id) => keep.has(id))
  const placed = new Set(out)
  const fill = (list: K[]) => {
    list.forEach((id, i) => {
      if (!keep.has(id) || placed.has(id)) return
      let at = -1
      for (let j = i - 1; j >= 0 && at < 0; j--) if (placed.has(list[j])) at = out.indexOf(list[j]) + 1
      if (at < 0) for (let j = i + 1; j < list.length && at < 0; j++) if (placed.has(list[j])) at = out.indexOf(list[j])
      if (at < 0) at = out.length
      out.splice(at, 0, id)
      placed.add(id)
    })
  }
  fill(other)
  fill(base)
  fill([...keep])
  return out
}

function countEvents(events: readonly Event[]): Map<string, number> {
  const out = new Map<string, number>()
  for (const e of events) {
    const k = canonical(e)
    out.set(k, (out.get(k) ?? 0) + 1)
  }
  return out
}

/** Union by identity: what each side added stays, what either side took back stays gone, a line both added once is kept once. */
function mergeEvents(b: readonly Event[], m: readonly Event[], t: readonly Event[]): Event[] {
  const bc = countEvents(b)
  const mc = countEvents(m)
  const tc = countEvents(t)
  const want = new Map<string, number>()
  for (const k of new Set([...bc.keys(), ...mc.keys(), ...tc.keys()])) {
    const base = bc.get(k) ?? 0
    const dm = (mc.get(k) ?? 0) - base
    const dt = (tc.get(k) ?? 0) - base
    const delta = dm > 0 && dt > 0 ? Math.max(dm, dt) : dm < 0 && dt < 0 ? Math.min(dm, dt) : dm + dt
    want.set(k, Math.max(0, base + delta))
  }
  const out: Event[] = []
  for (const e of [...m, ...t]) {
    const k = canonical(e)
    const left = want.get(k) ?? 0
    if (left <= 0) continue
    want.set(k, left - 1)
    out.push(e)
  }
  // Stable: equal times keep mine-then-theirs order.
  out.sort((x, y) => x.at - y.at)
  return out.slice(-MAX_EVENTS)
}
