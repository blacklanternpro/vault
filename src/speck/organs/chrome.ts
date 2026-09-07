import type { HitBox, Op, OrganName } from '../ir'
import { FIELD, PAPER, POWER, RULE, RULE_DIM, WHITE, fontHelv } from '../tokens'

export const CHROME_HEAD = 22
export const CHROME_TICKS = 8
export const CHROME_PAD = CHROME_HEAD + CHROME_TICKS

const FONT_LG = fontHelv(13, 700)
const FONT_SM = fontHelv(11, 400)

export type Buf = { ops: Op[]; hits: HitBox[] }

export function rect(buf: Buf, x: number, y: number, w: number, h: number, color: string, width = 1) {
  buf.ops.push({ op: 'LINE', x1: x, y1: y, x2: x + w, y2: y, color, width })
  buf.ops.push({ op: 'LINE', x1: x + w, y1: y, x2: x + w, y2: y + h, color, width })
  buf.ops.push({ op: 'LINE', x1: x + w, y1: y + h, x2: x, y2: y + h, color, width })
  buf.ops.push({ op: 'LINE', x1: x, y1: y + h, x2: x, y2: y, color, width })
}

function octagon(buf: Buf, cx: number, cy: number, r: number, color: string) {
  const pts: [number, number][] = []
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 8) + (i * Math.PI) / 4
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)])
  }
  for (let i = 0; i < 8; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % 8]
    buf.ops.push({ op: 'LINE', x1: a[0], y1: a[1], x2: b[0], y2: b[1], color, width: 1 })
  }
}

function salt(buf: Buf, x: number, y: number, w: number, h: number) {
  const dots: [number, number][] = [
    [3, 3],
    [w - 5, 4],
    [8, h - 4],
    [w - 11, h - 7],
    [14, 9],
  ]
  for (const [dx, dy] of dots) {
    buf.ops.push({
      op: 'FILL',
      x: x + dx,
      y: y + dy,
      w: 1,
      h: 1,
      color: 'rgba(225,6,0,0.45)',
    })
  }
}

export function paintChrome(
  buf: Buf,
  spec: {
    x: number
    y: number
    w: number
    h: number
    title: string
    organ: OrganName
    count: number
    live: boolean
  },
): number {
  const { x, y, w, h, title, organ, count, live } = spec
  buf.ops.push({ op: 'FILL', x, y, w, h, color: FIELD })
  rect(buf, x, y, w, h, PAPER, 1)
  rect(buf, x + 2, y + 2, w - 4, h - 4, RULE, 1)
  salt(buf, x, y, w, h)

  buf.ops.push({
    op: 'GLYPH',
    x: x + 10,
    y: y + 12,
    text: title,
    color: PAPER,
    font: FONT_LG,
    baseline: 'middle',
  })
  buf.hits.push({ kind: 'ORGAN', x, y, w: w - 72, h: CHROME_HEAD, z: 15, payload: organ })

  if (count > 0) {
    const cx = x + w - 58
    const cy = y + 11
    octagon(buf, cx, cy, 8, live ? POWER : PAPER)
    buf.ops.push({
      op: 'GLYPH',
      x: cx,
      y: cy,
      text: String(count),
      color: live ? POWER : PAPER,
      font: FONT_SM,
      align: 'center',
      baseline: 'middle',
    })
  }

  buf.ops.push({
    op: 'GLYPH',
    x: x + w - 28,
    y: y + 12,
    text: '···',
    color: RULE,
    font: FONT_SM,
    align: 'center',
    baseline: 'middle',
  })
  buf.hits.push({
    kind: 'RING',
    x: x + w - 40,
    y: y + 2,
    w: 16,
    h: 18,
    z: 22,
    payload: organ,
  })

  const xColor = live ? POWER : PAPER
  buf.ops.push({
    op: 'GLYPH',
    x: x + w - 12,
    y: y + 12,
    text: '[x]',
    color: xColor,
    font: FONT_SM,
    align: 'center',
    baseline: 'middle',
  })
  buf.hits.push({
    kind: 'CLOSE',
    x: x + w - 26,
    y: y + 2,
    w: 22,
    h: 18,
    z: 24,
    payload: organ,
  })

  const tickY = y + CHROME_HEAD
  buf.ops.push({
    op: 'LINE',
    x1: x + 6,
    y1: tickY,
    x2: x + w - 6,
    y2: tickY,
    color: RULE,
    width: 1,
  })
  for (let t = 0; t < w - 16; t += 6) {
    const len = t % 36 === 0 ? 6 : t % 18 === 0 ? 4 : 2
    const color = live && t % 36 === 0 ? POWER : RULE
    buf.ops.push({
      op: 'LINE',
      x1: x + 8 + t,
      y1: tickY,
      x2: x + 8 + t,
      y2: tickY + len,
      color,
      width: 1,
    })
  }

  return y + CHROME_PAD
}

export { WHITE, RULE_DIM }
