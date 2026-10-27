// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addNode, byId, setNoteText, addNote } from './doc'
import { parseLegacy } from './legacy'
import { BACKUP_KEY, DOC_KEY, exportText, importText, listBackups, load, save, snapshot } from './store'
import { seedDoc } from './seed'

const TRICKY = [
  'double "quotes" inside',
  'a line\nand another\n\nafter a blank line',
  'emoji 🔥 ünïcode — dash',
  'back\\slash // not a comment',
  '   leading and trailing   ',
  'NODE 5 "looks like source" status done',
  '',
]

describe('round trip', () => {
  beforeEach(() => localStorage.clear())

  it('keeps every string exactly, through save and load', () => {
    let doc = seedDoc()
    for (const text of TRICKY) {
      doc = addNode(doc, { parent: 1, title: text, body: text }).doc
      const n = addNote(doc, '')
      doc = setNoteText(n.doc, n.id, text)
    }
    expect(save(doc)).toBe(true)
    const back = load()
    expect(back.origin).toBe('saved')
    expect(back.doc).toEqual(doc)
  })

  it('keeps every string exactly, through export and import', () => {
    let doc = seedDoc()
    for (const text of TRICKY) doc = addNode(doc, { parent: 1, title: text }).doc
    expect(importText(exportText(doc))).toEqual(doc)
  })
})

describe('loading', () => {
  beforeEach(() => localStorage.clear())

  it('seeds an empty install', () => {
    expect(load()).toMatchObject({ origin: 'seed' })
  })

  it('migrates the old SPECK save and leaves it in place', () => {
    const old = `PIPE vault
  COL pending
NEST
  NODE 1 "client work" status none
    NODE 10 "BUILD SITE" status active URGENT
      BODY "para one"
      BODY "para two"
      NODE 11 "tick" status done
      NODE 12 "pulled" status rnd LOOSE
DUMP
  NOTE 09.09.26 NODE 10 "remember this"`
    localStorage.setItem('speck-os-v2', old)
    const r = load()
    expect(r.origin).toBe('migrated')
    expect(r.notice).toMatch(/4 items and 1 notes/)
    expect(byId(r.doc, 10)).toMatchObject({ title: 'BUILD SITE', status: 'active', urgent: true, body: 'para one\npara two' })
    expect(byId(r.doc, 12)).toMatchObject({ loose: true, parent: 10 })
    expect(r.doc.notes[0]).toMatchObject({ text: 'remember this', node: 10, date: '09.09.26' })
    expect(localStorage.getItem('speck-os-v2')).toBe(old)
    expect(listBackups().length).toBe(1)
  })

  it('never overwrites an unreadable save; falls back to the newest snapshot', () => {
    const good = addNode(seedDoc(), { parent: 1, title: 'only in the snapshot' }).doc
    snapshot(good, true)
    localStorage.setItem(DOC_KEY, '{"app":"vault","doc":{"nodes":[{"id":1,')
    const r = load()
    expect(r.origin).toBe('backup')
    expect(r.notice).toMatch(/couldn't be read/)
    expect(r.doc).toEqual(good)
    const parked = Object.keys(localStorage).filter((k) => k.startsWith('vault:unreadable:'))
    expect(parked.length).toBe(1)
  })

  it('throttles snapshots but keeps a forced one', () => {
    const a = seedDoc()
    snapshot(a)
    snapshot(addNode(a, { parent: 1, title: 'b' }).doc)
    expect(listBackups().length).toBe(1)
    snapshot(addNode(a, { parent: 1, title: 'c' }).doc, true)
    expect(listBackups().length).toBe(2)
    expect(JSON.parse(localStorage.getItem(BACKUP_KEY)!).length).toBe(2)
  })
})

describe('import', () => {
  it('reads a bare doc, an envelope, and an old SPECK save', () => {
    const doc = seedDoc()
    expect(importText(JSON.stringify(doc))).toEqual(doc)
    expect(importText(exportText(doc))).toEqual(doc)
    expect(importText('NEST\n  NODE 1 "p" status none').nodes[0].title).toBe('p')
  })

  it('refuses anything else', () => {
    expect(() => importText('hello there')).toThrow()
  })

  it('reads a legacy note that ran to the end of the line with no closing quote', () => {
    expect(parseLegacy('DUMP\n  NOTE 01.01.26 "unclosed').notes[0].text).toBe('unclosed')
  })
})

describe('when storage is full', () => {
  let quota = Infinity
  beforeEach(() => {
    localStorage.clear()
    quota = Infinity
    const real = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
      let used = 0
      for (let i = 0; i < this.length; i++) {
        const k = this.key(i)!
        if (k !== key) used += k.length + (this.getItem(k)?.length ?? 0)
      }
      if (used + key.length + value.length > quota) throw new DOMException('full', 'QuotaExceededError')
      real.call(this, key, value)
    })
  })
  afterEach(() => vi.restoreAllMocks())

  it('drops old snapshots to make room for the board, and keeps saving', () => {
    let doc = seedDoc()
    for (let i = 0; i < 8; i++) {
      doc = addNode(doc, { parent: 1, title: `t${i}`, body: 'x'.repeat(2000) }).doc
      snapshot(doc, true)
    }
    expect(listBackups().length).toBe(8)
    const size = JSON.stringify(localStorage).length
    quota = size + 3000
    const big = addNode(doc, { parent: 1, title: 'big', body: 'y'.repeat(6000) }).doc
    expect(save(big)).toBe(true)
    expect(load().doc).toEqual(big)
    expect(listBackups().length).toBeLessThan(8)
  })

  it('never saves over an unreadable board it could not set aside', () => {
    snapshot(seedDoc(), true)
    const damaged = '{"app":"vault","doc":' + 'z'.repeat(5000)
    localStorage.setItem(DOC_KEY, damaged)
    quota = JSON.stringify(localStorage).length + 100
    const r = load()
    expect(r.holdSave).toBe(true)
    expect(r.notice).toMatch(/won't save over it/)
    expect(localStorage.getItem(DOC_KEY)).toBe(damaged)
  })
})
