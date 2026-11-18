// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addNode, addNote, setNoteText } from './doc'
import { BACKUP_KEY, DOC_KEY, listBackups, load, save, snapshot } from './store'
import { seedDoc } from './seed'
import type { Doc } from './types'

/*
 * Save and load round trips while localStorage is close to full (audit 12),
 * and the behaviour audit 6 calls out: "snapshots can vanish quietly". The
 * board always wins over snapshots for space, which is right, but today
 * nothing tells the person their safety net just went.
 *
 * The quota is simulated by measuring what is stored (key + value lengths)
 * and throwing QuotaExceededError past a limit, as a browser does.
 */

let quota = Infinity

function used(s: Storage, except?: string): number {
  let n = 0
  for (let i = 0; i < s.length; i++) {
    const k = s.key(i)!
    if (k !== except) n += k.length + (s.getItem(k)?.length ?? 0)
  }
  return n
}

beforeEach(() => {
  localStorage.clear()
  quota = Infinity
  const real = Storage.prototype.setItem
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key: string, value: string) {
    if (used(this, key) + key.length + value.length > quota) throw new DOMException('full', 'QuotaExceededError')
    real.call(this, key, value)
  })
})
afterEach(() => vi.restoreAllMocks())

/** A board with `n` tasks, each carrying a body of `size` characters, and a few notes. */
function board(n: number, size: number, tag = 'v'): Doc {
  let d = seedDoc()
  for (let i = 0; i < n; i++) d = addNode(d, { parent: 1, title: `${tag} task ${i}`, body: `${tag}`.repeat(size) }).doc
  for (let i = 0; i < 3; i++) {
    const made = addNote(d, '')
    d = setNoteText(made.doc, made.id, `${tag} note ${i} — "quoted" \n second line`)
  }
  return d
}

function fillSnapshots(count: number, size: number): Doc {
  let d = seedDoc()
  for (let i = 0; i < count; i++) {
    d = addNode(d, { parent: 1, title: `snap ${i}`, body: 's'.repeat(size) }).doc
    snapshot(d, true)
  }
  return d
}

describe('save and load near the quota', () => {
  it('round-trips a board exactly with only a little headroom', () => {
    const doc = board(20, 400)
    quota = 40_000
    expect(save(doc)).toBe(true)
    const back = load()
    expect(back.origin).toBe('saved')
    expect(back.doc).toEqual(doc)
  })

  it('repeated saves as the board grows keep the latest board readable', () => {
    fillSnapshots(6, 1500)
    quota = used(localStorage) + 6000
    let doc = seedDoc()
    for (let i = 0; i < 12; i++) {
      doc = addNode(doc, { parent: 1, title: `grow ${i}`, body: 'g'.repeat(300) }).doc
      expect(save(doc)).toBe(true)
      expect(load().doc).toEqual(doc)
    }
  })

  it('refuses a board that cannot fit even with every snapshot gone, and leaves the last good save', () => {
    const small = board(2, 50)
    expect(save(small)).toBe(true)
    quota = used(localStorage) + 500
    const huge = board(5, 20_000, 'h')
    expect(save(huge)).toBe(false)
    expect(load().doc).toEqual(small)
  })

  it('today: trims snapshots to nothing to fit the board, and save reports plain success', () => {
    // Current behaviour, recorded so a change is noticed. See audit 6 below.
    fillSnapshots(8, 2000)
    expect(listBackups().length).toBe(8)
    const doc = board(4, 1500, 'b')
    // Room for the board and its envelope, and not for even one snapshot beside it.
    quota = JSON.stringify(doc).length + 400
    localStorage.removeItem(DOC_KEY)
    expect(save(doc)).toBe(true)
    expect(load().doc).toEqual(doc)
    expect(listBackups()).toEqual([])
    expect(localStorage.getItem(BACKUP_KEY)).toBeNull()
  })

  // Audit 6: "snapshots can vanish quietly". When the board's own save pushes
  // every snapshot out, nothing says so: save() answers `true` as if all were
  // well. Flips when either a snapshot survives or the caller is told.
  it.fails('audit 6: snapshots trimmed to fit the board are not lost silently', () => {
    fillSnapshots(8, 2000)
    const doc = board(4, 1500, 'b')
    quota = JSON.stringify(doc).length + 400
    localStorage.removeItem(DOC_KEY)
    const result: unknown = save(doc)
    const told = result !== true
    expect(listBackups().length > 0 || told).toBe(true)
  })
})
