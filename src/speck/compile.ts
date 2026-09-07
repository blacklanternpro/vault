import type { DockInput, EditBox, HitBox, Measure, Op, Program, Session } from './ir'
import { parseDoc } from './doc'
import { nowOf } from './ir'
import { compileCal } from './organs/cal'
import { compileDump } from './organs/dump'
import { compileNest } from './organs/nest'
import { compilePipe, PIPE_ROWS } from './organs/pipe'
import { compileSeal } from './organs/seal'
import { compileSkull } from './organs/skull'
import { FIELD, INK_RULE, INK_RULE_DIM, PAPER, POWER, fontDisplay, fontHelv, ground, ink } from './tokens'

export { PIPE_ROWS }

export type World = {
  source: string
  session: Session
  width: number
  viewH: number
  caretOn: boolean
}

export const DOCK_LAYOUT = {
  legendH: 22,
  echoH: 16,
  inputY: 8,
  inputH: 36,
  caretW: 18,
  commitW: 28,
  pad: 10,
  h: 70,
}

const DOCK_FONT = fontHelv(18, 400)
const PAD = 16
const MAX_INNER = 1100

type Buf = { ops: Op[]; hits: HitBox[] }

function innerX(width: number): { x: number; w: number } {
  const w = Math.min(MAX_INNER, Math.max(200, width - PAD * 2))
  return { x: (width - w) / 2, w }
}

function registerMarks(buf: Buf, width: number, h: number, color: string) {
  const m = 12
  const len = 14
  const corners: [number, number, number, number][] = [
    [m, m, m + len, m],
    [m, m, m, m + len],
    [width - m, m, width - m - len, m],
    [width - m, m, width - m, m + len],
    [m, h - m, m + len, h - m],
    [m, h - m, m, h - m - len],
    [width - m, h - m, width - m - len, h - m],
    [width - m, h - m, width - m, h - m - len],
  ]
  for (const [x1, y1, x2, y2] of corners) {
    buf.ops.push({ op: 'LINE', x1, y1, x2, y2, color, width: 1 })
  }
  buf.ops.push({
    op: 'LINE',
    x1: m,
    y1: 36,
    x2: width - m,
    y2: 36,
    color: INK_RULE_DIM,
    width: 1,
    dash: [2, 6],
  })
}

