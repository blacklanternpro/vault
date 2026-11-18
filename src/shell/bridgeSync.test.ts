import { describe, expect, it } from 'vitest'
import { BridgeAuthError, type PullResult, type PushResult } from '../model/bridge'
import { addNode, byId, removeNode, sanitizeDoc, setStatus, updateNode } from '../model/doc'
import { sameDoc } from '../model/merge'
import type { Agreed } from '../model/sync'
import type { Doc } from '../model/types'
import { createBridgeSync, type Adoption } from './bridgeSync'

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

/** vault-agent's PUT /doc rule, in memory: a push must name the current rev. */
function fakeServer(doc: Doc, rev = 1) {
  const s = {
    doc,
    rev,
    puts: 0,
    refused: 0,
    down: false,
    authFails: false,
    /** Runs just before a push is judged: an agent writing in the gap. */
    beforePut: null as null | (() => void),
    agent(fn: (d: Doc) => Doc) {
      s.doc = sanitizeDoc(fn(s.doc))
      s.rev += 1
    },
    async health() {
      if (s.down) return { up: false, authorized: false }
      return { up: true, authorized: !s.authFails }
    },
    async pull(): Promise<PullResult> {
      if (s.down) throw new TypeError('Failed to fetch')
      if (s.authFails) throw new BridgeAuthError('bridge: GET /doc 401')
      return { doc: s.doc, savedAt: 0, rev: s.rev }
    },
    async push(next: Doc, base: number): Promise<PushResult> {
      if (s.down) return { ok: false, conflict: false, error: 'down' }
      s.beforePut?.()
      if (base !== s.rev) {
        s.refused += 1
        return { ok: false, conflict: true, doc: s.doc, savedAt: 0, rev: s.rev }
      }
      s.doc = sanitizeDoc(next)
      s.rev += 1
      s.puts += 1
      return { ok: true, savedAt: 0, rev: s.rev }
    },
  }
  return s
}

function browser(doc: Doc, server: ReturnType<typeof fakeServer>, opts: { agreed?: Agreed | null; unsaved?: boolean } = {}) {
  const b = {
    doc,
    saved: (opts.agreed ?? null) as Agreed | null,
    adoptions: [] as Adoption[],
    edit(fn: (d: Doc) => Doc) {
      b.doc = fn(b.doc)
    },
  }
  const sync = createBridgeSync({
    transport: { health: () => server.health(), pull: () => server.pull(), push: (d, base) => server.push(d, base) },
    mine: () => b.doc,
    mineUnsaved: () => opts.unsaved === true,
    agreed: opts.agreed ?? null,
    saveAgreed: (a) => {
      b.saved = a
    },
    adopt: (next, how) => {
      b.doc = next
      b.adoptions.push(how)
    },
  })
  return { b, sync }
}

const titles = (d: Doc) => d.nodes.map((n) => n.title)

describe('bridge sync: first contact', () => {
  it('an empty bridge gets mine', async () => {
    const server = fakeServer(sanitizeDoc({ nodes: [], notes: [] }), 0)
    const { b, sync } = browser(board(), server)
    expect(await sync.run()).toBe('online')
    expect(sameDoc(server.doc, board())).toBe(true)
    expect(b.saved?.rev).toBe(1)
    expect(b.adoptions).toEqual([])
  })

  it('a browser that never saved takes the bridge board, and says what it had before', async () => {
    const server = fakeServer(board(), 4)
    const before = sanitizeDoc({ nodes: [{ id: 1, title: 'SAMPLE', status: 'none', parent: null }], notes: [] })
    const { b, sync } = browser(before, server, { unsaved: true })
    await sync.run()
    expect(sameDoc(b.doc, board())).toBe(true)
    expect(b.adoptions).toMatchObject([{ kind: 'take', before }])
    expect(server.puts).toBe(0)
  })
})

