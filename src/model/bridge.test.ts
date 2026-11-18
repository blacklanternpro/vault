// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BridgeAuthError, bridgeHealth, intakeBridgeToken, newer, ping, pullDoc, pullInbox, pushDoc, readBridgeBase, readBridgeSettings, removeInbox, splitBridgeToken, writeBridgeBase, writeBridgeSettings } from './bridge'
import { addNode } from './doc'
import { sameDoc } from './merge'
import { seedDoc } from './seed'

function respond(status: number, body?: unknown) {
  return Promise.resolve(new Response(body === undefined ? null : JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } }))
}

describe('bridge client', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => vi.restoreAllMocks())

  it('settings default to off and localhost', () => {
    expect(readBridgeSettings()).toEqual({ enabled: false, url: 'http://localhost:7331' })
    writeBridgeSettings({ enabled: true, url: 'http://localhost:9000/' })
    expect(readBridgeSettings()).toEqual({ enabled: true, url: 'http://localhost:9000/' })
  })

  it('pulls an envelope or a bare doc, sanitized', async () => {
    const doc = seedDoc()
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => respond(200, { app: 'vault', version: 1, savedAt: 123, doc }))
    const r = await pullDoc('http://x/')
    expect(r.savedAt).toBe(123)
    expect(r.doc).toEqual(doc)
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => respond(200, { nodes: [{ id: 1, title: 'p', status: 'none', parent: null }], notes: [] }))
    expect((await pullDoc('http://x')).doc.nodes[0].title).toBe('p')
  })

  it('pushes, and adopts the server copy on 409', async () => {
    const theirs = seedDoc()
    const calls: string[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation((url, init) => {
      calls.push(`${init?.method ?? 'GET'} ${String(url)}`)
      return init?.method === 'PUT' ? respond(409, { app: 'vault', version: 1, savedAt: 999, doc: theirs }) : respond(200)
    })
    const r = await pushDoc('http://x', seedDoc(), 5)
    expect(r).toMatchObject({ ok: false, conflict: true, savedAt: 999 })
    expect(calls).toEqual(['PUT http://x/doc'])
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => respond(200))
    expect(await pushDoc('http://x', seedDoc(), 7)).toEqual({ ok: true, savedAt: 7 })
  })

  it('sends base and the token, and reads rev back (Phase 1 contract)', async () => {
    let sent: { body: Record<string, unknown>; auth: string | null } | null = null
    vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) => {
      sent = { body: JSON.parse(String(init?.body)), auth: new Headers(init?.headers).get('authorization') }
      return respond(200, { ok: true, savedAt: 7, rev: 4 })
    })
    expect(await pushDoc({ url: 'http://x', token: 'tok' }, seedDoc(), 7, 3)).toEqual({ ok: true, savedAt: 7, rev: 4 })
    expect(sent).toMatchObject({ body: { base: 3, savedAt: 7 }, auth: 'Bearer tok' })
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => respond(409, { app: 'vault', version: 1, savedAt: 9, rev: 5, doc: seedDoc() }))
    expect(await pushDoc('http://x', seedDoc(), 8, 3)).toMatchObject({ ok: false, conflict: true, rev: 5 })
  })

  it('removes an inbox entry by id', async () => {
    const urls: string[] = []
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      urls.push(String(url))
      return respond(200)
    })
    expect(await removeInbox({ url: 'http://x' }, 'iabc')).toBe(true)
    expect(urls).toEqual(['http://x/inbox/iabc'])
  })

  it('reports an unreachable server without throwing', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.reject(new TypeError('Failed to fetch')))
    expect(await ping('http://x')).toBe(false)
    expect(await pushDoc('http://x', seedDoc())).toMatchObject({ ok: false, conflict: false })
  })

  it('reads and removes inbox entries, ignoring junk', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation((_url, init) =>
      init?.method === 'DELETE' ? respond(204) : respond(200, [{ at: 1, taskId: 2, text: 'done' }, 'junk', { text: 'no time' }]),
    )
    const list = await pullInbox('http://x')
    expect(list[0]).toEqual({ at: 1, taskId: 2, text: 'done' })
    expect(list[1].text).toBe('no time')
    expect(list.length).toBe(2)
    expect(await removeInbox('http://x', 'i1')).toBe(true)
  })

  it('two dismissals at once each remove their own entry, never by position (audit 11)', async () => {
    const server = [
      { id: 'ia', at: 1, text: 'a' },
      { id: 'ib', at: 2, text: 'b' },
      { id: 'ic', at: 3, text: 'c' },
    ]
    vi.spyOn(globalThis, 'fetch').mockImplementation(async (url, init) => {
      if (init?.method !== 'DELETE') return respond(200, { inbox: server })
      const key = decodeURIComponent(String(url).split('/inbox/')[1])
      // A bare number would be the legacy position; the client must never send one.
      if (/^\d+$/.test(key)) return respond(400)
      const at = server.findIndex((e) => e.id === key)
      if (at < 0) return respond(404)
      server.splice(at, 1)
      return respond(200)
    })
    const [a, , c] = await pullInbox('http://x')
    expect(await Promise.all([removeInbox('http://x', a.id!), removeInbox('http://x', c.id!)])).toEqual([true, true])
    expect(server.map((e) => e.text)).toEqual(['b'])
  })

  it('reads the inbox as vault-agent sends it, wrapped in { inbox }', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => respond(200, { inbox: [{ at: 5, taskId: 2, text: '## Report' }] }))
    expect(await pullInbox('http://x')).toEqual([{ at: 5, taskId: 2, text: '## Report' }])
  })

  it('asks /health (no token needed) whether the bridge is there and whether it knows us', async () => {
    const urls: string[] = []
    let body: unknown = { app: 'vault-agent', version: 1, authorized: false }
    vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
      urls.push(String(url))
      return respond(200, body)
    })
    expect(await bridgeHealth({ url: 'http://x/' })).toEqual({ up: true, authorized: false })
    expect(urls).toEqual(['http://x/health'])
    body = { app: 'vault-agent', version: 1, authorized: true, rev: 3 }
    expect(await bridgeHealth({ url: 'http://x', token: 't' })).toEqual({ up: true, authorized: true })
    // An older agent says nothing about authorization: take it as yes.
    body = { app: 'vault-agent', version: 1 }
    expect(await bridgeHealth('http://x')).toEqual({ up: true, authorized: true })
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => respond(401))
    expect(await bridgeHealth('http://x')).toEqual({ up: true, authorized: false })
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => Promise.reject(new TypeError('Failed to fetch')))
    expect(await bridgeHealth('http://x')).toEqual({ up: false, authorized: false })
    expect(await ping('http://x')).toBe(false)
  })

  it('a refused token reads as an auth failure, not a dead bridge', async () => {
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => respond(401, { error: 'token' }))
    await expect(pullDoc({ url: 'http://x', token: 'bad' })).rejects.toBeInstanceOf(BridgeAuthError)
    expect(await pushDoc('http://x', seedDoc(), 1, 0)).toMatchObject({ ok: false, conflict: false, auth: true })
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => respond(403))
    await expect(pullDoc('http://x')).rejects.toBeInstanceOf(BridgeAuthError)
    vi.spyOn(globalThis, 'fetch').mockImplementation(() => respond(500))
    await expect(pullDoc('http://x')).rejects.not.toBeInstanceOf(BridgeAuthError)
  })

  it('newer picks the later savedAt', () => {
    expect(newer({ savedAt: 1 }, { savedAt: 2 })).toBe('theirs')
    expect(newer({ savedAt: 3 }, { savedAt: 2 })).toBe('mine')
    expect(newer({ savedAt: 2 }, { savedAt: 2 })).toBe('same')
  })
})

