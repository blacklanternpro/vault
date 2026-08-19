import type { HitBox, Layer, Measure, Now, Op, Program, Session } from './ir'
import { ageInDays, clockOf, longDate, slipNo } from './ir'
import { jitter } from './noise'
import {
  branchCount,
  counts,
  findNode,
  flatten,
  focusChain,
  parseTree,
  subtreeSize,
  type Node,
  type Row,
} from './tree'
import { COBALT, FIELD, INK, PAPER, URGENT, cobaltA, fontHelv, inkA } from './tokens'

export type World = {
  source: string
  session: Session
  now: Now
  width: number
  viewH: number
  caretOn: boolean
}

export const DOCK_LAYOUT = {
  h: 46,
  echoH: 18,
  inputY: 9,
  inputH: 28,
  caretW: 16,
  commitW: 26,
}

export const ROW_H = 40
export const STEP = 22
export const STALE_DAYS = 7

const SLIP_MAX = 520
const SLIP_GUTTER = 10
const PAD_X = 16
const TOP = 40
const BOTTOM_CLEAR = 76
const DOT_R = 3.2
const TEXT_DX = 17
const PLUS_W = 20
const KILL_W = 26
const VALUE_W = 46

const MAST_FONT = fontHelv(17, 700)
const META_FONT = fontHelv(9, 400)
const RULE_FONT = fontHelv(11, 400)
const LABEL_FONT = fontHelv(8, 700)
const ITEM_FONT = fontHelv(13, 400)
const ITEM_FONT_ROOT = fontHelv(13, 700)
const VALUE_FONT = fontHelv(10, 400)
const PLUS_FONT = fontHelv(13, 400)
const TOTAL_FONT = fontHelv(9, 700)
const FOOT_FONT = fontHelv(8, 400)
const STAMP_FONT = fontHelv(9, 700)

type Buf = {
  ops: Op[]
  hits: HitBox[]
}

type Geo = {
  row: Row
  y: number
  rowX: number
  dotX: number
  dotY: number
  textX: number
  valueRight: number
  plusX: number
  killX: number
  selected: boolean
}

function slipBox(width: number): { x: number; w: number } {
  const w = Math.min(SLIP_MAX, Math.max(240, width - SLIP_GUTTER * 2))
  return { x: (width - w) / 2, w }
}

/** A rule printed out of characters, the way the refs draw rules. */
function charRule(
  buf: Buf,
  measure: Measure,
  ch: string,
  x: number,
  y: number,
  w: number,
  color: string,
  font: string,
): void {
  const cw = measure(ch, font) || 4
  const n = Math.max(4, Math.floor(w / cw))
  buf.ops.push({
    op: 'GLYPH',
    x,
    y,
    text: ch.repeat(n),
    color,
    font,
    baseline: 'middle',
  })
}

function leaders(measure: Measure, from: number, to: number, font: string): string {
  const cw = measure('.', font) || 3
  const n = Math.floor(Math.max(0, to - from) / cw)
  return n > 1 ? '.'.repeat(n) : ''
}

function truncate(measure: Measure, text: string, font: string, maxW: number): string {
  if (measure(text, font) <= maxW) return text
  let cut = text
  while (cut.length > 1 && measure(`${cut}…`, font) > maxW) cut = cut.slice(0, -1)
  return `${cut}…`
}

function valueOf(node: Node, folded: boolean): { text: string; chip: boolean } {
  if (node.children.length > 0) {
    if (folded) return { text: `+${subtreeSize(node)}`, chip: false }
    const { done, total } = branchCount(node)
    return { text: `${done}/${total}`, chip: total > 0 && done === total }
  }
  if (node.done) return { text: node.at || '--:--', chip: false }
  return { text: '--,--', chip: false }
}

function isStale(node: Node, now: Now): boolean {
  if (node.done || node.children.length > 0 || !node.born) return false
  return ageInDays(node.born, now) > STALE_DAYS
}

