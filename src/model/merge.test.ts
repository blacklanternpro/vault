import { describe, expect, it } from 'vitest'
import { addNode, addNote, byId, logEvent, markSeen, moveCard, removeNode, removeNote, reparentNode, sanitizeDoc, setNoteText, setStatus, updateNode } from './doc'
import { fingerprint, merge, mergeFresh } from './merge'
import { seedDoc } from './seed'
import type { Doc } from './types'

/*
 * Three-way merge of the board: `base` is the last doc both sides agreed on,
 * `mine` is the browser's, `theirs` the agent's (the bridge's file).
 */

/** A small board: project 1 with tasks 2 and 3, task 2 with subtasks 4 and 5. */
function board(): Doc {
  return sanitizeDoc({
    nodes: [
      { id: 1, title: 'CLIENT', status: 'none', parent: null },
      { id: 2, title: 'site', status: 'pending', parent: 1, body: 'the site' },
      { id: 4, title: 'wireframes', status: 'pending', parent: 2 },
      { id: 5, title: 'copy', status: 'pending', parent: 2 },
      { id: 3, title: 'deck', status: 'rnd', parent: 1 },
      { id: 6, title: 'OTHER', status: 'none', parent: null },
    ],
    notes: [{ id: 'na', date: '11.18.26', text: 'call marty' }],
    events: [{ at: 100, kind: 'created', node: 2, text: 'created' }],
  })
}

function titles(doc: Doc): string[] {
  return doc.nodes.map((n) => n.title)
}

function node(doc: Doc, id: number) {
  const n = byId(doc, id)
  if (!n) throw new Error(`no node ${id}`)
  return n
}

/** The merge result passes the model's own reader unchanged. */
function expectClean(doc: Doc) {
  expect(fingerprint(sanitizeDoc(JSON.parse(JSON.stringify(doc))))).toBe(fingerprint(doc))
}

describe('merge: idempotence', () => {
  it('merge(b, x, x) is x', () => {
    const b = board()
    const x = updateNode(addNode(b, { parent: 1, title: 'new' }).doc, 3, { title: 'deck v2' })
    expect(fingerprint(merge(b, x, x).doc)).toBe(fingerprint(x))
    expect(merge(b, x, x).conflicts).toEqual([])
  })

  it('merge(b, b, t) is t, and merge(b, m, b) is m', () => {
    const b = board()
    const t = removeNode(updateNode(b, 2, { title: 'site v2', urgent: true }), 3)
    const m = addNote(setStatus(b, 4, 'done'), 'more').doc
    expect(fingerprint(merge(b, b, t).doc)).toBe(fingerprint(t))
    expect(fingerprint(merge(b, m, b).doc)).toBe(fingerprint(m))
  })

  it('reads key order as no change (a sanitized copy equals the original)', () => {
    const b = board()
    const m = updateNode(updateNode(b, 2, { next: 'ring them' }), 2, { body: 'new body' })
    const roundTripped = sanitizeDoc(JSON.parse(JSON.stringify(m)))
    expect(fingerprint(roundTripped)).toBe(fingerprint(m))
    expect(fingerprint(merge(b, m, roundTripped).doc)).toBe(fingerprint(m))
  })
})

