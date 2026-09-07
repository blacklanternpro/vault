import { isOrganName, nextSlot, nowOf, tapeDate, type FieldSlot, type HitBox, type Now, type OrganName, type Selected, type Session } from './ir'
import {
  byId,
  indentNode,
  insertNode,
  isProject,
  outdentNode,
  parseDoc,
  removeNode,
  SEED_SOURCE,
  serializeDoc,
  setNodeBody,
  setNodeStatus,
  setNodeTitle,
  type Doc,
} from './doc'
import { formatDumpGuess, parseDump, type DumpParse } from './parse-dump'
import { isCommandLine, parseCommand } from './parse'
import { COL_ORDER, isBinderStatus, PAINT_OPS, type NodeStatus } from './tokens'

export type Result = {
  session: Session
  source: string
}

export function freshSession(): Session {
  return {
    selected: { kind: 'PIPE' },
    lens: 'pipe',
    nestClosed: [],
    pipeOpen: null,
    nestFocus: null,
    field: null,
    fieldBuffer: '',
    collapsed: [],
    draftId: null,
    buffer: '',
    echo: null,
    pendingDump: null,
    calDay: null,
  }
}

function ok(session: Session, source: string, echo: string | null = null): Result {
  return { session: { ...session, buffer: '', echo }, source }
}

function nodeIdOf(selected: Selected | null): number | null {
  return selected?.kind === 'NODE' ? selected.id : null
}

function closeField(session: Session): Session {
  return {
    ...session,
    field: null,
    fieldBuffer: '',
    draftId: null,
    pipeOpen: session.pipeOpen,
  }
}

function collapse(session: Session): Session {
  return {
    ...closeField(session),
    pipeOpen: null,
    echo: null,
    calDay: null,
  }
}

function openField(session: Session, id: number, slot: FieldSlot, value: string): Session {
  return {
    ...session,
    selected: { kind: 'NODE', id },
    field: { id, slot },
    fieldBuffer: value,
    echo: null,
  }
}

function shovelStatus(status: NodeStatus, delta: number): NodeStatus {
  if (status === 'none' && delta > 0) return 'backlog'
  const i = COL_ORDER.indexOf(status as (typeof COL_ORDER)[number])
  if (i < 0) return delta > 0 ? 'backlog' : 'none'
  const next = Math.max(0, Math.min(COL_ORDER.length - 1, i + delta))
  return COL_ORDER[next]
}

function applyShovel(session: Session, source: string, id: number | null, delta: number): Result {
  const tid = id ?? nodeIdOf(session.selected)
  if (tid == null) return ok(session, source, '? SHOVEL')
  const doc = parseDoc(source)
  const node = byId(doc, tid)
  if (!node) return ok(session, source, '? SHOVEL')
  node.status = shovelStatus(node.status, delta)
  return ok(
    { ...session, selected: { kind: 'NODE', id: tid } },
    serializeDoc(doc),
    `SHOVEL #${tid} ${node.status}`,
  )
}

function applyStrike(session: Session, source: string): Result {
  const tid = nodeIdOf(session.selected)
  if (tid == null) return ok(session, source, '? STRIKE')
  const doc = parseDoc(source)
  setNodeStatus(doc, tid, 'done')
  return ok(session, serializeDoc(doc), `STRIKE #${tid}`)
}

export function placeOrgan(source: string, organ: OrganName, x: number, y: number): string {
  const doc = parseDoc(source)
  const found = doc.places.find((p) => p.organ === organ)
  if (found) {
    found.x = x
    found.y = y
  } else {
    doc.places.push({ organ, x, y })
  }
  return serializeDoc(doc)
}

function moveOrgan(session: Session, source: string, organ: OrganName | undefined, x: number, y: number): Result {
  const name: OrganName | null = organ && isOrganName(organ)
    ? organ
    : session.selected && isOrganName(session.selected.kind)
      ? session.selected.kind
      : null
  if (!name) return ok(session, source, '? MOVE')
  return ok(session, placeOrgan(source, name, x, y))
}

