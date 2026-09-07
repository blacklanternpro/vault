import { lex, type Tok } from './lex'
import type { OrganName } from './ir'
import { COL_ORDER, isBinderStatus, type NodeStatus } from './tokens'

export type GraphNode = {
  id: number
  title: string
  body?: string
  status: NodeStatus
  parent: number | null
  urgent?: boolean
}

export type Note = {
  date: string
  text: string
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
}

export const SEED_SOURCE = `PIPE vault
  COL backlog
  COL active
  COL staging
  COL done
NEST
  NODE 1 "ops" status none
    NODE 10 "lab" status none
      NODE 11 "scout_ridge_a" status none URGENT
    NODE 20 "net" status none
      NODE 21 "flush_stale_resolvers.sh" status none
      NODE 102 "telemetry ui" status active
        BODY "overlay leftover"
    NODE 104 "ingress routing" status backlog
    NODE 101 "supabase link" status staging
    NODE 99 "baseline" status done
DUMP
  NOTE 09.07.26 "ridge"
PLACE PIPE 24 16
PLACE NEST 24 400
PLACE DUMP 560 400
GLYPH 820 36 72 "07"`

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
  if (s === 'backlog' || s === 'active' || s === 'staging' || s === 'done' || s === 'none') return s
  return 'none'
}

export function blankDoc(): Doc {
  return {
    pipeName: 'vault',
    cols: [...COL_ORDER],
    nodes: [],
    notes: [],
    places: [
      { organ: 'PIPE', x: 24, y: 16 },
      { organ: 'NEST', x: 24, y: 400 },
      { organ: 'DUMP', x: 560, y: 400 },
    ],
    glyphs: [],
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

export function isProject(doc: Doc, node: GraphNode): boolean {
  return childrenOf(doc, node.id).length > 0
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
  partial: { title: string; status?: NodeStatus; parent?: number | null; body?: string; urgent?: boolean; id?: number },
): GraphNode {
  const node: GraphNode = {
    id: partial.id ?? nextNodeId(doc),
    title: partial.title,
    status: partial.status ?? 'none',
    parent: partial.parent ?? null,
  }
  if (partial.body) node.body = partial.body
  if (partial.urgent) node.urgent = true
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
  for (let i = 0; i < toks.length; i++) {
    const w = word(toks[i])
    const nxt = toks[i + 1]
    if (w === 'ID' && nxt?.t === 'NUM') id = nxt.v
    if (w === 'STATUS' && nxt) status = parseStatus(nxt.t === 'WORD' ? nxt.v : nxt.raw)
    if (w === 'URGENT') urgent = true
  }
  if (!id) {
    const n = toks.find((t) => t.t === 'NUM')
    if (n) id = n.v
  }
  return { id, title, status, urgent: urgent || undefined }
}

function parseLegacyTask(toks: Tok[]): { col: string; title: string; id: number; nest?: string } | null {
  const col = (word(toks[1]) || 'backlog').toLowerCase()
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
      if (head === 'PIPE') doc.pipeName = line.toks[1]?.raw || 'vault'
      else if (head === 'NEST') nestRoot = line.toks[1]?.raw || ''
      else if (head === 'DUMP') {
        /* organ marker */
      } else if (head === 'PLACE') {
        const organ = word(line.toks[1])
        const n = nums(line.toks)
        if (organ === 'PIPE' || organ === 'NEST' || organ === 'DUMP') {
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
      const col = (word(line.toks[1]) || '').toLowerCase()
      if (col && !doc.cols.includes(col)) doc.cols.push(col)
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
      if (text) doc.notes.push({ date, text })
    }
  }
  if (doc.cols.length === 0) doc.cols = [...COL_ORDER]
  if (doc.places.length === 0) doc.places = blankDoc().places
  return doc
}

function writeTree(doc: Doc, parent: number | null, indent: number, lines: string[]): void {
  const pad = '  '.repeat(indent)
  for (const n of childrenOf(doc, parent)) {
    lines.push(
      `${pad}NODE ${n.id} ${quote(n.title)} status ${n.status}${n.urgent ? ' URGENT' : ''}`,
    )
    if (n.body) lines.push(`${pad}  BODY ${quote(n.body)}`)
    writeTree(doc, n.id, indent + 1, lines)
  }
}

export function serializeDoc(doc: Doc): string {
  const lines: string[] = []
  lines.push(`PIPE ${doc.pipeName}`)
  const cols = doc.cols.length ? doc.cols : [...COL_ORDER]
  for (const col of cols) lines.push(`  COL ${col}`)
  lines.push('NEST')
  writeTree(doc, null, 1, lines)
  lines.push('DUMP')
  for (const n of doc.notes) lines.push(`  NOTE ${n.date} ${quote(n.text)}`)
  for (const p of doc.places) lines.push(`PLACE ${p.organ} ${Math.round(p.x)} ${Math.round(p.y)}`)
  for (const g of doc.glyphs) {
    lines.push(`GLYPH ${Math.round(g.x)} ${Math.round(g.y)} ${Math.round(g.px)} ${quote(g.text)}`)
  }
  return lines.join('\n')
}

export function placeOf(doc: Doc, organ: OrganName): Place {
  return doc.places.find((p) => p.organ === organ) ?? blankDoc().places.find((p) => p.organ === organ)!
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
