export type Measure = (text: string, font: string) => number

export type Op =
  | {
      op: 'GLYPH'
      x: number
      y: number
      text: string
      color: string
      font: string
      align?: CanvasTextAlign
      baseline?: CanvasTextBaseline
      track?: number
      /** riso mis-registration: ghost colour printed a hair off true */
      ghost?: string
      ghostDx?: number
      ghostDy?: number
    }
  | {
      op: 'CHIP'
      x: number
      y: number
      w: number
      h: number
      text: string
      fg: string
      bg: string
      font: string
      padX?: number
      align?: CanvasTextAlign
    }
  | {
      op: 'FILL'
      x: number
      y: number
      w: number
      h: number
      color: string
    }
  | {
      op: 'LINE'
      x1: number
      y1: number
      x2: number
      y2: number
      color: string
      width: number
      dash?: number[]
    }
  /** diagonal parent-to-child connector. No elbows. */
  | {
      op: 'WIRE'
      x1: number
      y1: number
      x2: number
      y2: number
      color: string
      width: number
      seed: number
    }
  | {
      op: 'DOT'
      cx: number
      cy: number
      r: number
      color: string
      filled: boolean
      width: number
    }
  /** hand-drawn strike: jittered, overshooting, slightly wrong on purpose */
  | {
      op: 'HAND'
      x: number
      y: number
      w: number
      color: string
      width: number
      seed: number
    }
  /** distorted oval stamp, printed with mis-registration */
  | {
      op: 'STAMP'
      cx: number
      cy: number
      rx: number
      ry: number
      text: string
      font: string
      track: number
      color: string
      ghost: string
      angle: number
      alpha: number
      width: number
      seed: number
    }

export type HitKind =
  | 'DOT'
  | 'ROW'
  | 'PLUS'
  | 'RATIO'
  | 'KILL'
  | 'PATH'
  | 'FIELD'
  | 'COMMIT'
  | 'DOCK'
  | 'UNDO'

export type HitBox = {
  kind: HitKind
  x: number
  y: number
  w: number
  h: number
  z: number
  payload?: string
}

export type Layer = {
  ops: Op[]
  hits: HitBox[]
  h: number
}

export type Program = {
  field: Layer
  dock: Layer
}

export type Session = {
  /** path of the selected row, if any */
  selected: string | null
  /** path armed as the parent for the next commit */
  armed: string | null
  /** paths whose children are folded away */
  folded: string[]
  /** path the slip is printed from, '' for the whole tree */
  focus: string
  /** one level of undo, armed by a kill */
  undo: { source: string; label: string } | null
  buffer: string
  echo: string | null
}

export type Now = {
  year: number
  month: number
  day: number
  hh: number
  mm: number
}

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

export function tapeDate(year: number, month: number, day: number): string {
  return `${pad2(month + 1)}.${pad2(day)}.${String(year).slice(-2)}`
}

export function clockOf(now: Now): string {
  return `${pad2(now.hh)}:${pad2(now.mm)}`
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

/** Wed 19 / 08 / 2026 */
export function longDate(now: Now): string {
  const d = new Date(now.year, now.month, now.day)
  return `${DAYS[d.getDay()]} ${pad2(now.day)} / ${pad2(now.month + 1)} / ${now.year}`
}

/** day of the year, zero padded — the slip number */
export function slipNo(now: Now): string {
  const start = Date.UTC(now.year, 0, 1)
  const here = Date.UTC(now.year, now.month, now.day)
  const n = Math.floor((here - start) / 86400000) + 1
  return String(n).padStart(4, '0')
}

/** days between a MM.DD.YY tape date and now. Negative or NaN reads as fresh. */
export function ageInDays(tape: string, now: Now): number {
  const parts = tape.split('.')
  if (parts.length !== 3) return 0
  const mm = Number(parts[0])
  const dd = Number(parts[1])
  const yy = Number(parts[2])
  if (!mm || !dd || Number.isNaN(yy)) return 0
  const born = Date.UTC(2000 + yy, mm - 1, dd)
  const here = Date.UTC(now.year, now.month, now.day)
  return Math.floor((here - born) / 86400000)
}

export function hitTest(hits: HitBox[], x: number, y: number): HitBox | null {
  let best: HitBox | null = null
  for (const h of hits) {
    if (x < h.x || y < h.y || x > h.x + h.w || y > h.y + h.h) continue
    if (!best || h.z >= best.z) best = h
  }
  return best
}
