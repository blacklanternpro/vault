/** VAULT desktop field. Black / paper / cobalt. */

export const FIELD = '#000000'
export const PAPER = '#F4F4F0'
export const COBALT = '#0000FF'
export const WHITE = '#FFFFFF'
export const URGENT = '#FF2B2B'
export const CANVAS = FIELD
export const RULE = 'rgba(244,244,240,0.18)'

export const FONT_HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif'

export function fontHelv(px: number, weight = 400): string {
  return `${weight} ${px}px ${FONT_HELV}`
}

export const PAINT_OPS = ['FILL', 'GLYPH', 'LINE', 'CHIP', 'STRIKE', 'STEM'] as const

export const COL_ORDER = ['backlog', 'active', 'staging', 'done'] as const
export type ColName = (typeof COL_ORDER)[number]

export const COMMAND_WORDS = new Set<string>([
  'HIT',
  'TYPE',
  'COMMIT',
  'SEE',
  'WORDS',
  'CLEAR',
  'SHOVEL',
  'CLIP',
  'MOVE',
  'STRIKE',
  'TASK',
  'STEM',
  'NOTE',
  'PIPE',
  'NEST',
  'DUMP',
  'PLACE',
  'GLYPH',
  'COL',
  'DOCK',
])
