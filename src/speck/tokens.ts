/** VAULT paste-up mechanical. Board / process black / non-repro blue / process red. */

export const GROUND = '#F2F0EA'
export const SHOP = '#E4E2DC'
export const PANEL = '#E8E4DC'
export const CARD = '#FAF8F3'
export const CARD_2 = '#F4F1EA'
export const INK = '#141414'
export const MUTED = '#3F3D3A'
export const HAIR = '#C4C0B8'
export const LIVE = '#ED1C24'
export const LIVE_INK = '#FAF8F3'
export const MARK = '#ED1C24'
export const MARK_INK = '#FAF8F3'
export const BLUE = '#2F5A72'

export const FIELD = GROUND
export const PAPER = GROUND
export const POWER = LIVE
export const WHITE = '#FFFFFF'
export const URGENT = MARK
export const RULE = 'rgba(20,20,20,0.16)'
export const RULE_DIM = 'rgba(20,20,20,0.08)'
export const INK_RULE = 'rgba(0,0,0,0.22)'
export const INK_RULE_DIM = 'rgba(0,0,0,0.1)'

export const FONT_HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif'
export const FONT_PLAQUE = '"Archivo Narrow", "Helvetica Neue", Helvetica, Arial, sans-serif'
export const FONT_OSWALD = FONT_PLAQUE

export function fontHelv(px: number, weight = 400): string {
  return `${weight} ${px}px ${FONT_HELV}`
}

export function fontDisplay(px: number, weight = 700): string {
  return `${weight} ${px}px ${FONT_PLAQUE}`
}

export function ground(_inv?: boolean): string {
  return GROUND
}

export function ink(_inv?: boolean): string {
  return INK
}

export const PAINT_OPS = [
  'FILL',
  'GLYPH',
  'LINE',
  'CHIP',
  'STRIKE',
  'STEM',
  'GRAIN',
  'SCAN',
  'INV',
  'OVAL',
] as const

export const COL_ORDER = ['pending', 'rnd', 'active', 'done', 'dusted'] as const
export type ColName = (typeof COL_ORDER)[number]

export const NODE_STATUSES = ['pending', 'rnd', 'active', 'done', 'dusted', 'none'] as const
export type NodeStatus = (typeof NODE_STATUSES)[number]

export const LANE_PLAQUE: Record<ColName, string> = {
  pending: 'PENDING',
  rnd: 'R&D',
  active: 'ACTIVE',
  done: 'DONE',
  dusted: 'DUSTED',
}

export function isBinderStatus(status: string): status is ColName {
  return (COL_ORDER as readonly string[]).includes(status)
}

export const COMMAND_WORDS = new Set<string>([
  'HIT',
  'TYPE',
  'COMMIT',
  'SEE',
  'WORDS',
  'CLEAR',
  'SHOVEL',
  'FOCUS',
  'MOVE',
  'STRIKE',
  'ADD',
  'DOCK',
  'FIND',
  'NOTE',
  'GLYPH',
])
