import type { HitBox, Measure, Op, Session } from '../ir'
import { placeOf, type Doc, type Task } from '../doc'
import { COBALT, FIELD, PAPER, RULE, URGENT, WHITE, fontHelv } from '../tokens'

export const PIPE_ROWS = 6
export const PIPE_ROW_H = 18

const FONT = fontHelv(12, 400)
const FONT_SM = fontHelv(11, 400)
const FONT_LG = fontHelv(13, 700)

type Buf = { ops: Op[]; hits: HitBox[] }

const LEFT_COLS = ['backlog', 'active']
const RIGHT_COLS = ['staging', 'done']
const COL_LABEL: Record<string, string> = {
  backlog: 'BACKLOG',
  active: 'ACTIVE',
  staging: 'STAGING',
  done: 'COMMITTED',
}

function rect(buf: Buf, x: number, y: number, w: number, h: number, color: string, width = 1) {
  buf.ops.push({ op: 'LINE', x1: x, y1: y, x2: x + w, y2: y, color, width })
  buf.ops.push({ op: 'LINE', x1: x + w, y1: y, x2: x + w, y2: y + h, color, width })
  buf.ops.push({ op: 'LINE', x1: x + w, y1: y + h, x2: x, y2: y + h, color, width })
  buf.ops.push({ op: 'LINE', x1: x, y1: y + h, x2: x, y2: y, color, width })
}

function tasksIn(doc: Doc, col: string): Task[] {
  return doc.tasks.filter((t) => t.col === col).sort((a, b) => a.id - b.id)
}

function compileCol(
  buf: Buf,
  doc: Doc,
  session: Session,
  col: string,
  x: number,
  y: number,
  w: number,
  measure: Measure,
): number {
  buf.ops.push({
    op: 'GLYPH',
    x: x + 8,
    y: y + 10,
    text: `── ${COL_LABEL[col] ?? col.toUpperCase()} ──`,
    color: COBALT,
    font: FONT_SM,
    baseline: 'middle',
  })
  buf.hits.push({ kind: 'COL', x, y, w, h: 16, z: 8, payload: col })
  let rowY = y + 20
  const rows = tasksIn(doc, col)
  for (let i = 0; i < PIPE_ROWS; i++) {
    const task = rows[i]
    buf.ops.push({
      op: 'LINE',
      x1: x + 6,
      y1: rowY + PIPE_ROW_H - 2,
      x2: x + w - 6,
      y2: rowY + PIPE_ROW_H - 2,
      color: RULE,
      width: 1,
    })
    if (task) {
      const selected = session.selected?.kind === 'TASK' && session.selected.id === task.id
      const mark = col === 'done' ? '[X]' : '[ ]'
      const label = `${mark} #${task.id} ${task.title}`
      const tw = measure(label, FONT)
      if (selected) {
        buf.ops.push({
          op: 'CHIP',
          x: x + 6,
          y: rowY,
          w: Math.min(w - 28, Math.max(80, tw + 12)),
          h: PIPE_ROW_H - 2,
          text: label,
          fg: WHITE,
          bg: COBALT,
          font: FONT,
          padX: 6,
        })
      } else {
        buf.ops.push({
          op: 'GLYPH',
          x: x + 10,
          y: rowY + 8,
          text: label,
          color: PAPER,
          font: FONT,
          baseline: 'middle',
        })
      }
      if (col === 'done') {
        buf.ops.push({
          op: 'STRIKE',
          x: x + 10,
          y: rowY + 8,
          w: Math.min(tw, w - 40),
          thick: 1,
          color: URGENT,
        })
      }
      buf.hits.push({
        kind: 'TASK',
        x: x + 6,
        y: rowY,
        w: w - 28,
        h: PIPE_ROW_H,
        z: 12,
        payload: task.id,
      })
      if (col !== 'done') {
        buf.ops.push({
          op: 'GLYPH',
          x: x + w - 14,
          y: rowY + 8,
          text: '->',
          color: COBALT,
          font: FONT_SM,
          align: 'center',
          baseline: 'middle',
        })
        buf.hits.push({
          kind: 'SHOVEL',
          x: x + w - 28,
          y: rowY,
          w: 24,
          h: PIPE_ROW_H,
          z: 20,
          payload: task.id,
        })
      }
      if (selected && session.overlay) {
        const lines = [
          `#${task.id}  COL ${task.col}`,
          task.title,
          task.nest ? `nest ${task.nest}` : 'nest _',
        ]
        let dy = rowY + PIPE_ROW_H
        for (const line of lines) {
          const cw = Math.min(w - 12, Math.max(72, measure(line, FONT_SM) + 14))
          buf.ops.push({
            op: 'CHIP',
            x: x + 8,
            y: dy,
            w: cw,
            h: 16,
            text: line,
            fg: WHITE,
            bg: COBALT,
            font: FONT_SM,
            padX: 6,
          })
          dy += 16
        }
      }
    }
    rowY += PIPE_ROW_H
  }
  return rowY
}

