import { describe, expect, it } from 'vitest'
import {
  addNode,
  addNote,
  boardCards,
  byId,
  cardHits,
  cardOf,
  childrenOf,
  depthOf,
  linesOf,
  MAX_DEPTH,
  MAX_ID,
  restoreNote,
  restoreRemoved,
  dockCard,
  hitchNote,
  indentNode,
  kindOf,
  moveCard,
  moveNote,
  outdentNode,
  progressOf,
  pullCard,
  removeNode,
  removeNote,
  sanitizeDoc,
  searchPaths,
  setNoteText,
  shiftNode,
  toggleDone,
  updateNode,
} from './doc'
import { seedDoc } from './seed'
import type { Doc } from './types'

function tiny(): Doc {
  return sanitizeDoc({
    nodes: [
      { id: 1, title: 'proj', status: 'none', parent: null },
      { id: 2, title: 'TASK A', status: 'active', parent: 1 },
      { id: 3, title: 'line one', status: 'done', parent: 2 },
      { id: 4, title: 'line two', status: 'pending', parent: 2 },
      { id: 5, title: 'TASK B', status: 'pending', parent: 1 },
      { id: 6, title: 'other', status: 'none', parent: null },
    ],
    notes: [{ id: 'a', date: '01.01.26', text: 'hitched', node: 3 }],
  })
}

describe('reading the graph', () => {
  it('knows projects, tasks and subtasks by depth', () => {
    const d = tiny()
    expect(kindOf(d, 1)).toBe('project')
    expect(kindOf(d, 2)).toBe('task')
    expect(kindOf(d, 3)).toBe('subtask')
  })

  it('puts tasks and loose subtasks on the board', () => {
    const d = pullCard(tiny(), 4, 'rnd')
    expect(boardCards(d, null).map((n) => n.id)).toEqual([2, 4, 5])
    expect(boardCards(d, 6)).toEqual([])
    expect(cardOf(d, 3)?.id).toBe(2)
    expect(cardOf(d, 4)?.id).toBe(4)
  })

  it('counts subtask progress', () => {
    expect(progressOf(tiny(), 2)).toEqual({ done: 1, total: 2 })
  })

  it('finds cards by a subtask or description hit, and keeps the path to it', () => {
    const d = updateNode(tiny(), 5, { body: 'has the word zebra' })
    expect([...cardHits(d, 'line two')]).toEqual([2])
    expect([...cardHits(d, 'ZEBRA')]).toEqual([5])
    expect([...searchPaths(d, 'line two')].sort()).toEqual([1, 2, 4])
  })
})

describe('writing', () => {
  it('never mutates the doc it was given', () => {
    const d = tiny()
    const before = JSON.stringify(d)
    updateNode(d, 2, { title: 'x' })
    moveCard(d, 2, 'done')
    removeNode(d, 1)
    indentNode(d, 5)
    expect(JSON.stringify(d)).toBe(before)
  })

  it('adds with the right default status for where it lands', () => {
    let r = addNode(tiny(), { parent: null, title: 'new proj' })
    expect(byId(r.doc, r.id)?.status).toBe('none')
    r = addNode(tiny(), { parent: 1, title: 'new task' })
    expect(byId(r.doc, r.id)?.status).toBe('pending')
    r = addNode(tiny(), { parent: 2, title: 'line', before: 4 })
    expect(childrenOf(r.doc, 2).map((n) => n.title)).toEqual(['line one', 'line', 'line two'])
  })

  it('moving a card does not touch its subtasks', () => {
    const d = moveCard(tiny(), 2, 'pending')
    expect(byId(d, 2)?.status).toBe('pending')
    expect(byId(d, 3)?.status).toBe('done')
    expect(byId(d, 4)?.status).toBe('pending')
    const back = moveCard(d, 2, 'active')
    expect(byId(back, 3)?.status).toBe('done')
  })

  it('toggles a subtask between done and not', () => {
    const d = toggleDone(tiny(), 4)
    expect(byId(d, 4)?.status).toBe('done')
    expect(byId(toggleDone(d, 4), 4)?.status).toBe('pending')
  })

  it('removes a subtree and unhitches notes into it', () => {
    const d = removeNode(tiny(), 2)
    expect(d.nodes.map((n) => n.id)).toEqual([1, 5, 6])
    expect(d.notes[0].node).toBeUndefined()
  })

  it('indents under the sibling above and outdents back after the old parent', () => {
    const d = indentNode(tiny(), 5)
    expect(byId(d, 5)?.parent).toBe(2)
    expect(kindOf(d, 5)).toBe('subtask')
    const out = outdentNode(d, 5)
    expect(byId(out, 5)?.parent).toBe(1)
    expect(childrenOf(out, 1).map((n) => n.id)).toEqual([2, 5])
  })

  it('a task outdented to a project and back keeps its lane; a bare project indented lands in PENDING', () => {
    const active = outdentNode(tiny(), 2)
    expect(kindOf(active, 2)).toBe('project')
    const back = indentNode(active, 2)
    expect(kindOf(back, 2)).toBe('task')
    expect(byId(back, 2)?.status).toBe('active')
    const proj = indentNode(tiny(), 6)
    expect(byId(proj, 6)?.parent).toBe(1)
    expect(byId(proj, 6)?.status).toBe('pending')
  })

  it('cannot indent the first child or outdent a project', () => {
    const d = tiny()
    expect(indentNode(d, 2)).toBe(d)
    expect(outdentNode(d, 1)).toBe(d)
  })

  it('shifts among siblings', () => {
    const d = shiftNode(tiny(), 5, -1)
    expect(childrenOf(d, 1).map((n) => n.id)).toEqual([5, 2])
    expect(childrenOf(shiftNode(d, 5, 1), 1).map((n) => n.id)).toEqual([2, 5])
  })

  it('pulls a subtask loose and docks it back', () => {
    const pulled = pullCard(tiny(), 4, 'rnd')
    expect(byId(pulled, 4)).toMatchObject({ loose: true, status: 'rnd', parent: 2 })
    const docked = dockCard(pulled, 4, 5)
    expect(byId(docked, 4)).toMatchObject({ parent: 5 })
    expect(byId(docked, 4)?.loose).toBeUndefined()
  })

  it('refuses to dock a node into its own subtree', () => {
    const d = tiny()
    expect(dockCard(d, 2, 3)).toBe(d)
  })

  it('keeps notes by id through edits and reorders', () => {
    let { doc, id } = addNote(tiny(), '')
    doc = setNoteText(doc, id, 'line one\nline two "quoted"')
    doc = moveNote(doc, 1, 0)
    expect(doc.notes[0]).toMatchObject({ id, text: 'line one\nline two "quoted"' })
    doc = hitchNote(doc, id, 5)
    expect(doc.notes[0].node).toBe(5)
    doc = removeNote(doc, id)
    expect(doc.notes.map((n) => n.id)).toEqual(['a'])
  })
})

