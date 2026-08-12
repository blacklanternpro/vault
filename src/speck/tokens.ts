/** Locked VAULT tokens. SPECK does not invent color. */

export const CANVAS = '#F4F4F0'
export const INK = '#111111'
export const COBALT = '#0000FF'
export const URGENT = '#FF2B2B'

export const FONT_MONO = '"JetBrains Mono", ui-monospace, monospace'
export const FONT_NUM = '"Space Grotesk", "Helvetica Neue", sans-serif'

export function fontMono(px: number, weight = 400): string {
  return `${weight} ${px}px ${FONT_MONO}`
}

export function fontNum(px: number, weight = 300): string {
  return `${weight} ${px}px ${FONT_NUM}`
}

export const MONTHS = [
  'JAN',
  'FEB',
  'MAR',
  'APR',
  'MAY',
  'JUN',
  'JUL',
  'AUG',
  'SEP',
  'OCT',
  'NOV',
  'DEC',
] as const

export type MonthName = (typeof MONTHS)[number]

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

export const SOURCE_NOUNS = [
  'SEAL',
  'CAL',
  'DAY',
  'CHIP',
  'NEST',
  'STEM',
  'DUMP',
  'DOCK',
] as const

export const COMMAND_WORDS = new Set<string>([
  ...PAINT_OPS,
  ...SOURCE_NOUNS,
  'HIT',
  'TYPE',
  'COMMIT',
  'MO',
  'YR',
  'NAV',
  'SEE',
  'WORDS',
  'ATTACH',
  'P1',
  'P2',
  'P3',
  'URGENT',
])
