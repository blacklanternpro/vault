/** VAULT dark studio. Charcoal / slate / highlighter. */

export const GROUND = '#111318'
export const PANEL = '#181b22'
export const CARD = '#22262f'
export const CARD_2 = '#2a2f3a'
export const INK = '#eeeae4'
export const MUTED = '#a8adb8'
export const HAIR = '#2c313c'
export const MARK = '#ff3355'
export const MARK_INK = '#14080a'

export const FIELD = GROUND
export const PAPER = GROUND
export const POWER = MARK
export const WHITE = '#FFFFFF'
export const URGENT = MARK
export const RULE = 'rgba(238,234,228,0.18)'
export const RULE_DIM = 'rgba(238,234,228,0.08)'
export const INK_RULE = 'rgba(0,0,0,0.22)'
export const INK_RULE_DIM = 'rgba(0,0,0,0.1)'

export const FONT_HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif'
export const FONT_OSWALD = FONT_HELV

export function fontHelv(px: number, weight = 400): string {
  return `${weight} ${px}px ${FONT_HELV}`
}

export function fontDisplay(px: number, weight = 700): string {
  return `${weight} ${px}px ${FONT_HELV}`
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