describe('restoring after a delete', () => {
  it('puts the deleted subtree back without undoing later changes', () => {
    const before = tiny()
    const after = removeNode(before, 2)
    const later = moveCard(after, 5, 'done')
    const back = restoreRemoved(later, before, [2, 3, 4])
    expect(childrenOf(back, 1).map((n) => n.id)).toEqual([2, 5])
    expect(childrenOf(back, 2).map((n) => n.id)).toEqual([3, 4])
    expect(byId(back, 5)?.status).toBe('done')
    expect(back.notes[0].node).toBe(3)
  })

  it('a note comes back where it was', () => {
    let doc = addNote(tiny(), 'two').doc
    const id = doc.notes[1].id
    const after = removeNote(doc, id)
    doc = restoreNote(after, doc, id)
    expect(doc.notes.map((n) => n.text)).toEqual(['hitched', 'two'])
  })

  it('nested lines are counted and listed in tree order', () => {
    const d = addNode(tiny(), { parent: 3, title: 'deeper' }).doc
    expect(linesOf(d, 2).map((l) => [l.node.title, l.depth])).toEqual([
      ['line one', 1],
      ['deeper', 2],
      ['line two', 1],
    ])
    expect(progressOf(d, 2)).toEqual({ done: 1, total: 3 })
  })
})

describe('sanitizing', () => {
  it('repairs bad statuses, dangling parents, duplicate ids and cycles', () => {
    const d = sanitizeDoc({
      nodes: [
        { id: 1, title: 'p', status: 'weird', parent: null },
        { id: 2, title: 'a', status: 'active', parent: 99 },
        { id: 2, title: 'dup', status: 'done', parent: 1 },
        { id: 7, title: 'x', status: 'done', parent: 8 },
        { id: 8, title: 'y', status: 'done', parent: 7 },
        'junk',
      ],
      notes: [{ text: 'no id' }, { id: 'n', text: 't', node: 404 }],
    })
    expect(byId(d, 2)?.parent).toBeNull()
    expect(d.nodes.filter((n) => n.title === 'dup')[0].id).not.toBe(2)
    expect(d.nodes.every((n) => n.parent == null || byId(d, n.parent))).toBe(true)
    expect(d.notes[0].id).toBeTruthy()
    expect(d.notes[1].node).toBeUndefined()
  })

  it('replaces unsafe ids and cuts runaway depth', () => {
    const d = sanitizeDoc({
      nodes: [
        { id: Number.MAX_SAFE_INTEGER + 1, title: 'huge', status: 'none', parent: null },
        { id: Infinity, title: 'inf', status: 'none', parent: null },
        { id: -3, title: 'neg', status: 'none', parent: null },
      ],
      notes: [],
    })
    expect(d.nodes.every((n) => Number.isSafeInteger(n.id) && n.id > 0 && n.id <= MAX_ID)).toBe(true)
    expect(new Set(d.nodes.map((n) => n.id)).size).toBe(3)
    const made = addNode(d, { parent: d.nodes[0].id, title: 'child' })
    expect(made.id).not.toBe(d.nodes[0].id)

    const chain = Array.from({ length: 3000 }, (_, i) => ({ id: i + 1, title: `n${i}`, status: 'pending', parent: i === 0 ? null : i }))
    const deep = sanitizeDoc({ nodes: chain, notes: [] })
    expect(Math.max(...deep.nodes.map((n) => depthOf(deep, n.id)))).toBeLessThanOrEqual(MAX_DEPTH)
  })

  it('throws on something that is not a document at all', () => {
    expect(() => sanitizeDoc('nope')).toThrow()
    expect(() => sanitizeDoc({ foo: 1 })).toThrow()
  })

  it('the seed is valid as shipped', () => {
    const s = seedDoc()
    expect(sanitizeDoc(JSON.parse(JSON.stringify(s)))).toEqual(s)
  })
})
