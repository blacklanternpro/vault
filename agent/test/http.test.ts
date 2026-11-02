import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { addNode, logEvent } from '../../src/model/doc'
import { startBridge, type RunningBridge } from '../src/http'
import { makeStore, T0, type Fixture } from './fixture'

let fx: Fixture
let bridge: RunningBridge
const ORIGIN = 'http://localhost:5173'

beforeEach(async () => {
  fx = makeStore()
  bridge = await startBridge({ store: fx.store, port: 0, origins: [ORIGIN, 'https://vault.example.app'] })
})
afterEach(async () => {
  await bridge.close()
  fx.cleanup()
})

type Reply = { status: number; body: unknown; headers: Headers }
async function call(method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Promise<Reply> {
  const res = await fetch(bridge.url + path, {
    method,
    headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...headers },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  })
  const text = await res.text()
  return { status: res.status, body: text ? JSON.parse(text) : null, headers: res.headers }
}

describe('GET /doc and /health', () => {
  it('serves the board as the export envelope', async () => {
    const r = await call('GET', '/doc')
    expect(r.status).toBe(200)
    expect(r.body).toMatchObject({ app: 'vault', version: 1, savedAt: T0 })
    expect((r.body as { doc: { nodes: unknown[] } }).doc.nodes).toHaveLength(fx.doc.nodes.length)
    expect(r.headers.get('cache-control')).toBe('no-store')
    const h = await call('GET', '/health')
    expect(h.body).toMatchObject({ app: 'vault-agent', file: fx.store.file, savedAt: T0, nodes: 22, inbox: 0 })
  })

  it('binds to loopback on an ephemeral port', () => {
    expect(bridge.host).toBe('127.0.0.1')
    expect(bridge.port).toBeGreaterThan(0)
    expect(bridge.url).toBe(`http://127.0.0.1:${bridge.port}`)
  })
})

describe('PUT /doc', () => {
  it('replaces the board from an envelope and keeps its savedAt', async () => {
    const doc = addNode(fx.doc, { parent: 1, title: 'FROM THE BROWSER' }).doc
    const r = await call('PUT', '/doc', { app: 'vault', version: 1, savedAt: T0 + 1000, doc })
    expect(r).toMatchObject({ status: 200, body: { ok: true, savedAt: T0 + 1000 } })
    const back = fx.store.read()
    expect(back.savedAt).toBe(T0 + 1000)
    expect(back.doc.nodes.at(-1)?.title).toBe('FROM THE BROWSER')
  })

  it('accepts a bare doc and stamps it now', async () => {
    const r = await call('PUT', '/doc', addNode(fx.doc, { parent: 1, title: 'BARE' }).doc)
    expect(r.status).toBe(200)
    expect((r.body as { savedAt: number }).savedAt).toBeGreaterThan(T0)
  })

  it('answers 409 with the current board when the PUT is older than the file', async () => {
    const stale = { app: 'vault', version: 1, savedAt: T0 - 1, doc: addNode(fx.doc, { parent: 1, title: 'STALE' }).doc }
    const r = await call('PUT', '/doc', stale)
    expect(r.status).toBe(409)
    expect(r.body).toMatchObject({ app: 'vault', savedAt: T0 })
    expect((r.body as { doc: { nodes: { title: string }[] } }).doc.nodes.some((n) => n.title === 'STALE')).toBe(false)
    expect(fx.store.read().savedAt).toBe(T0)
  })

  it('rejects bad JSON and non-documents with 400', async () => {
    expect((await call('PUT', '/doc', '{not json')).status).toBe(400)
    expect((await call('PUT', '/doc', { hello: 1 })).status).toBe(400)
    expect((await call('PUT', '/doc', '')).status).toBe(400)
    expect((await call('POST', '/doc', {})).status).toBe(405)
  })
})

describe('GET /events', () => {
  it('returns events after `since`, newest first', async () => {
    fx.store.write(logEvent(fx.doc, 'note', 'fresh', 8, T0 + 10), T0 + 10)
    const all = await call('GET', '/events')
    expect((all.body as { events: unknown[] }).events).toHaveLength(fx.doc.events.length + 1)
    const some = await call('GET', `/events?since=${T0 - 2 * 60_000}`)
    expect(some.body).toMatchObject({ since: T0 - 120_000, savedAt: T0 + 10 })
    expect((some.body as { events: { text: string }[] }).events.map((e) => e.text)).toEqual(['fresh', 'moved to ACTIVE'])
    expect((await call('GET', '/events?since=soon')).status).toBe(400)
  })
})

describe('inbox', () => {
  it('posts, lists and deletes', async () => {
    const posted = await call('POST', '/inbox', { text: '## Report\n- [x] done', taskId: 2 })
    expect(posted.status).toBe(201)
    expect(posted.body).toMatchObject({ index: 0, item: { taskId: 2, text: '## Report\n- [x] done' } })
    await call('POST', '/inbox', { text: 'second', at: T0 })
    const list = await call('GET', '/inbox')
    expect(list.body).toMatchObject({ inbox: [{ taskId: 2 }, { at: T0, text: 'second' }] })
    const gone = await call('DELETE', '/inbox/0')
    expect(gone.status).toBe(200)
    expect(gone.body).toMatchObject({ removed: { taskId: 2 }, inbox: [{ text: 'second' }] })
    expect((await call('DELETE', '/inbox/7')).status).toBe(404)
    expect((await call('DELETE', '/inbox/x')).status).toBe(400)
    expect((await call('POST', '/inbox', { text: '' })).status).toBe(400)
    expect((await call('POST', '/inbox', { text: 'x', taskId: 'two' })).status).toBe(400)
    expect(fx.store.readInbox()).toEqual([{ at: T0, text: 'second' }])
  })
})

describe('CORS and routing', () => {
  it('answers preflight for an allowed origin and refuses others', async () => {
    const pre = await call('OPTIONS', '/doc', undefined, { Origin: ORIGIN, 'Access-Control-Request-Method': 'PUT' })
    expect(pre.status).toBe(204)
    expect(pre.headers.get('access-control-allow-origin')).toBe(ORIGIN)
    expect(pre.headers.get('access-control-allow-methods')).toContain('PUT')
    expect(pre.headers.get('access-control-allow-headers')).toBe('Content-Type')
    const ok = await call('GET', '/doc', undefined, { Origin: 'https://vault.example.app/' })
    expect(ok.status).toBe(200)
    expect(ok.headers.get('access-control-allow-origin')).toBe('https://vault.example.app/')
    const bad = await call('GET', '/doc', undefined, { Origin: 'http://evil.example' })
    expect(bad.status).toBe(403)
    expect(bad.headers.get('access-control-allow-origin')).toBeNull()
    const badPut = await call('PUT', '/doc', fx.doc, { Origin: 'http://evil.example' })
    expect(badPut.status).toBe(403)
  })

  it('404s anything else', async () => {
    expect((await call('GET', '/nope')).status).toBe(404)
    expect((await call('GET', '/inbox/0/extra')).status).toBe(404)
  })
})