export function compilePipe(
  doc: Doc,
  session: Session,
  measure: Measure,
  fieldW: number,
): { ops: Op[]; hits: HitBox[]; x: number; y: number; w: number; h: number } {
  const origin = placeOf(doc, 'PIPE')
  const x = origin.x
  const y = origin.y
  const w = Math.max(560, Math.min(fieldW - x - 16, 980))
  const spineW = 36
  const pageW = (w - spineW) / 2
  const head = 44
  const colBlock = 20 + PIPE_ROWS * PIPE_ROW_H
  const h = head + colBlock * 2 + 16
  const buf: Buf = { ops: [], hits: [] }

  buf.ops.push({ op: 'FILL', x, y, w, h, color: FIELD })
  rect(buf, x, y, w, h, PAPER, 1)
  rect(buf, x + 2, y + 2, w - 4, h - 4, RULE, 1)

  buf.ops.push({
    op: 'GLYPH',
    x: x + 10,
    y: y + 14,
    text: `PIPE // ${doc.pipeName}`,
    color: PAPER,
    font: FONT_LG,
    baseline: 'middle',
  })
  buf.hits.push({ kind: 'ORGAN', x, y, w, h: 24, z: 15, payload: 'PIPE' })
  buf.hits.push({ kind: 'PIPE', x, y, w, h, z: 4, payload: 'PIPE' })

  buf.ops.push({
    op: 'GLYPH',
    x: x + 10,
    y: y + 32,
    text: '[ FOCUS ]',
    color: COBALT,
    font: FONT_SM,
    baseline: 'middle',
  })
  buf.ops.push({
    op: 'GLYPH',
    x: x + pageW + spineW + 10,
    y: y + 32,
    text: '[ GATEWAY ]',
    color: COBALT,
    font: FONT_SM,
    baseline: 'middle',
  })

  const spineX = x + pageW
  buf.ops.push({
    op: 'LINE',
    x1: spineX + spineW / 2 - 2,
    y1: y + 28,
    x2: spineX + spineW / 2 - 2,
    y2: y + h - 8,
    color: COBALT,
    width: 1,
  })
  buf.ops.push({
    op: 'LINE',
    x1: spineX + spineW / 2 + 2,
    y1: y + 28,
    x2: spineX + spineW / 2 + 2,
    y2: y + h - 8,
    color: COBALT,
    width: 1,
  })
  for (let i = 0; i < 3; i++) {
    const ry = y + 70 + i * 70
    buf.ops.push({
      op: 'GLYPH',
      x: spineX + spineW / 2,
      y: ry,
      text: 'O',
      color: COBALT,
      font: FONT_LG,
      align: 'center',
      baseline: 'middle',
    })
    buf.hits.push({
      kind: 'RING',
      x: spineX + 4,
      y: ry - 10,
      w: spineW - 8,
      h: 20,
      z: 18,
    })
  }

  let ly = y + head
  for (const col of LEFT_COLS) {
    ly = compileCol(buf, doc, session, col, x + 4, ly, pageW - 8, measure)
  }
  let ry = y + head
  for (const col of RIGHT_COLS) {
    ry = compileCol(buf, doc, session, col, x + pageW + spineW + 4, ry, pageW - 8, measure)
  }

  return { ops: buf.ops, hits: buf.hits, x, y, w, h: Math.max(h, ly - y, ry - y) }
}
