// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest'
import { pullDoc, pullInbox, pushDoc, removeInbox } from './bridge'
import { addNode } from './doc'
import { seedDoc } from './seed'

/*
 * The browser bridge client held to the Phase 1 contract only (see the
 * contract commit on phase1/base). G1 is rewriting bridge.ts in parallel, so
 * nothing here leans on internals: only what the contract guarantees —
 *   - a push sends `base` (the rev it was edited from) and reads `rev` back;
 *   - a 409 hands back the server's doc, savedAt and rev, and is not an error;
 *   - every request carries `Authorization: Bearer <token>` when given one,
 *     and none when not;
 *   - inbox entries keep their server id, and removal is by that id.
 */

type Call = { url: string; method: string; auth: string | null; body: Record<string, unknown> | null }

function server(answer: (call: Call) => { status: number; body?: unknown }) {
  const calls: Call[] = []
  vi.spyOn(globalThis, 'fetch').mockImplementation(async (input, init) => {
    const call: Call = {
      url: String(input),
      method: init?.method ?? 'GET',
      auth: new Headers(init?.headers).get('authorization'),
      body: init?.body ? (JSON.parse(String(init.body)) as Record<string, unknown>) : null,
    }
    calls.push(call)
    const { status, body } = answer(call)
    return new Response(body === undefined || status === 204 ? null : JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
  })
  return calls
}

afterEach(() => vi.restoreAllMocks())

describe('bridge client, Phase 1 contract', () => {
  it('a pull reads rev from the envelope, and 0 when the server sends none', async () => {
    server(() => ({ status: 200, body: { app: 'vault', version: 1, savedAt: 10, rev: 7, doc: seedDoc() } }))
    expect(await pullDoc('http://x')).toMatchObject({ savedAt: 10, rev: 7 })
    vi.restoreAllMocks()
    server(() => ({ status: 200, body: { app: 'vault', version: 1, savedAt: 10, doc: seedDoc() } }))
    expect((await pullDoc('http://x')).rev).toBe(0)
  })

  it('a push carries base and the doc, and returns the rev the server wrote', async () => {
    const doc = addNode(seedDoc(), { parent: 1, title: 'pushed' }).doc
    const calls = server(() => ({ status: 200, body: { ok: true, savedAt: 50, rev: 13 } }))
    const r = await pushDoc('http://x', doc, 50, 12)
    expect(r).toMatchObject({ ok: true, rev: 13 })
    expect(calls).toHaveLength(1)
    expect(calls[0]).toMatchObject({ url: 'http://x/doc', method: 'PUT' })
    expect(calls[0].body).toMatchObject({ app: 'vault', base: 12 })
    expect((calls[0].body!.doc as { nodes: Array<{ title: string }> }).nodes.some((n) => n.title === 'pushed')).toBe(true)
  })

  it('base 0 is sent as 0 (a first write on an empty file), not dropped', async () => {
    const calls = server(() => ({ status: 200, body: { ok: true, savedAt: 1, rev: 1 } }))
    await pushDoc('http://x', seedDoc(), 1, 0)
    expect(calls[0].body).toHaveProperty('base', 0)
  })

  it('a refused push (409) returns the server copy and its rev, without throwing', async () => {
    const theirs = addNode(seedDoc(), { parent: 1, title: 'written by an agent' }).doc
    server(() => ({ status: 409, body: { app: 'vault', version: 1, savedAt: 99, rev: 21, doc: theirs } }))
    const r = await pushDoc('http://x', seedDoc(), 98, 20)
    expect(r.ok).toBe(false)
    if (r.ok || !r.conflict) throw new Error('expected a conflict')
    expect(r.rev).toBe(21)
    expect(r.savedAt).toBe(99)
    expect(r.doc.nodes.some((n) => n.title === 'written by an agent')).toBe(true)
  })

  it('any other failure is an error, not a conflict', async () => {
    server(() => ({ status: 500, body: { error: 'disk full' } }))
    expect(await pushDoc('http://x', seedDoc(), 1, 0)).toMatchObject({ ok: false, conflict: false })
    vi.restoreAllMocks()
    server(() => ({ status: 401, body: { error: 'token' } }))
    expect(await pushDoc({ url: 'http://x', token: 'wrong' }, seedDoc(), 1, 0)).toMatchObject({ ok: false, conflict: false })
  })

  it('sends the bearer token on every request when the target carries one', async () => {
    const calls = server((c) => {
      if (c.url.endsWith('/doc') && c.method === 'GET') return { status: 200, body: { app: 'vault', version: 1, savedAt: 1, rev: 1, doc: seedDoc() } }
      if (c.url.endsWith('/doc') && c.method === 'PUT') return { status: 200, body: { ok: true, savedAt: 2, rev: 2 } }
      if (c.url.endsWith('/inbox')) return { status: 200, body: { inbox: [] } }
      return { status: 200, body: {} }
    })
    const target = { url: 'http://x/', token: 's3cret' }
    await pullDoc(target)
    await pushDoc(target, seedDoc(), 2, 1)
    await pullInbox(target)
    await removeInbox(target, 'abc')
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual(['GET http://x/doc', 'PUT http://x/doc', 'GET http://x/inbox', 'DELETE http://x/inbox/abc'])
    expect(calls.every((c) => c.auth === 'Bearer s3cret')).toBe(true)
  })

  it('sends no Authorization header without a token', async () => {
    const calls = server(() => ({ status: 200, body: { app: 'vault', version: 1, savedAt: 1, rev: 1, doc: seedDoc() } }))
    await pullDoc('http://x')
    await pullDoc({ url: 'http://x' })
    expect(calls.every((c) => c.auth === null)).toBe(true)
  })

  it('inbox entries keep the id the server gave them, and removal names that id', async () => {
    const calls = server((c) =>
      c.method === 'DELETE'
        ? { status: 200, body: { removed: {} } }
        : {
            status: 200,
            body: {
              inbox: [
                { id: 'i-first', at: 1, taskId: 2, text: 'one' },
                { id: 'i-second', at: 2, text: 'two' },
              ],
            },
          },
    )
    const list = await pullInbox('http://x')
    expect(list.map((e) => e.id)).toEqual(['i-first', 'i-second'])
    // Two dismissals: each names its own entry, so the order they land in cannot remove the wrong one (audit 11).
    expect(await removeInbox('http://x', list[1].id!)).toBe(true)
    expect(await removeInbox('http://x', list[0].id!)).toBe(true)
    expect(calls.filter((c) => c.method === 'DELETE').map((c) => c.url)).toEqual(['http://x/inbox/i-second', 'http://x/inbox/i-first'])
  })

  it('an inbox id is escaped into the path', async () => {
    const calls = server(() => ({ status: 200, body: {} }))
    await removeInbox('http://x', 'a/b c')
    expect(calls[0].url).toBe('http://x/inbox/a%2Fb%20c')
  })

  it('a removal the server refuses reports false', async () => {
    server(() => ({ status: 404, body: { error: 'no inbox item' } }))
    expect(await removeInbox('http://x', 'gone')).toBe(false)
  })
})