function mastheadBlock(
  buf: Buf,
  measure: Measure,
  world: World,
  tree: Node[],
  x: number,
  w: number,
  y: number,
): number {
  const { now, session } = world
  const cx = x + w / 2

  buf.ops.push({
    op: 'GLYPH',
    x: cx,
    y,
    text: 'VAULT',
    color: INK,
    font: MAST_FONT,
    align: 'center',
    baseline: 'middle',
    track: 6,
    ghost: cobaltA(0.5),
    ghostDx: 1.5,
    ghostDy: -1,
  })
  y += 17

  buf.ops.push({
    op: 'GLYPH',
    x: cx,
    y,
    text: `${longDate(now)}   ${clockOf(now)}`,
    color: COBALT,
    font: META_FONT,
    align: 'center',
    baseline: 'middle',
    track: 1,
  })
  y += 14

  const chain = focusChain(tree, session.focus)
  if (chain.length) {
    const label = `VAULT / ${chain.map((n) => n.text).join(' / ')}`
    const shown = truncate(measure, label, META_FONT, w - PAD_X * 2)
    buf.ops.push({
      op: 'GLYPH',
      x: cx,
      y,
      text: shown,
      color: URGENT,
      font: META_FONT,
      align: 'center',
      baseline: 'middle',
      track: 0.6,
    })
    const pw = measure(shown, META_FONT)
    buf.hits.push({
      kind: 'PATH',
      x: cx - pw / 2 - 12,
      y: y - 12,
      w: pw + 24,
      h: 24,
      z: 40,
      payload: '',
    })
  } else {
    buf.ops.push({
      op: 'GLYPH',
      x: cx,
      y,
      text: `SLIP #${slipNo(now)}`,
      color: COBALT,
      font: META_FONT,
      align: 'center',
      baseline: 'middle',
      track: 1.4,
    })
  }
  return y + 14
}

function columnHead(buf: Buf, measure: Measure, x: number, w: number, y: number): number {
  charRule(buf, measure, ':', x + PAD_X, y, w - PAD_X * 2, cobaltA(0.9), RULE_FONT)
  y += 16
  buf.ops.push({
    op: 'GLYPH',
    x: x + PAD_X,
    y,
    text: 'ITEM',
    color: cobaltA(0.65),
    font: LABEL_FONT,
    baseline: 'middle',
    track: 1.4,
  })
  buf.ops.push({
    op: 'GLYPH',
    x: x + w - PAD_X - PLUS_W,
    y,
    text: 'TIME',
    color: cobaltA(0.65),
    font: LABEL_FONT,
    align: 'right',
    baseline: 'middle',
    track: 1.4,
  })
  return y + 12
}

function layout(rows: Row[], session: Session, x: number, w: number, top: number): Geo[] {
  return rows.map((row, i) => {
    const n = row.node
    const y = top + i * ROW_H
    const selected = session.selected === n.path
    const drift = jitter(n.seed, 1, 3.5)
    const rowX = x + PAD_X + n.depth * STEP + (n.depth > 0 ? drift : 0)
    const dotY = y + ROW_H / 2
    const killX = x + w - PAD_X - KILL_W
    const plusX = selected ? killX - PLUS_W - 2 : x + w - PAD_X - PLUS_W
    return {
      row,
      y,
      rowX,
      dotX: rowX + DOT_R + 1,
      dotY,
      textX: rowX + TEXT_DX,
      valueRight: plusX - 8,
      plusX,
      killX,
      selected,
    }
  })
}

function wirePass(buf: Buf, geos: Geo[]): void {
  const byPath = new Map<string, Geo>()
  for (const g of geos) byPath.set(g.row.node.path, g)

  for (const g of geos) {
    const parentPath = g.row.parentPath
    if (!parentPath) continue
    const parent = byPath.get(parentPath)
    if (!parent) continue
    const seed = g.row.node.seed
    // Keep the angle lively: a wire from far above starts closer rather than
    // dropping a near-vertical rail down the page.
    const startY = Math.max(parent.dotY + DOT_R + 3, g.dotY - ROW_H * 2.2)
    buf.ops.push({
      op: 'WIRE',
      x1: parent.dotX + jitter(seed, 2, 1.5),
      y1: startY,
      x2: g.dotX - DOT_R - 2,
      y2: g.dotY + jitter(seed, 3, 1),
      color: cobaltA(0.85),
      width: 1,
      seed,
    })
  }
}

function foldStub(buf: Buf, g: Geo): void {
  const seed = g.row.node.seed
  buf.ops.push({
    op: 'WIRE',
    x1: g.dotX + jitter(seed, 4, 1),
    y1: g.dotY + DOT_R + 3,
    x2: g.dotX + STEP * 0.62,
    y2: g.dotY + ROW_H * 0.42,
    color: cobaltA(0.4),
    width: 1,
    seed,
  })
}

