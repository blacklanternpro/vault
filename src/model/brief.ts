import { byId, hostOf, isSafeUrl, laneOf, linesOf, projectOf, projectsOf, subtreeIds, trailOf } from './doc'
import { LANE_LABEL, type Doc, type Node } from './types'

/*
 * The handoff, outbound: a task written out as a markdown brief an agent can
 * work from, plus the small readings around it — what kind of thing a link
 * points at, how long has been spent where, which URLs a pasted text holds.
 * Pure, like the rest of the model: a Doc in, text or numbers out.
 */

/* ------------------------------------------------------------------- links */

export type LinkKind = 'repo' | 'deploy' | 'figma' | 'mail' | 'doc' | 'other'

/** What a link points at, read off its hostname, so a chip can carry the right mark. */
export function linkKind(url: string): LinkKind {
  const host = hostOf(url).toLowerCase()
  const is = (...names: string[]) => names.some((n) => host === n || host.endsWith(`.${n}`))
  if (is('github.com', 'gitlab.com', 'bitbucket.org')) return 'repo'
  if (is('vercel.app', 'vercel.com', 'netlify.app', 'netlify.com', 'pages.dev', 'fly.dev')) return 'deploy'
  if (is('figma.com')) return 'figma'
  if (is('mail.google.com', 'outlook.live.com', 'outlook.office.com', 'outlook.office365.com', 'outlook.com')) return 'mail'
  if (is('docs.google.com', 'notion.so', 'notion.site')) return 'doc'
  return 'other'
}

/** Every http(s) URL in a piece of text, in order, without duplicates. Trailing punctuation is not part of a URL. */
export function findUrls(text: string): string[] {
  const out: string[] = []
  for (const m of text.matchAll(/https?:\/\/[^\s<>"'()[\]]+/g)) {
    const url = m[0].replace(/[.,;:!?]+$/, '')
    if (isSafeUrl(url) && !out.includes(url)) out.push(url)
  }
  return out
}

/* -------------------------------------------------------------------- time */

/** Seconds as the field writes them: `2h 15m`, `1h 02m`, `12m`, `45s`. */
export function formatDuration(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m`
  return `${s}s`
}

/** The inverse of `formatDuration`, for reading a session back off the trail. Null when the text is not one. */
export function parseDuration(text: string): number | null {
  const m = /^\s*(?:(\d+)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?\s*$/.exec(text)
  if (!m || (m[1] == null && m[2] == null && m[3] == null)) return null
  return Number(m[1] ?? 0) * 3600 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0)
}

/** The trail line a stopped session leaves: `session 1h 02m`. */
export function sessionText(seconds: number): string {
  return `session ${formatDuration(seconds)}`
}

/** Seconds a session line on the trail stands for, or null for any other line. */
export function sessionSeconds(text: string): number | null {
  if (!text.startsWith('session ')) return null
  return parseDuration(text.slice('session '.length))
}

/** Seconds spent on a node and everything inside it. */
export function spentOf(doc: Doc, id: number): number {
  return subtreeIds(doc, id).reduce((sum, nid) => sum + (byId(doc, nid)?.spent ?? 0), 0)
}

export type ProjectTime = { project: Node; seconds: number }

/** All-time seconds under each project, from the `spent` the session clock accumulates. Projects with none are left out. */
export function spentByProject(doc: Doc): ProjectTime[] {
  return projectsOf(doc)
    .map((project) => ({ project, seconds: spentOf(doc, project.id) }))
    .filter((t) => t.seconds > 0)
}

/**
 * Seconds of sessions logged on the trail between `from` (inclusive) and `to`
 * (exclusive), by project. A session whose task has since gone is not counted,
 * since there is nothing left to bill it to.
 */
export function sessionsByProject(doc: Doc, from: number, to: number): ProjectTime[] {
  const totals = new Map<number, number>()
  for (const e of doc.events) {
    if (e.kind !== 'note' || e.node == null || e.at < from || e.at >= to) continue
    const seconds = sessionSeconds(e.text)
    if (seconds == null) continue
    const project = projectOf(doc, e.node)
    if (!project) continue
    totals.set(project.id, (totals.get(project.id) ?? 0) + seconds)
  }
  return projectsOf(doc)
    .filter((p) => (totals.get(p.id) ?? 0) > 0)
    .map((project) => ({ project, seconds: totals.get(project.id)! }))
}

/** The bounds of the month `now` falls in, as ms since epoch, local time. */
export function monthBounds(now = Date.now()): { from: number; to: number } {
  const d = new Date(now)
  return { from: new Date(d.getFullYear(), d.getMonth(), 1).getTime(), to: new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime() }
}

/* ------------------------------------------------------------------- brief */

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** `Mon 21:14` inside the last week, `12 Oct 21:14` before that. */
export function stampOf(at: number, now = Date.now()): string {
  const d = new Date(at)
  const p = (n: number) => String(n).padStart(2, '0')
  const clock = `${p(d.getHours())}:${p(d.getMinutes())}`
  if (now - at < 6 * 86_400_000 && at <= now) return `${DAYS[d.getDay()]} ${clock}`
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${clock}`
}

/** A file-safe name for a task: `site-redesign`. */
export function slugOf(title: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
    .replace(/-+$/, '')
  return slug || 'task'
}

/** How many lines of the trail a brief carries. */
const TRAIL_LINES = 8

/**
 * A task as markdown, for an agent to work from. The headings are fixed so a
 * report can be matched back; `parseReport` reads the shape "Report back" asks for.
 */
export function briefOf(doc: Doc, id: number, now = Date.now()): string {
  const node = byId(doc, id)
  if (!node) return ''
  const project = projectOf(doc, id)
  const lines = linesOf(doc, id)
  const out: string[] = []
  out.push(`# ${node.title.trim() || '_'}`)
  out.push(
    `Project: ${project && project.id !== id ? project.title.trim() || '_' : '—'} · Status: ${LANE_LABEL[laneOf(node.status)]} · Due: ${node.due ?? '—'} · Urgent: ${node.urgent ? 'yes' : 'no'}`,
  )
  out.push('## Goal')
  out.push(node.body?.trim() ? node.body.trim() : '(no description)')
  out.push('## Next action')
  out.push(node.next?.trim() || '—')
  out.push('## Subtasks')
  if (lines.length) {
    for (const { node: line, depth } of lines) {
      out.push(`${'  '.repeat(depth - 1)}- [${line.status === 'done' ? 'x' : ' '}] ${line.title.trim() || '_'}`)
    }
  } else out.push('—')
  out.push('## Links')
  if (node.links?.length) for (const l of node.links) out.push(`- ${l.label}: ${l.url}`)
  else out.push('—')
  out.push('## Where I left off')
  out.push(node.leftOff?.trim() || '—')
  out.push('## Recent trail')
  const trail = trailOf(doc, id).slice(0, TRAIL_LINES)
  if (trail.length) for (const e of trail) out.push(`- ${stampOf(e.at, now)} ${e.text}`)
  else out.push('—')
  out.push('## Done when')
  out.push('Every subtask above is ticked and the status is DONE.')
  out.push('## Report back')
  out.push(
    'When you finish, reply with a "## Report" section listing each subtask you completed as "- [x] <exact subtask title>", anything new as "- [ ] <new subtask>", and a one-line "Left off:" note. Paste that report into VAULT (drawer → Paste report).',
  )
  return out.join('\n') + '\n'
}
