import { SEED_SOURCE } from './doc'

export const STORAGE_KEY = 'speck-os-v2'

export function loadSource(): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored != null && stored.trim()) return stored
  } catch {
    /* private mode */
  }
  return SEED_SOURCE
}

export function saveSource(source: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, source)
  } catch {
    /* quota / private mode */
  }
}
