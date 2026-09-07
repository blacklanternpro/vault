import type { HitBox, Op, Session } from '../ir'
import { placeOf, type Doc } from '../doc'
import { COBALT, FIELD, PAPER, RULE, fontHelv } from '../tokens'

const FONT = fontHelv(12, 400)
const FONT_LG = fontHelv(13, 700)
const FONT_SM = fontHelv(11, 400)
const ROW = 18

type Buf = { ops: Op[]; hits: HitBox[] }

export function compileDump(
  doc: Doc,
  session: Session,
  fieldW: number,
): { ops: Op[]; hits: HitBox[]; x: number; y: number; w: number; h: number } {
  const origin = placeOf(doc, 'DUMP')
  const x = origin.x
  const y = origin.y
  const w = Math.max(240, Math.min(400, fieldW - x - 16))
  const rows = Math.max(1, doc.notes.length)
  const h = 32 + rows * ROW + 12
  const buf: Buf = { ops: [], hits: [] }

  buf.ops.push({ op: 'FILL', x, y, w, h, color: FIELD })
  buf.ops.push({ op: 'LINE', x1: x, y1: y, x2: x + w, y2: y, color: PAPER, width: 1 })
  buf.ops.push({
    op: 'GLYPH',
    x: x + 8,
    y: y + 14,
    text: 'DUMP // tape',
    color: PAPER,
    font: FONT_LG,
    baseline: 'middle',
  })
  buf.hits.push({ kind: 'ORGAN', x, y, w, h: 24, z: 15, payload: 'DUMP' })
  buf.hits.push({ kind: 'DUMP', x, y, w, h, z: 4 })

  if (doc.notes.length === 0) {
    buf.ops.push({
      op: 'GLYPH',
      x: x + 10,
      y: y + 36,
      text: '_',
      color: RULE,
      font: FONT,
      baseline: 'middle',
    })
  }

  doc.notes.forEach((note, i) => {
    const rowY = y + 28 + i * ROW
    const selected = session.selected?.kind === 'DUMP' || session.selected?.kind === 'NOTE'
    buf.ops.push({
      op: 'GLYPH',
      x: x + 10,
      y: rowY + 10,
      text: note.date,
      color: COBALT,
      font: FONT_SM,
      baseline: 'middle',
    })
    buf.ops.push({
      op: 'GLYPH',
      x: x + 78,
      y: rowY + 10,
      text: note.text,
      color: selected ? PAPER : PAPER,
      font: FONT,
      baseline: 'middle',
    })
    buf.hits.push({
      kind: 'NOTE',
      x: x + 6,
      y: rowY,
      w: w - 12,
      h: ROW,
      z: 12,
      payload: i,
    })
  })

  return { ops: buf.ops, hits: buf.hits, x, y, w, h }
}
