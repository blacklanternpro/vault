// @vitest-environment jsdom
import { act, createElement } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { addNode } from '../model/doc'
import { seedDoc } from '../model/seed'
import type { Doc } from '../model/types'
import { useHistory, type DocHistory } from './useHistory'

/*
 * The undo stack as it behaves today (audit 12: nothing covered undo
 * directly). A tiny harness instead of a testing library: mount a component
 * that calls the hook, keep the latest return value, drive it inside act().
 */

;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

type Harness = { readonly h: DocHistory; unmount: () => void }

function mount(initial: Doc): Harness {
  let latest: DocHistory | null = null
  function Probe() {
    latest = useHistory(initial)
    return null
  }
  const el = document.createElement('div')
  let root: Root
  act(() => {
    root = createRoot(el)
    root.render(createElement(Probe))
  })
  return {
    get h() {
      return latest!
    },
    unmount: () => act(() => root.unmount()),
  }
}

/** A doc that differs from `d` by one new task, titled `title`. */
const plus = (d: Doc, title: string) => addNode(d, { parent: 1, title }).doc
const titles = (d: Doc) => d.nodes.map((n) => n.title)

let clock = 1_000_000
let harness: Harness | null = null

beforeEach(() => {
  clock = 1_000_000
  vi.spyOn(Date, 'now').mockImplementation(() => clock)
})
afterEach(() => {
  harness?.unmount()
  harness = null
  vi.restoreAllMocks()
})

function start(initial = seedDoc()): Harness {
  harness = mount(initial)
  return harness
}

