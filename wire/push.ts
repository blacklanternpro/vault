import { addNode, boardCards, byId, childrenOf, daysUntil, isIsoDate, linesOf, logEvent, progressOf, projectsOf, setStatus, updateNode } from '../src/model/doc.js'
import { LANE_LABEL, type Doc, type Lane, type Node } from '../src/model/types.js'
import { normalizeText, rank } from '../agent/src/match.js'

/*
 * vault_push and vault_status as pure functions over a Doc. Every write goes
 * through src/model (addNode, updateNode, setStatus, logEvent), so a pushed
 * task is shaped exactly like one made in the app; the store then runs the
 * result through sanitizeDoc before it is saved.
 *
 * Matching is deliberately stricter than the agent's resolver: pushing the
 * same tree twice must update, never duplicate, but a near miss must never
 * file work under the wrong name. So a folder matches only on its normalised
 * name (case, spacing, a trailing slash); a task or subtask also matches a
 * typo or two when the title is long enough for that to be safe. Prefixes and
 * contained phrases never match ("Site" is not "Site redesign").
 */

export const LIMITS = { tasks: 30, subtasks: 40, title: 200, text: 500 }

export type PushSubtask = string | { title: string; done?: boolean }

export type PushTask = {
  title: string
  subtasks?: PushSubtask[]
  /** YYYY-MM-DD */
  due?: string
  next?: string
  status?: Lane
  body?: string
}

export type PushTree = { folder: string; tasks: PushTask[] }

export type PushedTask = { id: number; title: string; created: boolean; subtasks: { added: number; ticked: number; total: number; done: number }; due: string | null }

export type PushResult = { doc: Doc; folder: { id: number; title: string; created: boolean }; tasks: PushedTask[]; receipt: string }

export class PushError extends Error {}

/** Folder names compare without case, spacing or a trailing slash: `R1i/` is `r1i`. */
function folderKey(s: string): string {
  return normalizeText(s).replace(/\/+$/, '').trim()
}

function clean(s: string, max: number): string {
  const printable = Array.from(s, (c) => {
    const code = c.charCodeAt(0)
    return code < 0x20 || code === 0x7f ? ' ' : c
  }).join('')
  return printable.replace(/\s+/g, ' ').trim().slice(0, max)
}

/** The one node among `items` that `title` means, or undefined to create a new one. */
export function matchTitle(title: string, items: readonly Node[]): Node | undefined {
  const key = normalizeText(title)
  const exact = items.find((n) => normalizeText(n.title) === key)
  if (exact) return exact
  if (key.length < 8) return undefined
  const typos = items.filter((n) => {
    const r = rank(title, n.title)
    return r.tier === 1 && n.title.length >= 8
  })
  return typos.length === 1 ? typos[0] : undefined
}

export function findFolder(doc: Doc, name: string): Node | undefined {
  const key = folderKey(name)
  return projectsOf(doc).find((p) => folderKey(p.title) === key)
}

function subtaskSpec(s: PushSubtask): { title: string; done: boolean } {
  return typeof s === 'string' ? { title: s, done: false } : { title: s.title, done: s.done === true }
}

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** `today`, `Fri` within the week, `3d late`, else `12 Dec`. */
export function dueLabel(due: string, now: Date): string {
  const days = daysUntil(due, now)
  if (days < 0) return `${-days}d late`
  if (days === 0) return 'today'
  const d = new Date(due + 'T00:00:00')
  if (days < 7) return WEEKDAY[d.getDay()]
  return `${d.getDate()} ${MONTH[d.getMonth()]}`
}

/** The one line Claude answers with: `→ r1i/ · NETWORK MAP · 4 subtasks · due Fri`. */
export function receiptOf(folder: string, tasks: PushedTask[], now: Date): string {
  const parts = [`→ ${folderKey(folder) || folder}/`]
  const names = tasks.map((t) => t.title.toUpperCase())
  parts.push(names.length <= 2 ? names.join(', ') : `${names[0]} +${names.length - 1} more`)
  const total = tasks.reduce((n, t) => n + t.subtasks.total, 0)
  const added = tasks.reduce((n, t) => n + t.subtasks.added, 0)
  const fresh = tasks.every((t) => t.created)
  if (total) parts.push(`${total} subtask${total === 1 ? '' : 's'}${!fresh && added ? ` (${added} new)` : ''}`)
  const dues = tasks.map((t) => t.due).filter((d): d is string => !!d).sort()
  if (dues.length) parts.push(`due ${dueLabel(dues[0], now)}`)
  if (!fresh) parts.push(tasks.some((t) => t.created) ? 'updated + new' : 'updated')
  return parts.join(' · ')
}