describe('merge: two writers', () => {
  it('keeps edits to different tasks from both sides', () => {
    const b = board()
    const m = updateNode(b, 2, { title: 'site (mine)' })
    const t = moveCard(b, 3, 'active')
    const r = merge(b, m, t)
    expect(node(r.doc, 2).title).toBe('site (mine)')
    expect(node(r.doc, 3).status).toBe('active')
    expect(r.conflicts).toEqual([])
    expectClean(r.doc)
  })

  it('keeps edits to different fields of the same task', () => {
    const b = board()
    const m = updateNode(b, 2, { title: 'site (mine)', due: '2026-12-01' })
    const t = updateNode(setStatus(b, 2, 'active'), 2, { body: 'agent wrote this', next: 'ship it' })
    const r = merge(b, m, t)
    expect(node(r.doc, 2)).toMatchObject({ title: 'site (mine)', due: '2026-12-01', status: 'active', body: 'agent wrote this', next: 'ship it' })
    expect(r.conflicts).toEqual([])
  })

  it('same field changed on both sides: mine wins, and the clash is recorded', () => {
    const b = board()
    const m = updateNode(b, 2, { title: 'mine' })
    const t = updateNode(b, 2, { title: 'theirs' })
    const r = merge(b, m, t)
    expect(node(r.doc, 2).title).toBe('mine')
    expect(r.conflicts).toEqual([{ on: 'node', id: 2, field: 'title', kept: 'mine' }])
    // Deterministic: the same inputs give the same answer.
    expect(fingerprint(merge(b, m, t).doc)).toBe(fingerprint(r.doc))
  })

  it('a field cleared on one side and untouched on the other stays cleared', () => {
    const b = board()
    const m = updateNode(b, 2, { body: '' })
    const r = merge(b, m, updateNode(b, 3, { title: 'x' }))
    expect(node(r.doc, 2).body).toBeUndefined()
  })

  it('subtasks ticked on both sides all stay ticked', () => {
    const b = board()
    const m = setStatus(b, 4, 'done')
    const t = setStatus(b, 5, 'done')
    const r = merge(b, m, t)
    expect(node(r.doc, 4).status).toBe('done')
    expect(node(r.doc, 5).status).toBe('done')
    // Both ticking the same one is no clash.
    expect(merge(b, m, setStatus(b, 4, 'done')).conflicts).toEqual([])
  })

  it('session time logged on both sides adds up; touched takes the later stamp', () => {
    const b = updateNode(board(), 2, { spent: 100, touched: 1000 })
    const m = updateNode(b, 2, { spent: 160, touched: 3000 })
    const t = updateNode(b, 2, { spent: 130, touched: 2000 })
    const r = merge(b, m, t)
    expect(node(r.doc, 2)).toMatchObject({ spent: 190, touched: 3000 })
    expect(r.conflicts).toEqual([])
  })

  it('lastSeen takes the later stamp', () => {
    const b = markSeen(board(), 10)
    expect(merge(b, markSeen(b, 30), markSeen(b, 20)).doc.lastSeen).toBe(30)
  })
})

describe('merge: adds, and ids minted on both sides', () => {
  it('keeps tasks added on either side', () => {
    const b = board()
    const m = addNode(b, { parent: 1, title: 'mine new' }).doc
    const t = addNode(b, { parent: 6, title: 'their new' }).doc
    const r = merge(b, m, t)
    expect(titles(r.doc)).toEqual(expect.arrayContaining(['mine new', 'their new']))
    expect(r.doc.nodes.length).toBe(b.nodes.length + 2)
    expectClean(r.doc)
  })

  it('the same new id on both sides: theirs keeps it (the agent may already have quoted it), mine moves, and every reference follows', () => {
    const b = board()
    const mAdd = addNode(b, { parent: 1, title: 'mine new' })
    const tAdd = addNode(b, { parent: 6, title: 'their new' })
    expect(mAdd.id).toBe(tAdd.id)
    const id = mAdd.id
    // Mine hangs a subtask, a note and a trail line on its new task.
    const mSub = addNode(mAdd.doc, { parent: id, title: 'mine sub' })
    const mNote = addNote(mSub.doc, 'about mine')
    let m = mNote.doc
    m = { ...m, notes: m.notes.map((n) => (n.id === mNote.id ? { ...n, node: id } : n)) }
    m = logEvent(m, 'created', 'created', id, 500)
    const r = merge(b, m, tAdd.doc)
    expect(node(r.doc, id).title).toBe('their new')
    const moved = r.doc.nodes.find((n) => n.title === 'mine new')!
    expect(moved.id).not.toBe(id)
    expect(r.remapped.get(id)).toBe(moved.id)
    expect(r.doc.nodes.find((n) => n.title === 'mine sub')!.parent).toBe(moved.id)
    expect(r.doc.notes.find((n) => n.text === 'about mine')!.node).toBe(moved.id)
    expect(r.doc.events.find((e) => e.at === 500)!.node).toBe(moved.id)
    expect(new Set(r.doc.nodes.map((n) => n.id)).size).toBe(r.doc.nodes.length)
    expectClean(r.doc)
  })

  it('the same task added identically on both sides is kept once', () => {
    const b = board()
    const x = addNode(b, { parent: 1, title: 'same' }).doc
    const r = merge(b, x, x)
    expect(r.doc.nodes.filter((n) => n.title === 'same')).toHaveLength(1)
    expect(r.remapped.size).toBe(0)
  })

  it('new tasks land beside the task they were added after', () => {
    const b = board()
    const t = addNode(b, { parent: 2, title: 'their sub', before: 5 }).doc
    const m = updateNode(b, 3, { title: 'deck v2' })
    const r = merge(b, m, t)
    const subs = r.doc.nodes.filter((n) => n.parent === 2).map((n) => n.title)
    expect(subs).toEqual(['wireframes', 'their sub', 'copy'])
  })
})

