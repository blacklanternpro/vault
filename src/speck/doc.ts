import { lex, type Tok } from './lex'
import { isOrganName, type OrganName } from './ir'
import { COL_ORDER, isBinderStatus, type NodeStatus } from './tokens'

export type GraphNode = {
  id: number
  title: string
  body?: string
  status: NodeStatus
  parent: number | null
  urgent?: boolean
  loose?: boolean
}

export type Note = {
  date: string
  text: string
  node?: number
}

export type Place = {
  organ: OrganName
  x: number
  y: number
}

export type FreeGlyph = {
  x: number
  y: number
  px: number
  text: string
}

export type Doc = {
  pipeName: string
  cols: string[]
  nodes: GraphNode[]
  notes: Note[]
  places: Place[]
  glyphs: FreeGlyph[]
  inv: boolean
  grain: number
  scan: number
}

export const DEFAULT_PLACES: Place[] = [
  { organ: 'PIPE', x: 24, y: 48 },
  { organ: 'NEST', x: 24, y: 660 },
  { organ: 'DUMP', x: 560, y: 540 },
]

export const SEED_SOURCE = `PIPE vault
  COL pending
  COL rnd
  COL active
  COL done
  COL dusted
NEST
  NODE 1 "ops" status none
    NODE 10 "LAB" status active
      NODE 11 "scout ridge" status active URGENT
    NODE 20 "NET" status active
      NODE 21 "flush stale resolvers" status active
      NODE 102 "telemetry overlay" status rnd LOOSE
        BODY "overlay leftover"
    NODE 104 "INGRESS ROUTING" status pending
    NODE 101 "SUPABASE LINK" status rnd
    NODE 99 "BASELINE" status done
    NODE 88 "OLD SPIKE" status dusted
  NODE 2 "archive" status none
    NODE 201 "COLD STORAGE" status pending
DUMP
  NOTE 09.07.26 "ridge"`

function word(tok: Tok | undefined): string | null {
  if (!tok || tok.t !== 'WORD') return null
  return tok.v
}

function strOf(toks: Tok[]): string {
  const s = toks.find((t) => t.t === 'STR')
  return s ? s.v : ''
}

function nums(toks: Tok[]): number[] {
  return toks.filter((t) => t.t === 'NUM').map((t) => t.v)
}

function quote(text: string): string {
  return `"${text.replace(/"/g, '')}"`
}

function parseStatus(raw: string): NodeStatus {
  const s = raw.toLowerCase()
  if (s === 'backlog') return 'pending'
  if (s === 'staging') return 'rnd'
  if (s === 'pending' || s === 'rnd' || s === 'active' || s === 'done' || s === 'dusted' || s === 'none') return s
  return 'none'
}

export function blankDoc(): Doc {
  return {
    pipeName: 'vault',
    cols: [...COL_ORDER],
    nodes: [],
    notes: [],
    places: [],
    glyphs: [],
    inv: false,
    grain: 0,
    scan: 0,
  }
}

export function byId(doc: Doc, id: number): GraphNode | undefined {
  return doc.nodes.find((n) => n.id === id)
}

export function childrenOf(doc: Doc, parent: number | null): GraphNode[] {
  return doc.nodes.filter((n) => n.parent === parent)
}

export function nextNodeId(doc: Doc): number {
  return doc.nodes.reduce((m, n) => Math.max(m, n.id), 0) + 1
}

export function isProject(_doc: Doc, node: GraphNode): boolean {
  return node.parent === null
}

export function projectsOf(doc: Doc): GraphNode[] {
  return childrenOf(doc, null)
}

export function projectIdOf(doc: Doc, projectId: number | null): number | null {
  if (projectId != null) {
    const node = byId(doc, projectId)
    if (node && node.parent === null) return projectId
  }
  return projectsOf(doc)[0]?.id ?? null
}

export function isManagerCard(doc: Doc, node: GraphNode, projectId: number | null): boolean {
  const pid = projectIdOf(doc, projectId)
  if (pid == null || node.id === pid || !inSubtree(doc, pid, node.id)) return false
  if (node.loose) return true
  return node.parent === pid
}

export function laneOf(status: NodeStatus): (typeof COL_ORDER)[number] {
  return status === 'none' ? 'pending' : status
}

export function nestedOf(doc: Doc, id: number): GraphNode[] {
  return childrenOf(doc, id).filter((n) => !n.loose)
}

export function jobsOf(doc: Doc, projectId: number | null): GraphNode[] {
  const pid = projectIdOf(doc, projectId)
  if (pid == null) return []
  return childrenOf(doc, pid).filter((n) => !n.loose)
}

