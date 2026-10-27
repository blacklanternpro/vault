import { isLane, type Doc, type Lane, type Node, type Note, type Status } from './types'

/*
 * Every operation here is pure: it takes a Doc and returns a new one, leaving
 * the old one untouched, which is what lets the shell keep an undo history by
 * just holding on to old Docs. Structure changes run through `normalize`, so a
 * node's status and loose flag always agree with where it sits in the tree.
 */

function clone(doc: Doc): Doc {
  return { nodes: doc.nodes.map((n) => ({ ...n })), notes: doc.notes.map((n) => ({ ...n })) }
}

/** Ids stay small whole numbers, whatever an import claims. */
export const MAX_ID = 1_000_000_000
/** No tree goes deeper than this; an import that does is cut at this depth. */
export const MAX_DEPTH = 64

/*
 * A finished Doc is frozen (its arrays), so it can never change under a cached
 * index. Docs still being built inside an operation are not frozen, and are
 * read the slow way.
 */
function freeze(doc: Doc): Doc {
  Object.freeze(doc.nodes)
  Object.freeze(doc.notes)
  return Object.freeze(doc)
}

type Index = { ids: Map<number, Node>; kids?: Map<number | null, Node[]> }
const indexes = new WeakMap<Doc, Index>()

function indexOf(doc: Doc): Index | null {
  if (!Object.isFrozen(doc.nodes)) return null
  let ix = indexes.get(doc)
  if (!ix) {
    ix = { ids: new Map(doc.nodes.map((n) => [n.id, n])) }
    indexes.set(doc, ix)
  }
  return ix
}

/* ----------------------------------------------------------------- reading */

export function byId(doc: Doc, id: number | null | undefined): Node | undefined {
  if (id == null) return undefined
  const ix = indexOf(doc)
  return ix ? ix.ids.get(id) : doc.nodes.find((n) => n.id === id)
}

export function childrenOf(doc: Doc, parent: number | null): Node[] {
  const ix = indexOf(doc)
  if (!ix) return doc.nodes.filter((n) => n.parent === parent)
  if (!ix.kids) {
    const kids = new Map<number | null, Node[]>()
    for (const n of doc.nodes) {
      const list = kids.get(n.parent)
      if (list) list.push(n)
      else kids.set(n.parent, [n])
    }
    ix.kids = kids
  }
  return ix.kids.get(parent) ?? []
}

export function projectsOf(doc: Doc): Node[] {
  return childrenOf(doc, null)
}

export function depthOf(doc: Doc, id: number): number {
  let depth = 0
  let node = byId(doc, id)
  const seen = new Set<number>()
  while (node && node.parent != null && !seen.has(node.id)) {
    seen.add(node.id)
    depth += 1
    node = byId(doc, node.parent)
  }
  return depth
}

/** The project (root) a node hangs under, or itself when it is one. */
export function projectOf(doc: Doc, id: number): Node | undefined {
  let node = byId(doc, id)
  const seen = new Set<number>()
  while (node && node.parent != null && !seen.has(node.id)) {
    seen.add(node.id)
    node = byId(doc, node.parent)
  }
  return node
}

export type Kind = 'project' | 'task' | 'subtask'

export function kindOf(doc: Doc, id: number): Kind {
  const depth = depthOf(doc, id)
  return depth === 0 ? 'project' : depth === 1 ? 'task' : 'subtask'
}

/** A node gets a card of its own when it is a task, or a subtask pulled loose. */
export function isCard(doc: Doc, node: Node): boolean {
  if (node.parent == null) return false
  return node.loose === true || byId(doc, node.parent)?.parent == null
}

/** The card a node is shown inside: itself if it is one, else the nearest ancestor that is. */
export function cardOf(doc: Doc, id: number): Node | undefined {
  let node = byId(doc, id)
  const seen = new Set<number>()
  while (node && !seen.has(node.id)) {
    if (isCard(doc, node)) return node
    seen.add(node.id)
    node = byId(doc, node.parent)
  }
  return undefined
}

export function subtreeIds(doc: Doc, id: number): number[] {
  const out: number[] = []
  const walk = (at: number) => {
    out.push(at)
    for (const child of childrenOf(doc, at)) walk(child.id)
  }
  walk(id)
  return out
}

