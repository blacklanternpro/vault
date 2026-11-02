import { addNode, byId, cardOf, childrenOf, depthOf, laneOf, outdentNode, projectOf, projectsOf, removeNode, reparentNode, setStatus, subtreeIds, updateNode } from './doc'
import { LANES, LANE_LABEL, type Doc, type Lane, type Node } from './types'

/*
 * The shell: a one-line grammar over the graph, pure like the rest of the
 * model. A line goes in with the doc and a working directory (a project, or
 * nothing for `~`); a result comes out saying what to print and what changed.
 * The shell never writes anything itself — a changed Doc is handed back for the
 * studio to commit, so every mutation is undoable and gets its toast.
 *
 *   paths     project/TASK/subtask — each segment is a case-insensitive prefix
 *             of a child's name, spaces and punctuation ignored; a unique
 *             prefix wins, an ambiguous one is refused with the candidates.
 *   commands  ls cd touch mkdir mv rm done undone st urgent rename open pwd help clear
 */

export const VERBS = ['ls', 'cd', 'touch', 'mkdir', 'mv', 'rm', 'done', 'undone', 'st', 'urgent', 'rename', 'open', 'pwd', 'help', 'clear'] as const
export type Verb = (typeof VERBS)[number]

export function isVerb(word: string): word is Verb {
  return (VERBS as readonly string[]).includes(word)
}

export type ShellContext = { doc: Doc; cwd: number | null }

export type ShellResult = {
  ok: boolean
  /** What to print under the prompt. Empty for `clear`. */
  text: string
  /** A changed Doc to commit, so the change is undoable and gets a toast. */
  doc?: Doc
  /** A new working directory: a project, or null for `~`. Absent when unchanged. */
  cwd?: number | null
  /** The card to open in the drawer. */
  open?: number
  /** The node to select (a node just made, or just changed). */
  select?: number
  /** A node to delete through the studio's own delete, which carries the Undo toast. */
  remove?: number
  clear?: boolean
}

/* ------------------------------------------------------------------ tokens */

/** Shell-style words: split on whitespace, with "double" and 'single' quotes grouping. */
export function tokenize(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let quote: string | null = null
  let has = false
  for (const ch of line) {
    if (quote) {
      if (ch === quote) quote = null
      else cur += ch
      continue
    }
    if (ch === '"' || ch === "'") {
      quote = ch
      has = true
      continue
    }
    if (/\s/.test(ch)) {
      if (has) out.push(cur)
      cur = ''
      has = false
      continue
    }
    cur += ch
    has = true
  }
  if (has) out.push(cur)
  return out
}

/* ------------------------------------------------------------------- paths */

/** Letters and digits only, lower-cased: `SITE REDESIGN` and `site-re` compare on the same footing. */
function fold(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '')
}

export type Resolved = { ok: true; node: Node | null } | { ok: false; error: string }

/** One segment against one node's children: exact beats prefix; one prefix wins; several are refused. */
export function matchChild(doc: Doc, parent: number | null, segment: string): Resolved {
  const want = fold(segment)
  const kids = childrenOf(doc, parent)
  if (!want) return { ok: false, error: `empty name in path` }
  const exact = kids.filter((k) => fold(k.title) === want)
  if (exact.length) return { ok: true, node: exact[0] }
  const prefixed = kids.filter((k) => fold(k.title).startsWith(want))
  if (prefixed.length === 1) return { ok: true, node: prefixed[0] }
  if (prefixed.length > 1) return { ok: false, error: `ambiguous "${segment}": ${prefixed.map((k) => k.title.trim() || '_').join(', ')}` }
  return { ok: false, error: `no such path: ${segment}` }
}

/**
 * Resolves a path against the working directory. `.` is here, `..` is up,
 * `/` and `~` are the top. A relative path that finds nothing under the
 * working directory is tried again from the top, so `homepage/site` works
 * wherever you are.
 */
