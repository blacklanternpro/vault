import { addNode, byId, linesOf, logEvent, removeNode, setStatus, updateNode } from './doc'
import type { Doc } from './types'

/*
 * The handoff, inbound: an agent's report read back into the task it was
 * briefed from. Three steps, each pure — parse the text into lists, match
 * the lists against the task's lines into a plan the person can check, then
 * apply the plan as one Doc so it is one undo step.
 */

export type Report = {
  /** Lines ticked in the report: `- [x] title`. */
  done: string[]
  /** Lines the report added: `- [ ] title`. */
  added: string[]
  /** The `Left off:` note, when there was one. */
  leftOff?: string
  /** Every other non-empty line, bullets stripped. */
  notes: string[]
}

const CHECK = /^\s*(?:[-*+•]|\d+[.)])?\s*\[(x|X| )?\]\s*(.*?)\s*$/
const LEFT_OFF = /^\s*(?:[-*+•]\s*)?\**\s*left\s*off\s*:?\**\s*:?\s*(.*?)\s*$/i
const HEADING = /^\s*#{1,6}\s/
const BULLET = /^\s*(?:[-*+•]|\d+[.)])\s+/

/** Reads a pasted report. Tolerant of `*` bullets, `[X]`, `[]`, numbered lists and a leading `## Report`. */
export function parseReport(text: string): Report {
  const out: Report = { done: [], added: [], notes: [] }
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim()
    if (!line || HEADING.test(line)) continue
    const check = CHECK.exec(line)
    if (check) {
      const title = check[2].trim()
      if (!title) continue
      if (check[1]?.toLowerCase() === 'x') out.done.push(title)
      else out.added.push(title)
      continue
    }
    const left = LEFT_OFF.exec(line)
    if (left && /left\s*off/i.test(line)) {
      const note = left[1].trim()
      if (out.leftOff == null) {
        if (note) out.leftOff = note
        continue
      }
    }
    out.notes.push(line.replace(BULLET, ''))
  }
  return out
}

/* ---------------------------------------------------------------- matching */

export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.!]+$/, '')
    .trim()
}

/** Edit distance, cut off once it passes `limit` so long strings stay cheap. */
export function levenshtein(a: string, b: string, limit = Infinity): number {
  if (a === b) return 0
  if (Math.abs(a.length - b.length) > limit) return limit + 1
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    const cur = [i]
    let best = i
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost)
      if (cur[j] < best) best = cur[j]
    }
    if (best > limit) return limit + 1
    prev = cur
  }
  return prev[b.length]
}

/** Shortest a title can be and still match another by prefix alone. */
const PREFIX_MIN = 5

/**
 * How well two titles agree: 0 is the same words, 1–2 is a typo or two away,
 * 3 is one being the start of the other. Null when they do not match.
 */
export function titleScore(a: string, b: string): number | null {
  const x = normalizeTitle(a)
  const y = normalizeTitle(b)
  if (!x || !y) return null
  if (x === y) return 0
  const d = levenshtein(x, y, 2)
  if (d <= 2) return d
  const [short, long] = x.length <= y.length ? [x, y] : [y, x]
  if (short.length >= PREFIX_MIN && long.startsWith(short)) return 3
  return null
}

export type PlanRow =
  /** An open line of the task that the report says is done. */
  | { kind: 'tick'; title: string; nodeId: number; matched: string }
  /** A done line the task did not have: added, already ticked. */
  | { kind: 'addDone'; title: string }
  /** A new open line. */
  | { kind: 'add'; title: string }
  /** The task's left-off note. */
  | { kind: 'leftOff'; text: string }

export type Plan = {
  rows: PlanRow[]
  /** Report lines that were already on the task as they are: nothing to do. */
  already: string[]
}

/**
 * Matches a parsed report against a task. Each report line finds the best
 * open subtask it agrees with (exact, then a typo away, then by prefix), and
 * no subtask is taken twice. Lines the task already has go to `already`.
 */
