import { describe, expect, it } from 'vitest'
import { addNode, byId, removeNode, sanitizeDoc, setStatus, updateNode } from './doc'
import { sameDoc } from './merge'
import { adoptMessage, planSync, pushLanded } from './sync'
import { seedDoc } from './seed'
import type { Doc } from './types'

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

const empty = sanitizeDoc({ nodes: [], notes: [], events: [] })

describe('planSync: every contact compares (rev + local changes)', () => {
  it('nothing changed on either side: nothing to do', () => {
    const b = board()
    expect(planSync({ rev: 4, doc: b }, b, { rev: 4, doc: b })).toEqual({ act: 'none', agreed: { rev: 4, doc: b } })
  })

  it('a copy with the same content under a new rev is no change (the rev is just remembered)', () => {
    const b = board()
    const copy = sanitizeDoc(JSON.parse(JSON.stringify(b)))
    const p = planSync({ rev: 4, doc: b }, b, { rev: 6, doc: copy })
    expect(p).toMatchObject({ act: 'none', agreed: { rev: 6 } })
  })

  it('mine changed, theirs did not: push mine, based on their rev', () => {
    const b = board()
    const m = updateNode(b, 2, { title: 'site v2' })
    expect(planSync({ rev: 4, doc: b }, m, { rev: 4, doc: b })).toEqual({ act: 'push', doc: m, base: 4 })
  })

  it('theirs changed, mine did not: take theirs', () => {
    const b = board()
    const t = setStatus(b, 3, 'active')
    expect(planSync({ rev: 4, doc: b }, b, { rev: 5, doc: t })).toMatchObject({ act: 'take', doc: t, rev: 5, changes: 1 })
  })

  it('both changed: merge against the agreed doc, to be pushed based on their rev', () => {
    const b = board()
    const m = updateNode(b, 2, { title: 'site v2' })
    const t = removeNode(b, 3)
    const p = planSync({ rev: 4, doc: b }, m, { rev: 5, doc: t })
    expect(p.act).toBe('merge')
    if (p.act !== 'merge') return
    expect(p.rev).toBe(5)
    expect(byId(p.doc, 2)?.title).toBe('site v2')
    expect(byId(p.doc, 3)).toBeUndefined()
    expect(p.result.theirChanges).toBe(1)
  })

  it('a reused rev (file restored from .bak, deleted, or another --file) is still compared by content', () => {
    const b = board()
    const other = sanitizeDoc({ nodes: [{ id: 5, title: 'ANOTHER BOARD', status: 'none', parent: null }], notes: [] })
    // Mine unchanged: take theirs, though the rev is the one we agreed on.
    expect(planSync({ rev: 3, doc: b }, b, { rev: 3, doc: other })).toMatchObject({ act: 'take', doc: other, rev: 3 })
    // Mine changed too: merge, never a push that would silently replace their board.
    const m = addNode(b, { parent: 1, title: 'my new' }).doc
    const p = planSync({ rev: 3, doc: b }, m, { rev: 3, doc: other })
    expect(p.act).toBe('merge')
    if (p.act !== 'merge') return
    expect(p.doc.nodes.map((n) => n.title)).toEqual(expect.arrayContaining(['ANOTHER BOARD', 'my new']))
  })

  it('a late reconnect with an older copy of the board does not replace mine (audit 1)', () => {
    // Agreed at rev 7. The bridge comes back serving rev 7 (it never saw our later edits): push, never take.
    const b = board()
    const m = addNode(b, { parent: 1, title: 'done while offline' }).doc
    expect(planSync({ rev: 7, doc: b }, m, { rev: 7, doc: b })).toMatchObject({ act: 'push', base: 7 })
  })
})

