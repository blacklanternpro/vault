import type { HitBox, Layer, Measure, Now, Op, Program, Session } from './ir'
import { monthLength, tapeDate } from './ir'
import { notesForDate } from './parse'
import { COBALT, FIELD, PAPER, WHITE, fontHelv } from './tokens'

export type World = {
  source: string
  session: Session
  now: Now
  width: number
  viewH: number
  caretOn: boolean
}

export const DOCK_LAYOUT = {
  h: 44,
  echoH: 16,
  inputY: 8,
  inputH: 28,
  caretW: 16,
  commitW: 28,
  pad: 12,
}

export const PACK_COLS = 7
export const DIGIT_PX = 12
export const ROW_H = 26
export const TOP = 14

const PAD = 16
const MAX_INNER = 672
const NOTE_H = 18
const DIGIT_FONT = fontHelv(DIGIT_PX, 400)
const NOTE_FONT = fontHelv(12, 400)
const DOCK_FONT = fontHelv(14, 400)

type Buf = {
  ops: Op[]
  hits: HitBox[]
}

type Cell = {
  day: number
  x: number
  y: number
  w: number
  h: number
  cx: number
  cy: number
  lineY: number
  tw: number
}

function innerX(width: number): { x: number; w: number } {
  const w = Math.min(MAX_INNER, Math.max(200, width - PAD * 2))
  return { x: (width - w) / 2, w }
}

function wrap(measure: Measure, text: string, font: string, maxW: number): string[] {
  const words = text.split(/\s+/)
  const out: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (measure(next, font) <= maxW) line = next
    else {
      if (line) out.push(line)
      line = word
    }
  }
  if (line) out.push(line)
  return out.length ? out : ['_']
}

function cellsForMonth(now: Now, measure: Measure, x: number, w: number): Cell[] {
  const last = monthLength(now.year, now.month)
  const cellW = w / PACK_COLS
  const cells: Cell[] = []
  for (let day = 1; day <= last; day++) {
    const col = (day - 1) % PACK_COLS
    const row = Math.floor((day - 1) / PACK_COLS)
    const left = x + col * cellW
    const top = TOP + row * ROW_H
    const label = String(day)
    const tw = measure(label, DIGIT_FONT)
    const cx = left + cellW / 2
    const cy = top + 10
    cells.push({
      day,
      x: left,
      y: top,
      w: cellW,
      h: ROW_H,
      cx,
      cy,
      lineY: cy + 8,
      tw,
    })
  }
  return cells
}

function compileField(world: World, measure: Measure): Layer {
  const buf: Buf = { ops: [], hits: [] }
  const { x, w } = innerX(world.width)
  const width = world.width
  const { session, source, now } = world
  const cells = cellsForMonth(now, measure, x, w)
  const packBottom = cells.length ? cells[cells.length - 1].y + ROW_H + 16 : TOP + 40
  const h = Math.max(packBottom, world.viewH)

  buf.ops.push({ op: 'FILL', x: 0, y: 0, w: width, h, color: FIELD })
  buf.hits.push({ kind: 'FIELD', x: 0, y: 0, w: width, h, z: 0 })

  for (const cell of cells) {
    const date = tapeDate(now.year, now.month, cell.day)
    const notes = notesForDate(source, date)
    buf.ops.push({
      op: 'GLYPH',
      x: cell.cx,
      y: cell.cy,
      text: String(cell.day),
      color: PAPER,
      font: DIGIT_FONT,
      align: 'center',
      baseline: 'middle',
    })
    if (notes.length > 0) {
      const half = cell.tw / 2
      buf.ops.push({
        op: 'LINE',
        x1: cell.cx - half,
        y1: cell.lineY,
        x2: cell.cx + half,
        y2: cell.lineY,
        color: COBALT,
        width: 1,
      })
    }
    buf.hits.push({
      kind: 'DAY',
      x: cell.x,
      y: cell.y,
      w: cell.w,
      h: cell.h,
      z: 10,
      payload: cell.day,
    })
  }

  const open = session.notesOpen && session.selectedDay != null
  if (open) {
    const cell = cells.find((c) => c.day === session.selectedDay)
    if (cell) {
      const date = tapeDate(now.year, now.month, cell.day)
      const notes = notesForDate(source, date)
      const originX = cell.cx - cell.tw / 2
      const maxW = Math.max(48, x + w - originX)
      let y = cell.lineY
      for (const note of notes) {
        const lines = wrap(measure, note, NOTE_FONT, maxW - 12)
        for (const line of lines) {
          const tw = measure(line, NOTE_FONT)
          const cw = Math.min(maxW, Math.max(24, tw + 12))
          buf.ops.push({
            op: 'CHIP',
            x: originX,
            y,
            w: cw,
            h: NOTE_H,
            text: line,
            fg: WHITE,
            bg: COBALT,
            font: NOTE_FONT,
            padX: 6,
          })
          buf.hits.push({
            kind: 'FIELD',
            x: originX,
            y,
            w: cw,
            h: NOTE_H,
            z: 80,
          })
          y += NOTE_H
        }
      }
    }
  }

  return { ops: buf.ops, hits: buf.hits, h }
}

