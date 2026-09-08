export type Measure = (text: string, font: string) => number

export const ORGAN_NAMES = ['PIPE', 'NEST', 'DUMP', 'SEAL', 'SKULL', 'CAL'] as const
export type OrganName = (typeof ORGAN_NAMES)[number]

export function isOrganName(value: string): value is OrganName {
  return (ORGAN_NAMES as readonly string[]).includes(value)
}

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
  | {
      op: 'GRAIN'
      x: number
      y: number
      w: number
      h: number
      amount: number
    }
  | {
      op: 'SCAN'
      x: number
      y: number
      w: number
      h: number
      amount: number
    }
  | {
      op: 'INV'
    }
  | {
      op: 'OVAL'
      x: number
      y: number
      w: number
      h: number
      color: string
      width: number
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
  | 'DAY'
  | 'LEGEND'
  | 'LENS'
  | 'CAL'
  | 'SEAL'
  | 'SKULL'

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

export type DockInput = {
  x: number
  y: number
  w: number
  h: number
}

export type Program = {
  field: Layer
  dock: Layer
  editBox: EditBox | null
  dockInput: DockInput
  grain: number
  scan: number
  inv: boolean
}

export type Selected =
  | { kind: 'PIPE' }
  | { kind: 'COL'; col: string }
  | { kind: 'NODE'; id: number }
  | { kind: 'NEST' }
  | { kind: 'DUMP' }
  | { kind: 'NOTE'; index: number }
  | { kind: 'SEAL' }
  | { kind: 'SKULL' }
  | { kind: 'CAL' }

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
  find: string | null
  calDay: string | null
}

export function matchesFind(session: Session, title: string): boolean {
  const q = session.find?.trim()
  if (!q) return false
  return title.toLowerCase().includes(q.toLowerCase())
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

export function nowOf(d = new Date()): Now {
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() }
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
