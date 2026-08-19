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
    }
  | {
      op: 'STRIKE'
      x: number
      y: number
      w: number
      thick: number
      color: string
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
    }
  | { op: 'SEAL'; x: number; y: number; w: number }
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
  | { op: 'GRAIN' }
  | { op: 'SCAN' }
  | { op: 'INV' }

export type HitKind = 'DAY' | 'FIELD' | 'COMMIT' | 'DOCK'

export type HitBox = {
  kind: HitKind
  x: number
  y: number
  w: number
  h: number
  z: number
  payload?: string | number
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
  selectedDay: number | null
  notesOpen: boolean
  buffer: string
  echo: string | null
}

export type Now = {
  year: number
  month: number
  day: number
}

export function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n)
}

export function tapeDate(year: number, month: number, day: number): string {
  return `${pad2(month + 1)}.${pad2(day)}.${String(year).slice(-2)}`
}

export function monthLength(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function hitTest(hits: HitBox[], x: number, y: number): HitBox | null {
  let best: HitBox | null = null
  for (const h of hits) {
    if (x < h.x || y < h.y || x > h.x + h.w || y > h.y + h.h) continue
    if (!best || h.z >= best.z) best = h
  }
  return best
}