function toggleMaterial(source: string, flag: string): string {
  const doc = parseDoc(source)
  const word = flag.toUpperCase()
  if (word === 'INV') doc.inv = !doc.inv
  else if (word === 'GRAIN') doc.grain = doc.grain > 0 ? 0 : 0.14
  else if (word === 'SCAN') doc.scan = doc.scan > 0 ? 0 : 0.1
  return serializeDoc(doc)
}

function toggleCollapsed(session: Session, organ: OrganName): Session {
  const has = session.collapsed.includes(organ)
  const collapsed = has ? session.collapsed.filter((o) => o !== organ) : [...session.collapsed, organ]
  return { ...session, collapsed }
}

function toggleNest(session: Session, id: number): Session {
  const has = session.nestClosed.includes(id)
  const nestClosed = has ? session.nestClosed.filter((n) => n !== id) : [...session.nestClosed, id]
  return { ...session, nestClosed, selected: { kind: 'NODE', id }, lens: 'nest' }
}

function focusNest(session: Session, id: number | null): Session {
  return {
    ...session,
    nestFocus: id,
    lens: 'nest',
    selected: id != null ? { kind: 'NODE', id } : { kind: 'NEST' },
    echo: id == null ? 'FOCUS _' : `FOCUS #${id}`,
  }
}

function parentForNew(session: Session, doc: Doc): number | null {
  if (session.nestFocus != null) return session.nestFocus
  const sid = nodeIdOf(session.selected)
  if (sid != null) {
    const node = byId(doc, sid)
    if (node && isProject(doc, node)) return sid
    if (node) return node.parent
  }
  return null
}

export function addChild(source: string, parent: number | null, title = '', status: NodeStatus = 'none'): { source: string; id: number } {
  const doc = parseDoc(source)
  const node = insertNode(doc, { title, status, parent })
  return { source: serializeDoc(doc), id: node.id }
}

function applyDumpParse(session: Session, source: string, dump: DumpParse): Result {
  if (dump.kind === 'ambiguous') {
    const guess = dump.guess
    const pending =
      guess.kind === 'project'
        ? { kind: 'project' as const, title: guess.title, children: guess.children }
        : { kind: 'tasks' as const, titles: guess.titles, parent: parentForNew(session, parseDoc(source)) }
    return {
      session: { ...session, pendingDump: pending, echo: formatDumpGuess(dump), buffer: '' },
      source,
    }
  }
  return commitDump(session, source, dump)
}

function commitDump(
  session: Session,
  source: string,
  dump: { kind: 'project'; title: string; children: string[] } | { kind: 'tasks'; titles: string[] },
): Result {
  const doc = parseDoc(source)
  if (dump.kind === 'project') {
    const project = insertNode(doc, { title: dump.title, status: 'none', parent: null })
    for (const title of dump.children) {
      insertNode(doc, { title, status: 'backlog', parent: project.id })
    }
    return ok(
      {
        ...session,
        selected: { kind: 'NODE', id: project.id },
        lens: 'nest',
        nestFocus: project.id,
        pendingDump: null,
      },
      serializeDoc(doc),
      `PROJECT ${dump.title}`,
    )
  }
  const parent = parentForNew(session, doc)
  let last = parent
  for (const title of dump.titles) {
    last = insertNode(doc, { title, status: 'backlog', parent }).id
  }
  return ok(
    {
      ...session,
      selected: last != null ? { kind: 'NODE', id: last } : session.selected,
      pendingDump: null,
    },
    serializeDoc(doc),
    dump.titles.length ? `+ ${dump.titles.length}` : null,
  )
}