describe('token in the link (#bridge-token=…)', () => {
  beforeEach(() => localStorage.clear())

  it('splits the token out of the hash and keeps the rest', () => {
    expect(splitBridgeToken('#bridge-token=abc123')).toEqual({ token: 'abc123', hash: '' })
    expect(splitBridgeToken('#x=1&bridge-token=abc&y=2')).toEqual({ token: 'abc', hash: '#x=1&y=2' })
    expect(splitBridgeToken('#bridge-token=a%2Bb')).toEqual({ token: 'a+b', hash: '' })
    expect(splitBridgeToken('#something')).toEqual({ token: null, hash: '#something' })
    expect(splitBridgeToken('')).toEqual({ token: null, hash: '' })
    // Present but empty or junk: stripped, not stored.
    expect(splitBridgeToken('#bridge-token=&x')).toEqual({ token: null, hash: '#x' })
    expect(splitBridgeToken('#bridge-token=has space')).toEqual({ token: null, hash: '' })
  })

  it('stores the token, leaves the bridge off if it was off, and strips it from the URL', () => {
    const calls: string[] = []
    const loc = { hash: '#keep&bridge-token=tok', pathname: '/app', search: '?q=1' }
    const hist = { state: { s: 1 }, replaceState: (_s: unknown, _t: string, url: string) => calls.push(url) }
    expect(intakeBridgeToken(loc, hist)).toBe('tok')
    expect(readBridgeSettings()).toEqual({ enabled: false, url: 'http://localhost:7331', token: 'tok' })
    expect(calls).toEqual(['/app?q=1#keep'])
  })

  it('keeps the bridge on, and its url, when it was already on', () => {
    writeBridgeSettings({ enabled: true, url: 'http://localhost:9000', token: 'old' })
    intakeBridgeToken({ hash: '#bridge-token=new', pathname: '/', search: '' }, { state: null, replaceState: () => {} })
    expect(readBridgeSettings()).toEqual({ enabled: true, url: 'http://localhost:9000', token: 'new' })
  })

  it('does nothing without a token in the hash', () => {
    const calls: string[] = []
    expect(intakeBridgeToken({ hash: '#x', pathname: '/', search: '' }, { state: null, replaceState: (_s, _t, u) => calls.push(u) })).toBeNull()
    expect(calls).toEqual([])
    expect(localStorage.getItem('vault:bridge')).toBeNull()
  })
})

describe('the agreed base, kept across reloads', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips per bridge url', () => {
    const doc = addNode(seedDoc(), { parent: 1, title: 'agreed' }).doc
    writeBridgeBase('http://localhost:7331', { rev: 9, doc })
    const back = readBridgeBase('http://localhost:7331')
    expect(back?.rev).toBe(9)
    expect(sameDoc(back!.doc, doc)).toBe(true)
    // Another bridge has no base with us.
    expect(readBridgeBase('http://localhost:9000')).toBeNull()
    writeBridgeBase('http://localhost:7331', null)
    expect(readBridgeBase('http://localhost:7331')).toBeNull()
  })

  it('reads junk as no base', () => {
    localStorage.setItem('vault:bridge-base', '{nope')
    expect(readBridgeBase('http://localhost:7331')).toBeNull()
    localStorage.setItem('vault:bridge-base', JSON.stringify({ url: 'http://localhost:7331', rev: 'x', doc: {} }))
    expect(readBridgeBase('http://localhost:7331')).toBeNull()
  })
})
