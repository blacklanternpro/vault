import {
  addNode,
  boardCards,
  byId,
  cardOf,
  hostOf,
  isIsoDate,
  isSafeUrl,
  kindOf,
  linesOf,
  logEvent,
  progressOf,
  projectOf,
  projectsOf,
  searchIds,
  setStatus as setLane,
  updateNode,
} from '../../src/model/doc.js'
import { isLane, LANES, type Doc, type EventKind, type Lane, type Node } from '../../src/model/types.js'
import { briefOf, statusLabel, taskSummary, type TaskSummary } from './brief.js'
import { findBest, normalizeText } from './match.js'
import { parseReport } from './report.js'
import type { FileStore } from './store.js'

/*
 * What the MCP tools and the CLI actually do. Each handler takes plain
 * arguments and returns `{ text, data }`: a line or two for a person or a
 * model to read, and the same facts as JSON. Anything that cannot be done
 * throws an AgentError whose message says what to do instead.
 */

export class AgentError extends Error {}

/** A task by number (`5`, `"5"`, `"#5"`) or by title (`"site redesign"`, forgiving). */
export type Ref = number | string

export type ToolResult<T> = { text: string; data: T }

export type TaskRow = Pick<TaskSummary, 'id' | 'title' | 'project' | 'projectId' | 'status' | 'urgent' | 'tonight' | 'loose' | 'due' | 'next' | 'progress'>

export type ReportOutcome = {
  task: { id: number; title: string }
  ticked: { id: number; title: string }[]
  added: { id: number; title: string; done: boolean }[]
  skipped: { line: string; reason: string }[]
  leftOff: string | null
  progress: { done: number; total: number }
  inboxIndex: number
}

export type SearchHit = { id: number; title: string; kind: 'project' | 'task' | 'subtask'; status: string; cardId: number | null; cardTitle: string | null; project: string | null }

/* ------------------------------------------------------------- resolving */

function label(n: Node): string {
  return `${n.title} (#${n.id})`
}

function idOf(ref: Ref): number | null {
  if (typeof ref === 'number') return Number.isInteger(ref) && ref > 0 ? ref : null
  const m = /^\s*#?(\d+)\s*$/.exec(ref)
  return m ? Number(m[1]) : null
}

/** The task (or loose/nested subtask) a reference means. */
export function resolveTask(doc: Doc, ref: Ref): Node {
  const id = idOf(ref)
  if (id != null) {
    const node = byId(doc, id)
    if (!node) throw new AgentError(`No task #${id}`)
    if (node.parent == null) throw new AgentError(`#${id} (${node.title}) is a project, not a task; list its tasks with vault_list_tasks`)
    return node
  }
  const title = String(ref).trim()
  if (!title) throw new AgentError('Give a task id or title')
  const cards = boardCards(doc, null)
  const onBoard = findBest(title, cards, (n) => n.title)
  if (onBoard.hit) return onBoard.hit
  if (onBoard.ambiguous) throw new AgentError(`'${title}' could be ${onBoard.ambiguous.map(label).join(' or ')}; use the id`)
  const cardIds = new Set(cards.map((c) => c.id))
  const inside = findBest(
    title,
    doc.nodes.filter((n) => n.parent != null && !cardIds.has(n.id)),
    (n) => n.title,
  )
  if (inside.hit) return inside.hit
  throw new AgentError(`No task matches '${title}'${onBoard.closest ? `; closest: ${label(onBoard.closest)}` : ''}`)
}

export function resolveProject(doc: Doc, ref: Ref): Node {
  const id = idOf(ref)
  if (id != null) {
    const node = byId(doc, id)
    if (!node) throw new AgentError(`No project #${id}`)
    if (node.parent != null) throw new AgentError(`#${id} (${node.title}) is a task, not a project`)
    return node
  }
  const name = String(ref).trim()
  if (!name) throw new AgentError('Give a project name or id')
  const projects = projectsOf(doc)
  const found = findBest(name, projects, (n) => n.title)
  if (found.hit) return found.hit
  if (found.ambiguous) throw new AgentError(`'${name}' could be ${found.ambiguous.map(label).join(' or ')}; use the id`)
  const have = projects.length ? ` Projects: ${projects.map((p) => p.title).join(', ')}.` : ' There are no projects yet.'
  throw new AgentError(`No project matches '${name}'${found.closest ? `; closest: ${label(found.closest)}` : ''}.${have}`)
}

