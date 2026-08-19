export const STORAGE_KEY = 'speck-program'

export const DEFAULT_SOURCE = `SEAL reindustrialize
GRAIN
SCAN`

const TAIL = new Set(['GRAIN', 'SCAN', 'INV', 'DOCK'])
const MARKS = new Set(['GLYPH', 'CHIP', 'STEM'])

function headWord(line: string): string {
  return line.trim().split(/\s+/)[0]?.toUpperCase() ?? ''
}

function ensureTail(source: string): string {
  const rows = source.replace(/\r\n/g, '\n').split('\n')
  const heads = new Set(rows.map(headWord))
  if (!heads.has('GRAIN')) rows.push('GRAIN')
  if (!heads.has('SCAN')) rows.push('SCAN')
  return rows.join('\n')
}

export function quote(text: string): string {
  return `"${text.replace(/"/g, '')}"`
}

export function appendPaint(source: string, line: string): string {
  const rows = source.replace(/\r\n/g, '\n').split('\n')
  let i = rows.length
  while (i > 0 && TAIL.has(headWord(rows[i - 1]))) i -= 1
  while (i > 0 && rows[i - 1] === '') i -= 1
  rows.splice(i, 0, line)
  return ensureTail(rows.join('\n'))
}

export function setSeal(source: string, legend: string): string {
  const rows = source.replace(/\r\n/g, '\n').split('\n')
  const next = `SEAL ${legend || 'reindustrialize'}`
  const idx = rows.findIndex((r) => headWord(r) === 'SEAL')
  if (idx >= 0) rows[idx] = next
  else rows.unshift(next)
  return ensureTail(rows.join('\n'))
}

export function strikeLine(source: string, lineNo: number): string {
  const rows = source.replace(/\r\n/g, '\n').split('\n')
  const i = lineNo - 1
  if (i < 0 || i >= rows.length) return source
  const head = headWord(rows[i])
  if (!MARKS.has(head)) return source
  if (/\bSTRIKE\b/i.test(rows[i])) {
    rows[i] = rows[i].replace(/\s+STRIKE\b/i, '')
  } else {
    rows[i] = `${rows[i]} STRIKE`
  }
  return rows.join('\n')
}

export function strikeLast(source: string): string | null {
  const rows = source.replace(/\r\n/g, '\n').split('\n')
  for (let i = rows.length - 1; i >= 0; i--) {
    if (MARKS.has(headWord(rows[i]))) return strikeLine(source, i + 1)
  }
  return null
}

export function loadSource(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && stored.trim()) return stored
  } catch {
    /* private mode */
  }
  return DEFAULT_SOURCE
}

export function saveSource(source: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, source)
  } catch {
    /* quota / private mode */
  }
}