describe('bridge sync: every contact compares', () => {
  it('nothing changed: no push, no adopt', async () => {
    const server = fakeServer(board(), 4)
    const { b, sync } = browser(board(), server, { agreed: { rev: 4, doc: board() } })
    await sync.run()
    await sync.run()
    expect(server.puts).toBe(0)
    expect(b.adoptions).toEqual([])
  })

  it('a local edit is pushed with the rev it was based on', async () => {
    const server = fakeServer(board(), 4)
    const { b, sync } = browser(board(), server, { agreed: { rev: 4, doc: board() } })
    b.edit((d) => updateNode(d, 2, { title: 'site v2' }))
    await sync.run()
    expect(byId(server.doc, 2)?.title).toBe('site v2')
    expect(server.refused).toBe(0)
    expect(b.saved?.rev).toBe(5)
  })

  it('an agent write with no local edits is taken', async () => {
    const server = fakeServer(board(), 4)
    const { b, sync } = browser(board(), server, { agreed: { rev: 4, doc: board() } })
    server.agent((d) => setStatus(d, 3, 'active'))
    await sync.run()
    expect(byId(b.doc, 3)?.status).toBe('active')
    expect(b.adoptions).toMatchObject([{ kind: 'take', changes: 1 }])
    expect(server.puts).toBe(0)
  })

  it('an agent write while the browser has unpushed edits: both survive (audit 2)', async () => {
    const server = fakeServer(board(), 4)
    const { b, sync } = browser(board(), server, { agreed: { rev: 4, doc: board() } })
    b.edit((d) => addNode(d, { parent: 1, title: 'mine' }).doc)
    server.agent((d) => addNode(d, { parent: 1, title: 'theirs' }).doc)
    await sync.run()
    expect(titles(server.doc)).toEqual(expect.arrayContaining(['mine', 'theirs']))
    expect(sameDoc(b.doc, server.doc)).toBe(true)
    expect(b.adoptions[0]).toMatchObject({ kind: 'merge' })
    // The id both minted stays the agent's; mine moved.
    expect(byId(server.doc, 4)?.title).toBe('theirs')
  })

  it('a 409 on a push takes the merge path, then lands', async () => {
    const server = fakeServer(board(), 4)
    const { b, sync } = browser(board(), server, { agreed: { rev: 4, doc: board() } })
    b.edit((d) => updateNode(d, 2, { title: 'mine' }))
    server.beforePut = () => {
      server.beforePut = null
      server.agent((d) => removeNode(d, 3))
    }
    await sync.run()
    expect(server.refused).toBe(1)
    expect(byId(server.doc, 2)?.title).toBe('mine')
    expect(byId(server.doc, 3)).toBeUndefined()
    expect(sameDoc(b.doc, server.doc)).toBe(true)
  })

  it('gives up after a few refusals in a row, without looping forever', async () => {
    const server = fakeServer(board(), 4)
    const { b, sync } = browser(board(), server, { agreed: { rev: 4, doc: board() } })
    b.edit((d) => updateNode(d, 2, { title: 'mine' }))
    let n = 0
    server.beforePut = () => server.agent((d) => updateNode(d, 3, { title: `agent ${++n}` }))
    expect(await sync.run()).toBe('online')
    expect(server.refused).toBeGreaterThan(1)
    expect(server.refused).toBeLessThanOrEqual(5)
    // Nothing of mine was lost on the way: it is still on screen to push next time.
    expect(byId(b.doc, 2)?.title).toBe('mine')
  })

  it('offline, both sides edit, the bridge comes back: merged, not replaced (audit 1)', async () => {
    const server = fakeServer(board(), 4)
    const { b, sync } = browser(board(), server, { agreed: { rev: 4, doc: board() } })
    server.down = true
    expect(await sync.run()).toBe('offline')
    b.edit((d) => addNode(d, { parent: 1, title: 'done offline' }).doc)
    server.down = false
    server.agent((d) => updateNode(d, 3, { title: 'deck (agent)' }))
    expect(await sync.run()).toBe('online')
    expect(titles(b.doc)).toEqual(expect.arrayContaining(['done offline', 'deck (agent)']))
    expect(sameDoc(b.doc, server.doc)).toBe(true)
  })

  it('a bridge that comes back with the copy we already agreed on does not replace newer local work', async () => {
    const server = fakeServer(board(), 4)
    const { b, sync } = browser(board(), server, { agreed: { rev: 4, doc: board() } })
    b.edit((d) => removeNode(d, 3))
    await sync.run()
    expect(byId(b.doc, 3)).toBeUndefined()
    expect(byId(server.doc, 3)).toBeUndefined()
    expect(b.adoptions).toEqual([])
  })

  it('reports a refused token apart from a dead bridge', async () => {
    const server = fakeServer(board(), 4)
    const { sync } = browser(board(), server)
    server.authFails = true
    expect(await sync.run()).toBe('auth')
    server.authFails = false
    server.down = true
    expect(await sync.run()).toBe('offline')
  })

  it('asks /health first, and does not pull from a bridge that will not have us', async () => {
    const server = fakeServer(board(), 4)
    let pulls = 0
    const sync = createBridgeSync({
      transport: {
        health: async () => ({ up: true, authorized: false }),
        pull: async () => {
          pulls += 1
          return server.pull()
        },
        push: (d, base) => server.push(d, base),
      },
      mine: () => board(),
      mineUnsaved: () => false,
      agreed: null,
      saveAgreed: () => {},
      adopt: () => {},
    })
    expect(await sync.run()).toBe('auth')
    expect(pulls).toBe(0)
  })

  it('after a reload the stored base still merges (a delete on the agent side is honoured, not resurrected)', async () => {
    const server = fakeServer(board(), 4)
    const first = browser(board(), server, { agreed: { rev: 4, doc: board() } })
    first.b.edit((d) => updateNode(d, 2, { title: 'synced' }))
    await first.sync.run()
    const stored = first.b.saved
    // Reload: a new engine, the stored base, the board from localStorage.
    const { b, sync } = browser(first.b.doc, server, { agreed: stored })
    b.edit((d) => addNode(d, { parent: 1, title: 'after reload' }).doc)
    server.agent((d) => removeNode(d, 3))
    await sync.run()
    expect(byId(server.doc, 3)).toBeUndefined()
    expect(titles(server.doc)).toEqual(expect.arrayContaining(['synced', 'after reload']))
  })

  it('runs one contact at a time (a poll and a push do not race each other)', async () => {
    const server = fakeServer(board(), 4)
    const { b, sync } = browser(board(), server, { agreed: { rev: 4, doc: board() } })
    b.edit((d) => updateNode(d, 2, { title: 'once' }))
    await Promise.all([sync.run(), sync.run(), sync.run()])
    expect(server.puts).toBe(1)
    expect(server.refused).toBe(0)
  })
})
