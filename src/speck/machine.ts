import type { HitBox, Now, OrganName, Selected, Session } from './ir'
import { tapeDate } from './ir'
import { nextTaskId, parseDoc, SEED_SOURCE, serializeDoc, type Doc } from './doc'
import { isCommandLine, parseCommand } from './parse'
import { COL_ORDER, PAINT_OPS } from './tokens'

export type Result = {
  session: Session
  source: string
}

export function freshSession(): Session {
  return { selected: { kind: 'PIPE' }, overlay: false, buffer: '', echo: null }
}

function ok(session: Session, source: string, echo: string | null = null): Result {
  return { session: { ...session, buffer: '', echo }, source }
}

function taskIdOf(selected: Selected | null): number | null {
  return selected?.kind === 'TASK' ? selected.id : null
}

function stemPathOf(selected: Selected | null): string | null {
  return selected?.kind === 'STEM' ? selected.path : null
}

function shovelDoc(doc: Doc, id: number, delta: number): Doc {
  const task = doc.tasks.find((t) => t.id === id)
  if (!task) return doc
  const i = COL_ORDER.indexOf(task.col as (typeof COL_ORDER)[number])
  const at = i < 0 ? 0 : i
  const next = Math.max(0, Math.min(COL_ORDER.length - 1, at + delta))
  task.col = COL_ORDER[next]
  return doc
}

function clipStem(doc: Doc, path: string): Doc {
  if (doc.tasks.some((t) => t.nest === path)) return doc
  const base = path.includes('/') ? path.slice(path.lastIndexOf('/') + 1) : path
  doc.tasks.push({
    id: nextTaskId(doc),
    col: 'backlog',
    title: base || path,
    nest: path,
  })
  return doc
}

function appendTask(doc: Doc, title: string, col: string): Doc {
  doc.tasks.push({ id: nextTaskId(doc), col, title })
  return doc
}

function appendStem(doc: Doc, text: string): Doc {
  const path = text.replace(/\s+/g, '/')
  doc.stems.push({ path, urgent: false })
  return doc
}

function appendNote(doc: Doc, text: string, now: Now): Doc {
  doc.notes.push({ date: tapeDate(now.year, now.month, now.day), text })
  return doc
}

function colForAppend(selected: Selected | null): string {
  if (selected?.kind === 'COL') return selected.col
  if (selected?.kind === 'TASK') return 'backlog'
  return 'backlog'
}

export function nowOf(d = new Date()): Now {
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() }
}

function commitData(session: Session, source: string, now: Now, text: string): Result {
  const trimmed = text.trim()
  if (!trimmed) return ok(session, source)
  const doc = parseDoc(source)
  const sel = session.selected
  if (sel?.kind === 'NEST' || sel?.kind === 'STEM') {
    return ok(session, serializeDoc(appendStem(doc, trimmed)))
  }
  if (sel?.kind === 'DUMP' || sel?.kind === 'NOTE') {
    return ok(session, serializeDoc(appendNote(doc, trimmed, now)))
  }
  return ok(session, serializeDoc(appendTask(doc, trimmed, colForAppend(sel))))
}

function applyClip(session: Session, source: string, path?: string): Result {
  const p = path || stemPathOf(session.selected)
  if (!p) return ok(session, source, '? CLIP')
  const doc = parseDoc(source)
  const next = clipStem(doc, p)
  return ok({ ...session, selected: { kind: 'PIPE' } }, serializeDoc(next), `CLIP ${p}`)
}

function applyShovel(session: Session, source: string, id: number | null, delta: number): Result {
  const tid = id ?? taskIdOf(session.selected)
  if (tid == null) return ok(session, source, '? SHOVEL')
  const doc = parseDoc(source)
  shovelDoc(doc, tid, delta)
  const col = doc.tasks.find((t) => t.id === tid)?.col ?? '?'
  return ok({ ...session, selected: { kind: 'TASK', id: tid } }, serializeDoc(doc), `SHOVEL #${tid} ${col}`)
}

function applyStrike(session: Session, source: string): Result {
  const tid = taskIdOf(session.selected)
  if (tid == null) return ok(session, source, '? STRIKE')
  const doc = parseDoc(source)
  const task = doc.tasks.find((t) => t.id === tid)
  if (task) task.col = 'done'
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
  const name: OrganName | null =
    organ === 'PIPE' || organ === 'NEST' || organ === 'DUMP'
      ? organ
      : session.selected?.kind === 'PIPE' || session.selected?.kind === 'NEST' || session.selected?.kind === 'DUMP'
        ? session.selected.kind
        : null
  if (!name) return ok(session, source, '? MOVE')
  return ok(session, placeOrgan(source, name, x, y))
}