export function resolvePath(doc: Doc, cwd: number | null, path: string): Resolved {
  const raw = path.trim()
  const base = cwd != null && byId(doc, cwd) ? cwd : null
  if (raw === '' || raw === '.') return { ok: true, node: base == null ? null : byId(doc, base) ?? null }
  if (raw === '/' || raw === '~') return { ok: true, node: null }
  let absolute = false
  let rest = raw
  if (rest.startsWith('~/')) {
    absolute = true
    rest = rest.slice(2)
  } else if (rest.startsWith('/')) {
    absolute = true
    rest = rest.slice(1)
  }
  const segments = rest.split('/').map((s) => s.trim()).filter(Boolean)
  const walk = (from: number | null): Resolved => {
    let at: number | null = from
    for (const seg of segments) {
      if (seg === '.') continue
      if (seg === '..') {
        at = at == null ? null : (byId(doc, at)?.parent ?? null)
        continue
      }
      const hit = matchChild(doc, at, seg)
      if (!hit.ok) return hit
      at = hit.node ? hit.node.id : null
    }
    return { ok: true, node: at == null ? null : byId(doc, at) ?? null }
  }
  if (absolute || base == null) return walk(null)
  const relative = walk(base)
  if (relative.ok) return relative
  const fromTop = walk(null)
  return fromTop.ok ? fromTop : relative
}

/** `~/homepage/SITE REDESIGN` — the full path of a node, `~` for the top. */
export function pathOf(doc: Doc, id: number | null): string {
  const parts: string[] = []
  let node = id == null ? undefined : byId(doc, id)
  const seen = new Set<number>()
  while (node && !seen.has(node.id)) {
    seen.add(node.id)
    parts.unshift(node.title.trim() || '_')
    node = byId(doc, node.parent)
  }
  return parts.length ? `~/${parts.join('/')}` : '~'
}

function name(node: Node): string {
  return node.title.trim() || '_'
}

/* -------------------------------------------------------------- completion */

export type Completion = {
  /** The partial path with its last segment completed as far as it can be. */
  text: string
  /** Children that fit the last segment, for a Tab that cannot finish the word alone. */
  candidates: string[]
}

/** Tab on a partial path: finishes the last segment when one child fits it, or lists the children that do. */
export function completePath(doc: Doc, cwd: number | null, partial: string): Completion {
  const cut = partial.lastIndexOf('/')
  const head = cut < 0 ? '' : partial.slice(0, cut + 1)
  const tail = cut < 0 ? partial : partial.slice(cut + 1)
  const parent = resolvePath(doc, cwd, head === '' ? '.' : head)
  if (!parent.ok) return { text: partial, candidates: [] }
  const kids = childrenOf(doc, parent.node ? parent.node.id : null)
  const want = fold(tail)
  const fits = kids.filter((k) => fold(k.title).startsWith(want))
  const names = fits.map((k) => name(k) + (k.parent == null ? '/' : ''))
  if (fits.length === 1) return { text: head + names[0], candidates: names }
  if (fits.length === 0) return { text: partial, candidates: [] }
  // Several fit: give the longest run of letters they share, which is at least what was typed.
  let common = names[0]
  for (const n of names) {
    let i = 0
    while (i < common.length && i < n.length && common[i].toLowerCase() === n[i].toLowerCase()) i += 1
    common = common.slice(0, i)
  }
  return { text: head + (common.length > tail.length ? common : tail), candidates: names }
}

/* ----------------------------------------------------------------- listing */

