import type { HitBox, Session } from './ir'
import { isCommandLine, parseCommand, type Stmt } from './parse'
import { see } from './see'
import {
  appendPaint,
  DEFAULT_SOURCE,
  quote,
  setSeal,
  strikeLast,
  strikeLine,
} from './source'
import { PAINT_OPS } from './tokens'

export type Result = {
  session: Session
  source: string
}

export function freshSession(): Session {
  return { inv: false, buffer: '', echo: null }
}

function ok(session: Session, source: string, echo: string | null = null): Result {
  return { session: { ...session, buffer: '', echo }, source }
}

function paintLine(stmt: Stmt): string | null {
  if (stmt.kind === 'GLYPH') {
    return `GLYPH ${quote(stmt.text)}${stmt.strike ? ' STRIKE' : ''}`
  }
  if (stmt.kind === 'CHIP') {
    return `CHIP ${quote(stmt.text)}${stmt.strike ? ' STRIKE' : ''}`
  }
  if (stmt.kind === 'STEM') {
    const flags = `${stmt.urgent ? ' URGENT' : ''}${stmt.strike ? ' STRIKE' : ''}`
    return `STEM ${stmt.text}${flags}`
  }
  return null
}

function applyStmt(stmt: Stmt, session: Session, source: string): Result {
  switch (stmt.kind) {
    case 'INV':
      return { session: { ...session, inv: !session.inv, buffer: '', echo: null }, source }
    case 'SEE': {
      const src = see(source, session)
      const echo = src.replace(/\n+/g, ' · ')
      return ok(session, source, echo.length > 160 ? `${echo.slice(0, 157)}…` : echo)
    }
    case 'WORDS':
      return ok(session, source, `${PAINT_OPS.join(' ')} // HIT TYPE COMMIT SEE CLEAR`)
    case 'CLEAR':
      return ok({ ...session, inv: false }, DEFAULT_SOURCE)
    case 'SEAL':
      return ok(session, setSeal(source, stmt.legend))
    case 'GLYPH':
    case 'CHIP':
    case 'STEM': {
      const line = paintLine(stmt)
      return line ? ok(session, appendPaint(source, line)) : ok(session, source, `? ${stmt.kind}`)
    }
    case 'GRAIN':
    case 'SCAN':
    case 'DOCK':
      return ok(session, source)
    case 'INK':
      return ok(session, source, 'INK // baked')
    case 'STRIKE': {
      const next = strikeLast(source)
      if (!next) return ok(session, source, '? STRIKE')
      return ok(session, next)
    }
    case 'COMMIT':
      return commitData(session, source, session.buffer)
    case 'TYPE':
      return { session: { ...session, buffer: stmt.text }, source }
    case 'HIT':
      return applyHitStmt(stmt.target, session, source)
    case 'DATA':
      return commitData(session, source, stmt.text)
    default:
      return ok(session, source, `? ${stmt.kind}`)
  }
}

function applyHitStmt(target: string, session: Session, source: string): Result {
  const t = target.toUpperCase()
  if (t === 'INV') {
    return { session: { ...session, inv: !session.inv, echo: null, buffer: '' }, source }
  }
  if (t === 'CLEAR') return ok({ ...session, inv: false }, DEFAULT_SOURCE)
  return ok(session, source, `? HIT ${target}`)
}

export function applyHit(hit: HitBox, session: Session, source: string): Result {
  switch (hit.kind) {
    case 'INV':
      return { session: { ...session, inv: !session.inv, echo: null }, source }
    case 'MARK':
      return { session: { ...session, echo: null }, source: strikeLine(source, Number(hit.payload ?? 0)) }
    case 'COMMIT':
    case 'DOCK':
      return { session, source }
    default:
      return { session, source }
  }
}

function commitData(session: Session, source: string, text: string): Result {
  const trimmed = text.trim()
  if (!trimmed) return ok(session, source)
  return ok(session, appendPaint(source, `GLYPH ${quote(trimmed)}`))
}

export function commitLine(line: string, session: Session, source: string): Result {
  const trimmed = line.trim()
  if (!trimmed) return ok(session, source)
  if (isCommandLine(trimmed)) {
    const stmt = parseCommand(trimmed)
    if (stmt.kind === 'DATA') return commitData(session, source, stmt.text)
    return applyStmt(stmt, session, source)
  }
  return commitData(session, source, trimmed)
}