export function parseLane(value: string): Lane {
  const v = normalizeText(value).replace(/[^a-z&]/g, '')
  const alias: Record<string, Lane> = { 'r&d': 'rnd', rd: 'rnd', research: 'rnd', doing: 'active', inprogress: 'active', todo: 'pending', complete: 'done', completed: 'done', finished: 'done', archived: 'dusted', dropped: 'dusted' }
  const lane = alias[v] ?? v
  if (isLane(lane)) return lane
  throw new AgentError(`'${value}' is not a status; use one of ${LANES.join(', ')}`)
}

/** The subtask of `task` that `query` names: by id, or by forgiving title match among the open ones first. */
export function resolveSubtask(doc: Doc, task: Node, query: string): { node: Node; alreadyDone: boolean } {
  const lines = linesOf(doc, task.id).map((l) => l.node)
  if (!lines.length) throw new AgentError(`${label(task)} has no subtasks yet; add one with vault_add_subtask`)
  const id = idOf(query)
  if (id != null) {
    const node = lines.find((n) => n.id === id)
    if (!node) throw new AgentError(`#${id} is not a subtask of ${label(task)}`)
    return { node, alreadyDone: node.status === 'done' }
  }
  const open = lines.filter((n) => n.status !== 'done')
  const found = findBest(query, open, (n) => n.title)
  if (found.hit) return { node: found.hit, alreadyDone: false }
  if (found.ambiguous) throw new AgentError(`'${query}' could be ${found.ambiguous.map(label).join(' or ')}; use the id`)
  const done = findBest(
    query,
    lines.filter((n) => n.status === 'done'),
    (n) => n.title,
  )
  if (done.hit) return { node: done.hit, alreadyDone: true }
  const closest = found.closest ?? done.closest
  throw new AgentError(`No open subtask of ${label(task)} matches '${query}'${closest ? `; closest: ${label(closest)}` : ''}`)
}

/* -------------------------------------------------------------- rendering */

function rowOf(doc: Doc, node: Node): TaskRow {
  const s = taskSummary(doc, node)
  return { id: s.id, title: s.title, project: s.project, projectId: s.projectId, status: s.status, urgent: s.urgent, tonight: s.tonight, loose: s.loose, due: s.due, next: s.next, progress: s.progress }
}

function clip(s: string, max: number): string {
  return s.length <= max ? s : s.slice(0, max - 1) + '…'
}

export function table(headers: string[], rows: string[][]): string {
  const widths = headers.map((h, i) => Math.max(h.length, ...rows.map((r) => (r[i] ?? '').length)))
  const line = (cells: string[]) => cells.map((c, i) => (i === cells.length - 1 ? c : c.padEnd(widths[i]))).join('  ').trimEnd()
  return [line(headers), ...rows.map(line)].join('\n')
}

export function tasksTable(doc: Doc, cards: Node[]): string {
  if (!cards.length) return 'No tasks match.'
  const rows = cards.map((n) => {
    const p = progressOf(doc, n.id)
    const flags = [n.urgent ? 'urgent' : '', n.tonight ? 'tonight' : '', n.loose ? 'loose' : ''].filter(Boolean).join(',')
    return [
      `#${n.id}`,
      statusLabel(n.status),
      projectOf(doc, n.id)?.title ?? '',
      clip(n.title, 40),
      p.total ? `${p.done}/${p.total}` : '',
      n.due ?? '',
      flags,
      clip(n.next ?? '', 48),
    ]
  })
  return table(['ID', 'STATUS', 'PROJECT', 'TITLE', 'SUBS', 'DUE', 'FLAGS', 'NEXT'], rows)
}

/* --------------------------------------------------------------- handlers */

export type Handlers = ReturnType<typeof createHandlers>

