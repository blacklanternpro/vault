import type { EditBox, HitBox, Measure, Op, Program, Session } from './ir'
import { parseDoc } from './doc'
import { compileDump } from './organs/dump'
import { compileNest } from './organs/nest'
import { compilePipe, PIPE_ROWS } from './organs/pipe'
import { FIELD, PAPER, POWER, fontHelv } from './tokens'

export { PIPE_ROWS }

export type World = {
  source: string
  session: Session
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

const DOCK_FONT = fontHelv(14, 400)
const PAD = 16
const MAX_INNER = 1100

type Buf = { ops: Op[]; hits: HitBox[] }

function innerX(width: number): { x: number; w: number } {
  const w = Math.min(MAX_INNER, Math.max(200, width - PAD * 2))
  return { x: (width - w) / 2, w }
}

function compileField(world: World, measure: Measure, edit: { box: EditBox | null }) {
  const buf: Buf = { ops: [], hits: [] }
  const width = world.width
  const doc = parseDoc(world.source)
  const pipe = compilePipe(doc, world.session, measure, width, edit)
  const nest = compileNest(doc, world.session, width, edit)
  const dump = compileDump(doc, world.session, width)
  const glyphBottom = doc.glyphs.reduce((m, g) => Math.max(m, g.y + g.px), 0)
  const h = Math.max(world.viewH, pipe.y + pipe.h, nest.y + nest.h, dump.y + dump.h, glyphBottom + 24, 480)

  buf.ops.push({ op: 'FILL', x: 0, y: 0, w: width, h, color: FIELD })
  buf.hits.push({ kind: 'FIELD', x: 0, y: 0, w: width, h, z: 0 })
  buf.ops.push(...pipe.ops, ...nest.ops, ...dump.ops)
  buf.hits.push(...pipe.hits, ...nest.hits, ...dump.hits)

  for (const g of doc.glyphs) {
    buf.ops.push({
      op: 'GLYPH',
      x: g.x,
      y: g.y,
      text: g.text,
      color: PAPER,
      font: fontHelv(g.px, 400),
      baseline: 'middle',
    })
    buf.hits.push({
      kind: 'GLYPH',
      x: g.x - 8,
      y: g.y - g.px / 2,
      w: Math.max(24, measure(g.text, fontHelv(g.px, 400))),
      h: g.px,
      z: 30,
    })
  }

  return { ops: buf.ops, hits: buf.hits, h }
}

function placeholder(session: Session): string {
  if (session.pendingDump) return '↵ confirm · edit to reject'
  if (session.lens === 'dump') return 'note…'
  return 'operator…'
}

function compileDock(world: World): { ops: Op[]; hits: HitBox[]; h: number } {
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
    color: POWER,
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
      color: POWER,
      font: fontHelv(16, 400),
      baseline: 'middle',
    })
  }

  const shown = session.buffer
  buf.ops.push({
    op: 'GLYPH',
    x: x + DOCK_LAYOUT.caretW,
    y: inputY + 10,
    text: shown || placeholder(session),
    color: shown ? PAPER : 'rgba(244,244,240,0.28)',
    font: shown ? DOCK_FONT : fontHelv(13, 400),
    baseline: 'middle',
  })
  buf.ops.push({
    op: 'LINE',
    x1: x + DOCK_LAYOUT.caretW,
    y1: inputY + DOCK_LAYOUT.inputH - 4,
    x2: x + w - DOCK_LAYOUT.commitW,
    y2: inputY + DOCK_LAYOUT.inputH - 4,
    color: POWER,
    width: 1,
  })
  buf.ops.push({
    op: 'GLYPH',
    x: x + w,
    y: inputY + 10,
    text: '↵',
    color: POWER,
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
  const edit = { box: null as EditBox | null }
  return {
    field: compileField(world, measure, edit),
    dock: compileDock(world),
    editBox: edit.box,
  }
}
