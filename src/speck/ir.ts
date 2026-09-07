export type Measure = (text: string, font: string) => number

export type OrganName = 'PIPE' | 'NEST' | 'DUMP'

export type FieldSlot = 'title' | 'body' | 'subtask' | 'status'

export type Lens = 'pipe' | 'nest' | 'dump' | 'field'

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
  | 'NODE'
  | 'NEST'
  | 'STEM'
  | 'DUMP'
  | 'NOTE'
  | 'SHOVEL'
  | 'ADD'
  | 'TOGGLE'
  | 'CLOSE'
  | 'STATUS'
  | 'SLOT'
  | 'EMPTY'
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

export type EditBox = {
  x: number
  y: number
  w: number
  h: number
  value: string
  placeholder: string
  slot: FieldSlot
}

export type Program = {
  field: Layer
  dock: Layer
  editBox: EditBox | null
}

export type Selected =
  | { kind: 'PIPE' }
  | { kind: 'COL'; col: string }
  | { kind: 'NODE'; id: number }
  | { kind: 'NEST' }
  | { kind: 'DUMP' }
  | { kind: 'NOTE'; index: number }

export type PendingDump = {
  kind: 'project'
  title: string
  children: string[]
} | {
  kind: 'tasks'
  titles: string[]
  parent: number | null
}

export type Session = {
  selected: Selected | null
  lens: Lens
  nestClosed: number[]
  pipeOpen: number | null
  nestFocus: number | null
  field: { id: number; slot: FieldSlot } | null
  fieldBuffer: string
  collapsed: OrganName[]
  draftId: number | null
  buffer: string
  echo: string | null
  pendingDump: PendingDump | null
}

export type Now = {
  year: number
  month: number
  day: number
}

export const FIELD_CYCLE: FieldSlot[] = ['title', 'body', 'subtask', 'status']

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

export function nextSlot(slot: FieldSlot, dir: 1 | -1): FieldSlot {
  const i = FIELD_CYCLE.indexOf(slot)
  const at = (i + dir + FIELD_CYCLE.length) % FIELD_CYCLE.length
  return FIELD_CYCLE[at]
}
