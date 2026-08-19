import type { HitBox, Layer, Measure, Op, Program, Session } from './ir'
import { parse, type Stmt } from './parse'
import { CANVAS, COBALT, INK, URGENT, fontMono } from './tokens'

export type World = {
  source: string
  session: Session
  clock: string
  width: number
  caretOn: boolean
}

export const DOCK_LAYOUT = {
  h: 92,
  echoH: 16,
  modeY: 16,
  inputY: 42,
  inputH: 28,
  caretW: 14,
  commitW: 28,
  pad: 12,
}

const PAD = 12
const MAX_INNER = 672

type Buf = {
  ops: Op[]
  hits: HitBox[]
}

type StemStmt = Extract<Stmt, { kind: 'STEM' }>

function innerX(width: number): { x: number; w: number } {
  const w = Math.min(MAX_INNER, Math.max(200, width - PAD * 2))
  return { x: (width - w) / 2, w }
}

function splice(buf: Buf, x: number, y: number, w: number): number {
  const n = Math.max(8, Math.floor(w / 7))
  buf.ops.push({
    op: 'GLYPH',
    x,
    y: y + 8,
    text: '*'.repeat(n),
    color: 'rgba(17,17,17,0.22)',
    font: fontMono(9, 400),
    baseline: 'middle',
    track: 1,
  })
  return y + 16
}

function wrap(measure: Measure, text: string, font: string, maxW: number): string[] {
  const paras = text.split('\n')
  const out: string[] = []
  for (const para of paras) {
    if (para === '') {
      out.push('')
      continue
    }
    const words = para.split(/\s+/)
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
  }
  return out.length ? out : ['_']
}

function stemPrefixes(stems: StemStmt[]): string[] {
  return stems.map((stem, i) => {
    const d = stem.indent
    if (d === 0) return ''
    let prefix = ''
    for (let depth = 1; depth < d; depth++) {
      let hasMore = false
      for (let j = i + 1; j < stems.length; j++) {
        if (stems[j].indent < depth) break
        if (stems[j].indent === depth) {
          hasMore = true
          break
        }
      }
      prefix += hasMore ? '│   ' : '    '
    }
    let last = true
    for (let j = i + 1; j < stems.length; j++) {
      if (stems[j].indent < d) break
      if (stems[j].indent === d) {
        last = false
        break
      }
    }
    return `${prefix}${last ? '└── ' : '├── '}`
  })
}

function markHit(buf: Buf, x: number, y: number, w: number, h: number, line: number): void {
  if (!line) return
  buf.hits.push({ kind: 'MARK', x, y, w, h, z: 10, payload: line })
}

function compileGlyph(
  buf: Buf,
  measure: Measure,
  x: number,
  y: number,
  w: number,
  stmt: Extract<Stmt, { kind: 'GLYPH' }>,
): number {
  const font = fontMono(13, 400)
  const lines = wrap(measure, stmt.text, font, w)
  const top = y
  for (const line of lines) {
    const tw = measure(line, font)
    buf.ops.push({
      op: 'GLYPH',
      x,
      y: y + 8,
      text: line,
      color: INK,
      font,
      baseline: 'middle',
    })
    if (stmt.strike) {
      buf.ops.push({ op: 'STRIKE', x, y: y + 8, w: tw, thick: 1.5, color: URGENT })
    }
    y += 18
  }
  markHit(buf, x, top, w, Math.max(18, y - top), stmt.line)
  return y + 2
}

function compileChip(
  buf: Buf,
  measure: Measure,
  x: number,
  y: number,
  w: number,
  stmt: Extract<Stmt, { kind: 'CHIP' }>,
): number {
  const font = fontMono(9, 800)
  const tw = measure(stmt.text, font)
  const cw = Math.min(w, Math.max(48, tw + 16))
  const ch = 16
  buf.ops.push({
    op: 'CHIP',
    x,
    y,
    w: cw,
    h: ch,
    text: stmt.text,
    fg: CANVAS,
    bg: COBALT,
    font,
  })
  if (stmt.strike) {
    buf.ops.push({ op: 'STRIKE', x, y: y + ch / 2, w: cw, thick: 2, color: URGENT })
  }
  markHit(buf, x, y, cw, ch, stmt.line)
  return y + 22
}

function compileStem(
  buf: Buf,
  measure: Measure,
  x: number,
  y: number,
  w: number,
  stmt: StemStmt,
  prefix: string,
): number {
  const lineH = 18
  const stemFont = fontMono(12, 400)
  const labelFont = fontMono(12, stmt.indent === 0 ? 800 : 400)
  const color = stmt.urgent ? URGENT : INK
  const sw = measure(prefix, stemFont)
  buf.ops.push({
    op: 'GLYPH',
    x,
    y: y + lineH / 2,
    text: prefix,
    color: 'rgba(17,17,17,0.35)',
    font: stemFont,
    baseline: 'middle',
  })
  buf.ops.push({
    op: 'GLYPH',
    x: x + sw,
    y: y + lineH / 2,
    text: stmt.text,
    color,
    font: labelFont,
    baseline: 'middle',
    track: stmt.indent === 0 ? 0.4 : 0,
  })
  if (stmt.strike) {
    const tw = measure(stmt.text, labelFont)
    buf.ops.push({
      op: 'STRIKE',
      x: x + sw,
      y: y + lineH / 2,
      w: tw,
      thick: 1.5,
      color: URGENT,
    })
  }
  markHit(buf, x, y, w, lineH, stmt.line)
  return y + lineH
}

