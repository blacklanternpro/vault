import { addNode, byId } from '../model/doc'
import type { Doc } from '../model/types'

/*
 * The drop: a tree that arrived (pasted, or pushed by Claude) and sits in
 * inbox/ as a draft until it is filed under a folder. A draft is flat lines
 * with a level each: level 0 lines become tasks, deeper lines subtasks.
 */

export type DraftLine = { key: string; level: number; text: string; done?: boolean }
export type Draft = { name: string; lines: DraftLine[] }

let seq = 0
export const lineKey = () => `l${Date.now().toString(36)}${(seq++).toString(36)}`

const TREE_GLYPHS = /^[\s│├└─┆╌|`\\-]*/
const BULLET = /^(?:[-*+•]|\d+[.)])\s+/
const TICK = /^\[([ xX]?)\]\s*/

/** Reads an indented list, a markdown checklist or `tree` output. Blank lines are skipped. */
export function parseTree(text: string): Draft | null {
  const raw = text.replace(/\r/g, '').split('\n').filter((l) => l.trim())
  if (!raw.length) return null
  const rows = raw.map((line) => {
    const expanded = line.replace(/\t/g, '  ')
    const lead = expanded.match(TREE_GLYPHS)?.[0] ?? ''
    // Box-drawing prefixes count four columns a level, like `tree` prints them.
    const width = /[│├└┆]/.test(lead) ? Math.round(lead.length / 4) * 4 + 2 : lead.length
    let body = expanded.slice(lead.length).trim()
    body = body.replace(BULLET, '')
    let done: boolean | undefined
    const tick = body.match(TICK)
    if (tick) {
      done = tick[1].toLowerCase() === 'x'
      body = body.slice(tick[0].length)
    }
    return { width, text: body.trim(), done }
  })
  const widths = [...new Set(rows.map((r) => r.width))].sort((a, b) => a - b)
  const levels = rows.map((r) => widths.indexOf(r.width))
  // Never jump more than one level deeper than the line above.
  for (let i = 0; i < levels.length; i++) levels[i] = Math.min(levels[i], i === 0 ? 0 : levels[i - 1] + 1)

  let name = 'untitled'
  let lines: DraftLine[] = rows.map((r, i) => ({ key: lineKey(), level: levels[i], text: r.text, ...(r.done != null ? { done: r.done } : {}) }))
  // One root folder (`name/`) holding everything: it names the draft.
  const roots = lines.filter((l) => l.level === 0)
  if (roots.length === 1 && lines.length > 1 && roots[0].text.endsWith('/')) {
    name = roots[0].text.replace(/\/+$/, '')
    lines = lines.slice(1).map((l) => ({ ...l, level: Math.max(0, l.level - 1) }))
  }
  lines = lines.filter((l) => l.text)
  return lines.length ? { name, lines } : null
}

/** Files a draft under a folder. Returns the new doc and the ids made, top to bottom. */
export function commitDraft(doc: Doc, draft: Draft, projectId: number): { doc: Doc; ids: number[] } {
  if (!byId(doc, projectId)) return { doc, ids: [] }
  const ids: number[] = []
  const stack: number[] = [projectId]
  let next = doc
  for (const line of draft.lines) {
    const level = Math.min(line.level, stack.length - 1)
    const parent = stack[level]
    const title = level === 0 ? line.text.toUpperCase() : line.text
    const made = addNode(next, { parent, title, status: line.done ? 'done' : 'pending' })
    if (made.id < 0) continue
    next = made.doc
    ids.push(made.id)
    stack.length = level + 1
    stack.push(made.id)
  }
  return { doc: next, ids }
}

/** Files a draft as a new folder of its own. */
export function commitAsProject(doc: Doc, draft: Draft): { doc: Doc; ids: number[] } {
  const name = draft.name.trim().replace(/\/+$/, '').toLowerCase().replace(/\s+/g, '-') || 'untitled'
  const made = addNode(doc, { parent: null, title: name })
  const filed = commitDraft(made.doc, draft, made.id)
  return { doc: filed.doc, ids: [made.id, ...filed.ids] }
}

export function draftStats(draft: Draft): { tasks: number; lines: number } {
  return { tasks: draft.lines.filter((l) => l.level === 0).length, lines: draft.lines.length }
}

/** What a push from Claude might look like, for trying the drop without a connector. */
export const SAMPLE_PUSH = `vault-phase-2/
  THE PIVOT
    rows morph into cards and back
    status rail as drop targets
    done chute with a counter
  THE DROP
    draft tree lands in inbox/
    edit it, then drag it onto a folder
  [ ] THE WIRE
    remote MCP on vercel
    "vault it" from the phone`
