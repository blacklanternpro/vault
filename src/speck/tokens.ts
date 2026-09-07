/** VAULT desktop field. Black / paper / power red. */

export const FIELD = '#000000'
export const PAPER = '#F4F4F0'
export const POWER = '#E10600'
export const WHITE = '#FFFFFF'
export const URGENT = POWER
export const CANVAS = FIELD
export const RULE = 'rgba(244,244,240,0.18)'
export const RULE_DIM = 'rgba(244,244,240,0.08)'

export const FONT_HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif'

export function fontHelv(px: number, weight = 400): string {
  return `${weight} ${px}px ${FONT_HELV}`
}

export const PAINT_OPS = ['FILL', 'GLYPH', 'LINE', 'CHIP', 'STRIKE', 'STEM'] as const

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
])