function confirmPending(session: Session, source: string): Result {
  if (!session.pendingDump) return ok(session, source)
  const p = session.pendingDump
  if (p.kind === 'project') return commitDump(session, source, p)
  const doc = parseDoc(source)
  for (const title of p.titles) insertNode(doc, { title, status: 'backlog', parent: p.parent })
  return ok({ ...session, pendingDump: null }, serializeDoc(doc), `+ ${p.titles.length}`)
}

function commitField(session: Session, source: string): Result {
  if (!session.field) return ok(session, source)
  const { id, slot } = session.field
  const text = session.fieldBuffer
  const doc = parseDoc(source)

  if (slot === 'title') {
    if (!text.trim() && session.draftId === id) {
      removeNode(doc, id)
      return ok(collapse(session), serializeDoc(doc))
    }
    setNodeTitle(doc, id, text.trim() || byId(doc, id)?.title || '_')
    return ok({ ...session, fieldBuffer: byId(parseDoc(serializeDoc(doc)), id)?.title ?? text, draftId: null }, serializeDoc(doc))
  }
  if (slot === 'body') {
    setNodeBody(doc, id, text)
    return ok(session, serializeDoc(doc))
  }
  if (slot === 'subtask') {
    const title = text.trim()
    if (!title) return ok({ ...session, fieldBuffer: '' }, source)
    const child = insertNode(doc, { title, status: 'none', parent: id })
    return ok(
      { ...session, fieldBuffer: '', selected: { kind: 'NODE', id: child.id }, pipeOpen: session.pipeOpen ?? id },
      serializeDoc(doc),
    )
  }
  if (slot === 'status') {
    const s = text.trim().toLowerCase()
    if (s === 'none' || isBinderStatus(s)) setNodeStatus(doc, id, s)
    return ok(session, serializeDoc(doc))
  }
  return ok(session, source)
}

function commitOperator(session: Session, source: string, now: Now, text: string): Result {
  const trimmed = text.trim()
  if (!trimmed) {
    if (session.pendingDump) return confirmPending(session, source)
    return ok(session, source)
  }
  if (session.lens === 'dump') {
    const doc = parseDoc(source)
    doc.notes.push({ date: tapeDate(now.year, now.month, now.day), text: trimmed })
    return ok(session, serializeDoc(doc))
  }
  return applyDumpParse(session, source, parseDump(trimmed))
}

function applyFocus(session: Session, source: string, id?: number, clear?: boolean): Result {
  if (clear) return ok(focusNest(session, null), source, 'FOCUS _')
  if (id != null) return ok(focusNest(session, id), source, `FOCUS #${id}`)
  const sid = nodeIdOf(session.selected)
  if (sid == null) return ok(focusNest(session, null), source, 'FOCUS _')
  const next = session.nestFocus === sid ? null : sid
  return ok(focusNest(session, next), source, next == null ? 'FOCUS _' : `FOCUS #${next}`)
}

function applyAdd(session: Session, source: string, parent: number | null, status: NodeStatus = 'none'): Result {
  const made = addChild(source, parent && parent > 0 ? parent : null, '', status)
  const node = byId(parseDoc(made.source), made.id)
  return {
    session: openField(
      {
        ...session,
        draftId: made.id,
        pipeOpen: status === 'none' ? session.pipeOpen : session.pipeOpen,
        lens: status === 'none' ? 'nest' : 'pipe',
      },
      made.id,
      'title',
      node?.title ?? '',
    ),
    source: made.source,
  }
}