function rowPass(
  buf: Buf,
  measure: Measure,
  geos: Geo[],
  world: World,
  x: number,
  w: number,
): void {
  const { session, now } = world
  for (const g of geos) {
    const n = g.row.node
    const font = n.depth === 0 ? ITEM_FONT_ROOT : ITEM_FONT
    const value = valueOf(n, g.row.folded)

    if (g.selected) {
      buf.ops.push({ op: 'FILL', x, y: g.y + 3, w, h: ROW_H - 6, color: COBALT })
    }
    if (g.row.folded) foldStub(buf, g)

    const armed = session.armed === n.path
    const dotColor = g.selected ? PAPER : COBALT
    buf.ops.push({
      op: 'DOT',
      cx: g.dotX,
      cy: g.dotY,
      r: DOT_R,
      color: dotColor,
      filled: n.done || armed,
      width: 1.4,
    })

    const textMax = g.valueRight - VALUE_W - g.textX - 6
    const shown = truncate(measure, n.text, font, Math.max(40, textMax))
    const textW = measure(shown, font)
    // settled work steps back so open work reads first
    const textColor = g.selected ? PAPER : n.done ? cobaltA(0.45) : COBALT
    buf.ops.push({
      op: 'GLYPH',
      x: g.textX,
      y: g.dotY,
      text: shown,
      color: textColor,
      font,
      baseline: 'middle',
      track: n.depth === 0 ? 0.3 : 0,
    })

    if (n.done) {
      buf.ops.push({
        op: 'HAND',
        x: g.textX,
        y: g.dotY,
        w: textW,
        color: URGENT,
        width: 1.6,
        seed: n.seed,
      })
    } else if (isStale(n, now)) {
      buf.ops.push({
        op: 'LINE',
        x1: g.textX,
        y1: g.dotY + 9,
        x2: g.textX + textW,
        y2: g.dotY + 9,
        color: URGENT,
        width: 1,
        dash: [2, 2],
      })
    }

    const dots = leaders(measure, g.textX + textW + 5, g.valueRight - VALUE_W, ITEM_FONT)
    if (dots) {
      buf.ops.push({
        op: 'GLYPH',
        x: g.textX + textW + 5,
        y: g.dotY,
        text: dots,
        color: g.selected ? 'rgba(244,244,240,0.5)' : cobaltA(0.28),
        font: ITEM_FONT,
        baseline: 'middle',
      })
    }

    if (value.chip) {
      const cw = measure(value.text, VALUE_FONT) + 10
      buf.ops.push({
        op: 'CHIP',
        x: g.valueRight - cw,
        y: g.dotY - 8,
        w: cw,
        h: 16,
        text: value.text,
        fg: g.selected ? COBALT : PAPER,
        bg: g.selected ? PAPER : COBALT,
        font: VALUE_FONT,
        padX: 5,
      })
    } else {
      buf.ops.push({
        op: 'GLYPH',
        x: g.valueRight,
        y: g.dotY,
        text: value.text,
        color: g.selected ? PAPER : cobaltA(0.75),
        font: VALUE_FONT,
        align: 'right',
        baseline: 'middle',
      })
    }

    buf.ops.push({
      op: 'GLYPH',
      x: g.plusX + PLUS_W / 2,
      y: g.dotY,
      text: '+',
      color: g.selected ? PAPER : armed ? COBALT : cobaltA(0.42),
      font: PLUS_FONT,
      align: 'center',
      baseline: 'middle',
    })

    if (g.selected) {
      buf.ops.push({
        op: 'GLYPH',
        x: g.killX + KILL_W / 2,
        y: g.dotY,
        text: '[X]',
        color: URGENT,
        font: VALUE_FONT,
        align: 'center',
        baseline: 'middle',
      })
      buf.hits.push({
        kind: 'KILL',
        x: g.killX - 2,
        y: g.y,
        w: KILL_W + 6,
        h: ROW_H,
        z: 40,
        payload: n.path,
      })
    }

    buf.hits.push({ kind: 'ROW', x, y: g.y, w, h: ROW_H, z: 10, payload: n.path })
    buf.hits.push({
      kind: 'DOT',
      x: g.rowX - 8,
      y: g.y,
      w: TEXT_DX + 8,
      h: ROW_H,
      z: 30,
      payload: n.path,
    })
    buf.hits.push({
      kind: 'PLUS',
      x: g.plusX - 4,
      y: g.y,
      w: PLUS_W + 8,
      h: ROW_H,
      z: 30,
      payload: n.path,
    })
    if (n.children.length > 0) {
      buf.hits.push({
        kind: 'RATIO',
        x: g.valueRight - VALUE_W,
        y: g.y,
        w: VALUE_W + 4,
        h: ROW_H,
        z: 25,
        payload: n.path,
      })
    }
  }
}