export function matchReport(doc: Doc, taskId: number, report: Report): Plan {
  const plan: Plan = { rows: [], already: [] }
  if (!byId(doc, taskId)) return plan
  const lines = linesOf(doc, taskId).map((l) => l.node)
  const taken = new Set<number>()
  const seen = new Set<string>()

  /** The closest untaken line; between equals, an open line beats a done one. */
  const best = (title: string) => {
    let found: { id: number; score: number; title: string; done: boolean } | null = null
    for (const line of lines) {
      if (taken.has(line.id)) continue
      const score = titleScore(title, line.title)
      if (score == null) continue
      const done = line.status === 'done'
      if (!found || score < found.score || (score === found.score && found.done && !done)) found = { id: line.id, score, title: line.title, done }
    }
    return found
  }

  for (const title of report.done) {
    const key = normalizeTitle(title)
    if (!key || seen.has(key)) continue
    seen.add(key)
    const hit = best(title)
    if (!hit) plan.rows.push({ kind: 'addDone', title })
    else {
      taken.add(hit.id)
      if (hit.done) plan.already.push(title)
      else plan.rows.push({ kind: 'tick', title, nodeId: hit.id, matched: hit.title })
    }
  }
  for (const title of report.added) {
    const key = normalizeTitle(title)
    if (!key || seen.has(key)) continue
    seen.add(key)
    const hit = best(title)
    if (!hit) plan.rows.push({ kind: 'add', title })
    else {
      taken.add(hit.id)
      plan.already.push(title)
    }
  }
  if (report.leftOff) plan.rows.push({ kind: 'leftOff', text: report.leftOff })
  return plan
}

/* ---------------------------------------------------------------- applying */

export type Applied = {
  doc: Doc
  /** `report: 3 ticked, 1 added` — what the trail and the toast say. */
  summary: string
  ticked: number[]
  added: number[]
  /** The left-off note before this report replaced it, when it did. */
  leftOffWas?: string
}

/** Applies the rows as one Doc: every tick, add and note in it, then one `report` line on the trail. */
export function applyPlan(doc: Doc, taskId: number, rows: PlanRow[], at = Date.now()): Applied {
  const task = byId(doc, taskId)
  if (!task) return { doc, summary: '', ticked: [], added: [] }
  let next = doc
  const ticked: number[] = []
  const added: number[] = []
  let leftOffWas: string | undefined
  let noted = false
  for (const row of rows) {
    if (row.kind === 'tick') {
      const line = byId(next, row.nodeId)
      if (!line || line.status === 'done') continue
      next = setStatus(next, row.nodeId, 'done')
      ticked.push(row.nodeId)
    } else if (row.kind === 'add' || row.kind === 'addDone') {
      const made = addNode(next, { parent: taskId, title: row.title, status: row.kind === 'addDone' ? 'done' : 'pending' })
      if (made.id < 0) continue
      next = made.doc
      added.push(made.id)
    } else if (row.kind === 'leftOff') {
      if (!noted) leftOffWas = task.leftOff ?? ''
      noted = true
      next = updateNode(next, taskId, { leftOff: row.text })
    }
  }
  const parts: string[] = []
  if (ticked.length) parts.push(`${ticked.length} ticked`)
  if (added.length) parts.push(`${added.length} added`)
  if (noted) parts.push('left off noted')
  const summary = `report: ${parts.length ? parts.join(', ') : 'nothing to apply'}`
  if (next === doc) return { doc, summary, ticked, added }
  next = updateNode(next, taskId, { touched: at })
  next = logEvent(next, 'report', summary, taskId, at)
  const out: Applied = { doc: next, summary, ticked, added }
  if (noted) out.leftOffWas = leftOffWas
  return out
}

/** Takes one applied report back out of whatever the doc is now, leaving everything done since alone. */
export function revertApplied(current: Doc, taskId: number, applied: Applied): Doc {
  let next = current
  for (const id of applied.ticked) {
    const line = byId(next, id)
    if (line && line.status === 'done') next = setStatus(next, id, 'pending')
  }
  for (const id of applied.added) next = removeNode(next, id)
  if (applied.leftOffWas !== undefined && byId(next, taskId)) next = updateNode(next, taskId, { leftOff: applied.leftOffWas })
  return next
}
