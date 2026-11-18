import { BridgeAuthError, type PullResult, type PushResult } from '../model/bridge'
import { sameDoc, type MergeResult } from '../model/merge'
import { planSync, type Agreed, type Theirs } from '../model/sync'
import type { Doc } from '../model/types'

/*
 * One contact with the agent bridge, done: pull, decide (../model/sync.ts),
 * then push, take or merge. Kept out of the React hook so it can be tested
 * against a fake bridge without a browser.
 *
 * Contacts run one at a time: a poll and a debounced push never race each
 * other into a needless 409. A refusal (409) comes back round as "both
 * changed" and merges again, at most MAX_ROUNDS times per contact; past that
 * the board stays as it is on screen and the next contact tries again.
 */

export type Transport = {
  /** `GET /health`: there at all, and taking our token? Optional (a bare transport just pulls). */
  health?: () => Promise<{ up: boolean; authorized: boolean }>
  pull: () => Promise<PullResult>
  push: (doc: Doc, base: number) => Promise<PushResult>
}

/** How an outside copy came in. `before` is the board the person had, for "restore mine". */
export type Adoption = { kind: 'take'; before: Doc; changes?: number } | { kind: 'merge'; before: Doc; result: MergeResult }

export type Outcome = 'online' | 'offline' | 'auth'

export type SyncDeps = {
  transport: Transport
  /** The board on screen now. */
  mine: () => Doc
  /** True while this browser has never saved a board of its own (the sample). */
  mineUnsaved: () => boolean
  /** The last doc both sides had, from storage; null when there is none. */
  agreed: Agreed | null
  saveAgreed: (agreed: Agreed) => void
  /** Show `next` instead of what is on screen. Called only when it differs. */
  adopt: (next: Doc, how: Adoption) => void
}

const MAX_ROUNDS = 4

export function createBridgeSync(deps: SyncDeps) {
  let agreed = deps.agreed
  let running: Promise<Outcome> | null = null
  let queued: Promise<Outcome> | null = null

  const agree = (next: Agreed) => {
    if (agreed && agreed.rev === next.rev && agreed.doc === next.doc) return
    agreed = next
    deps.saveAgreed(next)
  }

  /** After a push: ok → agreed on what was pushed; refused → their copy for the next round; else the outcome. */
  async function push(doc: Doc, base: number): Promise<Theirs | Outcome> {
    const r = await deps.transport.push(doc, base)
    if (r.ok) {
      // A legacy bridge without `rev` in its answer: -1 makes the next contact compare by content.
      agree({ rev: r.rev ?? -1, doc })
      return 'online'
    }
    if (r.conflict) return { doc: r.doc, rev: r.rev }
    return r.auth ? 'auth' : 'offline'
  }

  async function once(): Promise<Outcome> {
    if (deps.transport.health) {
      const h = await deps.transport.health()
      if (!h.up) return 'offline'
      if (!h.authorized) return 'auth'
    }
    let theirs: Theirs
    try {
      theirs = await deps.transport.pull()
    } catch (err) {
      return err instanceof BridgeAuthError ? 'auth' : 'offline'
    }
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const mine = deps.mine()
      const plan = planSync(agreed, mine, theirs, { mineUnsaved: deps.mineUnsaved() })
      let next: Theirs | Outcome
      if (plan.act === 'none') {
        agree(plan.agreed)
        return 'online'
      } else if (plan.act === 'take') {
        agree({ rev: plan.rev, doc: plan.doc })
        if (!sameDoc(plan.doc, mine)) deps.adopt(plan.doc, { kind: 'take', before: mine, changes: plan.changes })
        return 'online'
      } else if (plan.act === 'push') {
        next = await push(plan.doc, plan.base)
      } else {
        if (!sameDoc(plan.doc, mine)) deps.adopt(plan.doc, { kind: 'merge', before: mine, result: plan.result })
        // Their copy is now the common ancestor of what is on screen and of whatever they write next.
        agree({ rev: theirs.rev, doc: theirs.doc })
        if (sameDoc(plan.doc, theirs.doc)) return 'online'
        next = await push(plan.doc, theirs.rev)
      }
      if (typeof next === 'string') return next
      theirs = next
    }
    return 'online'
  }

  /** One contact. A call while one is running waits for it and then makes one more (calls in the meantime share it). */
  function run(): Promise<Outcome> {
    if (!running) {
      running = once().finally(() => {
        running = null
      })
      return running
    }
    if (!queued) {
      queued = running.then(() => {
        queued = null
        return run()
      })
    }
    return queued
  }

  return { run, agreed: () => agreed }
}
