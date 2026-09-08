import type { Session } from './ir'
import { byId, childrenOf, type Doc, type GraphNode } from './doc'

export type NestRow = {
  node: GraphNode
  depth: number
  last: boolean
  prefix: string
}

function isClosed(session: Session, id: number): boolean {
  return session.nestClosed.includes(id)
}

export function walkNest(
  doc: Doc,
  parent: number | null,
  depth: number,
  session: Session,
  out: NestRow[],
  ancestorLast: boolean[],
): void {
  const kids = childrenOf(doc, parent)
  kids.forEach((node, i) => {
    const last = i === kids.length - 1
    const bits = ancestorLast.map((l) => (l ? '    ' : '│   '))
    const branch = last ? '└── ' : '├── '
    const prefix = depth === 0 ? '' : `${bits.slice(1).join('')}${branch}`
    out.push({ node, depth, last, prefix: depth === 0 ? '' : prefix })
    if (!isClosed(session, node.id)) {
      walkNest(doc, node.id, depth + 1, session, out, [...ancestorLast, last])
    }
  })
}

export function nestRows(doc: Doc, session: Session): NestRow[] {
  const rows: NestRow[] = []
  if (session.nestFocus != null) {
    const node = byId(doc, session.nestFocus)
    if (!node) return rows
    rows.push({ node, depth: 0, last: true, prefix: '' })
    if (!isClosed(session, node.id)) walkNest(doc, node.id, 1, session, rows, [true])
    return rows
  }
  walkNest(doc, null, 0, session, rows, [true])
  return rows
}

export function visibleNestIds(doc: Doc, session: Session): number[] {
  return nestRows(doc, session).map((r) => r.node.id)
}
