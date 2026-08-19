export const STORAGE_KEY = 'speck-tree-v1'

export const DEFAULT_SOURCE = ''

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
