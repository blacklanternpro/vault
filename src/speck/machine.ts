import type { HitBox, Now, Session } from './ir'
import { clockOf, tapeDate } from './ir'
import { isCommandLine, parseCommand, type Stmt } from './parse'
import { see } from './see'
import { DEFAULT_SOURCE } from './source'
import { PAINT_OPS } from './tokens'
import {
  addChild,
  dropSettled,
  findNode,
  mapNode,
  parseTree,
  removeNode,
  repath,
  serialize,
  subtreeSize,
} from './tree'

export type Result = {
  session: Session
  source: string
}

export function freshSession(): Session {
  return {
    selected: null,
    armed: null,
    folded: [],
    focus: '',
    undo: null,
    buffer: '',
    echo: null,
  }
}

function ok(session: Session, source: string, echo: string | null = null): Result {
  return { session: { ...session, buffer: '', echo }, source }
}

function settle(session: Session, source: string, now: Now, path: string): Result {
  const tree = parseTree(source)
  const node = findNode(tree, path)
  if (!node) return ok(session, source, '? row')
  const next = mapNode(tree, path, (n) =>
    n.done ? { ...n, done: false, at: '' } : { ...n, done: true, at: clockOf(now) },
  )
  return { session: { ...session, echo: null }, source: serialize(next) }
}

function select(session: Session, source: string, path: string): Result {
  const same = session.selected === path
  return {
    session: { ...session, selected: same ? null : path, echo: null },
    source,
  }
}

function arm(session: Session, source: string, path: string): Result {
  const same = session.armed === path
  const node = findNode(parseTree(source), path)
  if (!node) return ok(session, source, '? row')
  return {
    session: {
      ...session,
      armed: same ? null : path,
      selected: same ? session.selected : path,
      echo: same ? null : `+ under ${node.text}`,
      buffer: session.buffer,
    },
    source,
  }
}

function fold(session: Session, source: string, path: string): Result {
  const has = session.folded.includes(path)
  const folded = has ? session.folded.filter((p) => p !== path) : [...session.folded, path]
  return { session: { ...session, folded, echo: null }, source }
}

function kill(session: Session, source: string, path: string): Result {
  const tree = parseTree(source)
  const node = findNode(tree, path)
  if (!node) return ok(session, source, '? row')
  const extra = subtreeSize(node)
  const next = repath(removeNode(tree, path))
  const label = extra > 0 ? `killed ${node.text} +${extra}` : `killed ${node.text}`
  return {
    session: {
      ...session,
      selected: null,
      armed: session.armed === path ? null : session.armed,
      focus: session.focus === path || session.focus.startsWith(`${path}.`) ? '' : session.focus,
      undo: { source, label },
      buffer: '',
      echo: `${label} · UNDO`,
    },
    source: serialize(next),
  }
}

function focusOn(session: Session, source: string, path: string): Result {
  if (!path) return { session: { ...session, focus: '', selected: null, echo: null }, source }
  const node = findNode(parseTree(source), path)
  if (!node) return ok(session, source, '? row')
  return {
    session: { ...session, focus: path, selected: null, armed: path, echo: `focus ${node.text}` },
    source,
  }
}

function undo(session: Session, source: string): Result {
  if (!session.undo) return ok(session, source, 'nothing to undo')
  return {
    session: { ...freshSession(), folded: session.folded, focus: session.focus, echo: 'restored' },
    source: session.undo.source,
  }
}

function applyStmt(stmt: Stmt, session: Session, source: string, now: Now): Result {
  switch (stmt.kind) {
    case 'SEE': {
      const src = see(source)
      const echo = src.trim() ? src.replace(/\n+/g, ' · ').replace(/\s+/g, ' ') : '_'
      return ok(session, source, echo.length > 150 ? `${echo.slice(0, 147)}…` : echo)
    }
    case 'WORDS':
      return ok(session, source, `${PAINT_OPS.join(' ')} // COMMIT SEE CLEAR WIPE UNDO OUT`)
    case 'CLEAR': {
      const next = dropSettled(parseTree(source))
      return ok({ ...session, selected: null, armed: null, undo: { source, label: 'cleared' } }, serialize(next), 'settled dropped · UNDO')
    }
    case 'WIPE':
      return ok({ ...freshSession(), undo: { source, label: 'wiped' } }, DEFAULT_SOURCE, 'wiped · UNDO')
    case 'UNDO':
      return undo(session, source)
    case 'OUT':
      return focusOn(session, source, '')
    case 'FOCUS':
      return focusOn(session, source, stmt.arg)
    case 'STEM':
      return commitTask(session, source, now, stmt.text)
    case 'COMMIT':
      return commitTask(session, source, now, session.buffer)
    case 'TYPE':
      return { session: { ...session, buffer: stmt.text }, source }
    case 'HIT':
      return applyHitStmt(stmt.target, stmt.arg, session, source, now)
    case 'DATA':
      return commitTask(session, source, now, stmt.text)
  }
}

function applyHitStmt(
  target: string,
  arg: string | undefined,
  session: Session,
  source: string,
  now: Now,
): Result {
  const t = target.toUpperCase()
  const path = arg ?? ''
  if (t === 'DOT') return settle(session, source, now, path)
  if (t === 'ROW') return select(session, source, path)
  if (t === 'PLUS') return arm(session, source, path)
  if (t === 'RATIO') return fold(session, source, path)
  if (t === 'KILL') return kill(session, source, path)
  if (t === 'PATH') return focusOn(session, source, path)
  if (t === 'FIELD') {
    return { session: { ...session, selected: null, armed: null, echo: null }, source }
  }
  if (t === 'UNDO') return undo(session, source)
  return ok(session, source, `? HIT ${target}`)
}

export function applyHit(hit: HitBox, session: Session, source: string, now: Now): Result {
  const path = String(hit.payload ?? '')
  switch (hit.kind) {
    case 'DOT':
      return settle(session, source, now, path)
    case 'ROW':
      return select(session, source, path)
    case 'PLUS':
      return arm(session, source, path)
    case 'RATIO':
      return fold(session, source, path)
    case 'KILL':
      return kill(session, source, path)
    case 'PATH':
      return focusOn(session, source, path)
    case 'UNDO':
      return undo(session, source)
    case 'FIELD':
      return { session: { ...session, selected: null, armed: null, echo: null }, source }
    case 'COMMIT':
    case 'DOCK':
      return { session, source }
  }
}

/** Long-press on a row. Prints the slip from that branch. */
export function focusHit(session: Session, source: string, path: string): Result {
  return focusOn(session, source, path)
}

function commitTask(session: Session, source: string, now: Now, text: string): Result {
  const trimmed = text.trim()
  if (!trimmed) return ok(session, source)
  const born = tapeDate(now.year, now.month, now.day)
  const parent = session.armed ?? (session.focus || null)
  const next = addChild(parseTree(source), parent, trimmed, born)
  return {
    session: { ...session, buffer: '', echo: null },
    source: serialize(next),
  }
}

export function commitLine(line: string, session: Session, source: string, now: Now): Result {
  const trimmed = line.trim()
  if (!trimmed) return ok(session, source)
  if (isCommandLine(trimmed)) {
    const stmt = parseCommand(trimmed)
    if (stmt.kind === 'DATA') return commitTask(session, source, now, stmt.text)
    return applyStmt(stmt, session, source, now)
  }
  return commitTask(session, source, now, trimmed)
}
