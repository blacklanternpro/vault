import { useCallback, useEffect, useRef, useState } from 'react'
import {
  bridgeHealth,
  intakeBridgeToken,
  pullDoc,
  pullInbox,
  pushDoc,
  readBridgeBase,
  readBridgeSettings,
  removeInbox,
  writeBridgeBase,
  writeBridgeSettings,
  type BridgeSettings,
  type InboxEntry,
} from '../model/bridge'
import { sameDoc } from '../model/merge'
import { DOC_KEY, snapshot } from '../model/store'
import { adoptMessage } from '../model/sync'
import type { Doc } from '../model/types'
import { createBridgeSync, type Adoption } from './bridgeSync'

/*
 * Keeps the browser's board and the local agent bridge (`vault-agent serve`)
 * in step. Every contact compares, by the server's rev and by whether this
 * board changed since the last doc both sides had (see ../model/sync.ts):
 * push mine, take theirs, or three-way merge. Contacts happen on turning the
 * bridge on, every POLL_MS, and shortly after every local change.
 *
 * Taking in an outside copy (a take, or a merge that changes what is on
 * screen) always:
 *   1. snapshots the board as it was (store.snapshot, forced), then
 *   2. hands the new doc to `adopt`, which must make it ONE undo step
 *      (Studio uses history.replace: Ctrl+Z puts back what you had, and the
 *      undo history from before stays usable), then
 *   3. says so, with "restore mine": the board as it was, put back through
 *      `restore` as one undoable commit, which the next contact pushes with
 *      the proper base.
 *
 * Inbox entries are removed by id only. An entry without an id (an agent
 * from before Phase 1) is dropped from view but never removed by position.
 */

export type BridgeStatus = 'off' | 'connecting' | 'online' | 'offline'

type Action = { label: string; run: () => void }

type Options = {
  doc: Doc
  /** Show a doc that came from the bridge, as one undoable step. */
  adopt: (doc: Doc) => void
  /** Put the person's own board back ("restore mine"), as one undoable commit. */
  restore: (doc: Doc) => void
  /** Tell the person something (a toast), with an optional button. */
  notify: (text: string, action?: Action) => void
}

const POLL_MS = 5000
const PUSH_DEBOUNCE_MS = 800
const TOKEN_HELP = 'run vault-agent token, or open the link vault-agent serve prints.'

/** When this browser last saved the board (0 for a board never saved, such as the first-run sample). */
function localSavedAt(): number {
  try {
    const raw = window.localStorage.getItem(DOC_KEY)
    const at = raw ? (JSON.parse(raw) as { savedAt?: unknown }).savedAt : 0
    return typeof at === 'number' && Number.isFinite(at) ? at : 0
  } catch {
    return 0
  }
}

function takeTokenFromLink(): string | null {
  try {
    return intakeBridgeToken(window.location, window.history)
  } catch {
    return null
  }
}

export function useBridge({ doc, adopt, restore, notify }: Options) {
  // The link `vault-agent serve` prints carries the token in the hash: take it before reading the settings.
  const [tokenFromLink] = useState(takeTokenFromLink)
  const [settings, setSettingsState] = useState<BridgeSettings>(readBridgeSettings)
  const [status, setStatus] = useState<BridgeStatus>(settings.enabled ? 'connecting' : 'off')
  const [inbox, setInbox] = useState<InboxEntry[]>([])
  const docRef = useRef(doc)
  docRef.current = doc
  const adoptRef = useRef(adopt)
  adoptRef.current = adopt
  const restoreRef = useRef(restore)
  restoreRef.current = restore
  const notifyRef = useRef(notify)
  notifyRef.current = notify
  const wasOnline = useRef(false)
  /** One contact with the bridge, for the push effect; null while the bridge is off. */
  const contactRef = useRef<(() => Promise<void>) | null>(null)
  const agreedRef = useRef<(() => { doc: Doc } | null) | null>(null)

  useEffect(() => {
    if (!tokenFromLink) return
    notifyRef.current(readBridgeSettings().enabled ? 'got the bridge token.' : 'got the bridge token. turn the bridge on in the menu to connect.')
  }, [tokenFromLink])

  const setSettings = useCallback((next: BridgeSettings) => {
    writeBridgeSettings(next)
    setSettingsState(next)
    setStatus(next.enabled ? 'connecting' : 'off')
    if (!next.enabled) setInbox([])
  }, [])

  // Connect, then keep comparing.
  useEffect(() => {
    if (!settings.enabled) return
    let stopped = false
    let authWarned = false
    const url = settings.url
    const target = { url, token: settings.token }

    const online = () => {
      setStatus('online')
      authWarned = false
      if (!wasOnline.current) {
        wasOnline.current = true
        notifyRef.current('Agent bridge connected')
      }
    }
    const offline = () => {
      setStatus('offline')
      if (wasOnline.current) {
        wasOnline.current = false
        notifyRef.current("Agent bridge isn't answering; working locally")
      }
    }
    const refused = () => {
      setStatus('offline')
      wasOnline.current = false
      if (authWarned) return
      authWarned = true
      notifyRef.current(`bridge token ${target.token ? 'is wrong' : 'missing'}. ${TOKEN_HELP}`)
    }

    const taken = (next: Doc, how: Adoption) => {
      if (stopped) return
      const before = how.before
      snapshot(before, true)
      docRef.current = next
      adoptRef.current(next)
      const text = how.kind === 'take' ? adoptMessage({ kind: 'take', changes: how.changes }) : adoptMessage({ kind: 'merge', result: how.result })
      notifyRef.current(text, { label: 'restore mine', run: () => restoreRef.current(before) })
    }

    const engine = createBridgeSync({
      transport: {
        health: () => bridgeHealth(target),
        pull: () => pullDoc(target),
        push: (d, base) => pushDoc(target, d, Date.now(), base),
      },
      mine: () => docRef.current,
      mineUnsaved: () => localSavedAt() === 0,
      agreed: readBridgeBase(url),
      saveAgreed: (a) => writeBridgeBase(url, a),
      adopt: taken,
    })

    const contact = async () => {
      const outcome = await engine.run()
      if (stopped) return
      if (outcome === 'auth') return refused()
      if (outcome === 'offline') return offline()
      online()
      const entries = await pullInbox(target).catch(() => null)
      if (!stopped && entries) setInbox(entries)
    }
    contactRef.current = contact
    agreedRef.current = engine.agreed

    void contact()
    const t = window.setInterval(() => void contact(), POLL_MS)
    return () => {
      stopped = true
      contactRef.current = null
      agreedRef.current = null
      window.clearInterval(t)
    }
  }, [settings.enabled, settings.url, settings.token])

  // A local change: compare (and push) shortly after.
  useEffect(() => {
    if (!settings.enabled || status !== 'online') return
    const t = window.setTimeout(() => {
      const agreed = agreedRef.current?.()
      if (agreed && sameDoc(doc, agreed.doc)) return
      void contactRef.current?.()
    }, PUSH_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [doc, settings.enabled, status])

  /** Removes one entry, by its id. Never by position: two dismissals at once must each take their own. */
  const dismissInbox = useCallback(
    async (entry: InboxEntry) => {
      setInbox((list) => list.filter((e) => e !== entry && !(entry.id != null && e.id === entry.id)))
      if (entry.id == null) return false
      return removeInbox({ url: settings.url, token: settings.token }, entry.id)
    },
    [settings.url, settings.token],
  )

  return { settings, setSettings, status, inbox, dismissInbox }
}
