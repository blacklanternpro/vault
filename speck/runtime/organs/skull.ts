import type { HitBox, Op, Session } from '../ir'
import { placeOf, type Doc } from '../doc'
import { CHROME_PAD, paintChrome, type Buf } from './chrome'
import { PAPER, POWER } from '../tokens'

const MAP = [
  '    ######    ',
  '  ##########  ',
  ' ############ ',
  '##############',
  '##  ####  ####',
  '##  ####  ####',
  '##############',
  '##############',
  ' ### ###### ##',
  '  ##  ##  ##  ',
  '   ########   ',
  '   #  ##  #   ',
  '   ##    ##   ',
  '    #    #    ',
  '    ######    ',
  '     ####     ',
]

export function compileSkull(
  doc: Doc,
  session: Session,
  fieldW: number,
): { ops: Op[]; hits: HitBox[]; x: number; y: number; w: number; h: number } {
  const origin = placeOf(doc, 'SKULL')
  const x = origin.x
  const y = origin.y
  const w = Math.max(160, Math.min(220, fieldW - x - 16))
  const collapsed = session.collapsed.includes('SKULL')
  const buf: Buf = { ops: [], hits: [] }
  const live = session.selected?.kind === 'SKULL'

  if (collapsed) {
    const h = CHROME_PAD + 4
    paintChrome(buf, { x, y, w, h, title: 'SKULL', organ: 'SKULL', count: 0, live, scan: doc.scan })
    return { ops: buf.ops, hits: buf.hits, x, y, w, h }
  }

  const cell = 7
  const mapW = MAP[0].length * cell
  const mapH = MAP.length * cell
  const h = CHROME_PAD + mapH + 28
  paintChrome(buf, { x, y, w, h, title: 'SKULL', organ: 'SKULL', count: 0, live, scan: doc.scan })
  buf.hits.push({ kind: 'SKULL', x, y, w, h, z: 4 })

  const ox = x + Math.floor((w - mapW) / 2)
  const oy = y + CHROME_PAD + 10
  for (let r = 0; r < MAP.length; r++) {
    for (let c = 0; c < MAP[r].length; c++) {
      if (MAP[r][c] !== '#') continue
      buf.ops.push({
        op: 'FILL',
        x: ox + c * cell,
        y: oy + r * cell,
        w: cell - 1,
        h: cell - 1,
        color: r > 3 && r < 8 && (c < 4 || c > 9) ? POWER : PAPER,
      })
    }
  }

  return { ops: buf.ops, hits: buf.hits, x, y, w, h }
}