/** The subtree as the directory draws it: stems, `name/` for projects, the lane on tasks, `[x]` on subtasks. */
export function listing(doc: Doc, root: number | null): string {
  const roots = root == null ? projectsOf(doc) : [byId(doc, root)].filter((n): n is Node => Boolean(n))
  if (!roots.length) return root == null ? '(no projects)' : '(nothing)'
  const lines: Array<{ stem: string; label: string; status: string }> = []
  const walk = (node: Node, rails: boolean[]) => {
    const depth = depthOf(doc, node.id)
    const stem = rails.length === 0 ? '' : rails.slice(0, -1).map((more) => (more ? '│   ' : '    ')).join('') + (rails[rails.length - 1] ? '├── ' : '└── ')
    const label = depth === 0 ? `${name(node)}/` : depth === 1 ? name(node) : `[${node.status === 'done' ? 'x' : ' '}] ${name(node)}`
    lines.push({ stem, label, status: depth === 1 ? LANE_LABEL[laneOf(node.status)] : '' })
    const kids = childrenOf(doc, node.id)
    kids.forEach((kid, i) => walk(kid, [...rails, i < kids.length - 1]))
  }
  for (const r of roots) walk(r, [])
  const width = Math.min(48, Math.max(0, ...lines.filter((l) => l.status).map((l) => l.stem.length + l.label.length))) + 2
  return lines.map((l) => (l.status ? (l.stem + l.label).padEnd(width) + l.status : l.stem + l.label)).join('\n')
}

/* ------------------------------------------------------------------- lanes */

const LANE_WORDS: Record<string, Lane> = { 'r&d': 'rnd', rd: 'rnd', research: 'rnd', todo: 'pending', doing: 'active' }

/** A lane by name or prefix: `a` is ACTIVE, `du` is DUSTED, `d` is refused. */
export function laneFrom(word: string): { ok: true; lane: Lane } | { ok: false; error: string } {
  const w = word.trim().toLowerCase()
  if (!w) return { ok: false, error: 'which lane? pending, rnd, active, done or dusted' }
  if (LANE_WORDS[w]) return { ok: true, lane: LANE_WORDS[w] }
  const exact = LANES.find((l) => l === w || LANE_LABEL[l].toLowerCase() === w)
  if (exact) return { ok: true, lane: exact }
  const fits = LANES.filter((l) => l.startsWith(w))
  if (fits.length === 1) return { ok: true, lane: fits[0] }
  if (fits.length > 1) return { ok: false, error: `ambiguous lane "${word}": ${fits.join(', ')}` }
  return { ok: false, error: `no such lane "${word}"; try pending, rnd, active, done or dusted` }
}

/* -------------------------------------------------------------------- help */

export const HELP = [
  'ls [path]          list a project or task as a tree',
  'cd [path]          narrow to a project (cd .. or cd / to clear)',
  'touch path/NAME    new task in a project, or subtask in a task',
  'mkdir NAME         new project',
  'mv path dest/      move into dest (mv path . outdents, mv path / makes a project)',
  'rm [-r] path       delete (-r takes what is inside too)',
  'done path          tick it · undone path to untick',
  'st path lane       set the lane: pending rnd active done dusted',
  'urgent path        flag or unflag',
  'rename path "NAME" new name',
  'open path          open it in the drawer',
  'pwd · help · clear',
  'paths: project/TASK/subtask — a unique prefix of each name will do, case does not matter',
].join('\n')

/* --------------------------------------------------------------------- run */

const fail = (error: string): ShellResult => ({ ok: false, text: error })

