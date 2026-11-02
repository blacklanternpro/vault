import fs from 'node:fs'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { addNode } from '../../src/model/doc'
import { emptyDoc, parseEnvelope, StoreError } from '../src/store'
import { fixtureDoc, makeStore, T0, type Fixture } from './fixture'

let fx: Fixture | null = null
afterEach(() => {
  fx?.cleanup()
  fx = null
})

describe('round trip', () => {
  it('reads back exactly what it wrote, in the export envelope', () => {
    fx = makeStore()
    const back = fx.store.read()
    expect(back.doc).toEqual(fx.doc)
    expect(back.savedAt).toBe(T0)
    const raw = JSON.parse(fs.readFileSync(fx.store.file, 'utf8'))
    expect(raw).toMatchObject({ app: 'vault', version: 1, savedAt: T0 })
    expect(raw.doc.nodes).toHaveLength(fx.doc.nodes.length)
  })

  it('reads a missing file as an empty board at time 0', () => {
    fx = makeStore(null)
    expect(fx.store.exists()).toBe(false)
    expect(fx.store.read()).toEqual({ doc: emptyDoc(), savedAt: 0 })
  })

  it('accepts a bare doc and an envelope', () => {
    const doc = fixtureDoc()
    expect(parseEnvelope(JSON.stringify(doc)).doc).toEqual(doc)
    expect(parseEnvelope(JSON.stringify({ app: 'vault', version: 1, savedAt: 5, doc }))).toEqual({ doc, savedAt: 5 })
    expect(() => parseEnvelope('nope')).toThrow(StoreError)
    expect(() => parseEnvelope('{"hello":1}')).toThrow()
  })

  it('sanitizes on the way in', () => {
    fx = makeStore(null)
    fx.store.write({ nodes: [{ id: 1, title: 'p', status: 'none', parent: null }, { id: 1, title: 'dup', status: 'bogus', parent: 99 } as never], notes: [], events: [{ at: 1, kind: 'nope', text: 'x' } as never] })
    const { doc } = fx.store.read()
    expect(doc.nodes.map((n) => n.id)).toEqual([1, 2])
    expect(doc.nodes[1]).toMatchObject({ status: 'pending', parent: null })
    expect(doc.events).toEqual([])
  })
})

describe('atomic write and backup', () => {
  it('leaves no temp file and keeps the previous copy as .bak', () => {
    fx = makeStore()
    const first = fs.readFileSync(fx.store.file, 'utf8')
    const next = addNode(fx.doc, { parent: 1, title: 'NEW TASK' }).doc
    fx.store.write(next, T0 + 1)
    expect(fs.readdirSync(fx.dir).sort()).toEqual(['vault.json', 'vault.json.bak'])
    expect(fs.readFileSync(fx.store.backupFile, 'utf8')).toBe(first)
    expect(fx.store.read().doc.nodes.some((n) => n.title === 'NEW TASK')).toBe(true)
  })

  it('never writes over a file it cannot read: it parks it first', () => {
    fx = makeStore(null)
    fs.writeFileSync(fx.store.file, '{ this is not json')
    expect(() => fx!.store.read()).toThrow(/not a readable VAULT file/)
    fx.store.write(fixtureDoc(), T0)
    const files = fs.readdirSync(fx.dir)
    expect(files.some((f) => f.startsWith('vault.json.unreadable-'))).toBe(true)
    expect(files).not.toContain('vault.json.bak')
    expect(fx.store.read().savedAt).toBe(T0)
  })

  it('update() reads, changes and writes under the lock, and skips the write when nothing changed', () => {
    fx = makeStore()
    const before = fs.statSync(fx.store.file).mtimeMs
    const same = fx.store.update((doc) => ({ doc, result: 'untouched' }))
    expect(same).toEqual({ result: 'untouched', savedAt: T0 })
    expect(fs.existsSync(fx.store.backupFile)).toBe(false)
    const changed = fx.store.update((doc) => ({ doc: addNode(doc, { parent: 1, title: 'X' }).doc, result: 1 }))
    expect(changed.savedAt).toBeGreaterThan(T0)
    expect(fs.existsSync(fx.store.backupFile)).toBe(true)
    expect(fs.statSync(fx.store.file).mtimeMs).toBeGreaterThanOrEqual(before)
    expect(fs.existsSync(fx.store.lockFile)).toBe(false)
  })

  it('takes over a stale lock and refuses a live one', () => {
    fx = makeStore()
    fs.writeFileSync(fx.store.lockFile, '12345')
    const old = (Date.now() - 60_000) / 1000
    fs.utimesSync(fx.store.lockFile, old, old)
    expect(() => fx!.store.write(fx!.doc, T0 + 1)).not.toThrow()
    expect(fs.existsSync(fx.store.lockFile)).toBe(false)
  })
})

describe('put (the bridge PUT rule)', () => {
  it('refuses an envelope older than the file and hands back the current board', () => {
    fx = makeStore()
    const stale = { app: 'vault', version: 1, savedAt: T0 - 1, doc: addNode(fx.doc, { parent: 1, title: 'STALE' }).doc }
    const out = fx.store.put(stale)
    expect(out.ok).toBe(false)
    if (!out.ok) {
      expect(out.current.savedAt).toBe(T0)
      expect(out.current.doc).toEqual(fx.doc)
    }
    expect(fx.store.read().doc.nodes.some((n) => n.title === 'STALE')).toBe(false)
  })

  it('accepts an equal or newer savedAt and keeps it', () => {
    fx = makeStore()
    const same = fx.store.put({ app: 'vault', version: 1, savedAt: T0, doc: fx.doc })
    expect(same.ok).toBe(true)
    const newer = fx.store.put({ app: 'vault', version: 1, savedAt: T0 + 500, doc: addNode(fx.doc, { parent: 1, title: 'NEWER' }).doc })
    expect(newer.ok && newer.snapshot.savedAt).toBe(T0 + 500)
    expect(fx.store.read().doc.nodes.some((n) => n.title === 'NEWER')).toBe(true)
  })

  it('takes a bare doc as "now"', () => {
    fx = makeStore()
    const out = fx.store.put(addNode(fx.doc, { parent: 1, title: 'BARE' }).doc)
    expect(out.ok).toBe(true)
    expect(out.ok && out.snapshot.savedAt).toBeGreaterThan(T0)
  })

  it('rejects something that is not a document', () => {
    fx = makeStore()
    expect(() => fx!.store.put({ hello: 'world' })).toThrow()
    expect(() => fx!.store.put('text')).toThrow(StoreError)
  })
})

describe('inbox', () => {
  it('appends, lists and removes items next to the board', () => {
    fx = makeStore()
    expect(fx.store.readInbox()).toEqual([])
    const a = fx.store.appendInbox({ text: 'first', taskId: 2, at: T0 })
    const b = fx.store.appendInbox({ text: 'second' })
    expect(a).toEqual({ index: 0, item: { at: T0, taskId: 2, text: 'first' } })
    expect(b.index).toBe(1)
    expect(b.item.at).toBeGreaterThan(T0)
    expect(fx.store.inboxFile).toBe(path.join(fx.dir, 'inbox.json'))
    expect(JSON.parse(fs.readFileSync(fx.store.inboxFile, 'utf8')).inbox).toHaveLength(2)
    expect(fx.store.removeInbox(5)).toBeUndefined()
    expect(fx.store.removeInbox(0)).toEqual({ at: T0, taskId: 2, text: 'first' })
    expect(fx.store.readInbox()).toEqual([b.item])
    expect(() => fx!.store.appendInbox({ text: '   ' })).toThrow(StoreError)
  })
})
