// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { newer, ping, pullDoc, pullInbox, pushDoc, readBridgeSettings, removeInbox, writeBridgeSettings } from './bridge'
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
    expect(await removeInbox('http://x', 0)).toBe(true)
  })

  it('newer picks the later savedAt', () => {
    expect(newer({ savedAt: 1 }, { savedAt: 2 })).toBe('theirs')
    expect(newer({ savedAt: 3 }, { savedAt: 2 })).toBe('mine')
    expect(newer({ savedAt: 2 }, { savedAt: 2 })).toBe('same')
  })
})
