import { isOrganName, nextSlot, nowOf, tapeDate, type FieldSlot, type HitBox, type Now, type OrganName, type Selected, type Session } from './ir'
import {
  byId,
  indentNode,
  insertNode,
  isProject,
  moveNodeBefore,
  moveNote,
  outdentNode,
  parseDoc,
  removeNode,
  SEED_SOURCE,
  serializeDoc,
  setNodeBody,
  setNodeStatus,
  setNoteText,
  setNodeTitle,
  type Doc,
} from './doc'
import { isCommandLine, parseCommand } from './parse'
import { COL_ORDER, isBinderStatus, PAINT_OPS, type NodeStatus } from './tokens'
import { visibleBinderIds } from './organs/pipe'
import { visibleNestIds } from './tree'

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
    find: null,
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

export function stageCard(
  session: Session,
  source: string,
  id: number,
  status: NodeStatus,
  beforeId?: number | null,
): Result {
  const doc = parseDoc(source)
  const node = byId(doc, id)
  if (!node) return ok(session, source, '? STAGE')
  node.status = status
  if (beforeId !== undefined) moveNodeBefore(doc, id, beforeId)
  return ok(
    { ...session, selected: { kind: 'NODE', id }, lens: 'pipe' },
    serializeDoc(doc),
    `STAGE #${id} ${status}`,
  )
}

export function applyNoteOrder(session: Session, source: string, from: number, to: number): Result {
  const doc = parseDoc(source)
  if (!moveNote(doc, from, to)) return ok(session, source)
  return ok(session, serializeDoc(doc))
}

export function applyNoteText(session: Session, source: string, index: number, text: string): Result {
  const doc = parseDoc(source)
  setNoteText(doc, index, text)
  return ok(session, serializeDoc(doc))
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

function applyFind(session: Session, source: string, query: string): Result {
  const q = query.trim()
  if (!q) return ok({ ...session, find: null }, source, 'FIND _')
  const doc = parseDoc(source)
  const needle = q.toLowerCase()
  const hits = doc.nodes.filter((n) => n.title.toLowerCase().includes(needle))
  const first = hits[0]
  return ok(
    {
      ...session,
      find: q,
      selected: first ? { kind: 'NODE', id: first.id } : session.selected,
    },
    source,
    hits.length ? `FIND ${hits.length}` : 'FIND _',
  )
}

function applyNote(session: Session, source: string, now: Now, text: string): Result {
  const t = text.trim()
  if (!t) return ok(session, source, '? NOTE')
  const doc = parseDoc(source)
  doc.notes.push({ date: tapeDate(now.year, now.month, now.day), text: t })
  return ok(
    { ...session, selected: { kind: 'DUMP' }, lens: 'dump' },
    serializeDoc(doc),
    'NOTE',
  )
}

function applyGlyph(session: Session, source: string, x: number, y: number, px: number, text: string): Result {
  const t = text.trim()
  if (!t) return ok(session, source, '? GLYPH')
  const doc = parseDoc(source)
  doc.glyphs.push({ x, y, px, text: t })
  return ok(session, serializeDoc(doc), `GLYPH ${t}`)
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
  if (!trimmed) return ok(session, source)
  if (session.lens === 'dump') return applyNote(session, source, now, trimmed)
  const query = trimmed.startsWith('/') ? trimmed.slice(1) : trimmed
  return applyFind(session, source, query)
}

function applyLens(session: Session, source: string, raw: string): Result {
  const nest = raw.toUpperCase() === 'NEST'
  return {
    session: {
      ...closeField(session),
      lens: nest ? 'nest' : 'pipe',
      selected: nest ? { kind: 'NEST' } : { kind: 'PIPE' },
    },
    source,
  }
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
  if (t === 'PIPE') {
    return {
      session: {
        ...collapse(session),
        selected: { kind: 'PIPE' },
        lens: 'pipe',
        collapsed: session.collapsed.filter((o) => o !== 'PIPE'),
      },
      source,
    }
  }
  if (t === 'NEST') {
    return {
      session: {
        ...collapse(session),
        selected: { kind: 'NEST' },
        lens: 'nest',
        collapsed: session.collapsed.filter((o) => o !== 'NEST'),
      },
      source,
    }
  }
  if (t === 'DUMP') {
    return {
      session: {
        ...collapse(session),
        selected: { kind: 'DUMP' },
        lens: 'dump',
        collapsed: session.collapsed.filter((o) => o !== 'DUMP'),
      },
      source,
    }
  }
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
  if (t === 'LENS') {
    return applyLens(session, source, String(arg ?? ''))
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
    case 'CLOSE': {
      const organ = String(hit.payload ?? 'PIPE') as OrganName
      return { session: toggleCollapsed(session, organ), source }
    }
    case 'LENS':
      return applyLens(session, source, String(hit.payload ?? 'PIPE'))
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
      return ok(session, source, session.echo || 'MOVE // FIND // NOTE')
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
      return ok(session, source, `${PAINT_OPS.join(' ')} // MOVE FIND NOTE CLEAR HIT`)
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
    case 'FIND':
      return applyFind(session, source, stmt.query)
    case 'NOTE':
      return applyNote(session, source, now, stmt.text)
    case 'GLYPH':
      return applyGlyph(session, source, stmt.x, stmt.y, stmt.px, stmt.text)
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

function moveSelection(session: Session, source: string, dir: 1 | -1): Result {
  if (session.lens === 'dump') return { session, source }
  const doc = parseDoc(source)
  const ids = session.lens === 'nest' ? visibleNestIds(doc, session) : visibleBinderIds(doc, session.nestFocus)
  if (ids.length === 0) return { session, source }
  const cur = nodeIdOf(session.selected)
  const at = cur == null ? -1 : ids.indexOf(cur)
  const next =
    dir > 0 ? (at < 0 ? 0 : Math.min(ids.length - 1, at + 1)) : at < 0 ? ids.length - 1 : Math.max(0, at - 1)
  return {
    session: { ...session, selected: { kind: 'NODE', id: ids[next] } },
    source,
  }
}

export function applyKey(key: string, shift: boolean, session: Session, source: string): Result {
  if (key === 'Escape') return { session: collapse(session), source }
  if (key === 'Tab' && session.field) return cycleField(session, source, shift ? -1 : 1)
  if ((key === 'ArrowUp' || key === 'ArrowDown') && !session.field) {
    return moveSelection(session, source, key === 'ArrowDown' ? 1 : -1)
  }
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
