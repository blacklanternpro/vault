import { DEFAULT_SOURCE } from './source'

export function see(source: string): string {
  const src = source.trim()
  return src ? src : DEFAULT_SOURCE
}