export function inSubtree(doc: Doc, rootId: number, id: number): boolean {
  return subtreeIds(doc, rootId).includes(id)
}

/** The lines inside a card: its children that have not been pulled out as cards of their own. */
export function subtasksOf(doc: Doc, id: number): Node[] {
  return childrenOf(doc, id).filter((n) => !n.loose)
}

export type Line = { node: Node; depth: number }

/** Every line inside a card, nested lines included, in tree order. A pulled-out (loose) line and what is under it belong to its own card. */
export function linesOf(doc: Doc, id: number): Line[] {
  const out: Line[] = []
  const walk = (at: number, depth: number) => {
    for (const child of subtasksOf(doc, at)) {
      out.push({ node: child, depth })
      walk(child.id, depth + 1)
    }
  }
  walk(id, 1)
  return out
}

export function progressOf(doc: Doc, id: number): { done: number; total: number } {
  const lines = linesOf(doc, id)
  return { done: lines.filter((l) => l.node.status === 'done').length, total: lines.length }
}

export function laneOf(status: Status): Lane {
  return status === 'none' ? 'pending' : status
}

/** Every card on the board, in document order, optionally narrowed to one project. */
export function boardCards(doc: Doc, projectId: number | null): Node[] {
  return doc.nodes.filter((n) => isCard(doc, n) && (projectId == null || projectOf(doc, n.id)?.id === projectId))
}

/** Loose cards on the board, each of which gets a cable back to its parent. */
export function satellitesOf(doc: Doc, projectId: number | null): Node[] {
  return boardCards(doc, projectId).filter((n) => n.loose)
}

/* ------------------------------------------------------------------ search */

export function matchesQuery(node: Node, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return false
  return node.title.toLowerCase().includes(q) || (node.body ?? '').toLowerCase().includes(q)
}

/** Ids of every node whose title or description holds the query. */
export function searchIds(doc: Doc, query: string): Set<number> {
  return new Set(doc.nodes.filter((n) => matchesQuery(n, query)).map((n) => n.id))
}

/** A card is a hit if it, or any line inside it, is. */
export function cardHits(doc: Doc, query: string): Set<number> {
  const out = new Set<number>()
  for (const id of searchIds(doc, query)) {
    const card = cardOf(doc, id)
    if (card) out.add(card.id)
  }
  return out
}

/** Hits plus every ancestor of a hit, which is what the directory keeps on screen while searching. */
export function searchPaths(doc: Doc, query: string): Set<number> {
  const out = new Set<number>()
  for (const id of searchIds(doc, query)) {
    let node = byId(doc, id)
    while (node && !out.has(node.id)) {
      out.add(node.id)
      node = byId(doc, node.parent)
    }
  }
  return out
}

/* ---------------------------------------------------------------- shaping */

export function nextId(doc: Doc): number {
  return doc.nodes.reduce((m, n) => Math.max(m, n.id), 0) + 1
}

/**
 * Makes a node's flags agree with where it sits: a task or subtask always has a
 * lane, and only a subtask can be loose (a task is already a card). A project's
 * lane is simply not shown — it is kept, so a task outdented to a project and
 * back comes back in the lane it left. Runs after every structural change.
 */
export function normalize(doc: Doc): Doc {
  for (const node of doc.nodes) {
    const depth = depthOf(doc, node.id)
    if (depth === 0) {
      delete node.loose
    } else {
      if (node.status === 'none') node.status = 'pending'
      if (depth === 1) delete node.loose
    }
  }
  const live = new Set(doc.nodes.map((n) => n.id))
  for (const note of doc.notes) if (note.node != null && !live.has(note.node)) delete note.node
  return doc
}

function placeBefore(doc: Doc, id: number, beforeId: number | null | undefined) {
  if (beforeId === undefined) return
  const from = doc.nodes.findIndex((n) => n.id === id)
  if (from < 0) return
  const [node] = doc.nodes.splice(from, 1)
  const to = beforeId == null ? -1 : doc.nodes.findIndex((n) => n.id === beforeId)
  if (to < 0) doc.nodes.push(node)
  else doc.nodes.splice(to, 0, node)
}