describe('merge: deletes', () => {
  it('a delete on one side with no edit on the other is taken', () => {
    const b = board()
    expect(byId(merge(b, removeNode(b, 3), b).doc, 3)).toBeUndefined()
    expect(byId(merge(b, b, removeNode(b, 3)).doc, 3)).toBeUndefined()
    // Deleted on both sides: gone, no clash.
    expect(merge(b, removeNode(b, 3), removeNode(b, 3)).conflicts).toEqual([])
  })

  it('delete vs edit: the edit wins and the task stays, either way round', () => {
    const b = board()
    const r1 = merge(b, updateNode(b, 3, { title: 'deck (mine)' }), removeNode(b, 3))
    expect(node(r1.doc, 3).title).toBe('deck (mine)')
    expect(r1.conflicts).toEqual([{ on: 'node', id: 3, field: 'deleted', kept: 'mine' }])
    const r2 = merge(b, removeNode(b, 3), setStatus(b, 3, 'active'))
    expect(node(r2.doc, 3).status).toBe('active')
    expect(r2.conflicts).toEqual([{ on: 'node', id: 3, field: 'deleted', kept: 'theirs' }])
  })

  it('a parent deleted on one side while the other added under it comes back with it', () => {
    const b = board()
    const m = removeNode(b, 2) // takes 4 and 5 with it
    const t = addNode(b, { parent: 2, title: 'their sub' }).doc
    const r = merge(b, m, t)
    const sub = r.doc.nodes.find((n) => n.title === 'their sub')!
    expect(sub.parent).toBe(2)
    expect(node(r.doc, 2).title).toBe('site')
    // The untouched siblings stay deleted.
    expect(byId(r.doc, 4)).toBeUndefined()
    expectClean(r.doc)
  })

  it('a note hitched to a task deleted on the other side comes loose', () => {
    const b = board()
    const t = { ...b, notes: [...b.notes.map((n) => ({ ...n }))] }
    const hitched = sanitizeDoc({ ...t, notes: [{ id: 'nb', date: '', text: 'about deck', node: 3 }, ...t.notes] })
    const r = merge(b, removeNode(b, 3), hitched)
    expect(r.doc.notes.find((n) => n.id === 'nb')!.node).toBeUndefined()
    expectClean(r.doc)
  })
})

describe('merge: moves', () => {
  it('reparent on one side, edit on the other: both kept', () => {
    const b = board()
    const m = reparentNode(b, 3, 6)
    const t = updateNode(b, 3, { body: 'agent body' })
    const r = merge(b, m, t)
    expect(node(r.doc, 3)).toMatchObject({ parent: 6, body: 'agent body' })
  })

  it('crossed moves that would make a loop keep mine', () => {
    const b = board()
    const m = reparentNode(b, 4, 5) // 4 under 5
    const t = reparentNode(b, 5, 4) // 5 under 4
    const r = merge(b, m, t)
    expect(node(r.doc, 4).parent).toBe(5)
    expect(node(r.doc, 5).parent).toBe(2)
    expect(r.conflicts).toContainEqual({ on: 'node', id: 5, field: 'parent', kept: 'mine' })
    expectClean(r.doc)
  })
})

