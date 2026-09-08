/** VAULT desktop field. Paper sheet / black windows / power red. */

export const FIELD = '#000000'
export const PAPER = '#F4F4F0'
export const POWER = '#E10600'
export const WHITE = '#FFFFFF'
export const URGENT = POWER
export const RULE = 'rgba(244,244,240,0.22)'
export const RULE_DIM = 'rgba(244,244,240,0.1)'
export const INK_RULE = 'rgba(0,0,0,0.22)'
export const INK_RULE_DIM = 'rgba(0,0,0,0.1)'

export const FONT_HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif'
export const FONT_OSWALD = '"Oswald", "Helvetica Neue", Helvetica, Arial, sans-serif'

export function fontHelv(px: number, weight = 400): string {
  return `${weight} ${px}px ${FONT_HELV}`
}

export function fontDisplay(px: number, weight = 700): string {
  return `${weight} ${px}px ${FONT_OSWALD}`
}

export function ground(inv: boolean): string {
  return inv ? PAPER : FIELD
}

export function ink(inv: boolean): string {
  return inv ? FIELD : PAPER
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

export const COL_ORDER = ['backlog', 'active', 'staging', 'done'] as const
export type ColName = (typeof COL_ORDER)[number]

export const NODE_STATUSES = ['backlog', 'active', 'staging', 'done', 'none'] as const
export type NodeStatus = (typeof NODE_STATUSES)[number]

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
