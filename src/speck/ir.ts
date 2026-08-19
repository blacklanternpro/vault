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

export type HitKind = 'INV' | 'COMMIT' | 'DOCK' | 'MARK'

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
  inv: boolean
  buffer: string
  echo: string | null
}

export function hitTest(hits: HitBox[], x: number, y: number): HitBox | null {
  let best: HitBox | null = null
  for (const h of hits) {
    if (x < h.x || y < h.y || x > h.x + h.w || y > h.y + h.h) continue
    if (!best || h.z >= best.z) best = h
  }
  return best
}
