import { useCallback, useEffect, useRef, useState } from 'react'
import { newer, ping, pullDoc, pullInbox, pushDoc, readBridgeSettings, removeInbox, writeBridgeSettings, type BridgeSettings, type InboxEntry } from '../model/bridge'
import type { Doc } from '../model/types'

/*
 * Keeps the browser's board and the local agent bridge (`vault-agent serve`)
 * in step. The newer `savedAt` wins, both ways:
 *   - every local change is pushed (debounced); a 409 means an agent wrote
 *     first, and their doc is adopted;
 *   - the bridge is polled, and a newer doc there is adopted.
 * Adopted docs are handed to `adopt`, which must not put them on this tab's
 * undo stack (they are the agent's changes, not the person's).
 */

export type BridgeStatus = 'off' | 'connecting' | 'online' | 'offline'

type Options = {
  doc: Doc
  /** Take a doc that arrived from the bridge. */
  adopt: (doc: Doc) => void
  /** Tell the person something (a toast). */
  notify: (text: string) => void
}

const POLL_MS = 5000
const PUSH_DEBOUNCE_MS = 800

export function useBridge({ doc, adopt, notify }: Options) {
  const [settings, setSettingsState] = useState<BridgeSettings>(readBridgeSettings)
  const [status, setStatus] = useState<BridgeStatus>(settings.enabled ? 'connecting' : 'off')
  const [inbox, setInbox] = useState<InboxEntry[]>([])
  /** The JSON of the doc as the bridge last had it, so we neither push it back nor adopt it again. */
  const known = useRef<{ json: string; savedAt: number }>({ json: '', savedAt: 0 })
  const docRef = useRef(doc)
  docRef.current = doc
  const adoptRef = useRef(adopt)
  adoptRef.current = adopt
  const notifyRef = useRef(notify)
  notifyRef.current = notify
  const wasOnline = useRef(false)

  const setSettings = useCallback((next: BridgeSettings) => {
    writeBridgeSettings(next)
    setSettingsState(next)
    setStatus(next.enabled ? 'connecting' : 'off')
    if (!next.enabled) setInbox([])
  }, [])

  const take = useCallback((theirs: Doc, savedAt: number) => {
    known.current = { json: JSON.stringify(theirs), savedAt }
    if (known.current.json !== JSON.stringify(docRef.current)) adoptRef.current(theirs)
  }, [])

  // Connect, then poll.
  useEffect(() => {
    if (!settings.enabled) return
    let stopped = false
    const url = settings.url

    const online = () => {
      if (stopped) return
      setStatus('online')
      if (!wasOnline.current) {
        wasOnline.current = true
        notifyRef.current('Agent bridge connected')
      }
    }
    const offline = () => {
      if (stopped) return
      setStatus('offline')
      if (wasOnline.current) {
        wasOnline.current = false
        notifyRef.current("Agent bridge isn't answering; working locally")
      }
    }

    const sync = async (first: boolean) => {
      if (!(await ping(url))) return offline()
      try {
        const theirs = await pullDoc(url)
        const mineJson = JSON.stringify(docRef.current)
        if (first && known.current.savedAt === 0) {
          // First contact: whichever side has content wins; an empty bridge takes ours.
          if (theirs.doc.nodes.length === 0 || newer({ savedAt: Date.now() }, theirs) === 'mine') {
            const r = await pushDoc(url, docRef.current)
            if (r.ok) known.current = { json: mineJson, savedAt: r.savedAt }
            else if (r.conflict) take(r.doc, r.savedAt)
          } else take(theirs.doc, theirs.savedAt)
        } else if (theirs.savedAt > known.current.savedAt) {
          take(theirs.doc, theirs.savedAt)
        }
        const entries = await pullInbox(url)
        if (!stopped) setInbox(entries)
        online()
      } catch {
        offline()
      }
    }

    void sync(true)
    const t = window.setInterval(() => void sync(false), POLL_MS)
    return () => {
      stopped = true
      window.clearInterval(t)
    }
  }, [settings.enabled, settings.url, take])

  // Push local changes, debounced.
  useEffect(() => {
    if (!settings.enabled || status !== 'online') return
    const json = JSON.stringify(doc)
    if (json === known.current.json) return
    const t = window.setTimeout(async () => {
      const savedAt = Date.now()
      const r = await pushDoc(settings.url, doc, savedAt)
      if (r.ok) known.current = { json, savedAt }
      else if (r.conflict) {
        take(r.doc, r.savedAt)
        notifyRef.current('An agent changed the board first; took their version')
      } else setStatus('offline')
    }, PUSH_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [doc, settings.enabled, settings.url, status, take])

  const dismissInbox = useCallback(
    async (index: number) => {
      setInbox((list) => list.filter((_, i) => i !== index))
      await removeInbox(settings.url, index)
    },
    [settings.url],
  )

  return { settings, setSettings, status, inbox, dismissInbox }
}
