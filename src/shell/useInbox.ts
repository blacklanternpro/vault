import { useCallback, useEffect, useState } from 'react'

/*
 * The agent inbox: reports left for VAULT by something outside it — a
 * bookmarklet, the MCP server, a script — as a JSON array under one
 * localStorage key. VAULT reads it on load, whenever another tab writes it
 * (`storage`), whenever something in this tab says it did
 * (`window.dispatchEvent(new Event('vault:inbox'))`), and whenever the tab
 * comes back into view. An entry is removed once it is applied or dismissed.
 * The format is documented in README.md under "For agents".
 */

export const INBOX_KEY = 'vault:inbox'
export const INBOX_EVENT = 'vault:inbox'

export type InboxEntry = {
  /** When it was left, ms since epoch. */
  at: number
  /** The task it is for, when the sender knew. */
  taskId?: number
  /** The report, in the shape "Report back" asks for. */
  text: string
}

const MAX_ENTRIES = 50

export function readInbox(): InboxEntry[] {
  try {
    const raw = window.localStorage.getItem(INBOX_KEY)
    if (!raw) return []
    const list: unknown = JSON.parse(raw)
    if (!Array.isArray(list)) return []
    const out: InboxEntry[] = []
    for (const item of list) {
      if (!item || typeof item !== 'object') continue
      const e = item as Record<string, unknown>
      if (typeof e.text !== 'string' || !e.text.trim()) continue
      const at = typeof e.at === 'number' && Number.isFinite(e.at) && e.at > 0 ? Math.round(e.at) : 0
      const entry: InboxEntry = { at, text: e.text }
      if (typeof e.taskId === 'number' && Number.isInteger(e.taskId) && e.taskId > 0) entry.taskId = e.taskId
      out.push(entry)
    }
    return out.slice(-MAX_ENTRIES)
  } catch {
    return []
  }
}

function sameEntry(a: InboxEntry, b: InboxEntry): boolean {
  return a.at === b.at && a.text === b.text && a.taskId === b.taskId
}

/** Takes one entry out of the inbox. Anything left there by then stays. */
export function removeFromInbox(entry: InboxEntry): void {
  try {
    const rest = readInbox().filter((e) => !sameEntry(e, entry))
    if (rest.length) window.localStorage.setItem(INBOX_KEY, JSON.stringify(rest))
    else window.localStorage.removeItem(INBOX_KEY)
  } catch {
    /* nothing to take it out of */
  }
}

export function useInbox(): { entries: InboxEntry[]; remove: (entry: InboxEntry) => void } {
  const [entries, setEntries] = useState<InboxEntry[]>(readInbox)

  useEffect(() => {
    const refresh = () => setEntries(readInbox())
    const onStorage = (e: StorageEvent) => {
      if (e.key === INBOX_KEY || e.key === null) refresh()
    }
    const onVisible = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener(INBOX_EVENT, refresh)
    window.addEventListener('focus', refresh)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(INBOX_EVENT, refresh)
      window.removeEventListener('focus', refresh)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  const remove = useCallback((entry: InboxEntry) => {
    removeFromInbox(entry)
    setEntries(readInbox())
  }, [])

  return { entries, remove }
}