describe('planSync: no agreed base (first contact, or lost)', () => {
  it('the same board on both sides: agree on it', () => {
    const b = board()
    expect(planSync(null, b, { rev: 3, doc: sanitizeDoc(JSON.parse(JSON.stringify(b))) })).toMatchObject({ act: 'none', agreed: { rev: 3 } })
  })

  it('an empty bridge takes mine', () => {
    const b = board()
    expect(planSync(null, b, { rev: 0, doc: empty })).toEqual({ act: 'push', doc: b, base: 0 })
  })

  it('a browser that never saved never seeds a blank bridge with the sample board', () => {
    expect(planSync(null, seedDoc(), { rev: 0, doc: empty }, { mineUnsaved: true })).toEqual({ act: 'none', agreed: null })
  })

  it('a browser that never saved (the sample board) takes theirs', () => {
    const t = board()
    expect(planSync(null, seedDoc(), { rev: 2, doc: t }, { mineUnsaved: true })).toMatchObject({ act: 'take', doc: t, rev: 2 })
  })

  it('two real boards: a union merge (nothing dropped)', () => {
    const m = addNode(board(), { parent: 1, title: 'mine' }).doc
    const t = addNode(board(), { parent: 1, title: 'theirs' }).doc
    const p = planSync(null, m, { rev: 2, doc: t })
    expect(p.act).toBe('merge')
    if (p.act !== 'merge') return
    expect(p.doc.nodes.map((n) => n.title)).toEqual(expect.arrayContaining(['mine', 'theirs', 'site', 'deck']))
    expect(sameDoc(p.doc, m)).toBe(false)
  })
})

describe('pushLanded: did a push whose answer was lost reach the file?', () => {
  const b = board()
  const pushed = updateNode(addNode(b, { parent: 1, title: 'new' }).doc, 2, { title: 'site v2' })

  it('yes when theirs holds every change the push made, even with agent edits on top', () => {
    expect(pushLanded(b, pushed, pushed)).toBe(true)
    expect(pushLanded(b, pushed, setStatus(pushed, 3, 'active'))).toBe(true)
  })

  it('no when theirs lacks them (the push never landed)', () => {
    expect(pushLanded(b, pushed, b)).toBe(false)
    expect(pushLanded(b, pushed, setStatus(b, 3, 'active'))).toBe(false)
  })

  it('no when an item the push changed was changed again since (cannot tell: the safe answer)', () => {
    expect(pushLanded(b, pushed, updateNode(pushed, 2, { title: 'agent' }))).toBe(false)
  })

  it('no for a push that changed nothing', () => {
    expect(pushLanded(b, b, b)).toBe(false)
  })
})

describe('adoptMessage (docs/VOICE.md §3.5, G4)', () => {
  it('took-theirs', () => {
    expect(adoptMessage({ kind: 'take', rev: 41, snapshotted: true })).toBe("took vault-agent's copy (rev 41). yours is in snapshots")
    // Only claims the snapshot when there is one.
    expect(adoptMessage({ kind: 'take', rev: 41, snapshotted: false })).toBe("took vault-agent's copy (rev 41)")
  })

  it('merged, with the count and the rev', () => {
    const doc = board()
    expect(adoptMessage({ kind: 'merge', rev: 41, doc, result: { theirChanges: 3, conflicts: [] } })).toBe('merged 3 changes from vault-agent (rev 41)')
    expect(adoptMessage({ kind: 'merge', rev: 7, doc, result: { theirChanges: 1, conflicts: [] } })).toBe('merged 1 change from vault-agent (rev 7)')
    expect(adoptMessage({ kind: 'merge', rev: 7, doc, result: { theirChanges: 0, conflicts: [] } })).toBe('merged changes from vault-agent (rev 7)')
  })

  it('a clash names the task, says whose was kept and where the other went', () => {
    const doc = board()
    expect(adoptMessage({ kind: 'merge', rev: 9, doc, result: { theirChanges: 2, conflicts: [{ on: 'node', id: 2, field: 'title', kept: 'mine' }] } })).toBe(
      'you and vault-agent both changed site. kept yours; theirs is in snapshots',
    )
    expect(
      adoptMessage({
        kind: 'merge',
        rev: 9,
        doc,
        result: {
          theirChanges: 2,
          conflicts: [
            { on: 'node', id: 2, field: 'title', kept: 'mine' },
            { on: 'node', id: 2, field: 'body', kept: 'mine' },
            { on: 'note', id: 'na', field: 'text', kept: 'mine' },
          ],
        },
      }),
    ).toBe('you and vault-agent both changed site and 1 more. kept yours; theirs is in snapshots')
  })

  it('owns up to a delete that came back', () => {
    expect(adoptMessage({ kind: 'merge', rev: 9, doc: board(), result: { theirChanges: 1, conflicts: [{ on: 'node', id: 3, field: 'deleted', kept: 'theirs' }] } })).toBe(
      'merged 1 change from vault-agent (rev 9) · 1 you deleted came back',
    )
  })
})
