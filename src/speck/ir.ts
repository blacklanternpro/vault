export type Measure = (text: string, font: string) => number

export type OrganName = 'PIPE' | 'NEST' | 'DUMP'

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
  | {
      op: 'STEM'
      x: number
      y: number
      text: string
      color: string
      font: string
    }

export type HitKind =
  | 'PIPE'
  | 'COL'
  | 'TASK'
  | 'NEST'
  | 'STEM'
  | 'DUMP'
  | 'NOTE'
  | 'SHOVEL'
  | 'CLIP'
  | 'RING'
  | 'ORGAN'
  | 'GLYPH'
  | 'FIELD'
  | 'COMMIT'
  | 'DOCK'

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

export type Selected =
  | { kind: 'PIPE' }
  | { kind: 'COL'; col: string }
  | { kind: 'TASK'; id: number }
  | { kind: 'NEST' }
  | { kind: 'STEM'; path: string }
  | { kind: 'DUMP' }
  | { kind: 'NOTE'; index: number }

export type Session = {
  selected: Selected | null
  overlay: boolean
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

export function hitTest(hits: HitBox[], x: number, y: number): HitBox | null {
  let best: HitBox | null = null
  for (const h of hits) {
    if (x < h.x || y < h.y || x > h.x + h.w || y > h.y + h.h) continue
    if (!best || h.z >= best.z) best = h
  }
  return best
}