describe('useHistory', () => {
  it('starts with nothing to undo or redo', () => {
    const t = start()
    expect(t.h.canUndo).toBe(false)
    expect(t.h.canRedo).toBe(false)
    let undone = true
    act(() => {
      undone = t.h.undo()
    })
    expect(undone).toBe(false)
    expect(t.h.redo()).toBe(false)
  })

  it('undoes and redoes commits in order', () => {
    const d0 = seedDoc()
    const t = start(d0)
    const d1 = plus(d0, 'one')
    const d2 = plus(d1, 'two')
    act(() => t.h.commit(d1))
    act(() => t.h.commit(d2))
    expect(t.h.doc).toBe(d2)
    expect(t.h.ref.current).toBe(d2)

    act(() => void t.h.undo())
    expect(t.h.doc).toBe(d1)
    expect(t.h.canRedo).toBe(true)
    act(() => void t.h.undo())
    expect(t.h.doc).toBe(d0)
    expect(t.h.canUndo).toBe(false)

    act(() => void t.h.redo())
    act(() => void t.h.redo())
    expect(t.h.doc).toBe(d2)
    expect(t.h.canRedo).toBe(false)
  })

  it('ignores a commit of the very same doc', () => {
    const d0 = seedDoc()
    const t = start(d0)
    act(() => t.h.commit(d0))
    expect(t.h.canUndo).toBe(false)
  })

  it('keeps at most 200 steps, dropping the oldest', () => {
    const d0 = seedDoc()
    const t = start(d0)
    let d = d0
    const all: Doc[] = []
    act(() => {
      for (let i = 0; i < 205; i++) {
        d = plus(d, `n${i}`)
        all.push(d)
        t.h.commit(d)
      }
    })
    let steps = 0
    act(() => {
      while (t.h.undo()) steps++
    })
    expect(steps).toBe(200)
    // The five oldest states (d0 and the first four commits) are gone; the floor is commit #5.
    expect(t.h.doc).toBe(all[4])
  })

  it('coalesces commits with the same key inside the window into one step', () => {
    const d0 = seedDoc()
    const t = start(d0)
    let d = d0
    act(() => {
      for (let i = 0; i < 5; i++) {
        d = plus(d, `typed ${i}`)
        t.h.commit(d, 'note:1')
        clock += 300
      }
    })
    act(() => void t.h.undo())
    expect(t.h.doc).toBe(d0)
    expect(t.h.canUndo).toBe(false)
  })

  it('measures the window from the last commit, so steady typing stays one step', () => {
    const d0 = seedDoc()
    const t = start(d0)
    let d = d0
    act(() => {
      // 10 keystrokes 1s apart: 9s in all, but each is inside 1.2s of the one before.
      for (let i = 0; i < 10; i++) {
        d = plus(d, `k${i}`)
        t.h.commit(d, 'title:2')
        clock += 1000
      }
    })
    act(() => void t.h.undo())
    expect(t.h.doc).toBe(d0)
  })

  it('starts a new step after the window, for a different key, or for an unkeyed commit', () => {
    const d0 = seedDoc()
    const t = start(d0)
    const a = plus(d0, 'a')
    const b = plus(a, 'b')
    const c = plus(b, 'c')
    const e = plus(c, 'e')
    act(() => t.h.commit(a, 'k'))
    clock += 1201
    act(() => t.h.commit(b, 'k')) // past the 1.2s window: a new step
    clock += 10
    act(() => t.h.commit(c, 'other')) // another key: a new step
    clock += 10
    act(() => t.h.commit(e)) // no key: always a step
    const seen: string[][] = []
    act(() => {
      while (t.h.undo()) seen.push(titles(t.h.doc))
    })
    expect(seen.length).toBe(4)
    expect(t.h.doc).toBe(d0)
  })

  it('honours a custom window per commit', () => {
    const d0 = seedDoc()
    const t = start(d0)
    const a = plus(d0, 'a')
    const b = plus(a, 'b')
    act(() => t.h.commit(a, 'k', 5000))
    clock += 4000
    act(() => t.h.commit(b, 'k', 5000))
    act(() => void t.h.undo())
    expect(t.h.doc).toBe(d0)
  })

  it('does not coalesce across an undo', () => {
    const d0 = seedDoc()
    const t = start(d0)
    const a = plus(d0, 'a')
    const b = plus(d0, 'b')
    act(() => t.h.commit(a, 'k'))
    act(() => void t.h.undo())
    act(() => t.h.commit(b, 'k'))
    expect(t.h.canUndo).toBe(true)
    act(() => void t.h.undo())
    expect(t.h.doc).toBe(d0)
  })

  it('a commit after undo drops the redo branch', () => {
    const d0 = seedDoc()
    const t = start(d0)
    const a = plus(d0, 'a')
    const b = plus(a, 'b')
    const other = plus(a, 'other')
    act(() => t.h.commit(a))
    act(() => t.h.commit(b))
    act(() => void t.h.undo())
    expect(t.h.canRedo).toBe(true)
    act(() => t.h.commit(other))
    expect(t.h.canRedo).toBe(false)
    let redone = true
    act(() => {
      redone = t.h.redo()
    })
    expect(redone).toBe(false)
    expect(t.h.doc).toBe(other)
    act(() => void t.h.undo())
    expect(t.h.doc).toBe(a)
  })

  it('replace is one undoable step and clears redo', () => {
    const d0 = seedDoc()
    const t = start(d0)
    const a = plus(d0, 'a')
    const imported = plus(d0, 'imported')
    act(() => t.h.commit(a))
    act(() => void t.h.undo())
    act(() => t.h.replace(imported))
    expect(t.h.doc).toBe(imported)
    expect(t.h.canRedo).toBe(false)
    act(() => void t.h.undo())
    expect(t.h.doc).toBe(d0)
  })

  it('replace breaks a coalescing run', () => {
    const d0 = seedDoc()
    const t = start(d0)
    const a = plus(d0, 'a')
    const r = plus(a, 'r')
    const b = plus(r, 'b')
    act(() => t.h.commit(a, 'k'))
    act(() => t.h.replace(r))
    act(() => t.h.commit(b, 'k'))
    act(() => void t.h.undo())
    expect(t.h.doc).toBe(r)
  })

  it('adopt (a doc from outside) wipes both undo and redo, as it does today', () => {
    // Today's behaviour, which audit 1 flags: adopting another copy leaves no way back to this tab's work.
    const d0 = seedDoc()
    const t = start(d0)
    const a = plus(d0, 'a')
    const b = plus(a, 'b')
    const theirs = plus(d0, 'from the agent')
    act(() => t.h.commit(a))
    act(() => t.h.commit(b))
    act(() => void t.h.undo())
    act(() => t.h.adopt(theirs))
    expect(t.h.doc).toBe(theirs)
    expect(t.h.canUndo).toBe(false)
    expect(t.h.canRedo).toBe(false)
  })

  it('adopt breaks a coalescing run, so the next keyed edit is its own step', () => {
    const d0 = seedDoc()
    const t = start(d0)
    const theirs = plus(d0, 'theirs')
    const mine = plus(theirs, 'mine')
    act(() => t.h.commit(plus(d0, 'x'), 'k'))
    act(() => t.h.adopt(theirs))
    act(() => t.h.commit(mine, 'k'))
    act(() => void t.h.undo())
    expect(t.h.doc).toBe(theirs)
  })

  it('amend changes the present without making a step and keeps past and future', () => {
    const d0 = seedDoc()
    const t = start(d0)
    const a = plus(d0, 'a')
    const b = plus(a, 'b')
    act(() => t.h.commit(a))
    act(() => t.h.commit(b))
    act(() => void t.h.undo())
    const seen = { ...a, lastSeen: 42 }
    act(() => t.h.amend(seen))
    expect(t.h.doc).toBe(seen)
    expect(t.h.canUndo).toBe(true)
    expect(t.h.canRedo).toBe(true)
    act(() => void t.h.redo())
    expect(t.h.doc).toBe(b)
    act(() => void t.h.undo())
    // The amended present was what redo left; undo returns to it, not the pre-amend copy.
    expect(t.h.doc).toBe(seen)
  })

  it('ref always holds the latest doc, even before a re-render', () => {
    const d0 = seedDoc()
    const t = start(d0)
    const a = plus(d0, 'a')
    const b = plus(a, 'b')
    act(() => {
      t.h.commit(a)
      // Same tick, no render in between: the second commit must stack on the first.
      t.h.commit(b)
      expect(t.h.ref.current).toBe(b)
    })
    act(() => void t.h.undo())
    expect(t.h.doc).toBe(a)
  })
})