/** Runs one line. Pure: the result carries what to print and any Doc to commit. */
export function runShell(line: string, ctx: ShellContext): ShellResult {
  const { doc } = ctx
  const cwd = ctx.cwd != null && byId(doc, ctx.cwd) ? ctx.cwd : null
  const tokens = tokenize(line.replace(/^\s*>\s*/, ''))
  if (!tokens.length) return { ok: true, text: '' }
  const [verb, ...args] = tokens
  const word = verb.toLowerCase()
  const rest = args.join(' ')

  const node = (path: string): Resolved => resolvePath(doc, cwd, path)
  const need = (path: string, what = 'a task or subtask'): { ok: true; node: Node } | { ok: false; error: string } => {
    const hit = node(path)
    if (!hit.ok) return hit
    if (!hit.node) return { ok: false, error: `that is the top; give ${what}` }
    return { ok: true, node: hit.node }
  }

  switch (word) {
    case 'help':
      return { ok: true, text: HELP }
    case 'clear':
      return { ok: true, text: '', clear: true }
    case 'pwd':
      return { ok: true, text: pathOf(doc, cwd) }
    case 'ls': {
      const hit = node(rest)
      if (!hit.ok) return fail(hit.error)
      return { ok: true, text: listing(doc, hit.node ? hit.node.id : null) }
    }
    case 'cd': {
      const hit = node(rest || '/')
      if (!hit.ok) return fail(hit.error)
      const target = hit.node ? projectOf(doc, hit.node.id) ?? null : null
      return { ok: true, text: pathOf(doc, target ? target.id : null), cwd: target ? target.id : null }
    }
    case 'mkdir': {
      const title = rest.trim()
      if (!title) return fail('mkdir what? mkdir NAME')
      const made = addNode(doc, { parent: null, title })
      return { ok: true, text: `made ${title}/`, doc: made.doc, select: made.id }
    }
    case 'touch': {
      const cut = rest.lastIndexOf('/')
      const title = (cut < 0 ? rest : rest.slice(cut + 1)).trim()
      const where = cut < 0 ? '.' : rest.slice(0, cut)
      if (!title) return fail('touch what? touch project/NAME, or touch NAME inside a project')
      const hit = node(where)
      if (!hit.ok) return fail(hit.error)
      if (!hit.node) return fail('touch where? touch project/NAME (or cd into a project first)')
      const made = addNode(doc, { parent: hit.node.id, title })
      return { ok: true, text: `created ${title} in ${name(hit.node)}/`, doc: made.doc, select: made.id }
    }
    case 'mv': {
      if (args.length < 2) return fail('mv path dest/ — or mv path . to outdent')
      const destWord = args[args.length - 1]
      const path = args.slice(0, -1).join(' ')
      const hit = need(path, 'something to move')
      if (!hit.ok) return fail(hit.error)
      const moving = hit.node
      if (destWord === '.' || destWord === '..') {
        const next = outdentNode(doc, moving.id)
        if (next === doc) return fail(`${name(moving)} is already at the top`)
        const parent = byId(doc, moving.parent!)
        const up = parent?.parent == null ? '~' : `${name(byId(doc, parent.parent)!)}/`
        return { ok: true, text: `moved ${name(moving)} → ${up}`, doc: next, select: moving.id }
      }
      const dest = node(destWord)
      if (!dest.ok) return fail(dest.error)
      const parentId = dest.node ? dest.node.id : null
      if (parentId === moving.id || (parentId != null && subtreeIds(doc, moving.id).includes(parentId))) {
        return fail(`cannot move ${name(moving)} into itself`)
      }
      if (moving.parent === parentId && !moving.loose) return fail(`${name(moving)} is already in ${dest.node ? name(dest.node) + '/' : '~'}`)
      const next = reparentNode(doc, moving.id, parentId)
      if (next === doc) return fail(`could not move ${name(moving)}`)
      return { ok: true, text: `moved ${name(moving)} → ${dest.node ? name(dest.node) + '/' : '~'}`, doc: next, select: moving.id }
    }
    case 'rm': {
      const recursive = args.includes('-r') || args.includes('-rf')
      const path = args.filter((a) => a !== '-r' && a !== '-rf').join(' ')
      if (!path.trim()) return fail('rm what? rm [-r] path')
      const hit = need(path, 'something to delete')
      if (!hit.ok) return fail(hit.error)
      const inside = subtreeIds(doc, hit.node.id).length - 1
      if (inside && !recursive) return fail(`${name(hit.node)} has ${inside} ${inside === 1 ? 'child' : 'children'}; use rm -r`)
      // Checked here so the error is the shell's; the studio's own delete does the removing, with its Undo.
      if (removeNode(doc, hit.node.id) === doc) return fail(`could not delete ${name(hit.node)}`)
      return { ok: true, text: `deleted ${name(hit.node)}${inside ? ` and ${inside} inside` : ''}`, remove: hit.node.id }
    }
    case 'done':
    case 'undone': {
      const hit = need(rest)
      if (!hit.ok) return fail(hit.error)
      if (hit.node.parent == null) return fail(`${name(hit.node)}/ is a project; done takes a task or subtask`)
      const lane: Lane = word === 'done' ? 'done' : 'pending'
      const next = setStatus(doc, hit.node.id, lane)
      return { ok: true, text: `${word} ${name(hit.node)}`, doc: next, select: hit.node.id }
    }
    case 'st': {
      if (args.length < 2) return fail('st path lane — pending rnd active done dusted')
      const lane = laneFrom(args[args.length - 1])
      if (!lane.ok) return fail(lane.error)
      const hit = need(args.slice(0, -1).join(' '))
      if (!hit.ok) return fail(hit.error)
      if (hit.node.parent == null) return fail(`${name(hit.node)}/ is a project; st takes a task or subtask`)
      return { ok: true, text: `${name(hit.node)} → ${LANE_LABEL[lane.lane]}`, doc: setStatus(doc, hit.node.id, lane.lane), select: hit.node.id }
    }
    case 'urgent': {
      const hit = need(rest)
      if (!hit.ok) return fail(hit.error)
      if (hit.node.parent == null) return fail(`${name(hit.node)}/ is a project; urgent takes a task or subtask`)
      const on = !hit.node.urgent
      return { ok: true, text: `${name(hit.node)} is ${on ? 'urgent' : 'no longer urgent'}`, doc: updateNode(doc, hit.node.id, { urgent: on }), select: hit.node.id }
    }
    case 'rename': {
      if (args.length < 2) return fail('rename path "NEW NAME"')
      const title = args[args.length - 1].trim()
      if (!title) return fail('rename to what?')
      const hit = need(args.slice(0, -1).join(' '), 'something to rename')
      if (!hit.ok) return fail(hit.error)
      return { ok: true, text: `renamed ${name(hit.node)} → ${title}`, doc: updateNode(doc, hit.node.id, { title }), select: hit.node.id }
    }
    case 'open': {
      const hit = need(rest, 'a task to open')
      if (!hit.ok) return fail(hit.error)
      const card = cardOf(doc, hit.node.id)
      if (!card) return fail(`${name(hit.node)}/ is a project; open takes a task`)
      return { ok: true, text: `opened ${name(card)}`, open: card.id, select: hit.node.id }
    }
    default:
      return fail(`unknown command "${verb}"; try help`)
  }
}