function compileField(world: World, measure: Measure, edit: { box: EditBox | null }) {
  const buf: Buf = { ops: [], hits: [] }
  const width = world.width
  const doc = parseDoc(world.source)
  const now = nowOf()
  const sheet = ground(doc.inv)
  const mark = ink(doc.inv)
  const pipe = compilePipe(doc, world.session, measure, width, edit)
  const nest = compileNest(doc, world.session, width, edit)
  const dump = compileDump(doc, world.session, width)
  const seal = compileSeal(doc, world.session, width)
  const skull = compileSkull(doc, world.session, width)
  const cal = compileCal(doc, world.session, width, now)
  const glyphBottom = doc.glyphs.reduce((m, g) => Math.max(m, g.y + g.px), 0)
  const h = Math.max(
    world.viewH,
    pipe.y + pipe.h,
    nest.y + nest.h,
    dump.y + dump.h,
    seal.y + seal.h,
    skull.y + skull.h,
    cal.y + cal.h,
    glyphBottom + 24,
    480,
  )

  buf.ops.push({ op: 'FILL', x: 0, y: 0, w: width, h, color: sheet })
  if (doc.inv) buf.ops.push({ op: 'INV' })
  if (doc.grain > 0) buf.ops.push({ op: 'GRAIN', x: 0, y: 0, w: width, h, amount: doc.grain })
  if (doc.scan > 0) buf.ops.push({ op: 'SCAN', x: 0, y: 0, w: width, h: 8, amount: doc.scan })
  registerMarks(buf, width, h, mark)
  buf.ops.push({
    op: 'LINE',
    x1: pipe.x + pipe.w / 2,
    y1: 36,
    x2: pipe.x + pipe.w / 2,
    y2: pipe.y + pipe.h,
    color: INK_RULE,
    width: 1,
    dash: [4, 8],
  })
  buf.hits.push({ kind: 'FIELD', x: 0, y: 0, w: width, h, z: 0 })
  buf.ops.push(...pipe.ops, ...nest.ops, ...dump.ops, ...seal.ops, ...skull.ops, ...cal.ops)
  buf.hits.push(...pipe.hits, ...nest.hits, ...dump.hits, ...seal.hits, ...skull.hits, ...cal.hits)

  for (const g of doc.glyphs) {
    buf.ops.push({
      op: 'GLYPH',
      x: g.x,
      y: g.y,
      text: g.text,
      color: mark,
      font: fontDisplay(g.px, 700),
      baseline: 'middle',
      track: 1,
    })
    buf.hits.push({
      kind: 'GLYPH',
      x: g.x - 8,
      y: g.y - g.px / 2,
      w: Math.max(24, measure(g.text, fontDisplay(g.px, 700))),
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

function compileDock(world: World): { ops: Op[]; hits: HitBox[]; h: number; input: DockInput } {
  const buf: Buf = { ops: [], hits: [] }
  const { session, width, caretOn } = world
  const doc = parseDoc(world.source)
  const { x, w } = innerX(width)
  const echo = session.echo
  const legendH = DOCK_LAYOUT.legendH
  const top = legendH + (echo ? DOCK_LAYOUT.echoH : 0)
  const h = DOCK_LAYOUT.h + (echo ? DOCK_LAYOUT.echoH : 0)

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

  const materials: { word: string; live: boolean }[] = [
    { word: 'GRAIN', live: doc.grain > 0 },
    { word: 'SCAN', live: doc.scan > 0 },
    { word: 'INV', live: doc.inv },
    { word: 'OVAL', live: true },
  ]
  let lx = x
  for (const m of materials) {
    const tw = m.word.length * 8 + 10
    buf.ops.push({
      op: 'GLYPH',
      x: lx,
      y: 11,
      text: m.word,
      color: m.live ? POWER : 'rgba(244,244,240,0.35)',
      font: fontHelv(11, 700),
      baseline: 'middle',
      track: 1,
    })
    if (m.word !== 'OVAL') {
      buf.hits.push({ kind: 'LEGEND', x: lx - 2, y: 2, w: tw, h: 18, z: 20, payload: m.word })
    }
    lx += tw
  }
  buf.ops.push({
    op: 'GLYPH',
    x: lx + 4,
    y: 11,
    text: '· PIPE NEST DUMP SEAL SKULL CAL',
    color: 'rgba(244,244,240,0.45)',
    font: fontHelv(11, 400),
    baseline: 'middle',
  })
  const focus = session.nestFocus != null ? `FOCUS ${session.nestFocus}` : 'FOCUS _'
  buf.ops.push({
    op: 'GLYPH',
    x: x + w,
    y: 11,
    text: focus,
    color: session.nestFocus != null ? POWER : 'rgba(244,244,240,0.35)',
    font: fontHelv(11, 700),
    align: 'right',
    baseline: 'middle',
  })
  buf.ops.push({
    op: 'LINE',
    x1: 0,
    y1: legendH,
    x2: width,
    y2: legendH,
    color: 'rgba(244,244,240,0.18)',
    width: 1,
  })

  if (echo) {
    buf.ops.push({
      op: 'GLYPH',
      x,
      y: legendH + 10,
      text: echo,
      color: 'rgba(244,244,240,0.45)',
      font: fontHelv(12, 400),
      baseline: 'middle',
    })
  }

  const inputY = top + DOCK_LAYOUT.inputY
  if (caretOn) {
    buf.ops.push({
      op: 'GLYPH',
      x,
      y: inputY + 12,
      text: '>',
      color: POWER,
      font: fontDisplay(20, 700),
      baseline: 'middle',
    })
  }

  const shown = session.buffer
  buf.ops.push({
    op: 'GLYPH',
    x: x + DOCK_LAYOUT.caretW,
    y: inputY + 12,
    text: shown || placeholder(session),
    color: shown ? PAPER : 'rgba(244,244,240,0.28)',
    font: shown ? DOCK_FONT : fontHelv(16, 400),
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
    y: inputY + 12,
    text: '↵',
    color: POWER,
    font: fontHelv(16, 400),
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

  return {
    ops: buf.ops,
    hits: buf.hits,
    h,
    input: {
      x: x + DOCK_LAYOUT.caretW,
      y: inputY,
      w: w - DOCK_LAYOUT.caretW - DOCK_LAYOUT.commitW,
      h: DOCK_LAYOUT.inputH,
    },
  }
}

export function compile(world: World, measure: Measure): Program {
  const edit = { box: null as EditBox | null }
  const doc = parseDoc(world.source)
  const dock = compileDock(world)
  return {
    field: compileField(world, measure, edit),
    dock: { ops: dock.ops, hits: dock.hits, h: dock.h },
    editBox: edit.box,
    dockInput: dock.input,
    grain: doc.grain,
    scan: doc.scan,
    inv: doc.inv,
  }
}