function compileDock(world: World): Layer {
  const buf: Buf = { ops: [], hits: [] }
  const { session, width, caretOn } = world
  const { x, w } = innerX(width)
  const echo = session.echo
  const top = echo ? DOCK_LAYOUT.echoH : 0
  const h = DOCK_LAYOUT.h + top

  buf.ops.push({ op: 'FILL', x: 0, y: 0, w: width, h, color: FIELD })
  buf.ops.push({
    op: 'LINE',
    x1: 0,
    y1: 1,
    x2: width,
    y2: 1,
    color: COBALT,
    width: 1,
  })

  if (echo) {
    buf.ops.push({
      op: 'GLYPH',
      x,
      y: 10,
      text: echo,
      color: 'rgba(244,244,240,0.4)',
      font: fontHelv(11, 400),
      baseline: 'middle',
    })
  }

  const inputY = top + DOCK_LAYOUT.inputY
  if (caretOn) {
    buf.ops.push({
      op: 'GLYPH',
      x,
      y: inputY + 10,
      text: '>',
      color: COBALT,
      font: fontHelv(16, 400),
      baseline: 'middle',
    })
  }

  const shown = session.buffer
  if (shown) {
    buf.ops.push({
      op: 'GLYPH',
      x: x + DOCK_LAYOUT.caretW,
      y: inputY + 10,
      text: shown,
      color: PAPER,
      font: DOCK_FONT,
      baseline: 'middle',
    })
  } else {
    buf.ops.push({
      op: 'GLYPH',
      x: x + DOCK_LAYOUT.caretW,
      y: inputY + 10,
      text: session.selectedDay == null ? 'tap a date' : 'note…',
      color: 'rgba(244,244,240,0.28)',
      font: fontHelv(13, 400),
      baseline: 'middle',
    })
  }
  buf.ops.push({
    op: 'LINE',
    x1: x + DOCK_LAYOUT.caretW,
    y1: inputY + DOCK_LAYOUT.inputH - 4,
    x2: x + w - DOCK_LAYOUT.commitW,
    y2: inputY + DOCK_LAYOUT.inputH - 4,
    color: COBALT,
    width: 1,
  })
  buf.ops.push({
    op: 'GLYPH',
    x: x + w,
    y: inputY + 10,
    text: '↵',
    color: COBALT,
    font: fontHelv(14, 400),
    align: 'right',
    baseline: 'middle',
  })
  buf.hits.push({
    kind: 'COMMIT',
    x: x + w - DOCK_LAYOUT.commitW,
    y: inputY,
    w: DOCK_LAYOUT.commitW,
    h: DOCK_LAYOUT.inputH,
    z: 20,
  })
  buf.hits.push({ kind: 'DOCK', x: 0, y: 0, w: width, h, z: 0 })

  return { ops: buf.ops, hits: buf.hits, h }
}

export function compile(world: World, measure: Measure): Program {
  return {
    field: compileField(world, measure),
    dock: compileDock(world),
  }
}
