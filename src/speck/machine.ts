import type { HitBox, Now, Session } from './ir'
import { tapeDate } from './ir'
import { isCommandLine, notesForDate, parseCommand, type Stmt } from './parse'
import { see } from './see'
import { appendDayNote, DEFAULT_SOURCE } from './source'
import { PAINT_OPS } from './tokens'

export type Result = {
  session: Session
  source: string
}

export function freshSession(): Session {
  return { selectedDay: null, notesOpen: false, buffer: '', echo: null }
}

function ok(session: Session, source: string, echo: string | null = null): Result {
  return { session: { ...session, buffer: '', echo }, source }
}

function selectDay(session: Session, source: string, now: Now, n: number): Result {
  const date = tapeDate(now.year, now.month, n)
  const has = notesForDate(source, date).length > 0
  if (session.selectedDay === n && session.notesOpen) {
    return {
      session: { ...session, notesOpen: false, echo: null },
      source,
    }
  }
  return {
    session: {
      ...session,
      selectedDay: n,
      notesOpen: has,
      echo: null,
    },
    source,
  }
}

function applyStmt(stmt: Stmt, session: Session, source: string, now: Now): Result {
  switch (stmt.kind) {
    case 'SEE': {
      const src = see(source)
      const echo = src.trim() ? src.replace(/\n+/g, ' · ') : '_'
      return ok(session, source, echo.length > 160 ? `${echo.slice(0, 157)}…` : echo)
    }
    case 'WORDS':
      return ok(session, source, `${PAINT_OPS.join(' ')} // HIT TYPE COMMIT SEE CLEAR`)
    case 'CLEAR':
      return ok(freshSession(), DEFAULT_SOURCE)
    case 'DAY': {
      if (!stmt.date || !stmt.text) return ok(session, source, '? DAY')
      return ok(session, appendDayNote(source, stmt.date, stmt.text))
    }
    case 'DOCK':
      return ok(session, source)
    case 'COMMIT':
      return commitData(session, source, now, session.buffer)
    case 'TYPE':
      return { session: { ...session, buffer: stmt.text }, source }
    case 'HIT':
      return applyHitStmt(stmt.target, stmt.arg, session, source, now)
    case 'DATA':
      return commitData(session, source, now, stmt.text)
  }
}

function applyHitStmt(
  target: string,
  arg: string | number | undefined,
  session: Session,
  source: string,
  now: Now,
): Result {
  const t = target.toUpperCase()
  if (t === 'DAY' && typeof arg === 'number') return selectDay(session, source, now, arg)
  if (t === 'FIELD') {
    return { session: { ...session, notesOpen: false, echo: null }, source }
  }
  if (t === 'CLEAR') return ok(freshSession(), DEFAULT_SOURCE)
  return ok(session, source, `? HIT ${target}`)
}

export function applyHit(hit: HitBox, session: Session, source: string, now: Now): Result {
  switch (hit.kind) {
    case 'DAY':
      return selectDay(session, source, now, Number(hit.payload ?? 0))
    case 'FIELD':
      return { session: { ...session, notesOpen: false, echo: null }, source }
    case 'COMMIT':
    case 'DOCK':
      return { session, source }
  }
}

function commitData(session: Session, source: string, now: Now, text: string): Result {
  const trimmed = text.trim()
  if (!trimmed) return ok(session, source)
  if (session.selectedDay == null) return ok(session, source, '? DAY')
  const date = tapeDate(now.year, now.month, session.selectedDay)
  return ok(session, appendDayNote(source, date, trimmed))
}

export function commitLine(line: string, session: Session, source: string, now: Now): Result {
  const trimmed = line.trim()
  if (!trimmed) return ok(session, source)
  if (isCommandLine(trimmed)) {
    const stmt = parseCommand(trimmed)
    if (stmt.kind === 'DATA') return commitData(session, source, now, stmt.text)
    return applyStmt(stmt, session, source, now)
  }
  return commitData(session, source, now, trimmed)
}
