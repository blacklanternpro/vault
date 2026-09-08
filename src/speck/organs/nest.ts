import type { EditBox, HitBox, Op, Session } from '../ir'
import { matchesFind } from '../ir'
import { childrenOf, openTaskCount, placeOf, type Doc, type GraphNode } from '../doc'
import { CHROME_PAD, liveOval, paintChrome, type Buf } from './chrome'
import { PAPER, POWER, RULE, WHITE, fontHelv } from '../tokens'

const FONT = fontHelv(16, 400)
const FONT_SM = fontHelv(13, 400)
const ROW = 26
const MID = ROW / 2

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

export function visibleNestIds(doc: Doc, session: Session): number[] {
  const rows: { node: GraphNode; depth: number; last: boolean; prefix: string }[] = []
  walk(doc, null, 0, session, rows, [true])
  return rows.map((r) => r.node.id)
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
  const w = Math.max(300, Math.min(440, fieldW - x - 16))
  const collapsed = session.collapsed.includes('NEST')
  const buf: Buf = { ops: [], hits: [] }
  const roots = childrenOf(doc, null)
  const count = roots.reduce((m, n) => m + openTaskCount(doc, n.id), 0)
  const live = session.lens === 'nest' || session.selected?.kind === 'NEST'
  const chrome = {
    x,
    y,
    w,
    title: 'NEST // dir',
    organ: 'NEST' as const,
    count,
    live,
    scan: doc.scan,
  }

  if (collapsed) {
    const h = CHROME_PAD + 4
    paintChrome(buf, { ...chrome, h })
    return { ops: buf.ops, hits: buf.hits, x, y, w, h }
  }

  const rows: { node: GraphNode; depth: number; last: boolean; prefix: string }[] = []
  walk(doc, null, 0, session, rows, [true])
  const emptySlot = true
  const h = CHROME_PAD + 8 + (rows.length + (emptySlot ? 1 : 0)) * ROW + 12

  paintChrome(buf, { ...chrome, h })
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
      y: rowY + MID,
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
        w: 28,
        h: ROW,
        z: 20,
        payload: row.node.id,
      })
    }

    if (selected && !editing) {
      const chipW = Math.min(w - 80, Math.max(64, row.node.title.length * 9 + 16))
      buf.ops.push({
        op: 'CHIP',
        x: x + 32,
        y: rowY + 1,
        w: chipW,
        h: ROW - 2,
        text: row.node.title,
        fg: WHITE,
        bg: POWER,
        font: FONT,
        padX: 4,
      })
      liveOval(buf, x + 32, rowY + 1, chipW, ROW - 2)
    } else if (!editing) {
      const found = matchesFind(session, row.node.title)
      buf.ops.push({
        op: 'STEM',
        x: x + 32,
        y: rowY + MID,
        text: row.prefix + (row.node.title || '_'),
        color: row.node.urgent || focused || found ? POWER : PAPER,
        font: FONT,
      })
    }

    buf.hits.push({
      kind: 'STEM',
      x: x + 28,
      y: rowY,
      w: w - 72,
      h: ROW,
      z: 12,
      payload: row.node.id,
    })

    if (session.lens === 'nest' && session.field?.id === row.node.id && session.field.slot === 'title') {
      edit.box = {
        x: x + 32,
        y: rowY + 1,
        w: w - 80,
        h: ROW - 2,
        value: row.node.title,
        placeholder: 'name',
        slot: 'title',
      }
    }

    buf.ops.push({
      op: 'GLYPH',
      x: x + w - 52,
      y: rowY + MID,
      text: '->',
      color: POWER,
      font: FONT_SM,
      align: 'center',
      baseline: 'middle',
    })
    buf.hits.push({
      kind: 'SHOVEL',
      x: x + w - 68,
      y: rowY,
      w: 24,
      h: ROW,
      z: 20,
      payload: row.node.id,
    })

    buf.ops.push({
      op: 'GLYPH',
      x: x + w - 18,
      y: rowY + MID,
      text: '[+]',
      color: POWER,
      font: FONT_SM,
      align: 'center',
      baseline: 'middle',
    })
    buf.hits.push({
      kind: 'ADD',
      x: x + w - 40,
      y: rowY,
      w: 36,
      h: ROW,
      z: 20,
      payload: row.node.id,
    })
  })

  const emptyY = y + CHROME_PAD + 4 + rows.length * ROW
  buf.ops.push({
    op: 'GLYPH',
    x: x + 10,
    y: emptyY + MID,
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
