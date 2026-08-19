import type { Session } from './ir'
import { DEFAULT_SOURCE } from './source'

/** Current program. Session INV is live chrome, not stored unless already in source. */
export function see(source: string, session: Session): string {
  const src = source.trim() ? source : DEFAULT_SOURCE
  if (session.inv && !/(^|\n)INV(\n|$)/.test(src)) return `${src.replace(/\s+$/, '')}\nINV`
  return src
}