function totalBlock(
  buf: Buf,
  measure: Measure,
  tree: Node[],
  printed: Node[],
  x: number,
  w: number,
  y: number,
): number {
  const c = counts(printed.length ? printed : tree)
  charRule(buf, measure, '-', x + PAD_X, y, w - PAD_X * 2, inkA(0.45), RULE_FONT)
  y += 16

  const cells = [
    ['ITEMS', String(c.items)],
    ['SETTLED', String(c.settled)],
    ['OPEN', String(c.open)],
    ['DEPTH', String(c.depth)],
  ]
  const inner = w - PAD_X * 2
  const step = inner / cells.length
  cells.forEach(([label, value], i) => {
    const cellX = x + PAD_X + i * step
    buf.ops.push({
      op: 'GLYPH',
      x: cellX,
      y,
      text: label,
      color: cobaltA(0.5),
      font: LABEL_FONT,
      baseline: 'middle',
      track: 1,
    })
    buf.ops.push({
      op: 'GLYPH',
      x: cellX,
      y: y + 13,
      text: value,
      color: INK,
      font: TOTAL_FONT,
      baseline: 'middle',
    })
  })
  return y + 28
}

function legendBlock(buf: Buf, x: number, w: number, y: number): number {
  const items: [string, string, number[] | undefined][] = [
    ['OPEN', COBALT, undefined],
    ['SETTLED', URGENT, undefined],
    ['STALE', URGENT, [2, 2]],
  ]
  const inner = w - PAD_X * 2
  const step = inner / items.length
  items.forEach(([label, color, dash], i) => {
    const cellX = x + PAD_X + i * step
    buf.ops.push({
      op: 'GLYPH',
      x: cellX,
      y,
      text: label,
      color: inkA(0.5),
      font: FOOT_FONT,
      baseline: 'middle',
      track: 1,
    })
    buf.ops.push({
      op: 'LINE',
      x1: cellX + 44,
      y1: y,
      x2: cellX + 44 + 22,
      y2: y,
      color,
      width: 1.4,
      dash,
    })
  })
  return y + 22
}

function footerBlock(buf: Buf, x: number, w: number, y: number): number {
  const cx = x + w / 2
  buf.ops.push({
    op: 'GLYPH',
    x: cx,
    y,
    text: 'KEEP FOR YOUR RECORDS',
    color: inkA(0.45),
    font: FOOT_FONT,
    align: 'center',
    baseline: 'middle',
    track: 2.4,
  })
  y += 34
  buf.ops.push({
    op: 'STAMP',
    cx,
    cy: y,
    rx: 54,
    ry: 19,
    text: 'BAD FORM',
    font: STAMP_FONT,
    track: 3,
    color: COBALT,
    ghost: URGENT,
    angle: -0.05,
    alpha: 0.9,
    width: 1.2,
    seed: 0x8adf07,
  })
  return y + 30
}

