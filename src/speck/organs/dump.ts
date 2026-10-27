import type { HitBox, Op, Session } from '../ir'
import { placeOf, type Doc } from '../doc'
import { CHROME_PAD, paintChrome, type Buf } from './chrome'
import { PAPER, POWER, RULE, fontHelv } from '../tokens'

const FONT = fontHelv(16, 400)
const FONT_SM = fontHelv(13, 400)
const ROW = 26
const MID = ROW / 2
const GHOSTS = ['_ LINK', '_ PIC', '_ FILE'] as const

export function compileDump(
  doc: Doc,
  session: Session,
  fieldW: number,
): { ops: Op[]; hits: HitBox[]; x: number; y: number; w: number; h: number } {
  const origin = placeOf(doc, 'DUMP')
  const x = origin.x
  const y = origin.y
  const w = Math.max(280, Math.min(440, fieldW - x - 16))
  const collapsed = session.collapsed.includes('DUMP')
  const buf: Buf = { ops: [], hits: [] }
  const live = session.lens === 'dump' || session.selected?.kind === 'DUMP'
  const count = doc.notes.length
  const title = 'DUMP // scratch'

  if (collapsed) {
    const h = CHROME_PAD + 4
    paintChrome(buf, { x, y, w, h, title, organ: 'DUMP', count, live, scan: doc.scan })
    return { ops: buf.ops, hits: buf.hits, x, y, w, h }
  }

  const noteRows = Math.max(1, doc.notes.length)
  const h = CHROME_PAD + noteRows * ROW + GHOSTS.length * ROW + 20
  paintChrome(buf, { x, y, w, h, title, organ: 'DUMP', count, live, scan: doc.scan })
  buf.hits.push({ kind: 'DUMP', x, y, w, h, z: 4 })

  if (doc.notes.length === 0) {
    buf.ops.push({
      op: 'GLYPH',
      x: x + 10,
      y: y + CHROME_PAD + MID,
      text: '_ txt',
      color: RULE,
      font: FONT,
      baseline: 'middle',
    })
  }

  doc.notes.forEach((note, i) => {
    const rowY = y + CHROME_PAD + 4 + i * ROW
    buf.ops.push({
      op: 'GLYPH',
      x: x + 10,
      y: rowY + MID,
      text: note.date,
      color: POWER,
      font: FONT_SM,
      baseline: 'middle',
    })
    buf.ops.push({
      op: 'GLYPH',
      x: x + 92,
      y: rowY + MID,
      text: note.text,
      color: PAPER,
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

  const ghostY0 = y + CHROME_PAD + 4 + noteRows * ROW
  GHOSTS.forEach((slot, i) => {
    buf.ops.push({
      op: 'GLYPH',
      x: x + 10,
      y: ghostY0 + i * ROW + MID,
      text: slot,
      color: RULE,
      font: FONT,
      baseline: 'middle',
    })
  })

  return { ops: buf.ops, hits: buf.hits, x, y, w, h }
}