/**
 * Files a tree under one folder. Creates what is missing, updates what matches
 * (due, next action, status, goal when given; ticks a subtask pushed as done),
 * and never deletes, unticks or renames anything already on the board.
 */
export function push(doc: Doc, tree: PushTree, at: number, signer = 'claude'): PushResult {
  const folderName = clean(tree.folder ?? '', LIMITS.title).replace(/\/+$/, '')
  if (!folderName) throw new PushError('Give a folder (the project the work belongs to)')
  if (!Array.isArray(tree.tasks) || !tree.tasks.length) throw new PushError('Give at least one task')
  if (tree.tasks.length > LIMITS.tasks) throw new PushError(`At most ${LIMITS.tasks} tasks in one push`)

  const sign = (d: Doc, kind: Parameters<typeof logEvent>[1], text: string, id: number) => logEvent(d, kind, `${signer} (wire): ${text}`, id, at)

  let next = doc
  let folder = findFolder(next, folderName)
  const folderCreated = !folder
  if (!folder) {
    const made = addNode(next, { parent: null, title: folderName })
    next = sign(made.doc, 'created', `created folder ${folderName}/`, made.id)
    folder = byId(next, made.id)!
  }
  const folderId = folder.id

  const pushed: PushedTask[] = []
  const seen = new Set<number>()
  for (const raw of tree.tasks) {
    const title = clean(raw.title ?? '', LIMITS.title)
    if (!title) throw new PushError('Every task needs a title')
    const due = raw.due?.trim() || undefined
    if (due && !isIsoDate(due)) throw new PushError(`'${raw.due}' is not a date; use YYYY-MM-DD`)
    const subs = (raw.subtasks ?? []).map(subtaskSpec).map((s) => ({ title: clean(s.title ?? '', LIMITS.title), done: s.done })).filter((s) => s.title)
    if (subs.length > LIMITS.subtasks) throw new PushError(`At most ${LIMITS.subtasks} subtasks on one task`)

    const existing = matchTitle(
      title,
      childrenOf(next, folderId).filter((n) => !seen.has(n.id)),
    )
    let taskId: number
    let created = false
    if (existing) {
      taskId = existing.id
    } else {
      const made = addNode(next, { parent: folderId, title, status: raw.status ?? 'pending' })
      taskId = made.id
      created = true
      next = sign(made.doc, 'created', `created "${title}" in ${folder.title}/`, taskId)
    }
    seen.add(taskId)

    const patch: { due?: string; next?: string; body?: string; touched: number } = { touched: at }
    if (due) patch.due = due
    const nextAction = raw.next != null ? clean(raw.next, LIMITS.text) : ''
    if (nextAction) patch.next = nextAction
    const body = raw.body != null ? raw.body.trim().slice(0, 4 * LIMITS.text) : ''
    if (body) patch.body = body
    const before = byId(next, taskId)!
    next = updateNode(next, taskId, patch)
    if (due && before.due !== due) next = sign(next, 'due', `due ${due}`, taskId)
    if (nextAction && before.next !== nextAction) next = sign(next, 'note', `next action: ${nextAction}`, taskId)
    if (!created && raw.status && before.status !== raw.status) {
      next = setStatus(next, taskId, raw.status)
      next = sign(next, 'moved', `moved to ${LANE_LABEL[raw.status]}`, taskId)
    }

    let added = 0
    let ticked = 0
    for (const s of subs) {
      const lines = linesOf(next, taskId).map((l) => l.node)
      const twin = matchTitle(s.title, lines)
      if (twin) {
        if (s.done && twin.status !== 'done') {
          next = setStatus(next, twin.id, 'done')
          next = sign(next, 'ticked', `ticked "${twin.title}"`, taskId)
          ticked += 1
        }
        continue
      }
      const made = addNode(next, { parent: taskId, title: s.title, status: s.done ? 'done' : 'pending' })
      next = sign(made.doc, 'created', `added subtask "${s.title}"${s.done ? ' (done)' : ''}`, taskId)
      added += 1
    }
    const progress = progressOf(next, taskId)
    const node = byId(next, taskId)!
    pushed.push({ id: taskId, title: node.title, created, subtasks: { added, ticked, total: progress.total, done: progress.done }, due: node.due ?? null })
  }

  const now = new Date(at)
  return { doc: next, folder: { id: folderId, title: folder.title, created: folderCreated }, tasks: pushed, receipt: receiptOf(folder.title, pushed, now) }
}