function applyHitStmt(target: string, arg: string | number | undefined, session: Session, source: string): Result {
  const t = target.toUpperCase()
  if (t === 'FIELD') return { session: collapse(session), source }
  if (t === 'PIPE') return { session: { ...collapse(session), selected: { kind: 'PIPE' }, lens: 'pipe' }, source }
  if (t === 'NEST') return { session: { ...collapse(session), selected: { kind: 'NEST' }, lens: 'nest' }, source }
  if (t === 'DUMP') return { session: { ...collapse(session), selected: { kind: 'DUMP' }, lens: 'dump' }, source }
  if (t === 'CAL') return { session: { ...session, selected: { kind: 'CAL' } }, source }
  if (t === 'SEAL') return { session: { ...session, selected: { kind: 'SEAL' } }, source }
  if (t === 'SKULL') return { session: { ...session, selected: { kind: 'SKULL' } }, source }
  if (t === 'GRAIN' || t === 'SCAN' || t === 'INV') {
    return ok(session, toggleMaterial(source, t), t)
  }
  if ((t === 'NODE' || t === 'TASK' || t === 'STEM') && typeof arg === 'number') {
    return hitNode(session, source, arg, t === 'STEM' ? 'nest' : 'pipe')
  }
  if (t === 'COL' && arg != null) {
    return { session: { ...session, selected: { kind: 'COL', col: String(arg).toLowerCase() }, lens: 'pipe' }, source }
  }
  if (t === 'SHOVEL') {
    const id = typeof arg === 'number' ? arg : nodeIdOf(session.selected)
    return applyShovel(session, source, id, 1)
  }
  if (t === 'ADD') {
    const parent = typeof arg === 'number' ? arg : parentForNew(session, parseDoc(source))
    return applyAdd(session, source, parent)
  }
  if (t === 'FOCUS') {
    return applyFocus(session, source, typeof arg === 'number' ? arg : undefined)
  }
  if (t === 'CLEAR') return ok(freshSession(), SEED_SOURCE)
  if (t === 'CLOSE' && arg != null) {
    return { session: toggleCollapsed(session, String(arg) as OrganName), source }
  }
  return ok(session, source, `? HIT ${target}`)
}

function hitNode(session: Session, source: string, id: number, lens: 'pipe' | 'nest'): Result {
  const doc = parseDoc(source)
  const node = byId(doc, id)
  if (!node) return { session, source }

  if (lens === 'nest') {
    const already = session.selected?.kind === 'NODE' && session.selected.id === id && session.lens === 'nest'
    if (already && session.field?.id === id) {
      return { session: closeField(session), source }
    }
    const nextFocus = isProject(doc, node) ? id : session.nestFocus
    if (already) {
      return {
        session: openField({ ...session, lens: 'nest', nestFocus: nextFocus }, id, 'title', node.title),
        source,
      }
    }
    return {
      session: {
        ...session,
        selected: { kind: 'NODE', id },
        lens: 'nest',
        nestFocus: nextFocus,
        field: null,
        fieldBuffer: '',
        echo: null,
      },
      source,
    }
  }

  if (session.pipeOpen === id && session.selected?.kind === 'NODE' && session.selected.id === id) {
    return { session: collapse(session), source }
  }
  return {
    session: openField(
      { ...session, lens: 'pipe', pipeOpen: id, selected: { kind: 'NODE', id } },
      id,
      'title',
      node.title,
    ),
    source,
  }
}