export function createHandlers(store: FileStore, clock: () => number = Date.now) {
  const note = (doc: Doc, kind: EventKind, text: string, id: number, at: number) => logEvent(doc, kind, `agent: ${text}`, id, at)
  const touch = (doc: Doc, id: number, at: number) => updateNode(doc, id, { touched: at })
  const current = () => store.read().doc

  function listTasks(args: { project?: Ref; status?: string; tonight?: boolean } = {}): ToolResult<{ count: number; tasks: TaskRow[] }> {
    const doc = current()
    const project = args.project != null && args.project !== '' ? resolveProject(doc, args.project) : null
    const lane = args.status ? parseLane(args.status) : null
    let cards = boardCards(doc, project ? project.id : null)
    if (lane) cards = cards.filter((n) => n.status === lane)
    if (args.tonight) cards = cards.filter((n) => n.tonight)
    const tasks = cards.map((n) => rowOf(doc, n))
    const scope = [project ? `project ${project.title}` : 'all projects', lane ? `status ${statusLabel(lane)}` : '', args.tonight ? 'tonight' : ''].filter(Boolean).join(', ')
    return { text: `${tasks.length} task${tasks.length === 1 ? '' : 's'} (${scope})\n${tasksTable(doc, cards)}`, data: { count: tasks.length, tasks } }
  }

  function getTask(args: { id?: Ref; title?: string }): ToolResult<TaskSummary> {
    const ref = args.id ?? args.title
    if (ref == null || ref === '') throw new AgentError('Give a task id or title')
    const doc = current()
    const node = resolveTask(doc, ref)
    return { text: briefOf(doc, node.id, { now: new Date(clock()) }), data: taskSummary(doc, node) }
  }

  function tick(args: { id: Ref; subtask: string }): ToolResult<{ task: { id: number; title: string }; subtask: { id: number; title: string }; progress: { done: number; total: number } }> {
    const at = clock()
    const { result } = store.update((doc) => {
      const task = resolveTask(doc, args.id)
      const { node, alreadyDone } = resolveSubtask(doc, task, args.subtask)
      if (alreadyDone) throw new AgentError(`"${node.title}" (#${node.id}) is already ticked on ${label(task)}`)
      let next = setLane(doc, node.id, 'done')
      next = note(next, 'ticked', `ticked "${node.title}"`, task.id, at)
      next = touch(next, task.id, at)
      const progress = progressOf(next, task.id)
      return {
        doc: next,
        result: {
          text: `Ticked "${node.title}" on ${label(task)}: ${progress.done}/${progress.total} done.`,
          data: { task: { id: task.id, title: task.title }, subtask: { id: node.id, title: node.title }, progress },
        },
      }
    })
    return result
  }

  function addSubtask(args: { id: Ref; title: string; done?: boolean }): ToolResult<{ task: { id: number; title: string }; subtask: { id: number; title: string; done: boolean }; progress: { done: number; total: number } }> {
    const title = args.title.trim()
    if (!title) throw new AgentError('A subtask needs a title')
    const at = clock()
    const { result } = store.update((doc) => {
      const task = resolveTask(doc, args.id)
      const twin = linesOf(doc, task.id).find((l) => normalizeText(l.node.title) === normalizeText(title))
      if (twin) throw new AgentError(`${label(task)} already has "${twin.node.title}" (#${twin.node.id}${twin.node.status === 'done' ? ', ticked' : ''})`)
      const added = addNode(doc, { parent: task.id, title, status: args.done ? 'done' : 'pending' })
      let next = note(added.doc, 'created', `added subtask "${title}"${args.done ? ' (done)' : ''}`, task.id, at)
      next = touch(next, task.id, at)
      const progress = progressOf(next, task.id)
      return {
        doc: next,
        result: {
          text: `Added ${args.done ? 'ticked ' : ''}subtask "${title}" (#${added.id}) to ${label(task)}: ${progress.done}/${progress.total} done.`,
          data: { task: { id: task.id, title: task.title }, subtask: { id: added.id, title, done: args.done === true }, progress },
        },
      }
    })
    return result
  }

  function setStatus(args: { id: Ref; status: string }): ToolResult<{ task: { id: number; title: string }; status: Lane; was: string }> {
    const lane = parseLane(args.status)
    const at = clock()
    const { result } = store.update((doc) => {
      const task = resolveTask(doc, args.id)
      const was = task.status
      if (was === lane) return { doc, result: { text: `${label(task)} is already ${statusLabel(lane)}.`, data: { task: { id: task.id, title: task.title }, status: lane, was } } }
      let next = setLane(doc, task.id, lane)
      next = note(next, 'moved', `moved to ${statusLabel(lane)}`, task.id, at)
      next = touch(next, task.id, at)
      return { doc: next, result: { text: `${label(task)}: ${statusLabel(was)} → ${statusLabel(lane)}.`, data: { task: { id: task.id, title: task.title }, status: lane, was } } }
    })
    return result
  }

  function setNext(args: { id: Ref; next: string }): ToolResult<{ task: { id: number; title: string }; next: string | null }> {
    const text = args.next.trim()
    const at = clock()
    const { result } = store.update((doc) => {
      const task = resolveTask(doc, args.id)
      let next = updateNode(doc, task.id, { next: text })
      next = note(next, 'note', text ? `next action: ${text}` : 'cleared the next action', task.id, at)
      next = touch(next, task.id, at)
      return { doc: next, result: { text: text ? `Next action on ${label(task)}: ${text}` : `Cleared the next action on ${label(task)}.`, data: { task: { id: task.id, title: task.title }, next: text || null } } }
    })
    return result
  }

  function leftOff(args: { id: Ref; text: string }): ToolResult<{ task: { id: number; title: string }; leftOff: string | null }> {
    const text = args.text.trim()
    const at = clock()
    const { result } = store.update((doc) => {
      const task = resolveTask(doc, args.id)
      let next = updateNode(doc, task.id, { leftOff: text })
      next = note(next, 'leftoff', text ? `left off: ${text}` : 'cleared the left-off note', task.id, at)
      next = touch(next, task.id, at)
      return { doc: next, result: { text: text ? `Left off on ${label(task)}: ${text}` : `Cleared the left-off note on ${label(task)}.`, data: { task: { id: task.id, title: task.title }, leftOff: text || null } } }
    })
    return result
  }

  function addLink(args: { id: Ref; url: string; label?: string }): ToolResult<{ task: { id: number; title: string }; link: { label: string; url: string }; links: { label: string; url: string }[] }> {
    const url = args.url.trim()
    if (!isSafeUrl(url)) throw new AgentError(`'${args.url}' is not an http(s) URL`)
    const linkLabel = args.label?.trim() || hostOf(url)
    const at = clock()
    const { result } = store.update((doc) => {
      const task = resolveTask(doc, args.id)
      const links = [...(task.links ?? []).filter((l) => l.url !== url), { label: linkLabel, url }]
      let next = updateNode(doc, task.id, { links })
      next = note(next, 'note', `linked ${linkLabel} (${url})`, task.id, at)
      next = touch(next, task.id, at)
      const saved = byId(next, task.id)?.links ?? []
      return { doc: next, result: { text: `Linked ${linkLabel} → ${url} on ${label(task)} (${saved.length} link${saved.length === 1 ? '' : 's'}).`, data: { task: { id: task.id, title: task.title }, link: { label: linkLabel, url }, links: saved } } }
    })
    return result
  }

  function report(args: { id: Ref; report: string }): ToolResult<ReportOutcome> {
    const text = args.report.trim()
    if (!text) throw new AgentError('The report is empty')
    const parsed = parseReport(text)
    const at = clock()
    const { result } = store.update((doc) => {
      const task = resolveTask(doc, args.id)
      let next = doc
      const ticked: ReportOutcome['ticked'] = []
      const added: ReportOutcome['added'] = []
      const skipped: ReportOutcome['skipped'] = []
      for (const line of parsed.done) {
        const lines = linesOf(next, task.id).map((l) => l.node)
        const open = lines.filter((n) => n.status !== 'done')
        const hit = findBest(line, open, (n) => n.title)
        if (hit.hit) {
          next = setLane(next, hit.hit.id, 'done')
          next = note(next, 'ticked', `ticked "${hit.hit.title}"`, task.id, at)
          ticked.push({ id: hit.hit.id, title: hit.hit.title })
          continue
        }
        if (hit.ambiguous) {
          skipped.push({ line, reason: `could be ${hit.ambiguous.map(label).join(' or ')}` })
          continue
        }
        const done = findBest(
          line,
          lines.filter((n) => n.status === 'done'),
          (n) => n.title,
        )
        if (done.hit) {
          skipped.push({ line, reason: `"${done.hit.title}" (#${done.hit.id}) was already ticked` })
          continue
        }
        const made = addNode(next, { parent: task.id, title: line, status: 'done' })
        next = note(made.doc, 'created', `added subtask "${line}" (done)`, task.id, at)
        added.push({ id: made.id, title: line, done: true })
      }
      for (const line of parsed.todo) {
        const lines = linesOf(next, task.id).map((l) => l.node)
        const twin = findBest(line, lines, (n) => n.title)
        if (twin.hit) {
          skipped.push({ line, reason: `already listed as "${twin.hit.title}" (#${twin.hit.id}${twin.hit.status === 'done' ? ', ticked' : ''})` })
          continue
        }
        if (twin.ambiguous) {
          skipped.push({ line, reason: `already listed (${twin.ambiguous.map(label).join(' or ')})` })
          continue
        }
        const made = addNode(next, { parent: task.id, title: line, status: 'pending' })
        next = note(made.doc, 'created', `added subtask "${line}"`, task.id, at)
        added.push({ id: made.id, title: line, done: false })
      }
      for (const line of parsed.ignored) skipped.push({ line, reason: 'not a `- [ ]`, `- [x]` or `Left off:` line' })
      if (parsed.leftOff) {
        next = updateNode(next, task.id, { leftOff: parsed.leftOff })
        next = note(next, 'leftoff', `left off: ${parsed.leftOff}`, task.id, at)
      }
      const summary = `report: ticked ${ticked.length}, added ${added.length}${parsed.leftOff ? ', left off noted' : ''}`
      next = note(next, 'report', summary, task.id, at)
      next = touch(next, task.id, at)
      const progress = progressOf(next, task.id)
      const outcome: ReportOutcome = { task: { id: task.id, title: task.title }, ticked, added, skipped, leftOff: parsed.leftOff ?? null, progress, inboxIndex: -1 }
      return { doc: next, result: outcome }
    })
    const inbox = store.appendInbox({ text, taskId: result.task.id, at })
    result.inboxIndex = inbox.index
    const lines = [
      `Report applied to ${result.task.title} (#${result.task.id}): ticked ${result.ticked.length}, added ${result.added.length}, skipped ${result.skipped.length}${result.leftOff ? ', left off noted' : ''}. ${result.progress.done}/${result.progress.total} done. Delivered to the VAULT inbox (#${inbox.index}).`,
    ]
    for (const t of result.ticked) lines.push(`  ticked:  ${t.title} (#${t.id})`)
    for (const a of result.added) lines.push(`  added:   ${a.title} (#${a.id})${a.done ? ' [done]' : ''}`)
    for (const s of result.skipped) lines.push(`  skipped: ${s.line} — ${s.reason}`)
    if (result.leftOff) lines.push(`  left off: ${result.leftOff}`)
    return { text: lines.join('\n'), data: result }
  }

  function createTask(args: { project: Ref; title: string; status?: string; next?: string; due?: string }): ToolResult<TaskSummary> {
    const title = args.title.trim()
    if (!title) throw new AgentError('A task needs a title')
    const lane = args.status ? parseLane(args.status) : 'pending'
    const due = args.due?.trim() || undefined
    if (due && !isIsoDate(due)) throw new AgentError(`'${args.due}' is not a date; use YYYY-MM-DD`)
    const at = clock()
    const { result } = store.update((doc) => {
      const project = resolveProject(doc, args.project)
      const made = addNode(doc, { parent: project.id, title, status: lane })
      let next = made.doc
      const patch: { next?: string; due?: string } = {}
      if (args.next?.trim()) patch.next = args.next.trim()
      if (due) patch.due = due
      if (Object.keys(patch).length) next = updateNode(next, made.id, patch)
      next = note(next, 'created', `created "${title}" in ${project.title}`, made.id, at)
      if (due) next = note(next, 'due', `due ${due}`, made.id, at)
      next = touch(next, made.id, at)
      const node = byId(next, made.id)!
      return { doc: next, result: { text: `Created ${label(node)} in ${project.title}, ${statusLabel(lane)}${due ? `, due ${due}` : ''}.`, data: taskSummary(next, node) } }
    })
    return result
  }

  function search(args: { q: string }): ToolResult<{ q: string; count: number; hits: SearchHit[] }> {
    const q = args.q.trim()
    if (!q) throw new AgentError('Give something to search for')
    const doc = current()
    const ids = searchIds(doc, q)
    const hits: SearchHit[] = []
    for (const n of doc.nodes) {
      if (!ids.has(n.id)) continue
      const card = cardOf(doc, n.id)
      const project = projectOf(doc, n.id)
      hits.push({ id: n.id, title: n.title, kind: kindOf(doc, n.id), status: n.status, cardId: card ? card.id : null, cardTitle: card ? card.title : null, project: project && project.id !== n.id ? project.title : null })
    }
    const shown = hits.slice(0, 50)
    const lines = shown.map((h) => {
      const where = h.kind === 'subtask' && h.cardId != null && h.cardId !== h.id ? ` — in ${h.cardTitle} (#${h.cardId})` : ''
      const proj = h.project ? ` · ${h.project}` : ''
      return `#${h.id} · ${h.kind}${h.kind === 'project' ? '' : ` · ${statusLabel(h.status)}`} · ${h.title}${where}${proj}`
    })
    const head = `${hits.length} hit${hits.length === 1 ? '' : 's'} for '${q}'${hits.length > shown.length ? ` (first ${shown.length})` : ''}`
    return { text: hits.length ? `${head}\n${lines.join('\n')}` : head, data: { q, count: hits.length, hits } }
  }

  /** The `vault://tasks` resource. */
  function tasksMarkdown(): string {
    const doc = current()
    const cards = boardCards(doc, null)
    return `# VAULT tasks\n\n${tasksTable(doc, cards)}\n\nRead one with vault_get_task or the resource vault://task/{id}.\n`
  }

  return { listTasks, getTask, tick, addSubtask, setStatus, setNext, leftOff, addLink, report, createTask, search, tasksMarkdown }
}