/* ----------------------------------------------------------------- writing */

export type NewNode = {
  parent: number | null
  title: string
  status?: Status
  body?: string
  urgent?: boolean
  /** Insert before this sibling; null or missing appends. */
  before?: number | null
}

export function addNode(doc: Doc, spec: NewNode): { doc: Doc; id: number } {
  const next = clone(doc)
  if (spec.parent != null && !byId(next, spec.parent)) return { doc, id: -1 }
  const id = nextId(next)
  const node: Node = { id, title: spec.title, status: spec.status ?? (spec.parent == null ? 'none' : 'pending'), parent: spec.parent }
  if (spec.body?.trim()) node.body = spec.body
  if (spec.urgent) node.urgent = true
  next.nodes.push(node)
  if (spec.before != null) placeBefore(next, id, spec.before)
  return { doc: freeze(normalize(next)), id }
}

export function updateNode(doc: Doc, id: number, patch: { title?: string; body?: string; urgent?: boolean }): Doc {
  const next = clone(doc)
  const node = byId(next, id)
  if (!node) return doc
  if (patch.title !== undefined) node.title = patch.title
  if (patch.body !== undefined) {
    if (patch.body.trim()) node.body = patch.body
    else delete node.body
  }
  if (patch.urgent !== undefined) {
    if (patch.urgent) node.urgent = true
    else delete node.urgent
  }
  return freeze(next)
}

/** Sets one node's status. Nothing else changes: subtasks keep their own ticks. */
export function setStatus(doc: Doc, id: number, status: Lane): Doc {
  const next = clone(doc)
  const node = byId(next, id)
  if (!node || node.parent == null) return doc
  node.status = status
  return freeze(next)
}

export function toggleDone(doc: Doc, id: number): Doc {
  const node = byId(doc, id)
  if (!node || node.parent == null) return doc
  return setStatus(doc, id, node.status === 'done' ? 'pending' : 'done')
}

/** A card moved to a lane (and optionally to a spot in it). Its subtasks keep their own state. */
export function moveCard(doc: Doc, id: number, lane: Lane, beforeId?: number | null): Doc {
  const next = clone(doc)
  const node = byId(next, id)
  if (!node || node.parent == null) return doc
  node.status = lane
  if (beforeId !== id) placeBefore(next, id, beforeId)
  return freeze(next)
}

/** A subtask pulled out of its card onto a lane: it stays in the tree but gets a card of its own. */
export function pullCard(doc: Doc, id: number, lane: Lane, beforeId?: number | null): Doc {
  if (depthOf(doc, id) < 2) return moveCard(doc, id, lane, beforeId)
  const next = clone(moveCard(doc, id, lane, beforeId))
  const node = byId(next, id)
  if (node) node.loose = true
  return freeze(next)
}

/** A card (or line) dropped onto another card becomes one of its subtasks. */
export function dockCard(doc: Doc, id: number, parentId: number): Doc {
  const node = byId(doc, id)
  const parent = byId(doc, parentId)
  if (!node || !parent || node.parent == null || id === parentId) return doc
  if (inSubtree(doc, id, parentId)) return doc
  const next = clone(doc)
  const n = byId(next, id)!
  n.parent = parentId
  delete n.loose
  return freeze(normalize(next))
}

/** Removes a node and everything under it. Notes hitched to any of it come loose. */
export function removeNode(doc: Doc, id: number): Doc {
  if (!byId(doc, id)) return doc
  const gone = new Set(subtreeIds(doc, id))
  const next = clone(doc)
  next.nodes = next.nodes.filter((n) => !gone.has(n.id))
  return freeze(normalize(next))
}

/** Under the sibling above, as its last child. Returns the same Doc when there is no sibling above. */
export function indentNode(doc: Doc, id: number): Doc {
  const node = byId(doc, id)
  if (!node) return doc
  const siblings = childrenOf(doc, node.parent)
  const at = siblings.findIndex((s) => s.id === id)
  if (at <= 0) return doc
  const next = clone(doc)
  const n = byId(next, id)!
  n.parent = siblings[at - 1].id
  // Last child of its new parent, which in a flat list means after everything already there.
  placeBefore(next, id, null)
  return freeze(normalize(next))
}