export function applyHit(hit: HitBox, session: Session, source: string): Result {
  switch (hit.kind) {
    case 'NODE':
      return hitNode(session, source, Number(hit.payload ?? 0), 'pipe')
    case 'STEM':
      return hitNode(session, source, Number(hit.payload ?? 0), 'nest')
    case 'SHOVEL':
      return applyShovel(session, source, Number(hit.payload ?? 0), 1)
    case 'ADD':
      return applyAdd(session, source, Number(hit.payload ?? 0) || null, 'none')
    case 'TOGGLE':
      return { session: toggleNest(session, Number(hit.payload ?? 0)), source }
    case 'CLOSE':
      return { session: toggleCollapsed(session, String(hit.payload ?? 'PIPE') as OrganName), source }
    case 'STATUS': {
      const raw = String(hit.payload ?? '')
      const [idStr, col] = raw.split(':')
      const id = Number(idStr)
      const doc = parseDoc(source)
      if (col === 'none' || isBinderStatus(col)) setNodeStatus(doc, id, col as NodeStatus)
      return ok({ ...session, selected: { kind: 'NODE', id } }, serializeDoc(doc), `STATUS #${id} ${col}`)
    }
    case 'SLOT': {
      const raw = String(hit.payload ?? '')
      const [idStr, slot] = raw.split(':')
      const id = Number(idStr)
      const doc = parseDoc(source)
      const node = byId(doc, id)
      if (!node) return { session, source }
      const value =
        slot === 'title' ? node.title : slot === 'body' ? node.body ?? '' : slot === 'status' ? node.status : ''
      return {
        session: openField(
          { ...session, pipeOpen: session.pipeOpen ?? id, selected: { kind: 'NODE', id } },
          id,
          (slot as FieldSlot) || 'title',
          value,
        ),
        source,
      }
    }
    case 'EMPTY': {
      const col = String(hit.payload ?? 'backlog')
      const status = isBinderStatus(col) ? col : 'backlog'
      const parent = parentForNew(session, parseDoc(source))
      return applyAdd({ ...session, lens: 'pipe' }, source, parent, status)
    }
    case 'COL':
      return { session: { ...session, selected: { kind: 'COL', col: String(hit.payload ?? 'backlog') }, lens: 'pipe' }, source }
    case 'PIPE':
    case 'ORGAN': {
      const organ = String(hit.payload ?? 'PIPE')
      if (organ === 'NEST') return { session: { ...collapse(session), selected: { kind: 'NEST' }, lens: 'nest' }, source }
      if (organ === 'DUMP') return { session: { ...collapse(session), selected: { kind: 'DUMP' }, lens: 'dump' }, source }
      if (organ === 'CAL') return { session: { ...session, selected: { kind: 'CAL' } }, source }
      if (organ === 'SEAL') return { session: { ...session, selected: { kind: 'SEAL' } }, source }
      if (organ === 'SKULL') return { session: { ...session, selected: { kind: 'SKULL' } }, source }
      return { session: { ...collapse(session), selected: { kind: 'PIPE' }, lens: 'pipe' }, source }
    }
    case 'NEST':
      return { session: { ...collapse(session), selected: { kind: 'NEST' }, lens: 'nest' }, source }
    case 'DUMP':
    case 'NOTE':
      return { session: { ...collapse(session), selected: { kind: 'DUMP' }, lens: 'dump' }, source }
    case 'CAL':
      return { session: { ...session, selected: { kind: 'CAL' } }, source }
    case 'SEAL':
      return { session: { ...session, selected: { kind: 'SEAL' } }, source }
    case 'SKULL':
      return { session: { ...session, selected: { kind: 'SKULL' } }, source }
    case 'DAY':
      return { session: { ...session, selected: { kind: 'CAL' }, calDay: String(hit.payload ?? '') }, source }
    case 'LEGEND': {
      const flag = String(hit.payload ?? '')
      return ok(session, toggleMaterial(source, flag), flag)
    }
    case 'RING':
      return ok(session, source, session.echo || 'SHOVEL // FOCUS // SEE')
    case 'FIELD':
      return { session: collapse(session), source }
    case 'COMMIT':
    case 'DOCK':
    case 'GLYPH':
      return { session, source }
  }
}

function applyStmt(stmt: ReturnType<typeof parseCommand>, session: Session, source: string, now: Now): Result {
  switch (stmt.kind) {
    case 'SEE': {
      const src = source.trim() ? source.replace(/\n+/g, ' · ') : '_'
      return ok(session, source, src.length > 160 ? `${src.slice(0, 157)}…` : src)
    }
    case 'WORDS':
      return ok(session, source, `${PAINT_OPS.join(' ')} // HIT SHOVEL FOCUS SEE CLEAR`)
    case 'CLEAR':
      return ok(freshSession(), SEED_SOURCE)
    case 'SHOVEL':
      return applyShovel(session, source, nodeIdOf(session.selected), stmt.delta)
    case 'FOCUS':
      return applyFocus(session, source, stmt.id, stmt.clear)
    case 'STRIKE':
      return applyStrike(session, source)
    case 'ADD':
      return applyAdd(session, source, parentForNew(session, parseDoc(source)))
    case 'COMMIT':
      if (session.field) return commitField(session, source)
      return commitOperator(session, source, now, session.buffer)
    case 'TYPE':
      return { session: { ...session, buffer: stmt.text }, source }
    case 'HIT':
      return applyHitStmt(stmt.target, stmt.arg, session, source)
    case 'MOVE':
      return moveOrgan(session, source, stmt.organ as OrganName | undefined, stmt.x, stmt.y)
    case 'DATA':
      return commitOperator(session, source, now, stmt.text)
  }
}

