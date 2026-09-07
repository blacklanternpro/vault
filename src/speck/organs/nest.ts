import type { HitBox, Op, Session } from '../ir'
import { placeOf, type Doc, type Stem } from '../doc'
import { COBALT, FIELD, PAPER, RULE, URGENT, fontHelv } from '../tokens'

const FONT = fontHelv(12, 400)
const FONT_LG = fontHelv(13, 700)
const FONT_SM = fontHelv(11, 400)
const ROW = 18

type Buf = { ops: Op[]; hits: HitBox[] }

function stemLabel(stem: Stem, last: boolean): string {
  const prefix = last ? '└── ' : '├── '
  return `${prefix}${stem.path}`
}

export function compileNest(
  doc: Doc,
  session: Session,
  fieldW: number,
): { ops: Op[]; hits: HitBox[]; x: number; y: number; w: number; h: number } {
  const origin = placeOf(doc, 'NEST')
  const x = origin.x
  const y = origin.y
  const w = Math.max(240, Math.min(360, fieldW - x - 16))
  const stemCount = Math.max(1, doc.stems.length)
  const h = 48 + stemCount * ROW + 16
  const buf: Buf = { ops: [], hits: [] }

  buf.ops.push({ op: 'FILL', x, y, w, h, color: FIELD })
  buf.ops.push({ op: 'LINE', x1: x, y1: y, x2: x + w, y2: y, color: PAPER, width: 1 })
  buf.ops.push({ op: 'LINE', x1: x, y1: y, x2: x, y2: y + h, color: RULE, width: 1 })
  buf.ops.push({
    op: 'GLYPH',
    x: x + 8,
    y: y + 14,
    text: `NEST // ${doc.nestRoot}`,
    color: PAPER,
    font: FONT_LG,
    baseline: 'middle',
  })
  buf.hits.push({ kind: 'ORGAN', x, y, w, h: 24, z: 15, payload: 'NEST' })
  buf.hits.push({ kind: 'NEST', x, y, w, h, z: 4 })

  buf.ops.push({
    op: 'STEM',
    x: x + 10,
    y: y + 32,
    text: doc.nestRoot,
    color: PAPER,
    font: FONT,
  })

  if (doc.stems.length === 0) {
    buf.ops.push({
      op: 'GLYPH',
      x: x + 10,
      y: y + 32 + ROW,
      text: '└── _',
      color: RULE,
      font: FONT,
      baseline: 'middle',
    })
  }

  doc.stems.forEach((stem, i) => {
    const last = i === doc.stems.length - 1
    const rowY = y + 32 + ROW + i * ROW
    const selected = session.selected?.kind === 'STEM' && session.selected.path === stem.path
    const text = stemLabel(stem, last)
    buf.ops.push({
      op: 'STEM',
      x: x + 10,
      y: rowY + 10,
      text,
      color: stem.urgent ? URGENT : selected ? COBALT : PAPER,
      font: FONT,
    })
    buf.hits.push({
      kind: 'STEM',
      x: x + 6,
      y: rowY,
      w: w - 36,
      h: ROW,
      z: 12,
      payload: stem.path,
    })
    buf.ops.push({
      op: 'GLYPH',
      x: x + w - 22,
      y: rowY + 10,
      text: '[+]',
      color: COBALT,
      font: FONT_SM,
      align: 'center',
      baseline: 'middle',
    })
    buf.hits.push({
      kind: 'CLIP',
      x: x + w - 44,
      y: rowY,
      w: 40,
      h: ROW,
      z: 20,
      payload: stem.path,
    })
  })

  return { ops: buf.ops, hits: buf.hits, x, y, w, h }
}
