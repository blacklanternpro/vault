import http from 'node:http'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { addNode, logEvent } from '../../src/model/doc'
import type { Doc } from '../../src/model/types'
import { LIVE_SITE_ORIGIN } from '../src/config'
import { startBridge, type RunningBridge } from '../src/http'
import { makeStore, T0, type Fixture } from './fixture'

let fx: Fixture
let bridge: RunningBridge
let token: string
const ORIGIN = 'http://localhost:5173'
const TOKEN = 'test-token-0123456789abcdefghijklmnopqrstuv'

beforeEach(async () => {
  fx = makeStore()
  token = TOKEN
  bridge = await startBridge({ store: fx.store, port: 0, origins: [ORIGIN, 'https://vault.example.app'], token: () => token })
})
afterEach(async () => {
  await bridge.close()
  fx.cleanup()
})

type Reply = { status: number; body: unknown; headers: Headers }
/** A request with the right token unless `auth` says otherwise (`null` = no Authorization header). */
async function call(method: string, path: string, body?: unknown, headers: Record<string, string> = {}, auth: string | null = TOKEN): Promise<Reply> {
  const res = await fetch(bridge.url + path, {
    method,
    headers: { ...(body === undefined ? {} : { 'Content-Type': 'application/json' }), ...(auth == null ? {} : { Authorization: `Bearer ${auth}` }), ...headers },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  })
  const text = await res.text()
  return { status: res.status, body: text ? JSON.parse(text) : null, headers: res.headers }
}

/** node:http, for what fetch will not do: a forged Host header, a chunked body with no length. */
function raw(opts: { method?: string; path?: string; headers?: Record<string, string>; chunks?: Buffer[] }): Promise<{ status: number; body: string; headers: http.IncomingHttpHeaders }> {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: bridge.port, method: opts.method ?? 'GET', path: opts.path ?? '/doc', headers: { Authorization: `Bearer ${TOKEN}`, ...opts.headers } }, (res) => {
      const parts: Buffer[] = []
      res.on('data', (c: Buffer) => parts.push(c))
      res.on('end', () => resolve({ status: res.statusCode ?? 0, body: Buffer.concat(parts).toString('utf8'), headers: res.headers }))
      res.on('error', reject)
    })
    req.on('error', reject)
    const write = async () => {
      for (const c of opts.chunks ?? []) {
        if (req.destroyed) return
        if (!req.write(c)) await new Promise((r) => req.once('drain', r))
      }
      req.end()
    }
    write().catch(() => {})
  })
}

const envelope = (doc: Doc, extra: Record<string, unknown> = {}) => ({ app: 'vault', version: 1, savedAt: T0 + 1000, doc, ...extra })

describe('the token (audit 4)', () => {
  it('no token → 401 with a JSON error that says how to get the link', async () => {
    const r = await call('GET', '/doc', undefined, {}, null)
    expect(r.status).toBe(401)
    expect((r.body as { error: string }).error).toMatch(/vault-agent token/)
    expect(r.headers.get('www-authenticate')).toMatch(/^Bearer/)
  })

  it('wrong token → 401, for reads and writes alike, and nothing is written', async () => {
    expect((await call('GET', '/doc', undefined, {}, 'nope')).status).toBe(401)
    expect((await call('GET', '/inbox', undefined, {}, TOKEN + 'x')).status).toBe(401)
    expect((await call('GET', '/events', undefined, {}, TOKEN.slice(0, -1))).status).toBe(401)
    const put = await call('PUT', '/doc', envelope(addNode(fx.doc, { parent: 1, title: 'SNEAKY' }).doc, { base: 1 }), {}, 'nope')
    expect(put.status).toBe(401)
    expect((await call('POST', '/inbox', { text: 'x' }, {}, null)).status).toBe(401)
    expect((await call('DELETE', '/inbox/i0', undefined, {}, null)).status).toBe(401)
    expect(fx.store.read().rev).toBe(1)
    expect(fx.store.readInbox()).toEqual([])
  })

  it('a malformed Authorization header is no token', async () => {
    expect((await call('GET', '/doc', undefined, { Authorization: TOKEN }, null)).status).toBe(401)
    expect((await call('GET', '/doc', undefined, { Authorization: `Basic ${TOKEN}` }, null)).status).toBe(401)
    expect((await call('GET', '/doc', undefined, { Authorization: `bearer ${TOKEN}` }, null)).status).toBe(200)
  })

  it('right token → 200', async () => {
    expect((await call('GET', '/doc')).status).toBe(200)
    expect((await call('GET', '/inbox')).status).toBe(200)
  })

  it('a rotated token takes over at once; the old one stops working', async () => {
    token = 'rotated-token-0123456789abcdefghijklmnop'
    expect((await call('GET', '/doc')).status).toBe(401)
    expect((await call('GET', '/doc', undefined, {}, token)).status).toBe(200)
  })

  it('a 401 to an allowed page still carries CORS headers, so the app can read why', async () => {
    const r = await call('GET', '/doc', undefined, { Origin: ORIGIN }, null)
    expect(r.status).toBe(401)
    expect(r.headers.get('access-control-allow-origin')).toBe(ORIGIN)
  })
})