export function commitLine(line: string, session: Session, source: string, now: Now = nowOf()): Result {
  const trimmed = line.trim()
  if (!trimmed) {
    if (session.field) return commitField(session, source)
    if (session.pendingDump) return confirmPending(session, source)
    return ok(session, source)
  }
  if (isCommandLine(trimmed)) {
    const stmt = parseCommand(trimmed)
    if (stmt.kind === 'DATA') return commitOperator(session, source, now, stmt.text)
    return applyStmt(stmt, session, source, now)
  }
  return commitOperator(session, source, now, trimmed)
}

export function commitFieldLine(session: Session, source: string): Result {
  return commitField(session, source)
}

export function typeField(session: Session, text: string): Session {
  return { ...session, fieldBuffer: text, echo: null }
}

export function cycleField(session: Session, source: string, dir: 1 | -1): Result {
  if (!session.field) return { session, source }
  const committed = commitField(session, source)
  const id = committed.session.selected?.kind === 'NODE' ? committed.session.selected.id : session.field.id
  const slot = nextSlot(session.field.slot, dir)
  const doc = parseDoc(committed.source)
  const node = byId(doc, id)
  const value =
    slot === 'title' ? node?.title ?? '' : slot === 'body' ? node?.body ?? '' : slot === 'status' ? node?.status ?? '' : ''
  return {
    session: openField({ ...committed.session, pipeOpen: committed.session.pipeOpen ?? id }, id, slot, value),
    source: committed.source,
  }
}

export function applyKey(key: string, shift: boolean, session: Session, source: string): Result {
  if (key === 'Escape') return { session: collapse(session), source }
  if (key === 'Tab' && session.field) return cycleField(session, source, shift ? -1 : 1)
  if (key === ' ' && !session.field) {
    const id = nodeIdOf(session.selected)
    if (id == null) return { session, source }
    return applyShovel(session, source, id, 1)
  }
  if ((key === '[' || key === 'ArrowLeft') && session.lens === 'nest' && !session.field) {
    const id = nodeIdOf(session.selected)
    if (id == null) return { session, source }
    if (!session.nestClosed.includes(id)) return { session: toggleNest(session, id), source }
    return { session, source }
  }
  if ((key === ']' || key === 'ArrowRight') && session.lens === 'nest' && !session.field) {
    const id = nodeIdOf(session.selected)
    if (id == null) return { session, source }
    if (session.nestClosed.includes(id)) return { session: toggleNest(session, id), source }
    return { session, source }
  }
  if (key === 'Tab' && session.lens === 'nest' && !session.field) {
    const id = nodeIdOf(session.selected)
    if (id == null) return { session, source }
    const doc = parseDoc(source)
    const okMove = shift ? outdentNode(doc, id) : indentNode(doc, id)
    if (!okMove) return { session, source }
    return { session: { ...session, echo: shift ? 'OUTDENT' : 'INDENT' }, source: serializeDoc(doc) }
  }
  if (key === 'Backspace' && session.field && session.draftId != null && !session.fieldBuffer) {
    const doc = parseDoc(source)
    removeNode(doc, session.draftId)
    return ok(collapse(session), serializeDoc(doc))
  }
  return { session, source }
}

export { SEED_SOURCE, nowOf }