/* ------------------------------------------------------------------ status */

export type FolderStatus = { id: number; title: string; counts: Record<Lane, number>; active: string[] }
export type DueItem = { id: number; title: string; folder: string; due: string; label: string }
export type BoardStatus = { folders: FolderStatus[]; dueSoon: DueItem[]; overdue: DueItem[]; tonight: string[]; activeTotal: number }

export function status(doc: Doc, now: Date): BoardStatus {
  const folders: FolderStatus[] = projectsOf(doc).map((p) => {
    const counts: Record<Lane, number> = { pending: 0, rnd: 0, active: 0, done: 0, dusted: 0 }
    const cards = boardCards(doc, p.id)
    for (const c of cards) if (c.status !== 'none') counts[c.status] += 1
    return { id: p.id, title: p.title, counts, active: cards.filter((c) => c.status === 'active').map((c) => c.title) }
  })
  const dueSoon: DueItem[] = []
  const overdue: DueItem[] = []
  const tonight: string[] = []
  for (const c of boardCards(doc, null)) {
    if (c.tonight) tonight.push(c.title)
    if (!c.due || c.status === 'done' || c.status === 'dusted') continue
    const days = daysUntil(c.due, now)
    const folder = projectsOf(doc).find((p) => p.id === topOf(doc, c).id)?.title ?? ''
    const item = { id: c.id, title: c.title, folder, due: c.due, label: dueLabel(c.due, now) }
    if (days < 0) overdue.push(item)
    else if (days <= 7) dueSoon.push(item)
  }
  dueSoon.sort((a, b) => a.due.localeCompare(b.due))
  overdue.sort((a, b) => a.due.localeCompare(b.due))
  return { folders, dueSoon, overdue, tonight, activeTotal: folders.reduce((n, f) => n + f.counts.active, 0) }
}

function topOf(doc: Doc, node: Node): Node {
  let at = node
  while (at.parent != null) {
    const up = byId(doc, at.parent)
    if (!up) break
    at = up
  }
  return at
}

export function statusText(s: BoardStatus, meta: { rev: number; savedAt: number | null }): string {
  const lines: string[] = []
  const saved = meta.savedAt ? new Date(meta.savedAt).toISOString().slice(0, 16).replace('T', ' ') + 'Z' : 'never'
  lines.push(`test board · rev ${meta.rev} · saved ${saved} · ${s.activeTotal}/3 active`)
  if (!s.folders.length) lines.push('_ (empty: nothing vaulted yet)')
  for (const f of s.folders) {
    const c = f.counts
    const open = c.pending + c.rnd + c.active
    const bits = [`${open} open`]
    if (c.active) bits.push(`${c.active} active`)
    if (c.rnd) bits.push(`${c.rnd} r&d`)
    if (c.done) bits.push(`${c.done} done`)
    lines.push(`${f.title}/  ${bits.join(' · ')}${f.active.length ? `  → ${f.active.join(', ')}` : ''}`)
  }
  if (s.overdue.length) lines.push(`late: ${s.overdue.map((d) => `${d.title} (${d.folder}/, ${d.label})`).join('; ')}`)
  if (s.dueSoon.length) lines.push(`due soon: ${s.dueSoon.map((d) => `${d.title} (${d.folder}/, ${d.label})`).join('; ')}`)
  if (s.tonight.length) lines.push(`tonight: ${s.tonight.join(', ')}`)
  return lines.join('\n')
}
