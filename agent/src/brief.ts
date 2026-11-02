import { byId, daysUntil, kindOf, linesOf, progressOf, projectOf, trailOf } from '../../src/model/doc.js'
import { LANE_LABEL, type Doc, type Node } from '../../src/model/types.js'

/*
 * The brief: one task as a markdown page an agent can work from. The web
 * app's "Copy as brief" renders the same sections in the same order, and
 * "Paste report" reads the report shape described under "Report back", so a
 * brief from either side round-trips through either side.
 *
 *   # TITLE
 *   Task #id · Project: name · Status: LANE · Due: date (in n days) · Urgent · Tonight
 *   ## Goal                 the task's body
 *   ## Next action          the one next action
 *   ## Subtasks             - [x] / - [ ] lines, nested by two spaces
 *   ## Links                - [label](url)
 *   ## Where I left off     the left-off note
 *   ## Recent trail         the last TRAIL_LINES trail events, newest first
 *   ## Done when            what finished looks like
 *   ## Report back          how to send the report
 *
 * Goal, Links, Where I left off and Recent trail are left out when empty;
 * everything else is always there.
 */

export const TRAIL_LINES = 8

export type TaskSummary = {
  id: number
  title: string
  kind: 'task' | 'subtask'
  project: string | null
  projectId: number | null
  status: string
  urgent: boolean
  tonight: boolean
  loose: boolean
  due: string | null
  next: string | null
  leftOff: string | null
  goal: string | null
  links: { label: string; url: string }[]
  progress: { done: number; total: number }
  touched: number | null
  subtasks: { id: number; title: string; done: boolean; status: string; depth: number }[]
}

export function taskSummary(doc: Doc, node: Node): TaskSummary {
  const project = projectOf(doc, node.id)
  return {
    id: node.id,
    title: node.title,
    kind: kindOf(doc, node.id) === 'task' ? 'task' : 'subtask',
    project: project && project.id !== node.id ? project.title : null,
    projectId: project && project.id !== node.id ? project.id : null,
    status: node.status,
    urgent: node.urgent === true,
    tonight: node.tonight === true,
    loose: node.loose === true,
    due: node.due ?? null,
    next: node.next ?? null,
    leftOff: node.leftOff ?? null,
    goal: node.body ?? null,
    links: (node.links ?? []).map((l) => ({ label: l.label, url: l.url })),
    progress: progressOf(doc, node.id),
    touched: node.touched ?? null,
    subtasks: linesOf(doc, node.id).map((l) => ({ id: l.node.id, title: l.node.title, done: l.node.status === 'done', status: l.node.status, depth: l.depth })),
  }
}

export function statusLabel(status: string): string {
  return status in LANE_LABEL ? LANE_LABEL[status as keyof typeof LANE_LABEL] : status.toUpperCase()
}

export function dueLabel(due: string, now = new Date()): string {
  const days = daysUntil(due, now)
  if (days === 0) return `${due} (today)`
  if (days === 1) return `${due} (tomorrow)`
  if (days === -1) return `${due} (1 day overdue)`
  if (days < 0) return `${due} (${-days} days overdue)`
  return `${due} (in ${days} days)`
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

/** Local time, minute precision: `2026-11-02 23:14`. */
export function stamp(at: number): string {
  const d = new Date(at)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function doneWhen(doc: Doc, node: Node): string {
  const { done, total } = progressOf(doc, node.id)
  const open = total - done
  const next = node.next ? ' and the next action is done' : ''
  if (total === 0) return node.next ? 'The next action above is done.' : 'The goal above is met. There are no subtasks yet; add the ones you find as you go.'
  if (open === 0) return `Every subtask is already ticked${node.next ? '; finish the next action above' : ''}.`
  return `Every subtask above is ticked${next}. ${open} of ${total} ${open === 1 ? 'is' : 'are'} still open.`
}

export type BriefOptions = { now?: Date; trail?: number }

/** The markdown brief for one task. Throws when the id is not a task or subtask. */
export function briefOf(doc: Doc, id: number, opts: BriefOptions = {}): string {
  const node = byId(doc, id)
  if (!node) throw new Error(`No task #${id}`)
  if (node.parent == null) throw new Error(`#${id} (${node.title}) is a project, not a task`)
  const now = opts.now ?? new Date()
  const trailLines = opts.trail ?? TRAIL_LINES
  const project = projectOf(doc, id)
  const out: string[] = []

  out.push(`# ${node.title}`)
  const meta = [`Task #${node.id}`]
  if (project && project.id !== node.id) meta.push(`Project: ${project.title}`)
  meta.push(`Status: ${statusLabel(node.status)}`)
  if (node.due) meta.push(`Due: ${dueLabel(node.due, now)}`)
  if (node.urgent) meta.push('Urgent')
  if (node.tonight) meta.push('Tonight')
  if (node.loose) {
    const parent = byId(doc, node.parent)
    if (parent) meta.push(`Loose from: ${parent.title} (#${parent.id})`)
  }
  out.push(meta.join(' · '))

  if (node.body?.trim()) out.push('', '## Goal', node.body.trim())

  out.push('', '## Next action', node.next?.trim() || '(not set — pick the first open subtask)')

  out.push('', '## Subtasks')
  const lines = linesOf(doc, id)
  if (!lines.length) out.push('(none yet)')
  for (const line of lines) out.push(`${'  '.repeat(line.depth - 1)}- [${line.node.status === 'done' ? 'x' : ' '}] ${line.node.title}`)

  if (node.links?.length) {
    out.push('', '## Links')
    for (const l of node.links) out.push(`- [${l.label}](${l.url})`)
  }

  if (node.leftOff?.trim()) out.push('', '## Where I left off', node.leftOff.trim())

  const trail = trailOf(doc, id).slice(0, trailLines)
  if (trail.length) {
    out.push('', '## Recent trail')
    for (const e of trail) out.push(`- ${stamp(e.at)} · ${e.kind} · ${e.text}`)
  }

  out.push('', '## Done when', doneWhen(doc, node))

  out.push(
    '',
    '## Report back',
    'When you stop, reply with a report in this shape (titles as written above; new lines for work you found):',
    '',
    '```',
    '## Report',
    '- [x] a subtask you finished',
    '- [ ] a new subtask you found',
    'Left off: where you stopped, in one line',
    '```',
    '',
    `Send it with the \`vault_report\` MCP tool (id ${node.id}), or \`vault-agent report ${node.id} < report.md\`, or paste it into this task in VAULT.`,
  )
  return out.join('\n') + '\n'
}