describe('merge: notes and the trail', () => {
  it('notes added, edited and removed on either side all land', () => {
    const b = addNote(board(), 'second').doc
    const second = b.notes[1].id
    const m = addNote(setNoteText(b, 'na', 'call marty today'), 'mine note').doc
    const t = addNote(removeNote(b, second), 'their note').doc
    const r = merge(b, m, t)
    expect(r.doc.notes.map((n) => n.text)).toEqual(['call marty today', 'mine note', 'their note'])
  })

  it('the same note edited on both sides keeps mine and records it', () => {
    const b = board()
    const r = merge(b, setNoteText(b, 'na', 'mine'), setNoteText(b, 'na', 'theirs'))
    expect(r.doc.notes[0].text).toBe('mine')
    expect(r.conflicts).toEqual([{ on: 'note', id: 'na', field: 'text', kept: 'mine' }])
  })

  it('note removed on one side, edited on the other: the edit stays', () => {
    const b = board()
    const r = merge(b, removeNote(b, 'na'), setNoteText(b, 'na', 'edited'))
    expect(r.doc.notes.map((n) => n.text)).toEqual(['edited'])
  })

  it('trail events from both sides are unioned, in time order, without doubles', () => {
    const b = board()
    const m = logEvent(logEvent(b, 'moved', 'mine 1', 2, 300), 'ticked', 'mine 2', 4, 500)
    const t = logEvent(b, 'report', 'theirs', 3, 400)
    const r = merge(b, m, t)
    expect(r.doc.events.map((e) => e.text)).toEqual(['created', 'mine 1', 'theirs', 'mine 2'])
    expect(merge(b, m, m).doc.events).toHaveLength(3)
  })

  it('an event taken back on one side (undo) stays gone', () => {
    const b = logEvent(board(), 'moved', 'was here', 2, 300)
    const m = { ...b, events: b.events.slice(0, 1) }
    const t = logEvent(b, 'report', 'theirs', 3, 400)
    expect(merge(b, m, t).doc.events.map((e) => e.text)).toEqual(['created', 'theirs'])
  })
})

describe('merge: counts and shape', () => {
  it('counts what the agent changed', () => {
    const b = board()
    const t = addNote(removeNode(updateNode(b, 2, { title: 'x' }), 3), 'n').doc
    expect(merge(b, b, t).theirChanges).toBe(3)
    expect(merge(b, t, b).theirChanges).toBe(0)
  })

  it('every node field is known to the merge', () => {
    const full = updateNode(board(), 2, {
      title: 't',
      body: 'b',
      urgent: true,
      due: '2026-12-24',
      next: 'n',
      leftOff: 'l',
      links: [{ label: 'repo', url: 'https://example.com' }],
      tonight: true,
      touched: 5,
      spent: 9,
    })
    const r = merge(board(), full, board())
    expect(node(r.doc, 2)).toEqual(node(full, 2))
    const loose = { ...board(), nodes: board().nodes.map((n) => (n.id === 4 ? { ...n, loose: true } : n)) }
    expect(node(merge(board(), sanitizeDoc(loose), board()).doc, 4).loose).toBe(true)
  })

  it('merges the sample board against itself with nothing to report', () => {
    const s = seedDoc()
    const r = merge(s, s, s)
    expect(fingerprint(r.doc)).toBe(fingerprint(s))
    expect(r.conflicts).toEqual([])
    expect(r.theirChanges).toBe(0)
  })
})

describe('mergeFresh: no agreed base to merge against', () => {
  it('unions both boards: nothing either side has is dropped', () => {
    const b = board()
    const m = addNode(updateNode(b, 2, { title: 'site (mine)' }), { parent: 1, title: 'mine new' }).doc
    const t = removeNode(addNode(b, { parent: 6, title: 'their new' }).doc, 3)
    const r = mergeFresh(m, t)
    expect(titles(r.doc)).toEqual(expect.arrayContaining(['site (mine)', 'mine new', 'their new', 'deck']))
    expect(r.doc.nodes.filter((n) => n.title === 'their new' || n.title === 'mine new')).toHaveLength(2)
    expectClean(r.doc)
  })

  it('same id and title is the same task (no duplicates); differing fields keep mine', () => {
    const b = board()
    const r = mergeFresh(setStatus(b, 3, 'active'), setStatus(b, 3, 'done'))
    expect(r.doc.nodes).toHaveLength(b.nodes.length)
    expect(node(r.doc, 3).status).toBe('active')
    expect(r.conflicts).toContainEqual({ on: 'node', id: 3, field: 'status', kept: 'mine' })
  })

  it('same id but a different title is two tasks', () => {
    const one = sanitizeDoc({ nodes: [{ id: 1, title: 'MINE', status: 'none', parent: null }], notes: [] })
    const two = sanitizeDoc({ nodes: [{ id: 1, title: 'THEIRS', status: 'none', parent: null }], notes: [] })
    const r = mergeFresh(one, two)
    expect(titles(r.doc).sort()).toEqual(['MINE', 'THEIRS'])
    expect(node(r.doc, 1).title).toBe('THEIRS')
  })

  it('of identical boards is the board', () => {
    const b = board()
    expect(fingerprint(mergeFresh(b, b).doc)).toBe(fingerprint(b))
  })
})
