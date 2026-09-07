import type { HitBox, Now, Op, Session } from '../ir'
import { tapeDate } from '../ir'
import { placeOf, type Doc } from '../doc'
import { CHROME_PAD, paintChrome, type Buf } from './chrome'
import { PAPER, POWER, RULE, fontHelv } from '../tokens'

const FONT = fontHelv(16, 400)
const FONT_SM = fontHelv(13, 400)
const COLS = 7

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function compileCal(
  doc: Doc,
  session: Session,
  fieldW: number,
  now: Now,
): { ops: Op[]; hits: HitBox[]; x: number; y: number; w: number; h: number } {
  const origin = placeOf(doc, 'CAL')
  const x = origin.x
  const y = origin.y
  const w = Math.max(240, Math.min(320, fieldW - x - 16))
  const collapsed = session.collapsed.includes('CAL')
  const buf: Buf = { ops: [], hits: [] }
  const live = session.selected?.kind === 'CAL'
  const last = daysInMonth(now.year, now.month)
  const monthLabel = `${String(now.month + 1).padStart(2, '0')}.${String(now.year).slice(-2)}`
  const noted = new Set(doc.notes.filter((n) => n.date).map((n) => n.date))

  if (collapsed) {
    const h = CHROME_PAD + 4
    paintChrome(buf, { x, y, w, h, title: `CAL // ${monthLabel}`, organ: 'CAL', count: last, live, scan: doc.scan })
    return { ops: buf.ops, hits: buf.hits, x, y, w, h }
  }

  const cellW = (w - 16) / COLS
  const cellH = 28
  const rows = Math.ceil(last / COLS)
  const drop = session.calDay
    ? doc.notes.filter((n) => n.date === session.calDay)
    : []
  const dropH = drop.length ? 8 + drop.length * 22 : 0
  const h = CHROME_PAD + 12 + rows * cellH + dropH + 12

  paintChrome(buf, { x, y, w, h, title: `CAL // ${monthLabel}`, organ: 'CAL', count: last, live, scan: doc.scan })
  buf.hits.push({ kind: 'CAL', x, y, w, h, z: 4 })

  for (let d = 1; d <= last; d++) {
    const i = d - 1
    const col = i % COLS
    const row = Math.floor(i / COLS)
    const dx = x + 8 + col * cellW
    const dy = y + CHROME_PAD + 8 + row * cellH
    const date = tapeDate(now.year, now.month, d)
    const has = noted.has(date)
    const selected = session.calDay === date
    buf.ops.push({
      op: 'GLYPH',
      x: dx + cellW / 2,
      y: dy + 12,
      text: String(d),
      color: selected ? POWER : PAPER,
      font: FONT,
      align: 'center',
      baseline: 'middle',
    })
    if (has) {
      buf.ops.push({
        op: 'LINE',
        x1: dx + 6,
        y1: dy + 22,
        x2: dx + cellW - 6,
        y2: dy + 22,
        color: POWER,
        width: 1,
      })
    }
    buf.hits.push({
      kind: 'DAY',
      x: dx,
      y: dy,
      w: cellW,
      h: cellH,
      z: 16,
      payload: date,
    })
  }

  if (drop.length) {
    let ny = y + CHROME_PAD + 8 + rows * cellH + 6
    buf.ops.push({
      op: 'LINE',
      x1: x + 8,
      y1: ny - 4,
      x2: x + w - 8,
      y2: ny - 4,
      color: POWER,
      width: 1,
    })
    for (const note of drop) {
      buf.ops.push({
        op: 'GLYPH',
        x: x + 12,
        y: ny + 10,
        text: note.text,
        color: PAPER,
        font: FONT_SM,
        baseline: 'middle',
      })
      buf.hits.push({
        kind: 'NOTE',
        x: x + 8,
        y: ny,
        w: w - 16,
        h: 22,
        z: 14,
        payload: doc.notes.indexOf(note),
      })
      ny += 22
    }
  } else if (session.calDay) {
    buf.ops.push({
      op: 'GLYPH',
      x: x + 12,
      y: y + h - 16,
      text: '_',
      color: RULE,
      font: FONT_SM,
      baseline: 'middle',
    })
  }

  return { ops: buf.ops, hits: buf.hits, x, y, w, h }
}
