/** VAULT slip tokens. Paper is data, black is the machine, red is the hand. */

export const FIELD = '#000000'
export const PAPER = '#F4F4F0'
export const INK = '#111111'
export const COBALT = '#0000FF'
export const URGENT = '#FF2B2B'
export const CANVAS = FIELD

export const FONT_HELV = '"Helvetica Neue", Helvetica, Arial, sans-serif'

export function fontHelv(px: number, weight = 400): string {
  return `${weight} ${px}px ${FONT_HELV}`
}

/** cobalt at partial strength — for dim chrome that must stay on paper */
export function cobaltA(a: number): string {
  return `rgba(0,0,255,${a})`
}

export function inkA(a: number): string {
  return `rgba(17,17,17,${a})`
}

export const PAINT_OPS = [
  'STEM',
  'WIRE',
  'DOT',
  'HAND',
  'CHIP',
  'GLYPH',
  'RULE',
  'STAMP',
  'DOCK',
] as const

/** Whole-line words. A single word on its own line is a command; anything longer is a task. */
export const SOLO_WORDS = new Set<string>(['SEE', 'WORDS', 'CLEAR', 'WIPE', 'UNDO', 'OUT', 'COMMIT'])

/** Structural heads. These take arguments, so they stay commands even in a long line. */
export const HEAD_WORDS = new Set<string>(['STEM', 'HIT', 'TYPE', 'FOCUS'])
