// @vitest-environment jsdom
import { useState } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BRIDGE_KEY, readBridgeSettings, writeBridgeBase, writeBridgeSettings } from '../model/bridge'
import { addNode, byId, sanitizeDoc, updateNode } from '../model/doc'
import { sameDoc } from '../model/merge'
import { BACKUP_KEY, DOC_KEY } from '../model/store'
import type { Doc } from '../model/types'
import { useBridge } from './useBridge'

/*
 * The hook end to end against a fake vault-agent behind `fetch`: rev/base,
 * 409 on a stale base, the token, /health, inbox ids.
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
  const s = { doc, rev, inbox, puts: [] as Array<{ base: unknown }>, token }
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
      s.puts.push({ base: body.base })
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

type Handle = { doc: Doc; bridge: ReturnType<typeof useBridge>; toasts: Array<{ text: string; action?: { label: string; run: () => void }; notice?: boolean }>; adopted: number; restored: number }

let root: Root | null = null
let host: HTMLDivElement | null = null

function mount(initial: Doc): Handle {
  const h: Handle = { doc: initial, bridge: null as never, toasts: [], adopted: 0, restored: 0 }
  function Harness() {
    const [doc, setDoc] = useState(initial)
    h.doc = doc
    h.bridge = useBridge({
      doc,
      adopt: (d) => {
        h.adopted += 1
        setDoc(d)
      },
      restore: (d) => {
        h.restored += 1
        setDoc(d)
      },
      notify: (text, action, notice) => h.toasts.push({ text, action, notice }),
    })
    ;(h as Handle & { set: (d: Doc) => void }).set = setDoc
    return null
  }
  host = document.createElement('div')
  root = createRoot(host)
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

beforeEach(() => {
  ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = false
  localStorage.clear()
  window.history.replaceState(null, '', '/')
})

afterEach(() => {
  root?.unmount()
  root = null
  host = null
  vi.restoreAllMocks()
})

describe('useBridge', () => {
  it('merges an agent write with unpushed local work, snapshots mine first, and "restore mine" puts it back as one change', async () => {
    writeBridgeSettings({ enabled: true, url: URL_, token: 'tok' })
    localStorage.setItem(DOC_KEY, JSON.stringify({ app: 'vault', version: 1, savedAt: 5, doc: board() }))
    writeBridgeBase(URL_, { rev: 3, doc: board() })
    const agent = fakeAgent(addNode(board(), { parent: 1, title: 'from the agent' }).doc, 4)
    const mine = updateNode(board(), 2, { title: 'site (mine)' })
    const h = mount(mine)

    await until(() => h.toasts.some((t) => t.text.startsWith('merged')))
    expect(h.toasts.find((t) => t.text.startsWith('merged'))?.notice).toBe(true)
    expect(h.doc.nodes.map((n) => n.title)).toEqual(expect.arrayContaining(['site (mine)', 'from the agent']))
    await until(() => agent.puts.length > 0)
    expect(agent.puts[0].base).toBe(4)
    expect(byId(agent.doc, 2)?.title).toBe('site (mine)')
    // A snapshot of what the person had, taken before the merge landed.
    const snaps = JSON.parse(localStorage.getItem(BACKUP_KEY) ?? '[]') as Array<{ doc: Doc }>
    expect(snaps.some((s) => sameDoc(sanitizeDoc(s.doc), mine))).toBe(true)

    // "connected" first, so the toast left showing is the one with "restore mine".
    expect(h.toasts.map((t) => t.text).slice(0, 2)).toEqual(['bridge on · localhost:7331', 'merged 1 change from vault-agent (rev 4)'])
    const toast = h.toasts.find((t) => t.text.startsWith('merged'))!
    expect(toast.text).toBe('merged 1 change from vault-agent (rev 4)')
    expect(toast.action?.label).toBe('restore mine')
    const merged = h.doc
    toast.action!.run()
    await until(() => h.restored === 1 && sameDoc(h.doc, mine))
    expect(h.toasts.at(-1)?.text).toMatch(/^restored yours \(\d\d:\d\d\)\. theirs is in snapshots$/)
    // Theirs (the merged board) is in the snapshots now.
    const after = JSON.parse(localStorage.getItem(BACKUP_KEY) ?? '[]') as Array<{ doc: Doc }>
    expect(after.some((s) => sameDoc(sanitizeDoc(s.doc), merged))).toBe(true)
    // …and pushed with a proper base, so the bridge ends up with mine too.
    await until(() => sameDoc(agent.doc, mine))
    expect(agent.puts.every((p) => typeof p.base === 'number')).toBe(true)
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
    expect(h.toasts[0]).toMatchObject({ text: 'bridge refused: wrong token. open the link vault-agent serve prints', notice: true })
  })

  it('a missing or wrong token: offline, and says how to get one', async () => {
    writeBridgeSettings({ enabled: true, url: URL_ })
    fakeAgent(board(), 1)
    const h = mount(board())
    await until(() => h.toasts.length > 0)
    expect(h.bridge.status).toBe('offline')
    expect(h.toasts[0]).toMatchObject({ text: 'bridge refused: no token. run vault-agent serve and open the link it prints', notice: true })
  })
})
