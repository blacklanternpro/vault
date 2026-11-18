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
 * in step. Every contact compares the bridge's board and this one against
 * the last doc both had (see ../model/sync.ts): push mine, take theirs, or
 * three-way merge. Contacts happen on turning the bridge on, every POLL_MS,
 * shortly after every local change, and on `syncNow()`.
 *
 * Taking in an outside copy (a take, or a merge that changes what is on screen):
 *   - is ONE undo step (`adopt` with `undoable`; Studio uses history.replace),
 *     except over the never-saved sample, which is simply replaced;
 *   - is announced in the notice slot with `restore mine` (not over the
 *     sample: that would push the sample over the real board). `restore mine`
 *     only works while the board is still the one it was offered on: the next
 *     change of any kind retracts it;
 *   - is snapshotted with care for the 30 snapshots a busy agent could churn:
 *     a take, or a merge with no clash, snapshots yours only under the usual
 *     ten-minute rule (a take never holds unpushed work of yours; a clean
 *     merge keeps all of it); a merge with a clash forces yours, and theirs
 *     too when something of theirs lost.
 *
 * An undo that steps back across a take or merge (Ctrl+Z meant for your own
 * typo) is allowed, as every undo is, but snapshots the agent's copy first
 * and says so: `undid vault-agent's change · redo`. The next contact pushes
 * that undo like any other change.
 *
 * When a merge moved ids of yours (both sides minted the same new id), the
 * map goes to `adopt` so the shell can follow them (open card, selection,
 * session clock).
 *
 * Inbox entries are removed by id only. An entry without an id (an agent
 * from before Phase 1) is dropped from view but never removed by position.
 */

export type BridgeStatus = 'off' | 'connecting' | 'online' | 'offline'

type Action = { label: string; run: () => void }

export type AdoptHow = {
  /** False when replacing the never-saved sample: no undo step back to it. */
  undoable: boolean
  /** Your task ids that moved (old → new), when both sides minted the same one. */
  remapped?: ReadonlyMap<number, number>
}

type Options = {
  doc: Doc
  /** The live board, ahead of the render (Studio: history.ref). Falls back to `doc`. */
  live?: { readonly current: Doc }
  /** Show a doc that came from the bridge. */
  adopt: (doc: Doc, how: AdoptHow) => void
  /** Put the person's own board back ("restore mine"), as one undoable commit. */
  restore: (doc: Doc) => void
  /** Step forward again (the `redo` on "undid vault-agent's change"). */
  redo?: () => void
  /**
   * Tell the person something, with an optional action word. `notice` marks
   * a message about the board's data (a merge, a take, a refused token, an
   * undone agent change): it belongs in the sticky notice slot.
   */
  notify: (text: string, action?: Action, notice?: boolean) => void
  /** The last notice's action no longer applies (the board moved on): keep the words, drop the button. */
  retract?: () => void
}

const POLL_MS = 5000
const PUSH_DEBOUNCE_MS = 800
const TOKEN_HINT = 'run vault-agent token (or serve) for the link'

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