/* ----------------------------------------------------------------- palette */

export type PaletteKind = 'search' | 'command' | 'filter' | 'empty'

export type FilterWords = { project?: string; lane?: string; urgent?: boolean }

/** `p:homepage s:active !` — filter words, or null when any word is something else. */
export function parseFilters(text: string): FilterWords | null {
  const words = text.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return null
  const out: FilterWords = {}
  for (const w of words) {
    if (w === '!') out.urgent = true
    else if (/^p:/i.test(w)) out.project = w.slice(2)
    else if (/^s:/i.test(w)) out.lane = w.slice(2)
    else return null
  }
  return out
}

/**
 * What the one input is doing: a `>` or a verb with its arguments is a
 * command, `p:` `s:` `!` words are filters, and anything else searches.
 * A verb on its own still searches, so typing "done" finds the done things;
 * the line turns into a command once there is a space after the verb.
 */
export function paletteKind(text: string): PaletteKind {
  const t = text.trim()
  if (!t) return 'empty'
  if (text.trimStart().startsWith('>')) return 'command'
  if (parseFilters(t)) return 'filter'
  const [verb] = tokenize(t)
  if (verb && isVerb(verb.toLowerCase()) && (/\s/.test(text.trim()) || ['ls', 'pwd', 'help', 'clear'].includes(verb.toLowerCase()))) return 'command'
  return 'search'
}

export type PaletteRow =
  | { kind: 'task'; id: number; title: string; project: string; where: 'title' | 'subtask' | 'description'; snippet: string }
  | { kind: 'command'; line: string }
  | { kind: 'filter'; label: string; project?: number | null; lane?: Lane | null; urgent?: boolean }
  | { kind: 'none'; label: string }

export const PALETTE_ROWS = 8