/** Out to sit right after its old parent. Returns the same Doc for a project. */
export function outdentNode(doc: Doc, id: number): Doc {
  const node = byId(doc, id)
  if (!node || node.parent == null) return doc
  const parent = byId(doc, node.parent)
  if (!parent) return doc
  const next = clone(doc)
  const n = byId(next, id)!
  n.parent = parent.parent
  const from = next.nodes.indexOf(n)
  next.nodes.splice(from, 1)
  // After the old parent's whole subtree, so the outdented node does not land inside it.
  const tail = subtreeIds(next, parent.id)
  const lastAt = Math.max(...tail.map((t) => next.nodes.findIndex((x) => x.id === t)))
  next.nodes.splice(lastAt + 1, 0, n)
  return freeze(normalize(next))
}

/** Moves a node one place up or down among its siblings. */
export function shiftNode(doc: Doc, id: number, dir: -1 | 1): Doc {
  const node = byId(doc, id)
  if (!node) return doc
  const siblings = childrenOf(doc, node.parent)
  const at = siblings.findIndex((s) => s.id === id)
  const swap = siblings[at + dir]
  if (!swap) return doc
  const next = clone(doc)
  if (dir < 0) placeBefore(next, id, swap.id)
  else {
    const after = siblings[at + 2]
    placeBefore(next, id, after ? after.id : null)
  }
  return freeze(next)
}

/* ------------------------------------------------------------------- notes */

export function tapeDate(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(d.getMonth() + 1)}.${p(d.getDate())}.${p(d.getFullYear() % 100)}`
}

export function noteId(): string {
  return `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

export function addNote(doc: Doc, text = '', date = tapeDate()): { doc: Doc; id: string } {
  const next = clone(doc)
  const note: Note = { id: noteId(), date, text }
  next.notes.push(note)
  return { doc: freeze(next), id: note.id }
}

export function setNoteText(doc: Doc, id: string, text: string): Doc {
  const next = clone(doc)
  const note = next.notes.find((n) => n.id === id)
  if (!note) return doc
  note.text = text
  return freeze(next)
}

export function removeNote(doc: Doc, id: string): Doc {
  if (!doc.notes.some((n) => n.id === id)) return doc
  const next = clone(doc)
  next.notes = next.notes.filter((n) => n.id !== id)
  return freeze(next)
}

export function moveNote(doc: Doc, from: number, to: number): Doc {
  if (from < 0 || from >= doc.notes.length) return doc
  const clamped = Math.max(0, Math.min(doc.notes.length - 1, to))
  if (from === clamped) return doc
  const next = clone(doc)
  const [note] = next.notes.splice(from, 1)
  next.notes.splice(clamped, 0, note)
  return freeze(next)
}

export function hitchNote(doc: Doc, id: string, nodeId: number | null): Doc {
  const next = clone(doc)
  const note = next.notes.find((n) => n.id === id)
  if (!note) return doc
  if (nodeId == null || !byId(next, nodeId)) delete note.node
  else note.node = nodeId
  return freeze(next)
}

/* ------------------------------------------------------------- validation */

/**
 * Turns anything that claims to be a Doc into one that is safe to render:
 * unknown fields dropped, bad statuses repaired, duplicate ids renumbered,
 * missing parents and cycles broken. Throws only when there is nothing
 * recognisable at all.
 */