function compileMarks(buf: Buf, stmts: Stmt[], measure: Measure, x: number, y: number, w: number): number {
  for (let i = 0; i < stmts.length; i++) {
    const stmt = stmts[i]
    if (stmt.kind === 'STEM') {
      const run: StemStmt[] = []
      while (i < stmts.length && stmts[i].kind === 'STEM') {
        run.push(stmts[i] as StemStmt)
        i += 1
      }
      i -= 1
      const prefixes = stemPrefixes(run)
      for (let k = 0; k < run.length; k++) {
        y = compileStem(buf, measure, x, y, w, run[k], prefixes[k])
      }
      y += 4
      continue
    }
    if (stmt.kind === 'GLYPH') y = compileGlyph(buf, measure, x, y, w, stmt)
    else if (stmt.kind === 'CHIP') y = compileChip(buf, measure, x, y, w, stmt)
  }
  return y
}

function compileField(world: World, measure: Measure): Layer {
  const buf: Buf = { ops: [], hits: [] }
  const { x, w } = innerX(world.width)
  const width = world.width

  buf.ops.push({ op: 'FILL', x: 0, y: 0, w: width, h: 8, color: CANVAS })

  buf.ops.push({
    op: 'GLYPH',
    x: width - PAD,
    y: 16,
    text: world.clock,
    color: COBALT,
    font: fontMono(10, 400),
    align: 'right',
    baseline: 'middle',
    track: 2,
  })
  const invW = 28
  const invX = width - PAD - 108 - invW
  if (world.session.inv) {
    buf.ops.push({
      op: 'CHIP',
      x: invX,
      y: 8,
      w: invW,
      h: 16,
      text: 'INV',
      fg: CANVAS,
      bg: COBALT,
      font: fontMono(10, 700),
    })
  } else {
    buf.ops.push({
      op: 'GLYPH',
      x: invX + invW,
      y: 16,
      text: 'INV',
      color: COBALT,
      font: fontMono(10, 700),
      align: 'right',
      baseline: 'middle',
      track: 1.6,
    })
  }
  buf.hits.push({ kind: 'INV', x: invX, y: 6, w: invW + 4, h: 20, z: 30 })

  const sealW = Math.min(240, width * 0.78)
  const sealX = (width - sealW) / 2
  const sealY = 28
  buf.ops.push({ op: 'SEAL', x: sealX, y: sealY, w: sealW })
  const sealH = (118 / 280) * sealW
  buf.ops.push({
    op: 'GLYPH',
    x: width / 2,
    y: sealY + sealH + 12,
    text: 'local_first // no_cloud',
    color: 'rgba(17,17,17,0.45)',
    font: fontMono(9, 400),
    align: 'center',
    baseline: 'middle',
    track: 2.8,
  })

  let y = sealY + sealH + 24
  y = splice(buf, x, y, w)

  const { stmts } = parse(world.source)
  y = compileMarks(buf, stmts, measure, x, y, w)

  y += 24
  buf.ops.push({ op: 'GRAIN' })
  buf.ops.push({ op: 'SCAN' })
  if (world.session.inv) buf.ops.push({ op: 'INV' })

  return { ops: buf.ops, hits: buf.hits, h: y }
}

function compileDock(world: World, measure: Measure): Layer {
  const buf: Buf = { ops: [], hits: [] }
  const { session, width, caretOn } = world
  const { x, w } = innerX(width)
  const echo = session.echo
  const top = echo ? DOCK_LAYOUT.echoH : 0
  const h = DOCK_LAYOUT.h + top

  buf.ops.push({ op: 'FILL', x: 0, y: 0, w: width, h, color: CANVAS })
  buf.ops.push({
    op: 'LINE',
    x1: 0,
    y1: 1,
    x2: width,
    y2: 1,
    color: COBALT,
    width: 2,
  })

  if (echo) {
    buf.ops.push({
      op: 'GLYPH',
      x,
      y: 10,
      text: echo,
      color: 'rgba(17,17,17,0.45)',
      font: fontMono(9, 400),
      baseline: 'middle',
      track: 0.8,
    })
  }

  const modeY = top + DOCK_LAYOUT.modeY
  buf.ops.push({
    op: 'GLYPH',
    x,
    y: modeY,
    text: 'SPECK',
    color: COBALT,
    font: fontMono(10, 800),
    baseline: 'middle',
    track: 1.6,
  })
  const modeW = measure('SPECK', fontMono(10, 800)) + 4 * 1.6
  buf.ops.push({
    op: 'GLYPH',
    x: x + modeW + 6,
    y: modeY,
    text: '//',
    color: 'rgba(17,17,17,0.3)',
    font: fontMono(10, 400),
    baseline: 'middle',
  })
  buf.ops.push({
    op: 'GLYPH',
    x: x + modeW + 22,
    y: modeY,
    text: 'field',
    color: COBALT,
    font: fontMono(10, 400),
    baseline: 'middle',
    track: 1.4,
  })

  const inputY = top + DOCK_LAYOUT.inputY
  if (caretOn) {
    buf.ops.push({
      op: 'GLYPH',
      x,
      y: inputY + 10,
      text: '>',
      color: COBALT,
      font: fontMono(16, 800),
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
      color: COBALT,
      font: fontMono(14, 700),
      baseline: 'middle',
    })
  } else {
    buf.ops.push({
      op: 'GLYPH',
      x: x + DOCK_LAYOUT.caretW,
      y: inputY + 10,
      text: 'speak speck…',
      color: 'rgba(0,0,255,0.35)',
      font: fontMono(13, 400),
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
    width: 2,
  })
  buf.ops.push({
    op: 'GLYPH',
    x: x + w,
    y: inputY + 10,
    text: '↵',
    color: COBALT,
    font: fontMono(14, 800),
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
    dock: compileDock(world, measure),
  }
}
