import type { HitBox, Op, Session } from '../ir'
import { placeOf, type Doc } from '../doc'
import { CHROME_PAD, paintChrome, type Buf } from './chrome'
import { PAPER, POWER, fontDisplay } from '../tokens'

function ovalLines(buf: Buf, cx: number, cy: number, rx: number, ry: number, color: string, steps = 48) {
  let px = cx + rx
  let py = cy
  for (let i = 1; i <= steps; i++) {
    const a = (i / steps) * Math.PI * 2
    const nx = cx + Math.cos(a) * rx
    const ny = cy + Math.sin(a) * ry
    buf.ops.push({ op: 'LINE', x1: px, y1: py, x2: nx, y2: ny, color, width: 1 })
    px = nx
    py = ny
  }
}

export function compileSeal(
  doc: Doc,
  session: Session,
  fieldW: number,
): { ops: Op[]; hits: HitBox[]; x: number; y: number; w: number; h: number } {
  const origin = placeOf(doc, 'SEAL')
  const x = origin.x
  const y = origin.y
  const w = Math.max(180, Math.min(240, fieldW - x - 16))
  const collapsed = session.collapsed.includes('SEAL')
  const buf: Buf = { ops: [], hits: [] }
  const live = session.selected?.kind === 'SEAL'

  if (collapsed) {
    const h = CHROME_PAD + 4
    paintChrome(buf, { x, y, w, h, title: 'SEAL', organ: 'SEAL', count: 0, live, scan: doc.scan })
    return { ops: buf.ops, hits: buf.hits, x, y, w, h }
  }

  const h = CHROME_PAD + 186
  paintChrome(buf, { x, y, w, h, title: 'SEAL', organ: 'SEAL', count: 0, live, scan: doc.scan })
  buf.hits.push({ kind: 'SEAL', x, y, w, h, z: 4 })

  const cx = x + w / 2
  const cy = y + CHROME_PAD + 72
  const rx = 52
  const ry = 52
  ovalLines(buf, cx, cy, rx, ry, PAPER, 56)
  ovalLines(buf, cx, cy, rx * 0.55, ry, PAPER, 40)
  ovalLines(buf, cx, cy, rx, ry * 0.4, PAPER, 40)
  buf.ops.push({ op: 'LINE', x1: cx, y1: cy - ry, x2: cx, y2: cy + ry, color: PAPER, width: 1 })
  buf.ops.push({ op: 'LINE', x1: cx - rx, y1: cy, x2: cx + rx, y2: cy, color: POWER, width: 1 })
  for (let i = 0; i < 12; i++) {
    const a = -Math.PI / 2 + (i / 12) * Math.PI * 2
    const inner = i % 2 === 0 ? 60 : 56
    const outer = i % 2 === 0 ? 70 : 64
    buf.ops.push({
      op: 'LINE',
      x1: cx + Math.cos(a) * inner,
      y1: cy + Math.sin(a) * inner,
      x2: cx + Math.cos(a) * outer,
      y2: cy + Math.sin(a) * outer,
      color: i % 3 === 0 ? POWER : PAPER,
      width: 1,
    })
  }
  buf.ops.push({
    op: 'OVAL',
    x: cx - rx,
    y: cy - ry,
    w: rx * 2,
    h: ry * 2,
    color: PAPER,
    width: 1,
  })
  buf.ops.push({
    op: 'GLYPH',
    x: cx,
    y: y + h - 22,
    text: 'VAULT WORLDWIDE',
    color: PAPER,
    font: fontDisplay(13, 700),
    align: 'center',
    baseline: 'middle',
    track: 1,
  })

  return { ops: buf.ops, hits: buf.hits, x, y, w, h }
}