describe('GET /health', () => {
  it('without the token: open, but only who is there and that a token is needed', async () => {
    const r = await call('GET', '/health', undefined, {}, null)
    expect(r.status).toBe(200)
    expect(r.body).toEqual({ app: 'vault-agent', version: expect.any(String), authorized: false })
    const wrong = await call('GET', '/health', undefined, {}, 'nope')
    expect(wrong.body).toEqual({ app: 'vault-agent', version: expect.any(String), authorized: false })
    expect((await call('GET', '/', undefined, {}, null)).body).toMatchObject({ authorized: false })
  })

  it('with the token: the file, savedAt, rev, counts', async () => {
    const h = await call('GET', '/health')
    expect(h.body).toMatchObject({ app: 'vault-agent', authorized: true, file: fx.store.file, savedAt: T0, rev: 1, nodes: 22, inbox: 0 })
  })

  it('only GET', async () => {
    expect((await call('POST', '/health', {})).status).toBe(405)
  })
})

describe('the Host check (DNS rebinding)', () => {
  it('refuses a request whose Host is another name, before touching anything', async () => {
    const r = await raw({ headers: { Host: `evil.example:${bridge.port}` } })
    expect(r.status).toBe(421)
    expect(JSON.parse(r.body).error).toMatch(/Host/)
    expect(r.headers['access-control-allow-origin']).toBeUndefined()
    const put = await raw({ method: 'PUT', headers: { Host: `evil.example:${bridge.port}`, 'Content-Type': 'application/json' }, chunks: [Buffer.from(JSON.stringify(envelope(fx.doc, { base: 1 })))] })
    expect(put.status).toBe(421)
    expect(fx.store.read().rev).toBe(1)
  })

  it('refuses the right name on the wrong port, a missing port, and the health check too', async () => {
    expect((await raw({ headers: { Host: `127.0.0.1:${bridge.port + 1}` } })).status).toBe(421)
    expect((await raw({ headers: { Host: '127.0.0.1' } })).status).toBe(421)
    expect((await raw({ path: '/health', headers: { Host: `evil.example:${bridge.port}` } })).status).toBe(421)
    expect((await raw({ method: 'OPTIONS', headers: { Host: `evil.example:${bridge.port}`, Origin: ORIGIN } })).status).toBe(421)
  })

  it('takes 127.0.0.1, localhost and [::1] at the bound port, in any case', async () => {
    for (const host of [`127.0.0.1:${bridge.port}`, `localhost:${bridge.port}`, `LOCALHOST:${bridge.port}`, `[::1]:${bridge.port}`]) {
      expect((await raw({ headers: { Host: host } })).status, host).toBe(200)
    }
  })
})

