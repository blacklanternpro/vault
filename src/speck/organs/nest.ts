import type { EditBox, HitBox, Op, Session } from '../ir'
import { childrenOf, openTaskCount, placeOf, type Doc, type GraphNode } from '../doc'
import { CHROME_PAD, paintChrome, type Buf } from './chrome'
import { PAPER, POWER, RULE, WHITE, fontHelv } from '../tokens'

const FONT = fontHelv(12, 400)
const FONT_SM = fontHelv(11, 400)
const ROW = 18

function isClosed(session: Session, id: number): boolean {
  return session.nestClosed.includes(id)
}

function walk(
  doc: Doc,
  parent: number | null,
  depth: number,
  session: Session,
  out: { node: GraphNode; depth: number; last: boolean; prefix: string }[],
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
      walk(doc, node.id, depth + 1, session, out, [...ancestorLast, last])
    }
  })
}

export function compileNest(
  doc: Doc,
  session: Session,
  fieldW: number,
  edit: { box: EditBox | null },
): { ops: Op[]; hits: HitBox[]; x: number; y: number; w: number; h: number } {
  const origin = placeOf(doc, 'NEST')
  const x = origin.x
  const y = origin.y
  const w = Math.max(260, Math.min(380, fieldW - x - 16))
  const collapsed = session.collapsed.includes('NEST')
  const buf: Buf = { ops: [], hits: [] }
  const roots = childrenOf(doc, null)
  const count = roots.reduce((m, n) => m + openTaskCount(doc, n.id), 0)
  const live = session.lens === 'nest' || session.selected?.kind === 'NEST'

  if (collapsed) {
    const h = CHROME_PAD + 4
    paintChrome(buf, { x, y, w, h, title: 'NEST // graph', organ: 'NEST', count, live })
    return { ops: buf.ops, hits: buf.hits, x, y, w, h }
  }

  const rows: { node: GraphNode; depth: number; last: boolean; prefix: string }[] = []
  walk(doc, null, 0, session, rows, [true])
  const emptySlot = true
  const h = CHROME_PAD + 8 + (rows.length + (emptySlot ? 1 : 0)) * ROW + 12

  paintChrome(buf, { x, y, w, h, title: 'NEST // graph', organ: 'NEST', count, live })
  buf.hits.push({ kind: 'NEST', x, y, w, h, z: 4 })

  if (rows.length === 0) {
    buf.ops.push({
      op: 'GLYPH',
      x: x + 10,
      y: y + CHROME_PAD + ROW,
      text: '└── _',
      color: RULE,
      font: FONT,
      baseline: 'middle',
    })
  }

  rows.forEach((row, i) => {
    const rowY = y + CHROME_PAD + 4 + i * ROW
    const selected = session.selected?.kind === 'NODE' && session.selected.id === row.node.id && session.lens === 'nest'
    const focused = session.nestFocus === row.node.id
    const kids = childrenOf(doc, row.node.id)
    const fold = kids.length ? (isClosed(session, row.node.id) ? '[+]' : '[-]') : ' · '
    const editing = session.field?.id === row.node.id && session.field.slot === 'title' && session.lens === 'nest'

    buf.ops.push({
      op: 'GLYPH',
      x: x + 8,
      y: rowY + 10,
      text: fold,
      color: kids.length ? POWER : RULE,
      font: FONT_SM,
      baseline: 'middle',
    })
    if (kids.length) {
      buf.hits.push({
        kind: 'TOGGLE',
        x: x + 4,
        y: rowY,
        w: 22,
        h: ROW,
        z: 20,
        payload: row.node.id,
      })
    }

    if (selected && !editing) {
      buf.ops.push({
        op: 'CHIP',
        x: x + 28,
        y: rowY + 1,
        w: Math.min(w - 72, Math.max(48, row.node.title.length * 7 + 12)),
        h: ROW - 2,
        text: row.node.title,
        fg: WHITE,
        bg: POWER,
        font: FONT,
        padX: 4,
      })
    } else if (!editing) {
      buf.ops.push({
        op: 'STEM',
        x: x + 28,
        y: rowY + 10,
        text: row.prefix + (row.node.title || '_'),
        color: row.node.urgent ? POWER : focused ? POWER : PAPER,
        font: FONT,
      })
    }

    buf.hits.push({
      kind: 'STEM',
      x: x + 24,
      y: rowY,
      w: w - 68,
      h: ROW,
      z: 12,
      payload: row.node.id,
    })

    if (session.lens === 'nest' && session.field?.id === row.node.id && session.field.slot === 'title') {
      edit.box = {
        x: x + 28,
        y: rowY + 1,
        w: w - 76,
        h: ROW - 2,
        value: row.node.title,
        placeholder: 'name',
        slot: 'title',
      }
    }

    buf.ops.push({
      op: 'GLYPH',
      x: x + w - 16,
      y: rowY + 10,
      text: '[+]',
      color: POWER,
      font: FONT_SM,
      align: 'center',
      baseline: 'middle',
    })
    buf.hits.push({
      kind: 'ADD',
      x: x + w - 36,
      y: rowY,
      w: 32,
      h: ROW,
      z: 20,
      payload: row.node.id,
    })
  })

  const emptyY = y + CHROME_PAD + 4 + rows.length * ROW
  buf.ops.push({
    op: 'GLYPH',
    x: x + 10,
    y: emptyY + 10,
    text: '└── +',
    color: RULE,
    font: FONT,
    baseline: 'middle',
  })
  buf.hits.push({
    kind: 'ADD',
    x: x + 6,
    y: emptyY,
    w: w - 16,
    h: ROW,
    z: 10,
    payload: 0,
  })

  return { ops: buf.ops, hits: buf.hits, x, y, w, h }
}