export function satellitesOf(doc: Doc, projectId: number | null): GraphNode[] {
  const pid = projectIdOf(doc, projectId)
  if (pid == null) return []
  return doc.nodes.filter((n) => Boolean(n.loose) && n.id !== pid && inSubtree(doc, pid, n.id))
}

export function managerCards(doc: Doc, projectId: number | null = null): GraphNode[] {
  const pid = projectIdOf(doc, projectId)
  if (pid == null) return []
  const jobs = jobsOf(doc, pid)
  const sats = satellitesOf(doc, pid)
  const ids = new Set(jobs.map((n) => n.id))
  const extra = sats.filter((n) => !ids.has(n.id))
  const wanted = new Set([...jobs, ...extra].map((n) => n.id))
  return doc.nodes.filter((n) => wanted.has(n.id))
}

export function moveNodeBefore(doc: Doc, id: number, beforeId: number | null): boolean {
  const from = doc.nodes.findIndex((n) => n.id === id)
  if (from < 0) return false
  const [node] = doc.nodes.splice(from, 1)
  if (beforeId == null) {
    doc.nodes.push(node)
    return true
  }
  const to = doc.nodes.findIndex((n) => n.id === beforeId)
  if (to < 0) {
    doc.nodes.push(node)
    return true
  }
  doc.nodes.splice(to, 0, node)
  return true
}

export function moveNote(doc: Doc, from: number, to: number): boolean {
  if (from < 0 || from >= doc.notes.length) return false
  const clamped = Math.max(0, Math.min(doc.notes.length - 1, to))
  if (from === clamped) return true
  const [note] = doc.notes.splice(from, 1)
  doc.notes.splice(clamped, 0, note)
  return true
}

export function setNoteText(doc: Doc, index: number, text: string): void {
  const note = doc.notes[index]
  if (note) note.text = text
}

export function subtreeIds(doc: Doc, id: number): number[] {
  const out = [id]
  for (const child of childrenOf(doc, id)) out.push(...subtreeIds(doc, child.id))
  return out
}

export function inSubtree(doc: Doc, rootId: number, id: number): boolean {
  return subtreeIds(doc, rootId).includes(id)
}

export function plaqueOf(doc: Doc, node: GraphNode): GraphNode | null {
  if (node.parent == null) return null
  return byId(doc, node.parent) ?? null
}

export function binderNodes(doc: Doc, focus: number | null): GraphNode[] {
  return doc.nodes.filter((n) => {
    if (!isBinderStatus(n.status)) return false
    if (focus == null) return true
    return inSubtree(doc, focus, n.id)
  })
}

export function openTaskCount(doc: Doc, id: number): number {
  return subtreeIds(doc, id).filter((nid) => {
    if (nid === id) return false
    const n = byId(doc, nid)
    return n && isBinderStatus(n.status) && n.status !== 'done'
  }).length
}

export function insertNode(
  doc: Doc,
  partial: {
    title: string
    status?: NodeStatus
    parent?: number | null
    body?: string
    urgent?: boolean
    loose?: boolean
    id?: number
  },
): GraphNode {
  const node: GraphNode = {
    id: partial.id ?? nextNodeId(doc),
    title: partial.title,
    status: partial.status ?? 'none',
    parent: partial.parent ?? null,
  }
  if (partial.body) node.body = partial.body
  if (partial.urgent) node.urgent = true
  if (partial.loose) node.loose = true
  doc.nodes.push(node)
  return node
}

export function removeNode(doc: Doc, id: number): void {
  const ids = new Set(subtreeIds(doc, id))
  doc.nodes = doc.nodes.filter((n) => !ids.has(n.id))
}

function ensurePath(doc: Doc, path: string, nestRoot: string): number | null {
  const rootBits = nestRoot.split('/').filter(Boolean)
  const bits = path.split('/').filter(Boolean)
  const parts = rootBits.length && bits[0] !== rootBits[0] ? [...rootBits, ...bits] : bits
  let parent: number | null = null
  for (const part of parts) {
    const found: GraphNode | undefined = childrenOf(doc, parent).find((n) => n.title === part)
    if (found) {
      parent = found.id
      continue
    }
    parent = insertNode(doc, { title: part, status: 'none', parent }).id
  }
  return parent
}

