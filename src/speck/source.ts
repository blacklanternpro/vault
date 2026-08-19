export const STORAGE_KEY = 'speck-month-v1'

export const DEFAULT_SOURCE = ''

export function quote(text: string): string {
  return `"${text.replace(/"/g, '')}"`
}

export function appendDayNote(source: string, date: string, text: string): string {
  const line = `DAY ${date} ${quote(text)}`
  const trimmed = source.replace(/\r\n/g, '\n').trim()
  if (!trimmed) return line
  return `${trimmed}\n${line}`
}

export function loadSource(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored != null) return stored
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