export function sanitizeDoc(raw: unknown): Doc {
  if (!raw || typeof raw !== 'object') throw new Error('not a document')
  const src = raw as { nodes?: unknown; notes?: unknown }
  if (!Array.isArray(src.nodes)) throw new Error('document has no nodes list')

  const nodes: Node[] = []
  const seen = new Set<number>()
  let maxId = 0
  for (const item of src.nodes) {
    const raw = item && typeof item === 'object' ? (item as Node).id : undefined
    if (isSafeId(raw)) maxId = Math.max(maxId, raw)
  }
  for (const item of src.nodes) {
    if (!item || typeof item !== 'object') continue
    const n = item as Record<string, unknown>
    let id = isSafeId(n.id) ? n.id : 0
    if (!id || seen.has(id)) id = ++maxId
    if (id > MAX_ID) throw new Error('document has too many items')
    seen.add(id)
    const node: Node = {
      id,
      title: typeof n.title === 'string' ? n.title : String(n.title ?? ''),
      status: n.status === 'none' || isLane(n.status) ? (n.status as Status) : 'pending',
      parent: isSafeId(n.parent) ? n.parent : null,
    }
    if (typeof n.body === 'string' && n.body.trim()) node.body = n.body
    if (n.urgent === true) node.urgent = true
    if (n.loose === true) node.loose = true
    nodes.push(node)
  }
  const ids = new Set(nodes.map((n) => n.id))
  for (const node of nodes) {
    if (node.parent != null && !ids.has(node.parent)) node.parent = null
  }
  // Break cycles: walk up from each node; if it comes back round, cut it loose at the top.
  const parentOf = new Map(nodes.map((n) => [n.id, n.parent]))
  for (const node of nodes) {
    const path = new Set<number>([node.id])
    let at = node.parent
    while (at != null) {
      if (path.has(at)) {
        node.parent = null
        parentOf.set(node.id, null)
        break
      }
      path.add(at)
      at = parentOf.get(at) ?? null
    }
  }

  // Cut anything nested deeper than MAX_DEPTH loose at that depth, so no walk can run away.
  const byKey = new Map(nodes.map((n) => [n.id, n]))
  for (const node of nodes) {
    let steps = 0
    let at = node.parent
    while (at != null && steps <= MAX_DEPTH) {
      steps += 1
      at = byKey.get(at)?.parent ?? null
    }
    if (steps > MAX_DEPTH) node.parent = null
  }

  const notes: Note[] = []
  const noteIds = new Set<string>()
  if (Array.isArray(src.notes)) {
    for (const item of src.notes) {
      if (!item || typeof item !== 'object') continue
      const n = item as Record<string, unknown>
      let id = typeof n.id === 'string' && n.id ? n.id : noteId()
      if (noteIds.has(id)) id = noteId()
      noteIds.add(id)
      const note: Note = { id, date: typeof n.date === 'string' ? n.date : '', text: typeof n.text === 'string' ? n.text : '' }
      if (isSafeId(n.node) && ids.has(n.node)) note.node = n.node
      notes.push(note)
    }
  }
  return freeze(normalize({ nodes, notes }))
}

function isSafeId(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 && value <= MAX_ID
}

/* ---------------------------------------------------------------- restoring */

/**
 * Puts back nodes that a delete removed, into whatever the doc is now — so
 * "Undo" on a delete brings that back without also undoing anything done since.
 * Each comes back after the node it followed; one whose parent has since gone
 * comes back as a project. Notes that were hitched to them are hitched again.
 */
export function restoreRemoved(current: Doc, before: Doc, removedIds: readonly number[]): Doc {
  const wanted = new Set(removedIds)
  const next = clone(current)
  const have = new Set(next.nodes.map((n) => n.id))
  before.nodes.forEach((node, at) => {
    if (!wanted.has(node.id) || have.has(node.id)) return
    const prevId = before.nodes[at - 1]?.id
    const prevAt = prevId == null ? -1 : next.nodes.findIndex((n) => n.id === prevId)
    next.nodes.splice(prevId == null ? 0 : prevAt < 0 ? next.nodes.length : prevAt + 1, 0, { ...node })
    have.add(node.id)
  })
  for (const node of next.nodes) if (node.parent != null && !have.has(node.parent)) node.parent = null
  for (const note of next.notes) {
    const old = before.notes.find((x) => x.id === note.id)
    if (note.node == null && old?.node != null && wanted.has(old.node)) note.node = old.node
  }
  return freeze(normalize(next))
}

/** Puts back a note that was removed, where it was. */
export function restoreNote(current: Doc, before: Doc, id: string): Doc {
  if (current.notes.some((n) => n.id === id)) return current
  const at = before.notes.findIndex((n) => n.id === id)
  if (at < 0) return current
  const next = clone(current)
  next.notes.splice(Math.min(at, next.notes.length), 0, { ...before.notes[at] })
  return freeze(next)
}