function parseNodeLine(toks: Tok[]): Omit<GraphNode, 'parent'> | null {
  const strTok = toks.find((t) => t.t === 'STR')
  if (!strTok) return null
  const title = strTok.v
  let id = 0
  let status: NodeStatus = 'none'
  let urgent = false
  let loose = false
  for (let i = 0; i < toks.length; i++) {
    const w = word(toks[i])
    const nxt = toks[i + 1]
    if (w === 'ID' && nxt?.t === 'NUM') id = nxt.v
    if (w === 'STATUS' && nxt) status = parseStatus(nxt.t === 'WORD' ? nxt.v : nxt.raw)
    if (w === 'URGENT') urgent = true
    if (w === 'LOOSE') loose = true
  }
  if (!id) {
    const n = toks.find((t) => t.t === 'NUM')
    if (n) id = n.v
  }
  return { id, title, status, urgent: urgent || undefined, loose: loose || undefined }
}

function parseLegacyTask(toks: Tok[]): { col: string; title: string; id: number; nest?: string } | null {
  const col = parseStatus(word(toks[1]) || 'pending')
  const title = strOf(toks)
  if (!title) return null
  let id = 0
  let nest: string | undefined
  for (let i = 0; i < toks.length; i++) {
    const w = word(toks[i])
    const nxt = toks[i + 1]
    if (w === 'ID' && nxt?.t === 'NUM') id = nxt.v
    if (w === 'NEST') {
      nest = toks
        .slice(i + 1)
        .map((t) => t.raw)
        .join('')
        .replace(/\/+/g, '/')
    }
  }
  return { id, col, title, nest }
}

function stemPath(toks: Tok[]): { path: string; urgent: boolean } {
  const rest = toks.slice(1)
  const urgent = rest.some((t) => t.t === 'WORD' && t.v === 'URGENT')
  const bits = rest.filter((t) => !(t.t === 'WORD' && t.v === 'URGENT')).map((t) => t.raw)
  let path = bits.join('')
  path = path.replace(/\/+/g, '/').replace(/\/$/, '')
  if (bits.length >= 2 && bits[0]?.endsWith('/')) {
    path = `${bits[0]}${bits.slice(1).join('')}`.replace(/\/+/g, '/')
  }
  return { path, urgent }
}

export function parseDoc(src: string): Doc {
  const doc = blankDoc()
  doc.cols = []
  doc.places = []
  const stack: { indent: number; id: number }[] = []
  let nestRoot = ''
  const lines = lex(src)
  for (const line of lines) {
    const head = word(line.toks[0])
    if (!head) continue
    if (line.indent === 0) {
      if (head === 'INV') doc.inv = true
      else if (head === 'GRAIN') doc.grain = nums(line.toks)[0] ?? 0.14
      else if (head === 'SCAN') doc.scan = nums(line.toks)[0] ?? 0.1
      else if (head === 'PIPE') doc.pipeName = line.toks[1]?.raw || 'vault'
      else if (head === 'NEST') nestRoot = line.toks[1]?.raw || ''
      else if (head === 'DUMP') {
        /* organ marker */
      } else if (head === 'PLACE') {
        const organ = word(line.toks[1])
        const n = nums(line.toks)
        if (organ && isOrganName(organ)) {
          doc.places.push({ organ, x: n[0] ?? 24, y: n[1] ?? 16 })
        }
      } else if (head === 'GLYPH') {
        const n = nums(line.toks)
        doc.glyphs.push({
          x: n[0] ?? 0,
          y: n[1] ?? 0,
          px: n[2] ?? 72,
          text: strOf(line.toks) || String(n[3] ?? ''),
        })
      }
      continue
    }
    if (head === 'COL') {
      const col = parseStatus((word(line.toks[1]) || '').toLowerCase())
      if (col !== 'none' && !doc.cols.includes(col)) doc.cols.push(col)
    } else if (head === 'NODE') {
      const parsed = parseNodeLine(line.toks)
      if (!parsed) continue
      while (stack.length && stack[stack.length - 1].indent >= line.indent) stack.pop()
      const parent = stack.length ? stack[stack.length - 1].id : null
      const id = parsed.id || nextNodeId(doc)
      const node: GraphNode = {
        id,
        title: parsed.title,
        status: parsed.status,
        parent,
      }
      if (parsed.urgent) node.urgent = true
      if (parsed.loose) node.loose = true
      doc.nodes.push(node)
      stack.push({ indent: line.indent, id })
    } else if (head === 'BODY') {
      const text = strOf(line.toks)
      const top = stack[stack.length - 1]
      if (text && top) {
        const node = byId(doc, top.id)
        if (node) node.body = text
      }
    } else if (head === 'TASK') {
      const task = parseLegacyTask(line.toks)
      if (!task) continue
      const parent = task.nest ? ensurePath(doc, task.nest, nestRoot) : ensurePath(doc, nestRoot, nestRoot)
      insertNode(doc, {
        id: task.id || undefined,
        title: task.title,
        status: parseStatus(task.col),
        parent,
      })
    } else if (head === 'STEM') {
      const stem = stemPath(line.toks)
      const id = ensurePath(doc, stem.path, nestRoot)
      if (id && stem.urgent) {
        const node = byId(doc, id)
        if (node) node.urgent = true
      }
    } else if (head === 'NOTE') {
      const dateTok = line.toks[1]
      const date = dateTok?.t === 'DATE' ? dateTok.v : ''
      const text = strOf(line.toks)
      let node: number | undefined
      for (let i = 0; i < line.toks.length; i++) {
        const nxt = line.toks[i + 1]
        if (word(line.toks[i]) === 'NODE' && nxt?.t === 'NUM') node = nxt.v
      }
      if (text) doc.notes.push(node != null ? { date, text, node } : { date, text })
    }
  }
  doc.cols = [...COL_ORDER]
  return doc
}