function applyHitStmt(target: string, arg: string | number | undefined, session: Session, source: string): Result {
  const t = target.toUpperCase()
  if (t === 'FIELD') return { session: { ...session, overlay: false, echo: null }, source }
  if (t === 'PIPE') return { session: { ...session, selected: { kind: 'PIPE' }, overlay: false, echo: null }, source }
  if (t === 'NEST') return { session: { ...session, selected: { kind: 'NEST' }, overlay: false, echo: null }, source }
  if (t === 'DUMP') return { session: { ...session, selected: { kind: 'DUMP' }, overlay: false, echo: null }, source }
  if (t === 'TASK' && typeof arg === 'number') {
    return { session: { ...session, selected: { kind: 'TASK', id: arg }, overlay: true, echo: null }, source }
  }
  if (t === 'COL' && arg != null) {
    return { session: { ...session, selected: { kind: 'COL', col: String(arg).toLowerCase() }, overlay: false, echo: null }, source }
  }
  if (t === 'STEM' && arg != null) {
    return { session: { ...session, selected: { kind: 'STEM', path: String(arg) }, overlay: false, echo: null }, source }
  }
  if (t === 'SHOVEL') {
    const id = typeof arg === 'number' ? arg : taskIdOf(session.selected)
    return applyShovel(session, source, id, 1)
  }
  if (t === 'CLIP') return applyClip(session, source, arg != null ? String(arg) : undefined)
  if (t === 'RING') return ok(session, source, session.echo || 'SHOVEL // CLIP')
  if (t === 'CLEAR') return ok(freshSession(), SEED_SOURCE)
  return ok(session, source, `? HIT ${target}`)
}

export function applyHit(hit: HitBox, session: Session, source: string): Result {
  switch (hit.kind) {
    case 'TASK': {
      const id = Number(hit.payload ?? 0)
      if (session.selected?.kind === 'TASK' && session.selected.id === id && session.overlay) {
        return { session: { ...session, overlay: false, echo: null }, source }
      }
      return { session: { ...session, selected: { kind: 'TASK', id }, overlay: true, echo: null }, source }
    }
    case 'SHOVEL':
      return applyShovel(session, source, Number(hit.payload ?? 0), 1)
    case 'CLIP':
      return applyClip(session, source, String(hit.payload ?? ''))
    case 'STEM':
      return { session: { ...session, selected: { kind: 'STEM', path: String(hit.payload ?? '') }, overlay: false, echo: null }, source }
    case 'COL':
      return { session: { ...session, selected: { kind: 'COL', col: String(hit.payload ?? 'backlog') }, overlay: false, echo: null }, source }
    case 'PIPE':
    case 'ORGAN': {
      const organ = String(hit.payload ?? 'PIPE')
      if (organ === 'NEST') return { session: { ...session, selected: { kind: 'NEST' }, overlay: false, echo: null }, source }
      if (organ === 'DUMP') return { session: { ...session, selected: { kind: 'DUMP' }, overlay: false, echo: null }, source }
      return { session: { ...session, selected: { kind: 'PIPE' }, overlay: false, echo: null }, source }
    }
    case 'NEST':
      return { session: { ...session, selected: { kind: 'NEST' }, overlay: false, echo: null }, source }
    case 'DUMP':
    case 'NOTE':
      return { session: { ...session, selected: { kind: 'DUMP' }, overlay: false, echo: null }, source }
    case 'RING':
      return ok(session, source, session.echo || 'SHOVEL // CLIP')
    case 'FIELD':
      return { session: { ...session, overlay: false, echo: null }, source }
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
      return ok(session, source, `${PAINT_OPS.join(' ')} // HIT SHOVEL CLIP SEE CLEAR`)
    case 'CLEAR':
      return ok(freshSession(), SEED_SOURCE)
    case 'SHOVEL':
      return applyShovel(session, source, taskIdOf(session.selected), stmt.delta)
    case 'CLIP':
      return applyClip(session, source)
    case 'STRIKE':
      return applyStrike(session, source)
    case 'COMMIT':
      return commitData(session, source, now, session.buffer)
    case 'TYPE':
      return { session: { ...session, buffer: stmt.text }, source }
    case 'HIT':
      return applyHitStmt(stmt.target, stmt.arg, session, source)
    case 'MOVE':
      return moveOrgan(session, source, stmt.organ as OrganName | undefined, stmt.x, stmt.y)
    case 'DATA':
      return commitData(session, source, now, stmt.text)
  }
}

export function commitLine(line: string, session: Session, source: string, now: Now = nowOf()): Result {
  const trimmed = line.trim()
  if (!trimmed) return ok(session, source)
  if (isCommandLine(trimmed)) {
    const stmt = parseCommand(trimmed)
    if (stmt.kind === 'DATA') return commitData(session, source, now, stmt.text)
    return applyStmt(stmt, session, source, now)
  }
  return commitData(session, source, now, trimmed)
}

export { SEED_SOURCE }