/** 24-hour hh:mm, as the voice sheet writes times. */
function clock(at: number): string {
  const d = new Date(at)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function hostOf(url: string): string {
  try {
    return new URL(url).host
  } catch {
    return url
  }
}

function takeTokenFromLink(): string | null {
  try {
    return intakeBridgeToken(window.location, window.history)
  } catch {
    return null
  }
}

export function useBridge({ doc, live, adopt, restore, redo, notify, retract }: Options) {
  // The link `vault-agent serve` prints carries the token in the hash: take it before reading the settings.
  const [tokenFromLink] = useState(takeTokenFromLink)
  const [settings, setSettingsState] = useState<BridgeSettings>(readBridgeSettings)
  const [status, setStatus] = useState<BridgeStatus>(settings.enabled ? 'connecting' : 'off')
  const [inbox, setInbox] = useState<InboxEntry[]>([])
  const docRef = useRef(doc)
  docRef.current = doc
  const liveRef = useRef(live)
  liveRef.current = live
  const adoptRef = useRef(adopt)
  adoptRef.current = adopt
  const restoreRef = useRef(restore)
  restoreRef.current = restore
  const redoRef = useRef(redo)
  redoRef.current = redo
  const notifyRef = useRef(notify)
  notifyRef.current = notify
  const retractRef = useRef(retract)
  retractRef.current = retract
  const wasOnline = useRef(false)
  /** One contact with the bridge; null while the bridge is off. */
  const contactRef = useRef<(() => Promise<void>) | null>(null)
  const agreedRef = useRef<(() => { doc: Doc } | null) | null>(null)
  /** Each adopted doc → the board it replaced, to spot an undo stepping back across it. */
  const crossings = useRef(new WeakMap<Doc, Doc>())
  /** The board the current notice's action was offered on; any other board retracts it. */
  const noticeOn = useRef<Doc | null>(null)
  /** Set while "restore mine" runs, so it is not mistaken for an undo across the adoption. */
  const restoring = useRef(false)
  const prevDoc = useRef(doc)

  /** The board as it is right now, rendered or not. */
  const current = useCallback(() => (liveRef.current ?? docRef).current, [])

  useEffect(() => {
    if (!tokenFromLink) return
    notifyRef.current(readBridgeSettings().enabled ? 'bridge token saved' : 'bridge token saved. turn the bridge on in the menu to connect')
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
        notifyRef.current(`bridge on · ${hostOf(url)}`)
      }
    }
    const offline = () => {
      setStatus('offline')
      if (wasOnline.current) {
        wasOnline.current = false
        notifyRef.current('bridge offline · working locally')
      }
    }
    const refused = () => {
      setStatus('offline')
      wasOnline.current = false
      if (authWarned) return
      authWarned = true
      notifyRef.current(`bridge refused: ${target.token ? 'wrong token' : 'no token'}. ${TOKEN_HINT}`, undefined, true)
    }

    let pending: { text: string; on: Doc; action?: Action } | null = null

    const taken = (next: Doc, how: Adoption) => {
      if (stopped) return
      const before = how.before
      const at = Date.now()
      const sample = how.kind === 'take' && how.unsaved === true
      let snapshotted = false
      if (how.kind === 'take') {
        if (!sample) snapshotted = snapshot(before)
      } else {
        const clash = how.result.conflicts.length > 0
        snapshot(before, clash)
        if (how.result.conflicts.some((c) => c.kept === 'mine')) snapshot(how.theirs, true)
      }
      const remapped = how.kind === 'merge' && how.result.remapped.size ? how.result.remapped : undefined
      adoptRef.current(next, { undoable: !sample, ...(remapped ? { remapped } : {}) })
      if (liveRef.current?.current !== next) docRef.current = next
      if (!sample) crossings.current.set(next, before)
      const text = how.kind === 'take' ? adoptMessage({ kind: 'take', rev: how.rev, snapshotted }) : adoptMessage({ kind: 'merge', rev: how.rev, doc: next, result: how.result })
      const restoreMine = () => {
        // Only on the board it was offered on: anything since would be lost.
        if (current() !== next) return
        restoring.current = true
        snapshot(next, true)
        restoreRef.current(before)
        notifyRef.current(`restored yours (${clock(at)}). theirs is in snapshots`)
      }
      // Said once the contact is over, after "bridge on", so the notice with "restore mine" is what is left showing.
      pending = { text, on: next, ...(sample ? {} : { action: { label: 'restore mine', run: restoreMine } }) }
    }

    const engine = createBridgeSync({
      transport: {
        health: () => bridgeHealth(target),
        pull: () => pullDoc(target),
        push: (d, base) => pushDoc(target, d, Date.now(), base),
      },
      mine: current,
      mineUnsaved: () => localSavedAt() === 0,
      agreed: readBridgeBase(url),
      loadAgreed: () => readBridgeBase(url),
      saveAgreed: (a) => writeBridgeBase(url, a),
      adopt: taken,
    })

    const contact = async () => {
      const outcome = await engine.run()
      if (stopped) return
      if (outcome === 'auth') return refused()
      if (outcome === 'offline') return offline()
      online()
      if (pending) {
        const p = pending
        pending = null
        // The board moved on while the contact finished: the words stand, the way back does not.
        const action = p.action && current() === p.on ? p.action : undefined
        noticeOn.current = action ? p.on : null
        notifyRef.current(p.text, action, true)
      }
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
  }, [settings.enabled, settings.url, settings.token, current])

  // Every change of board: an undo across an adoption is named; a notice's action that no longer applies is retracted.
  useEffect(() => {
    const prev = prevDoc.current
    prevDoc.current = doc
    if (prev === doc) return
    const wasRestoring = restoring.current
    restoring.current = false
    if (!wasRestoring && crossings.current.get(prev) === doc) {
      // Ctrl+Z stepped back over the agent's change. Keep their copy, say so, offer the way forward.
      snapshot(prev, true)
      noticeOn.current = doc
      const forward = redoRef.current
      notifyRef.current("undid vault-agent's change", forward ? { label: 'redo', run: () => current() === doc && forward() } : undefined, true)
      return
    }
    if (noticeOn.current && doc !== noticeOn.current) {
      noticeOn.current = null
      retractRef.current?.()
    }
  }, [doc, current])

  // A local change: compare (and push) shortly after.
  useEffect(() => {
    if (!settings.enabled || status !== 'online') return
    const t = window.setTimeout(() => {
      const agreed = agreedRef.current?.()
      if (agreed && sameDoc(current(), agreed.doc)) return
      void contactRef.current?.()
    }, PUSH_DEBOUNCE_MS)
    return () => window.clearTimeout(t)
  }, [doc, settings.enabled, status, current])

  /** One contact now (resolves when it is done; nothing when the bridge is off). */
  const syncNow = useCallback(async () => {
    await contactRef.current?.()
  }, [])

  /** Removes one entry, by its id. Never by position: two dismissals at once must each take their own. */
  const dismissInbox = useCallback(
    async (entry: InboxEntry) => {
      setInbox((list) => list.filter((e) => e !== entry && !(entry.id != null && e.id === entry.id)))
      if (entry.id == null) return false
      return removeInbox({ url: settings.url, token: settings.token }, entry.id)
    },
    [settings.url, settings.token],
  )

  return { settings, setSettings, status, inbox, dismissInbox, syncNow }
}
