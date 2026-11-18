// @vitest-environment jsdom
import { useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BRIDGE_KEY, readBridgeBase, readBridgeSettings, writeBridgeBase, writeBridgeSettings } from '../model/bridge'
import { addNode, byId, sanitizeDoc, setStatus, updateNode } from '../model/doc'
import { sameDoc } from '../model/merge'
import { BACKUP_KEY, DOC_KEY } from '../model/store'
import type { Doc } from '../model/types'
import { useBridge } from './useBridge'

/*
 * The hook end to end against a fake vault-agent behind `fetch`: rev/base,
 * 409 on a stale base, the token, /health, inbox ids. The harness keeps a
 * small undo history the way Studio's useHistory does (replace = a step,
 * adopt = a fresh stack), with a live ref that runs ahead of the render.
 */

const URL_ = 'http://localhost:7331'

function board(): Doc {
  return sanitizeDoc({
    nodes: [
      { id: 1, title: 'CLIENT', status: 'none', parent: null },
      { id: 2, title: 'site', status: 'pending', parent: 1 },
      { id: 3, title: 'deck', status: 'rnd', parent: 1 },
    ],
    notes: [],
    events: [],
  })
}

type Item = { id: string; at: number; text: string }

function fakeAgent(doc: Doc, rev: number, inbox: Item[] = [], token = 'tok') {
  const s = {
    doc,
    rev,
    inbox,
    puts: [] as Array<{ base: unknown; doc: Doc }>,
    token,
    agent(fn: (d: Doc) => Doc) {
      s.doc = sanitizeDoc(fn(s.doc))
      s.rev += 1
    },
  }
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const u = new URL(String(input))
    const method = init?.method ?? 'GET'
    const authed = new Headers(init?.headers).get('authorization') === `Bearer ${s.token}`
    const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
    if (u.pathname === '/health') return json(200, { app: 'vault-agent', version: 1, authorized: authed })
    if (!authed) return json(401, { error: 'run vault-agent token' })
    if (u.pathname === '/doc' && method === 'GET') return json(200, { app: 'vault', version: 1, savedAt: 1, rev: s.rev, doc: s.doc })
    if (u.pathname === '/doc' && method === 'PUT') {
      const body = JSON.parse(String(init?.body)) as { base?: number; doc: Doc }
      s.puts.push({ base: body.base, doc: body.doc })
      if (body.base === undefined) return json(428, { error: 'base required' })
      if (body.base !== s.rev) return json(409, { app: 'vault', version: 1, savedAt: 1, rev: s.rev, doc: s.doc })
      s.doc = sanitizeDoc(body.doc)
      s.rev += 1
      return json(200, { ok: true, savedAt: 2, rev: s.rev })
    }
    if (u.pathname === '/inbox' && method === 'GET') return json(200, { inbox: s.inbox })
    if (u.pathname.startsWith('/inbox/') && method === 'DELETE') {
      const key = decodeURIComponent(u.pathname.slice('/inbox/'.length))
      if (/^\d+$/.test(key)) return json(400, { error: 'by id' })
      const at = s.inbox.findIndex((e) => e.id === key)
      if (at < 0) return json(404, {})
      s.inbox.splice(at, 1)
      return json(200, {})
    }
    return json(404, {})
  })
  return s
}

type Toast = { text: string; action?: { label: string; run: () => void }; notice?: boolean }
type Hist = { past: Doc[]; present: Doc; future: Doc[] }

type Handle = {
  doc: Doc
  hist: Hist
  live: { current: Doc }
  bridge: ReturnType<typeof useBridge>
  toasts: Toast[]
  adoptions: Array<{ undoable: boolean; remapped?: ReadonlyMap<number, number> }>
  restored: number
  retracted: number
  commit: (d: Doc) => void
  undo: () => void
  redo: () => void
}

let root: Root | null = null

function mount(initial: Doc): Handle {
  const h = { hist: { past: [], present: initial, future: [] }, live: { current: initial }, toasts: [], adoptions: [], restored: 0, retracted: 0 } as unknown as Handle
  // The board as the harness holds it now (rendered or not).
  Object.defineProperty(h, 'doc', { get: () => h.hist.present })
  let render: (n: number) => void = () => {}
  const set = (next: Hist) => {
    h.hist = next
    h.live.current = next.present
    render(Math.random())
  }
  h.commit = (d) => set({ past: [...h.hist.past, h.hist.present], present: d, future: [] })
  h.undo = () => {
    const prev = h.hist.past.at(-1)
    if (prev) set({ past: h.hist.past.slice(0, -1), present: prev, future: [h.hist.present, ...h.hist.future] })
  }
  h.redo = () => {
    const nxt = h.hist.future[0]
    if (nxt) set({ past: [...h.hist.past, h.hist.present], present: nxt, future: h.hist.future.slice(1) })
  }
  function Harness() {
    const [, setTick] = useState(0)
    render = setTick
    h.bridge = useBridge({
      doc: h.hist.present,
      live: h.live,
      adopt: (d, how) => {
        h.adoptions.push(how)
        set(how.undoable ? { past: [...h.hist.past, h.hist.present], present: d, future: [] } : { past: [], present: d, future: [] })
      },
      restore: (d) => {
        h.restored += 1
        h.commit(d)
      },
      redo: () => h.redo(),
      notify: (text, action, notice) => h.toasts.push({ text, action, notice }),
      retract: () => {
        h.retracted += 1
      },
    })
    return null
  }
  root = createRoot(document.createElement('div'))
  root.render(<Harness />)
  return h
}

