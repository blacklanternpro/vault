import { childrenOf } from './doc'
import type { Doc, Node } from './types'

export type TreeRow = {
  node: Node
  depth: number
  /** The box-drawing prefix, e.g. `│   ├── `. Empty for a project. */
  stem: string
  hasChildren: boolean
  open: boolean
}

/**
 * The directory listing, one project at a time. `keep`, when given, limits the
 * walk to those ids (search), and a kept subtree is always shown open.
 */
export function treeRows(doc: Doc, rootId: number, collapsed: ReadonlySet<number>, keep?: ReadonlySet<number>): TreeRow[] {
  const out: TreeRow[] = []
  const root = doc.nodes.find((n) => n.id === rootId)
  if (!root || (keep && !keep.has(root.id))) return out

  const walk = (node: Node, depth: number, rails: boolean[]) => {
    const kids = childrenOf(doc, node.id).filter((k) => !keep || keep.has(k.id))
    const open = keep ? true : !collapsed.has(node.id)
    const stem =
      depth === 0 ? '' : rails.slice(0, -1).map((more) => (more ? '│   ' : '    ')).join('') + (rails[rails.length - 1] ? '├── ' : '└── ')
    out.push({ node, depth, stem, hasChildren: kids.length > 0, open })
    if (!open) return
    kids.forEach((kid, i) => walk(kid, depth + 1, [...rails, i < kids.length - 1]))
  }
  walk(root, 0, [])
  return out
}