/** The rows under the one input: tasks that match, the command, or the filters the words name. */
export function paletteRows(doc: Doc, text: string): PaletteRow[] {
  const kind = paletteKind(text)
  if (kind === 'empty') return []
  if (kind === 'command') return [{ kind: 'command', line: text.trim().replace(/^>\s*/, '') }]
  if (kind === 'filter') return filterRows(doc, parseFilters(text)!)
  return taskRows(doc, text).slice(0, PALETTE_ROWS)
}

function taskRows(doc: Doc, text: string): PaletteRow[] {
  const q = text.trim().toLowerCase()
  const rows: PaletteRow[] = []
  const seen = new Set<number>()
  const snippetOf = (s: string) => {
    const at = s.toLowerCase().indexOf(q)
    const from = Math.max(0, at - 24)
    return (from > 0 ? '…' : '') + s.slice(from, at + q.length + 32).replace(/\s+/g, ' ') + (at + q.length + 32 < s.length ? '…' : '')
  }
  // Grouped by project: walk the projects in order and their cards in order.
  for (const project of projectsOf(doc)) {
    for (const n of doc.nodes) {
      if (n.parent == null || projectOf(doc, n.id)?.id !== project.id) continue
      const title = n.title.toLowerCase().includes(q)
      const body = (n.body ?? '').toLowerCase().includes(q)
      if (!title && !body) continue
      const card = cardOf(doc, n.id)
      if (!card || seen.has(card.id)) continue
      seen.add(card.id)
      const where = card.id === n.id ? (title ? 'title' : 'description') : 'subtask'
      rows.push({ kind: 'task', id: card.id, title: name(card), project: name(project), where, snippet: where === 'title' ? '' : snippetOf(where === 'subtask' ? n.title : n.body ?? '') })
    }
  }
  return rows
}

function filterRows(doc: Doc, words: FilterWords): PaletteRow[] {
  const rows: PaletteRow[] = []
  const base: { lane?: Lane | null; urgent?: boolean; project?: number | null } = {}
  let bad: string | null = null
  if (words.lane !== undefined) {
    const lane = laneFrom(words.lane)
    if (lane.ok) base.lane = lane.lane
    else if (words.lane.trim()) bad = lane.error
  }
  if (words.urgent) base.urgent = true
  if (words.project !== undefined && words.project.trim()) {
    const hit = matchChild(doc, null, words.project)
    if (hit.ok && hit.node) base.project = hit.node.id
    else if (!hit.ok && hit.error.startsWith('ambiguous')) {
      /* listed below */
    } else bad = `no project matches “${words.project}”`
  }
  const label = (extra: string) => [extra, base.lane ? `Status: ${LANE_LABEL[base.lane]}` : '', base.urgent ? 'Urgent only' : ''].filter(Boolean).join(' · ')

  if (words.project !== undefined && base.project === undefined) {
    const want = fold(words.project)
    const fits = projectsOf(doc).filter((p) => !want || fold(p.title).startsWith(want))
    if (!fits.length) return [{ kind: 'none', label: `no project matches “${words.project}”` }]
    for (const p of fits.slice(0, PALETTE_ROWS)) rows.push({ kind: 'filter', label: label(`${name(p)}/`), ...base, project: p.id })
    return rows
  }
  if (words.lane !== undefined && base.lane === undefined) {
    const w = words.lane.trim().toLowerCase()
    const fits = LANES.filter((l) => !w || l.startsWith(w))
    if (!fits.length) return [{ kind: 'none', label: bad ?? `no such lane “${words.lane}”` }]
    const project = base.project != null ? `${name(byId(doc, base.project)!)}/` : ''
    for (const l of fits) rows.push({ kind: 'filter', label: [project, `Status: ${LANE_LABEL[l]}`, base.urgent ? 'Urgent only' : ''].filter(Boolean).join(' · '), ...base, lane: l })
    return rows
  }
  if (bad) return [{ kind: 'none', label: bad }]
  const project = base.project != null ? `${name(byId(doc, base.project)!)}/` : ''
  rows.push({ kind: 'filter', label: label(project) || 'Filter', ...base })
  return rows
}