async function until(check: () => boolean, ms = 3000) {
  const end = Date.now() + ms
  while (!check()) {
    if (Date.now() > end) throw new Error('timed out')
    await new Promise((r) => setTimeout(r, 20))
  }
}

const settle = () => new Promise((r) => setTimeout(r, 60))

/** A browser that has saved a board of its own and has agreed on `agreed` with the bridge at `rev`. */
function synced(agreed: Doc, rev: number) {
  writeBridgeSettings({ enabled: true, url: URL_, token: 'tok' })
  localStorage.setItem(DOC_KEY, JSON.stringify({ app: 'vault', version: 1, savedAt: 5, doc: agreed }))
  writeBridgeBase(URL_, { rev, doc: agreed })
}

const snapshots = () => (JSON.parse(localStorage.getItem(BACKUP_KEY) ?? '[]') as Array<{ doc: Doc }>).map((s) => sanitizeDoc(s.doc))

beforeEach(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false
  localStorage.clear()
  window.history.replaceState(null, '', '/')
})

afterEach(() => {
  root?.unmount()
  root = null
  vi.restoreAllMocks()
})

describe('useBridge', () => {
  it('merges an agent write with unpushed local work, and "restore mine" puts it back as one change', async () => {
    synced(board(), 3)
    const agent = fakeAgent(addNode(board(), { parent: 1, title: 'from the agent' }).doc, 4)
    const mine = updateNode(board(), 2, { title: 'site (mine)' })
    const h = mount(mine)

    await until(() => h.toasts.some((t) => t.text.startsWith('merged')))
    expect(h.doc.nodes.map((n) => n.title)).toEqual(expect.arrayContaining(['site (mine)', 'from the agent']))
    expect(h.adoptions[0].undoable).toBe(true)
    await until(() => agent.puts.length > 0)
    expect(agent.puts[0].base).toBe(4)
    // "bridge on" first, so the notice with "restore mine" is what is left showing.
    expect(h.toasts.map((t) => t.text).slice(0, 2)).toEqual(['bridge on · localhost:7331', 'merged 1 change from vault-agent (rev 4)'])
    const toast = h.toasts.find((t) => t.text.startsWith('merged'))!
    expect(toast).toMatchObject({ notice: true, action: { label: 'restore mine' } })

    const merged = h.doc
    toast.action!.run()
    await until(() => h.restored === 1 && sameDoc(h.doc, mine))
    expect(h.toasts.at(-1)?.text).toMatch(/^restored yours \(\d\d:\d\d\)\. theirs is in snapshots$/)
    expect(snapshots().some((s) => sameDoc(s, merged))).toBe(true)
    // Restoring is not an undo across the adoption: no "undid" notice.
    expect(h.toasts.some((t) => t.text.startsWith('undid'))).toBe(false)
    await until(() => sameDoc(agent.doc, mine))
    expect(agent.puts.every((p) => typeof p.base === 'number')).toBe(true)
  })

  it('an undo that crosses a take says so, snapshots theirs first, and offers redo', async () => {
    synced(board(), 3)
    fakeAgent(setStatus(board(), 3, 'active'), 4)
    const h = mount(board())
    await until(() => h.toasts.some((t) => t.text.startsWith('took')))
    const theirs = h.doc
    expect(byId(theirs, 3)?.status).toBe('active')

    h.undo()
    await until(() => h.toasts.some((t) => t.text.startsWith('undid')))
    const undid = h.toasts.find((t) => t.text.startsWith('undid'))!
    expect(undid).toMatchObject({ text: "undid vault-agent's change", notice: true, action: { label: 'redo' } })
    expect(snapshots().some((s) => sameDoc(s, theirs))).toBe(true)
    undid.action!.run()
    await until(() => h.doc === theirs)
  })

  it('a take over the never-saved sample is not undoable and offers no "restore mine"', async () => {
    writeBridgeSettings({ enabled: true, url: URL_, token: 'tok' })
    fakeAgent(board(), 2)
    const sample = sanitizeDoc({ nodes: [{ id: 1, title: 'SAMPLE', status: 'none', parent: null }], notes: [] })
    const h = mount(sample)
    await until(() => h.toasts.some((t) => t.text.startsWith('took')))
    const took = h.toasts.find((t) => t.text.startsWith('took'))!
    expect(took.action).toBeUndefined()
    expect(h.adoptions[0].undoable).toBe(false)
    expect(sameDoc(h.doc, board())).toBe(true)
  })

  it('"restore mine" expires once the board moves on', async () => {
    synced(board(), 3)
    const agent = fakeAgent(setStatus(board(), 3, 'active'), 4)
    const h = mount(board())
    await until(() => h.toasts.some((t) => t.text.startsWith('took')))
    const took = h.toasts.find((t) => t.text.startsWith('took'))!
    h.commit(updateNode(h.doc, 2, { title: 'my next edit' }))
    await until(() => h.retracted > 0)
    took.action!.run()
    await settle()
    expect(h.restored).toBe(0)
    expect(byId(h.doc, 2)?.title).toBe('my next edit')
    await until(() => byId(agent.doc, 2)?.title === 'my next edit')
    expect(byId(agent.doc, 3)?.status).toBe('active')
  })

  it('hands the ids it moved to the shell, so it can follow them', async () => {
    synced(board(), 3)
    fakeAgent(addNode(board(), { parent: 1, title: 'theirs' }).doc, 4)
    const h = mount(addNode(board(), { parent: 1, title: 'mine' }).doc)
    await until(() => h.adoptions.length > 0)
    const moved = h.doc.nodes.find((n) => n.title === 'mine')!.id
    expect([...(h.adoptions[0].remapped ?? [])]).toEqual([[4, moved]])
  })

  it('takes from a busy agent do not each force a snapshot', async () => {
    synced(board(), 3)
    const agent = fakeAgent(board(), 3)
    const h = mount(board())
    await until(() => h.bridge?.status === 'online')
    for (const title of ['one', 'two', 'three']) {
      agent.agent((d) => addNode(d, { parent: 1, title }).doc)
      await h.bridge.syncNow()
      await until(() => h.doc.nodes.some((n) => n.title === title))
    }
    expect(snapshots().length).toBeLessThanOrEqual(1)
  })

  it('reads the live board, not the last render (a commit not yet rendered is not left out)', async () => {
    synced(board(), 3)
    const agent = fakeAgent(board(), 3)
    const h = mount(board())
    await until(() => h.bridge?.status === 'online')
    // Committed, not rendered yet.
    h.live.current = updateNode(board(), 2, { title: 'unrendered' })
    await h.bridge.syncNow()
    expect(byId(agent.doc, 2)?.title).toBe('unrendered')
  })

  it('keeps the agreed base with when it was agreed, for other tabs', async () => {
    synced(board(), 3)
    fakeAgent(setStatus(board(), 3, 'active'), 4)
    const h = mount(board())
    await until(() => h.toasts.some((t) => t.text.startsWith('took')))
    expect(readBridgeBase(URL_)).toMatchObject({ rev: 4 })
    expect(readBridgeBase(URL_)?.at).toBeGreaterThan(0)
  })

  it('two inbox dismissals at once remove those two, by id', async () => {
    writeBridgeSettings({ enabled: true, url: URL_, token: 'tok' })
    const agent = fakeAgent(board(), 1, [
      { id: 'ia', at: 1, text: 'a' },
      { id: 'ib', at: 2, text: 'b' },
      { id: 'ic', at: 3, text: 'c' },
    ])
    const h = mount(board())
    await until(() => h.bridge?.inbox.length === 3)
    const [a, , c] = h.bridge.inbox
    await Promise.all([h.bridge.dismissInbox(a), h.bridge.dismissInbox(c)])
    expect(agent.inbox.map((e) => e.text)).toEqual(['b'])
    await until(() => h.bridge.inbox.length === 1)
    expect(h.bridge.inbox[0].text).toBe('b')
  })

  it('takes a token from the link, strips it from the address, and leaves the bridge off', async () => {
    window.history.replaceState(null, '', '/#keep&bridge-token=fresh')
    const h = mount(board())
    await until(() => h.toasts.length > 0)
    expect(readBridgeSettings()).toMatchObject({ enabled: false, token: 'fresh' })
    expect(window.location.hash).toBe('#keep')
    expect(h.toasts[0].text).toBe('bridge token saved. turn the bridge on in the menu to connect')
    expect(h.bridge.status).toBe('off')
    expect(localStorage.getItem(BRIDGE_KEY)).toContain('fresh')
  })

  it('a wrong token says so', async () => {
    writeBridgeSettings({ enabled: true, url: URL_, token: 'stale' })
    fakeAgent(board(), 1)
    const h = mount(board())
    await until(() => h.toasts.length > 0)
    expect(h.toasts[0]).toMatchObject({ text: 'bridge refused: wrong token. run vault-agent token (or serve) for the link', notice: true })
  })

  it('a missing token: offline, and says how to get one', async () => {
    writeBridgeSettings({ enabled: true, url: URL_ })
    fakeAgent(board(), 1)
    const h = mount(board())
    await until(() => h.toasts.length > 0)
    expect(h.bridge.status).toBe('offline')
    expect(h.toasts[0]).toMatchObject({ text: 'bridge refused: no token. run vault-agent token (or serve) for the link', notice: true })
  })
})
