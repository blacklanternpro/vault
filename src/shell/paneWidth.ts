/*
 * The directory pane's width on a wide field, kept in localStorage so the
 * split comes back the way it was left.
 */

export const DIR_WIDTH_KEY = 'vault:dir-width'
export const DIR_MIN = 240
export const DIR_MAX = 520
export const DIR_DEFAULT = 320
/** How far an arrow key on the handle moves it. */
export const DIR_STEP = 16

export function clampDirWidth(n: number): number {
  if (!Number.isFinite(n)) return DIR_DEFAULT
  return Math.max(DIR_MIN, Math.min(DIR_MAX, Math.round(n)))
}

export function readDirWidth(): number {
  try {
    const raw = window.localStorage.getItem(DIR_WIDTH_KEY)
    return raw ? clampDirWidth(Number(raw)) : DIR_DEFAULT
  } catch {
    return DIR_DEFAULT
  }
}

export function writeDirWidth(width: number): void {
  try {
    window.localStorage.setItem(DIR_WIDTH_KEY, String(clampDirWidth(width)))
  } catch {
    /* no storage: the width lasts the session */
  }
}