describe('CORS and origins (audit 5)', () => {
  it('answers a preflight without the token for an allowed origin', async () => {
    const pre = await call('OPTIONS', '/doc', undefined, { Origin: ORIGIN, 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Headers': 'authorization, content-type' }, null)
    expect(pre.status).toBe(204)
    expect(pre.headers.get('access-control-allow-origin')).toBe(ORIGIN)
    expect(pre.headers.get('access-control-allow-methods')).toContain('PUT')
    expect(pre.headers.get('access-control-allow-headers')).toBe('Content-Type, Authorization')
  })

  it('refuses a preflight from any other origin, with no CORS or Private Network headers', async () => {
    const pre = await call('OPTIONS', '/doc', undefined, { Origin: 'http://evil.example', 'Access-Control-Request-Method': 'PUT', 'Access-Control-Request-Private-Network': 'true' }, null)
    expect(pre.status).toBe(403)
    expect(pre.headers.get('access-control-allow-origin')).toBeNull()
    expect(pre.headers.get('access-control-allow-private-network')).toBeNull()
  })

  it('answers Chrome’s Private Network Access preflight for an allowed origin only', async () => {
    const pre = await call('OPTIONS', '/doc', undefined, { Origin: 'https://vault.example.app', 'Access-Control-Request-Method': 'GET', 'Access-Control-Request-Private-Network': 'true' }, null)
    expect(pre.status).toBe(204)
    expect(pre.headers.get('access-control-allow-private-network')).toBe('true')
  })

  it('an unknown origin gets 403 naming the exact flag to add, even with the right token', async () => {
    const bad = await call('GET', '/doc', undefined, { Origin: 'http://evil.example' })
    expect(bad.status).toBe(403)
    expect((bad.body as { error: string }).error).toContain('--origin http://evil.example')
    expect(bad.headers.get('access-control-allow-origin')).toBeNull()
    expect((await call('PUT', '/doc', envelope(fx.doc, { base: 1 }), { Origin: 'http://evil.example' })).status).toBe(403)
    expect(fx.store.read().rev).toBe(1)
  })

  it('the live site is refused unless it was given', async () => {
    const r = await call('GET', '/doc', undefined, { Origin: LIVE_SITE_ORIGIN })
    expect(r.status).toBe(403)
    expect((r.body as { error: string }).error).toContain(`--origin ${LIVE_SITE_ORIGIN}`)
    const pre = await call('OPTIONS', '/doc', undefined, { Origin: LIVE_SITE_ORIGIN, 'Access-Control-Request-Method': 'GET' }, null)
    expect(pre.status).toBe(403)

    const opted = await startBridge({ store: fx.store, port: 0, origins: [ORIGIN, LIVE_SITE_ORIGIN], token: TOKEN })
    try {
      const ok = await fetch(`${opted.url}/doc`, { headers: { Origin: LIVE_SITE_ORIGIN, Authorization: `Bearer ${TOKEN}` } })
      expect(ok.status).toBe(200)
      expect(ok.headers.get('access-control-allow-origin')).toBe(LIVE_SITE_ORIGIN)
    } finally {
      await opted.close()
    }
  })

  it('an allowed origin with a trailing slash is the same origin', async () => {
    const ok = await call('GET', '/doc', undefined, { Origin: 'https://vault.example.app/' })
    expect(ok.status).toBe(200)
    expect(ok.headers.get('access-control-allow-origin')).toBe('https://vault.example.app/')
  })

  it('a request with no Origin (curl, scripts) still needs the token', async () => {
    expect((await call('GET', '/doc', undefined, {}, null)).status).toBe(401)
  })
})

describe('the size cap', () => {
  it('refuses a body over the cap with 413 from its Content-Length, before reading it', async () => {
    const small = await startBridge({ store: fx.store, port: 0, token: TOKEN, maxBody: 1024 })
    try {
      const body = JSON.stringify(envelope(fx.doc, { base: 1 }))
      expect(body.length).toBeGreaterThan(1024)
      const r = await fetch(`${small.url}/doc`, { method: 'PUT', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }, body })
      expect(r.status).toBe(413)
      expect(((await r.json()) as { error: string }).error).toMatch(/1 KiB.*--max-body/)
      expect(fx.store.read().rev).toBe(1)
      // A declared length over the cap is answered at once, without waiting for (or buffering) the body.
      const early = await new Promise<number>((resolve, reject) => {
        const req = http.request({ host: '127.0.0.1', port: small.port, method: 'PUT', path: '/doc', headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Length': String(1024 * 1024 * 1024) } }, (res) => {
          res.resume()
          resolve(res.statusCode ?? 0)
          req.destroy()
        })
        req.on('error', reject)
        req.write('{"app":"vault"')
      })
      expect(early).toBe(413)
    } finally {
      await small.close()
    }
  })

  it('refuses a streamed body (no Content-Length) once it passes the cap', async () => {
    const small = await startBridge({ store: fx.store, port: 0, token: TOKEN, maxBody: 64 * 1024 })
    try {
      const chunks = Array.from({ length: 40 }, () => Buffer.alloc(8 * 1024, 0x20))
      const r = await new Promise<number>((resolve, reject) => {
        const req = http.request({ host: '127.0.0.1', port: small.port, method: 'POST', path: '/inbox', headers: { Authorization: `Bearer ${TOKEN}`, 'Transfer-Encoding': 'chunked' } }, (res) => {
          res.resume()
          resolve(res.statusCode ?? 0)
        })
        req.on('error', reject)
        ;(async () => {
          for (const c of chunks) {
            if (req.destroyed) return
            if (!req.write(c)) await new Promise((ok) => req.once('drain', ok))
          }
          req.end()
        })().catch(() => {})
      })
      expect(r).toBe(413)
      expect(fx.store.readInbox()).toEqual([])
    } finally {
      await small.close()
    }
  })

  it('the default cap takes a real board', async () => {
    const r = await call('PUT', '/doc', envelope(addNode(fx.doc, { parent: 1, title: 'FITS' }).doc, { base: 1 }))
    expect(r.status).toBe(200)
  })
})

describe('GET /doc', () => {
  it('serves the board as the export envelope, with rev', async () => {
    const r = await call('GET', '/doc')
    expect(r.status).toBe(200)
    expect(r.body).toMatchObject({ app: 'vault', version: 1, savedAt: T0, rev: 1 })
    expect((r.body as { doc: { nodes: unknown[] } }).doc.nodes).toHaveLength(fx.doc.nodes.length)
    expect(r.headers.get('cache-control')).toBe('no-store')
  })

  it('binds to loopback on an ephemeral port', () => {
    expect(bridge.host).toBe('127.0.0.1')
    expect(bridge.port).toBeGreaterThan(0)
    expect(bridge.url).toBe(`http://127.0.0.1:${bridge.port}`)
  })
})

describe('PUT /doc (versioned)', () => {
  it('a PUT based on the current rev lands, keeps its savedAt and bumps rev', async () => {
    const got = (await call('GET', '/doc')).body as { rev: number; doc: Doc }
    expect(got.rev).toBe(1)
    const r = await call('PUT', '/doc', envelope(addNode(got.doc, { parent: 1, title: 'FROM THE BROWSER' }).doc, { base: got.rev }))
    expect(r).toMatchObject({ status: 200, body: { ok: true, savedAt: T0 + 1000, rev: 2 } })
    const back = fx.store.read()
    expect(back).toMatchObject({ savedAt: T0 + 1000, rev: 2 })
    expect(back.doc.nodes.at(-1)?.title).toBe('FROM THE BROWSER')
  })

  it('without base → 428 Precondition Required, saying what to send; nothing is written', async () => {
    const r = await call('PUT', '/doc', envelope(addNode(fx.doc, { parent: 1, title: 'NO BASE' }).doc))
    expect(r.status).toBe(428)
    expect((r.body as { error: string }).error).toMatch(/send base.*GET \/doc/)
    expect((await call('PUT', '/doc', addNode(fx.doc, { parent: 1, title: 'BARE' }).doc)).status).toBe(428)
    expect((await call('PUT', '/doc', envelope(fx.doc, { base: 'one' }))).status).toBe(428)
    expect(fx.store.read().rev).toBe(1)
  })

  it('a stale base → 409 with the current envelope, even if its savedAt is newer', async () => {
    fx.store.update((doc) => ({ doc: addNode(doc, { parent: 1, title: 'AGENT' }).doc, result: null }))
    const r = await call('PUT', '/doc', { app: 'vault', version: 1, savedAt: Date.now() + 60_000, base: 1, doc: fx.doc })
    expect(r.status).toBe(409)
    expect(r.body).toMatchObject({ app: 'vault', rev: 2 })
    expect((r.body as { doc: Doc }).doc.nodes.some((n) => n.title === 'AGENT')).toBe(true)
    expect(fx.store.read().doc.nodes.some((n) => n.title === 'AGENT')).toBe(true)
    // A base from the future is just as stale.
    expect((await call('PUT', '/doc', envelope(fx.doc, { base: 99 }))).status).toBe(409)
  })

  it('rejects bad JSON and non-documents with 400', async () => {
    expect((await call('PUT', '/doc', '{not json')).status).toBe(400)
    expect((await call('PUT', '/doc', { hello: 1, base: 1 })).status).toBe(400)
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

describe('inbox (audit 11)', () => {
  it('posts (answering the id), lists and deletes by id', async () => {
    const posted = await call('POST', '/inbox', { text: '## Report\n- [x] done', taskId: 2 })
    expect(posted.status).toBe(201)
    const id = (posted.body as { id: string }).id
    expect(id).toMatch(/^i[0-9a-f]+$/)
    expect(posted.body).toEqual({ id, item: { id, at: expect.any(Number), taskId: 2, text: '## Report\n- [x] done' } })
    await call('POST', '/inbox', { text: 'second', at: T0 })
    const list = await call('GET', '/inbox')
    expect(list.body).toMatchObject({ inbox: [{ id, taskId: 2 }, { at: T0, text: 'second' }] })
    const gone = await call('DELETE', `/inbox/${id}`)
    expect(gone.status).toBe(200)
    expect(gone.body).toMatchObject({ removed: { id, taskId: 2 }, inbox: [{ text: 'second' }] })
    expect((await call('DELETE', `/inbox/${id}`)).status).toBe(404)
    expect((await call('DELETE', '/inbox/x')).status).toBe(404)
    expect((await call('POST', '/inbox', { text: '' })).status).toBe(400)
    expect((await call('POST', '/inbox', { text: 'x', taskId: 'two' })).status).toBe(400)
    expect(fx.store.readInbox()).toEqual([{ id: expect.any(String), at: T0, text: 'second' }])
  })

  it('a bare position is no longer accepted: 400 that says to use the id', async () => {
    await call('POST', '/inbox', { text: 'keep me' })
    const r = await call('DELETE', '/inbox/0')
    expect(r.status).toBe(400)
    expect((r.body as { error: string }).error).toMatch(/by id/)
    expect(fx.store.readInbox()).toHaveLength(1)
  })

  it('deletes by id, so two removals at once take the right items', async () => {
    const a = (await call('POST', '/inbox', { text: 'a' })).body as { id: string }
    const b = (await call('POST', '/inbox', { text: 'b' })).body as { id: string }
    await call('POST', '/inbox', { text: 'c' })
    const [ra, rb] = await Promise.all([call('DELETE', `/inbox/${b.id}`), call('DELETE', `/inbox/${a.id}`)])
    expect([ra.status, rb.status]).toEqual([200, 200])
    expect(fx.store.readInbox().map((i) => i.text)).toEqual(['c'])
  })

  it('an item an agent filed through the store (MCP, CLI) can be deleted by its id over HTTP', async () => {
    const { item } = fx.store.appendInbox({ text: 'from vault_report', taskId: 2 })
    const list = (await call('GET', '/inbox')).body as { inbox: { id: string }[] }
    expect(list.inbox.map((i) => i.id)).toEqual([item.id])
    expect((await call('DELETE', `/inbox/${encodeURIComponent(item.id)}`)).status).toBe(200)
  })
})

describe('routing', () => {
  it('404s anything else (behind the token)', async () => {
    expect((await call('GET', '/nope')).status).toBe(404)
    expect((await call('GET', '/inbox/i0/extra')).status).toBe(404)
    expect((await call('GET', '/nope', undefined, {}, null)).status).toBe(401)
  })
})
