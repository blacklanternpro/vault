import { useCallback, useRef, useState } from 'react'
import type { Doc } from '../model/types'

const LIMIT = 200
/** Edits to the same thing this close together undo as one step (typing in a note, say). */
const COALESCE_MS = 1200

type History = { past: Doc[]; present: Doc; future: Doc[] }

export type DocHistory = {
  doc: Doc
  /** Always the latest doc, for handlers that outlive a render. */
  ref: { readonly current: Doc }
  /** Commits with the same key inside `windowMs` undo as one step. */
  commit: (next: Doc, coalesceKey?: string, windowMs?: number) => void
  /** A doc this tab chose to load (an import, a snapshot). Undo goes back to what was here. */
  replace: (next: Doc) => void
  /** A doc another tab saved. Taken as is, and the undo history is cleared: those changes are not this tab's to undo. */
  adopt: (next: Doc) => void
  undo: () => boolean
  redo: () => boolean
  canUndo: boolean
  canRedo: boolean
}

export function useHistory(initial: Doc): DocHistory {
  const [state, setState] = useState<History>({ past: [], present: initial, future: [] })
  const stateRef = useRef(state)
  stateRef.current = state
  const docRef = useRef(initial)
  docRef.current = state.present
  const last = useRef<{ key: string; at: number } | null>(null)

  const set = useCallback((next: History) => {
    stateRef.current = next
    docRef.current = next.present
    setState(next)
  }, [])

  const commit = useCallback(
    (next: Doc, coalesceKey?: string, windowMs = COALESCE_MS) => {
      const cur = stateRef.current
      if (next === cur.present) return
      const now = Date.now()
      const merge = coalesceKey != null && last.current?.key === coalesceKey && now - last.current.at < windowMs
      last.current = coalesceKey != null ? { key: coalesceKey, at: now } : null
      set({
        past: merge ? cur.past : [...cur.past, cur.present].slice(-LIMIT),
        present: next,
        future: [],
      })
    },
    [set],
  )

  const replace = useCallback(
    (next: Doc) => {
      const cur = stateRef.current
      last.current = null
      set({ past: [...cur.past, cur.present].slice(-LIMIT), present: next, future: [] })
    },
    [set],
  )

  const adopt = useCallback(
    (next: Doc) => {
      last.current = null
      set({ past: [], present: next, future: [] })
    },
    [set],
  )

  const undo = useCallback(() => {
    const cur = stateRef.current
    const prev = cur.past[cur.past.length - 1]
    if (!prev) return false
    last.current = null
    set({ past: cur.past.slice(0, -1), present: prev, future: [cur.present, ...cur.future] })
    return true
  }, [set])

  const redo = useCallback(() => {
    const cur = stateRef.current
    const nxt = cur.future[0]
    if (!nxt) return false
    last.current = null
    set({ past: [...cur.past, cur.present], present: nxt, future: cur.future.slice(1) })
    return true
  }, [set])

  return {
    doc: state.present,
    ref: docRef,
    commit,
    replace,
    adopt,
    undo,
    redo,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
  }
}