function compileField(world: World, measure: Measure): Layer {
  const buf: Buf = { ops: [], hits: [] }
  const { x, w } = slipBox(world.width)
  const width = world.width
  const { session } = world

  const tree = parseTree(world.source)
  const focusNode = session.focus ? findNode(tree, session.focus) : null
  const printed = focusNode ? focusNode.children : tree
  const rows = flatten(printed, new Set(session.folded), focusNode ? focusNode.path : null)

  let y = TOP
  y = mastheadBlock(buf, measure, world, tree, x, w, y)
  y = columnHead(buf, measure, x, w, y)
  y += 10

  const rowsTop = y
  if (rows.length === 0) {
    buf.ops.push({
      op: 'GLYPH',
      x: x + PAD_X,
      y: y + 16,
      text: '_',
      color: cobaltA(0.8),
      font: ITEM_FONT_ROOT,
      baseline: 'middle',
    })
    y += 40
  } else {
    const geos = layout(rows, session, x, w, rowsTop)
    wirePass(buf, geos)
    rowPass(buf, measure, geos, world, x, w)
    y = rowsTop + rows.length * ROW_H
  }

  y += 14
  y = totalBlock(buf, measure, tree, printed, x, w, y)
  y = legendBlock(buf, x, w, y)
  y = footerBlock(buf, x, w, y)

  // Content clears the dock; the paper itself runs past it to the screen edge.
  const h = Math.max(y + BOTTOM_CLEAR, world.viewH)

  // Paper first, so everything above prints on it. The slip bleeds off both ends.
  buf.ops.unshift({ op: 'FILL', x, y: 0, w, h, color: PAPER })
  buf.ops.unshift({ op: 'FILL', x: 0, y: 0, w: width, h, color: FIELD })

  const c = counts(printed)
  if (c.items > 0 && c.open === 0) {
    buf.ops.push({
      op: 'STAMP',
      cx: x + w / 2,
      cy: rowsTop + (rows.length * ROW_H) / 2,
      rx: w * 0.4,
      ry: Math.max(56, w * 0.15),
      text: 'BAD FORM',
      font: fontHelv(Math.max(16, w * 0.055), 700),
      track: Math.max(5, w * 0.02),
      color: URGENT,
      ghost: COBALT,
      angle: -0.16,
      alpha: 0.18,
      width: 3,
      seed: 0x5e77_1ed,
    })
  }

  buf.hits.push({ kind: 'FIELD', x: 0, y: 0, w: width, h, z: 0 })

  return { ops: buf.ops, hits: buf.hits, h }
}

function compileDock(world: World, measure: Measure): Layer {
  const buf: Buf = { ops: [], hits: [] }
  const { session, width, caretOn, source } = world
  const { x, w } = slipBox(width)
  const echo = session.echo
  const top = echo ? DOCK_LAYOUT.echoH : 0
  const h = DOCK_LAYOUT.h + top

  buf.ops.push({ op: 'FILL', x: 0, y: 0, w: width, h, color: FIELD })

  if (echo) {
    const shown = truncate(measure, echo, META_FONT, w - 24)
    buf.ops.push({
      op: 'GLYPH',
      x: x + 4,
      y: 11,
      text: shown,
      color: session.undo ? URGENT : 'rgba(244,244,240,0.55)',
      font: META_FONT,
      baseline: 'middle',
    })
    if (session.undo) {
      buf.hits.push({ kind: 'UNDO', x: 0, y: 0, w: width, h: top + 4, z: 40 })
    }
  }

  buf.ops.push({
    op: 'LINE',
    x1: x + 4,
    y1: top + 2,
    x2: x + w - 4,
    y2: top + 2,
    color: cobaltA(0.55),
    width: 1,
  })

  // Cobalt on black is the one place this palette fails to read, so the dock
  // speaks in paper. Cobalt stays as the hairline and the armed marker.
  const inputY = top + DOCK_LAYOUT.inputY
  if (caretOn) {
    buf.ops.push({
      op: 'GLYPH',
      x: x + 4,
      y: inputY + 12,
      text: '>',
      color: PAPER,
      font: fontHelv(16, 700),
      baseline: 'middle',
    })
  }

  const armed = session.armed ? findNode(parseTree(source), session.armed) : null
  const placeholder = armed ? `+ under ${armed.text}` : 'item…'
  const shown = session.buffer
  buf.ops.push({
    op: 'GLYPH',
    x: x + DOCK_LAYOUT.caretW + 4,
    y: inputY + 12,
    text: shown || truncate(measure, placeholder, fontHelv(14, 400), w - 90),
    color: shown ? PAPER : armed ? 'rgba(244,244,240,0.6)' : 'rgba(244,244,240,0.34)',
    font: fontHelv(15, 400),
    baseline: 'middle',
  })

  buf.ops.push({
    op: 'GLYPH',
    x: x + w - 4,
    y: inputY + 12,
    text: '↵',
    color: shown ? PAPER : 'rgba(244,244,240,0.4)',
    font: fontHelv(15, 700),
    align: 'right',
    baseline: 'middle',
  })
  buf.hits.push({
    kind: 'COMMIT',
    x: x + w - DOCK_LAYOUT.commitW - 4,
    y: inputY,
    w: DOCK_LAYOUT.commitW + 8,
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
