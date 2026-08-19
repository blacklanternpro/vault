import { hashStr } from './noise'
import { parse } from './parse'

export type Node = {
  /** positional address, "0.2.1". Identity for hits and mutations. */
  path: string
  text: string
  done: boolean
  /** settle time, HH:MM */
  at: string
  /** born date, MM.DD.YY */
  born: string
  depth: number
  /** chaos seed from the text, so wobble survives reordering */
  seed: number
  children: Node[]
}

export const MAX_DEPTH = 4

function node(text: string, done: boolean, at: string, born: string, path: string, depth: number): Node {
  return { path, text, done, at, born, depth, seed: hashStr(text), children: [] }
}

/** Source is indent-nested STEM lines. Indent deeper than +1 clamps to +1. */
export function parseTree(src: string): Node[] {
  const roots: Node[] = []
  const stack: Node[] = []
  for (const stmt of parse(src).stmts) {
    if (stmt.kind !== 'STEM') continue
    const depth = Math.min(stmt.depth, Math.min(stack.length, MAX_DEPTH - 1))
    stack.length = depth
    const parent = depth > 0 ? stack[depth - 1] : null
    const siblings = parent ? parent.children : roots
    const path = parent ? `${parent.path}.${siblings.length}` : String(siblings.length)
    const n = node(stmt.text, stmt.done, stmt.at, stmt.born, path, depth)
    siblings.push(n)
    stack[depth] = n
  }
  return roots
}

export function serialize(nodes: Node[]): string {
  const out: string[] = []
  const walk = (list: Node[], depth: number) => {
    for (const n of list) {
      const pad = '  '.repeat(depth)
      const text = n.text.replace(/"/g, '')
      let line = `${pad}STEM "${text}"`
      if (n.done) line += ' STRIKE'
      if (n.born) line += ` ${n.born}`
      if (n.done && n.at) line += ` ${n.at}`
      out.push(line)
      walk(n.children, depth + 1)
    }
  }
  walk(nodes, 0)
  return out.join('\n')
}

/** Re-address every node after a structural change. */
export function repath(nodes: Node[], prefix = '', depth = 0): Node[] {
  return nodes.map((n, i) => {
    const path = prefix ? `${prefix}.${i}` : String(i)
    return { ...n, path, depth, children: repath(n.children, path, depth + 1) }
  })
}

export function findNode(nodes: Node[], path: string): Node | null {
  if (!path) return null
  for (const n of nodes) {
    if (n.path === path) return n
    if (path.startsWith(`${n.path}.`)) {
      const hit = findNode(n.children, path)
      if (hit) return hit
    }
  }
  return null
}

export function mapNode(nodes: Node[], path: string, fn: (n: Node) => Node): Node[] {
  return nodes.map((n) => {
    if (n.path === path) return fn(n)
    if (path.startsWith(`${n.path}.`)) {
      return { ...n, children: mapNode(n.children, path, fn) }
    }
    return n
  })
}

export function removeNode(nodes: Node[], path: string): Node[] {
  const out: Node[] = []
  for (const n of nodes) {
    if (n.path === path) continue
    if (path.startsWith(`${n.path}.`)) {
      out.push({ ...n, children: removeNode(n.children, path) })
      continue
    }
    out.push(n)
  }
  return out
}

export function addChild(nodes: Node[], parentPath: string | null, text: string, born: string): Node[] {
  const fresh = node(text, false, '', born, 'pending', 0)
  if (!parentPath) return repath([...nodes, fresh])
  const parent = findNode(nodes, parentPath)
  if (!parent) return repath([...nodes, fresh])
  if (parent.depth >= MAX_DEPTH - 1) {
    // Deeper than the slip can print. Land it as a sibling instead of vanishing.
    const up = parentPath.includes('.') ? parentPath.slice(0, parentPath.lastIndexOf('.')) : null
    return addChild(nodes, up, text, born)
  }
  return repath(mapNode(nodes, parentPath, (p) => ({ ...p, children: [...p.children, fresh] })))
}

export function dropSettled(nodes: Node[]): Node[] {
  const keep = (list: Node[]): Node[] =>
    list
      .filter((n) => !(n.done && n.children.length === 0))
      .map((n) => ({ ...n, children: keep(n.children) }))
      .filter((n) => !(n.done && n.children.length === 0))
  return repath(keep(nodes))
}

export type Counts = {
  items: number
  settled: number
  open: number
  depth: number
}

export function counts(nodes: Node[]): Counts {
  let items = 0
  let settled = 0
  let depth = 0
  const walk = (list: Node[], d: number) => {
    if (list.length) depth = Math.max(depth, d)
    for (const n of list) {
      items += 1
      if (n.done) settled += 1
      walk(n.children, d + 1)
    }
  }
  walk(nodes, 1)
  return { items, settled, open: items - settled, depth }
}

/** settled / total across a node's whole branch, excluding itself */
export function branchCount(n: Node): { done: number; total: number } {
  let done = 0
  let total = 0
  const walk = (list: Node[]) => {
    for (const c of list) {
      total += 1
      if (c.done) done += 1
      walk(c.children)
    }
  }
  walk(n.children)
  return { done, total }
}

export function subtreeSize(n: Node): number {
  return branchCount(n).total
}

export type Row = {
  node: Node
  /** hidden children stashed behind a fold */
  folded: boolean
  parentPath: string | null
}

/** Visible rows, in print order, respecting folds. */
export function flatten(nodes: Node[], folded: Set<string>, parentPath: string | null = null): Row[] {
  const rows: Row[] = []
  for (const n of nodes) {
    const isFolded = folded.has(n.path) && n.children.length > 0
    rows.push({ node: n, folded: isFolded, parentPath })
    if (!isFolded) rows.push(...flatten(n.children, folded, n.path))
  }
  return rows
}

/** The node the slip is printed from, plus its ancestry for the masthead. */
export function focusChain(nodes: Node[], focus: string): Node[] {
  if (!focus) return []
  const chain: Node[] = []
  const parts = focus.split('.')
  let path = ''
  for (const part of parts) {
    path = path ? `${path}.${part}` : part
    const found = findNode(nodes, path)
    if (!found) break
    chain.push(found)
  }
  return chain
}
