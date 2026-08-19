/** VAULT month field. Black / paper / cobalt. */

export const FIELD = '#000000'
export const PAPER = '#F4F4F0'
export const COBALT = '#0000FF'
export const WHITE = '#FFFFFF'
export const CANVAS = FIELD

export const FONT_HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif'

export function fontHelv(px: number, weight = 400): string {
  return `${weight} ${px}px ${FONT_HELV}`
}

export const PAINT_OPS = [
  'GLYPH',
  'INK',
  'STRIKE',
  'CHIP',
  'STEM',
  'SEAL',
  'DOCK',
  'GRAIN',
  'SCAN',
  'INV',
] as const

export const COMMAND_WORDS = new Set<string>([
  'HIT',
  'TYPE',
  'COMMIT',
  'SEE',
  'WORDS',
  'CLEAR',
  'DAY',
  'DOCK',
])