function writeTree(doc: Doc, parent: number | null, indent: number, lines: string[]): void {
  const pad = '  '.repeat(indent)
  for (const n of childrenOf(doc, parent)) {
    lines.push(
      `${pad}NODE ${n.id} ${quote(n.title)} status ${n.status}${n.urgent ? ' URGENT' : ''}${n.loose ? ' LOOSE' : ''}`,
    )
    if (n.body) lines.push(`${pad}  BODY ${quote(n.body)}`)
    writeTree(doc, n.id, indent + 1, lines)
  }
}

export function serializeDoc(doc: Doc): string {
  const lines: string[] = []
  if (doc.inv) lines.push('INV')
  if (doc.grain > 0) lines.push(`GRAIN ${doc.grain}`)
  if (doc.scan > 0) lines.push(`SCAN ${doc.scan}`)
  lines.push(`PIPE ${doc.pipeName}`)
  for (const col of COL_ORDER) lines.push(`  COL ${col}`)
  lines.push('NEST')
  writeTree(doc, null, 1, lines)
  lines.push('DUMP')
  for (const n of doc.notes) {
    const hitch = n.node != null ? ` NODE ${n.node}` : ''
    lines.push(`  NOTE ${n.date}${hitch} ${quote(n.text)}`)
  }
  for (const p of doc.places) lines.push(`PLACE ${p.organ} ${Math.round(p.x)} ${Math.round(p.y)}`)
  for (const g of doc.glyphs) {
    lines.push(`GLYPH ${Math.round(g.x)} ${Math.round(g.y)} ${Math.round(g.px)} ${quote(g.text)}`)
  }
  return lines.join('\n')
}

export function placeOf(doc: Doc, organ: OrganName): Place {
  return (
    doc.places.find((p) => p.organ === organ) ??
    DEFAULT_PLACES.find((p) => p.organ === organ) ?? { organ, x: 24, y: 16 }
  )
}

export function indentNode(doc: Doc, id: number): boolean {
  const node = byId(doc, id)
  if (!node) return false
  const siblings = childrenOf(doc, node.parent)
  const idx = siblings.findIndex((s) => s.id === id)
  if (idx <= 0) return false
  const prev = siblings[idx - 1]
  node.parent = prev.id
  return true
}

export function outdentNode(doc: Doc, id: number): boolean {
  const node = byId(doc, id)
  if (!node || node.parent == null) return false
  const parent = byId(doc, node.parent)
  if (!parent) return false
  const grand = parent.parent
  const from = doc.nodes.indexOf(node)
  doc.nodes.splice(from, 1)
  const parentAt = doc.nodes.findIndex((n) => n.id === parent.id)
  node.parent = grand
  doc.nodes.splice(parentAt + 1, 0, node)
  return true
}

export function setNodeTitle(doc: Doc, id: number, title: string): void {
  const node = byId(doc, id)
  if (node) node.title = title
}

export function setNodeBody(doc: Doc, id: number, body: string): void {
  const node = byId(doc, id)
  if (!node) return
  if (body.trim()) node.body = body
  else delete node.body
}

export function setNodeStatus(doc: Doc, id: number, status: NodeStatus): void {
  const node = byId(doc, id)
  if (node) node.status = status
}

export function setNodeLoose(doc: Doc, id: number, loose: boolean): void {
  const node = byId(doc, id)
  if (!node) return
  if (loose) node.loose = true
  else delete node.loose
}

export function followNested(doc: Doc, id: number, status: NodeStatus): void {
  for (const child of childrenOf(doc, id)) {
    if (child.loose) continue
    child.status = status
    followNested(doc, child.id, status)
  }
}

export function promotePending(doc: Doc, id: number): void {
  const node = byId(doc, id)
  if (!node || node.status !== 'pending') return
  if (nestedOf(doc, id).length > 0) return
  node.status = 'active'
}
