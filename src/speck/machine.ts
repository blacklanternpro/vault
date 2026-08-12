import type { OsMode } from '../lib/os-mode'
import type { TaskPriority, VaultSnapshot } from '../lib/vault-types'
import type { HitBox, Now, Session } from './ir'
import { tapeDate } from './ir'
import { isCommandLine, parseCommand, type Stmt } from './parse'
import { findNodeByPath, findNodePath, see } from './see'
import { PAINT_OPS } from './tokens'

export type Intent =
  | { type: 'ADD_SYS_LOG'; text: string; day: number; date: string }
  | {
      type: 'ADD_TASK'
      text: string
      parentId: string | null
      priority: TaskPriority
    }
  | { type: 'ADD_NOTE'; text: string; date: string; attachment?: string }
  | { type: 'TOGGLE_TASK'; id: string }
  | { type: 'DELETE_SYS_LOG'; id: string }
  | { type: 'ATTACH' }

export type Result = {
  session: Session
  intents: Intent[]
}

export function freshSession(now: Now): Session {
  return {
    inv: false,
    mode: 'DAY',
    viewYear: now.year,
    viewMonth: now.month,
    calView: 'MO',
    selectedDay: now.day,
    nestId: null,
    priority: 'P2',
    buffer: '',
    echo: null,
  }
}

function shiftCal(session: Session, delta: number): Session {
  const d = new Date(session.viewYear, session.viewMonth, 1)
  if (session.calView === 'YR') d.setFullYear(d.getFullYear() + delta)
  else d.setMonth(d.getMonth() + delta)
  return {
    ...session,
    viewYear: d.getFullYear(),
    viewMonth: d.getMonth(),
    selectedDay: null,
    mode: 'DAY',
    echo: null,
  }
}

function dockDate(session: Session, now: Now): { day: number; date: string } | null {
  const viewingNow = session.viewYear === now.year && session.viewMonth === now.month
  const day = session.selectedDay ?? (viewingNow ? now.day : null)
  if (day == null) return null
  return { day, date: tapeDate(session.viewYear, session.viewMonth, day) }
}

function commitData(session: Session, now: Now, text: string): Result {
  const trimmed = text.trim()
  if (!trimmed) return { session: { ...session, buffer: '', echo: null }, intents: [] }

  if (session.mode === 'DAY') {
    const slot = dockDate(session, now)
    if (!slot) {
      return { session: { ...session, echo: '? DAY' }, intents: [] }
    }
    return {
      session: { ...session, buffer: '', echo: null, selectedDay: slot.day },
      intents: [
        {
          type: 'ADD_SYS_LOG',
          text: trimmed.toUpperCase(),
          day: slot.day,
          date: slot.date,
        },
      ],
    }
  }

  if (session.mode === 'NEST') {
    return {
      session: { ...session, buffer: '', echo: null, priority: 'P2' },
      intents: [
        {
          type: 'ADD_TASK',
          text: trimmed,
          parentId: session.nestId,
          priority: session.priority,
        },
      ],
    }
  }

  const date = dockDate(session, now)?.date ?? tapeDate(now.year, now.month, now.day)
  return {
    session: { ...session, buffer: '', echo: null },
    intents: [{ type: 'ADD_NOTE', text: trimmed, date }],
  }
}

function applyStmt(
  stmt: Stmt,
  session: Session,
  snapshot: VaultSnapshot,
  now: Now,
): Result {
  switch (stmt.kind) {
    case 'INV':
      return { session: { ...session, inv: !session.inv, buffer: '', echo: null }, intents: [] }
    case 'MO':
      return { session: { ...session, calView: 'MO', mode: 'DAY', buffer: '', echo: null }, intents: [] }
    case 'YR':
      return { session: { ...session, calView: 'YR', mode: 'DAY', buffer: '', echo: null }, intents: [] }
    case 'NAV':
      return { session: { ...shiftCal(session, stmt.delta), buffer: '' }, intents: [] }
    case 'SEE': {
      const src = see(snapshot, session, now)
      const date = tapeDate(now.year, now.month, now.day)
      return {
        session: { ...session, buffer: '', echo: 'SEE → DUMP', mode: 'DUMP' },
        intents: [{ type: 'ADD_NOTE', text: src, date }],
      }
    }
    case 'WORDS':
      return {
        session: {
          ...session,
          buffer: '',
          echo: `${PAINT_OPS.join(' ')} // HIT TYPE COMMIT SEE`,
        },
        intents: [],
      }
    case 'ATTACH':
      return {
        session: { ...session, mode: 'DUMP', buffer: '', echo: null },
        intents: [{ type: 'ATTACH' }],
      }
    case 'PRIORITY':
      return {
        session: {
          ...session,
          mode: 'NEST',
          priority: stmt.value as TaskPriority,
          buffer: '',
          echo: null,
        },
        intents: [],
      }
    case 'DAY_SELECT':
      return {
        session: {
          ...session,
          mode: 'DAY',
          selectedDay: stmt.n,
          nestId: null,
          buffer: '',
          echo: null,
        },
        intents: [],
      }
    case 'MODE': {
      if (stmt.mode === 'NEST') {
        let nestId = session.nestId
        if (stmt.arg) {
          const node = findNodeByPath(snapshot.tasks, stmt.arg)
          nestId = node?.id ?? null
          if (!node) {
            return { session: { ...session, echo: `? ${stmt.arg}`, buffer: '' }, intents: [] }
          }
        }
        return {
          session: { ...session, mode: 'NEST', nestId, buffer: '', echo: null },
          intents: [],
        }
      }
      const mode = stmt.mode as OsMode
      return {
        session: {
          ...session,
          mode,
          nestId: mode === 'NEST' ? session.nestId : null,
          buffer: '',
          echo: null,
        },
        intents: [],
      }
    }
    case 'DUMP': {
      if (!stmt.text && !stmt.date) {
        return { session: { ...session, mode: 'DUMP', buffer: '', echo: null }, intents: [] }
      }
      const date = stmt.date || tapeDate(now.year, now.month, now.day)
      return {
        session: { ...session, mode: 'DUMP', buffer: '', echo: null },
        intents: [{ type: 'ADD_NOTE', text: stmt.text || '_', date }],
      }
    }
    case 'STEM_ADD':
      return commitData({ ...session, mode: 'NEST' }, now, stmt.text)
    case 'DOCK': {
      const mode = (stmt.mode === 'NEST' || stmt.mode === 'DUMP' ? stmt.mode : 'DAY') as OsMode
      return { session: { ...session, mode, buffer: '', echo: null }, intents: [] }
    }
    case 'COMMIT':
      return commitData(session, now, session.buffer)
    case 'TYPE':
      return { session: { ...session, buffer: stmt.text }, intents: [] }
    case 'STRIKE': {
      if (stmt.id) {
        const log = snapshot.sysLogs.find((l) => l.id === stmt.id)
        if (log) {
          return {
            session: { ...session, buffer: '', echo: null },
            intents: [{ type: 'DELETE_SYS_LOG', id: stmt.id }],
          }
        }
        return {
          session: { ...session, buffer: '', echo: null },
          intents: [{ type: 'TOGGLE_TASK', id: stmt.id }],
        }
      }
      if (session.mode === 'NEST' && session.nestId) {
        return {
          session: { ...session, buffer: '', echo: null },
          intents: [{ type: 'TOGGLE_TASK', id: session.nestId }],
        }
      }
      return { session: { ...session, echo: '? STRIKE', buffer: '' }, intents: [] }
    }
    case 'HIT':
      return applyHitStmt(stmt.target, stmt.arg, session, snapshot)
    case 'GRAIN':
    case 'SCAN':
    case 'SEAL':
      return { session: { ...session, buffer: '', echo: null }, intents: [] }
    case 'CAL':
      return { session: { ...session, mode: 'DAY', calView: 'MO', buffer: '', echo: null }, intents: [] }
    case 'DATA':
      return commitData(session, now, stmt.text)
    default:
      return { session: { ...session, echo: `? ${stmt.kind}`, buffer: '' }, intents: [] }
  }
}

function applyHitStmt(
  target: string,
  arg: string | number | undefined,
  session: Session,
  snapshot: VaultSnapshot,
): Result {
  const t = target.toUpperCase()
  if (t === 'INV') return { session: { ...session, inv: !session.inv, echo: null }, intents: [] }
  if (t === 'MO') return { session: { ...session, calView: 'MO', mode: 'DAY', echo: null }, intents: [] }
  if (t === 'YR') return { session: { ...session, calView: 'YR', mode: 'DAY', echo: null }, intents: [] }
  if (t === 'NAV' && typeof arg === 'number') {
    return { session: shiftCal(session, arg), intents: [] }
  }
  if (t === 'DAY' && typeof arg === 'number') {
    return {
      session: { ...session, mode: 'DAY', selectedDay: arg, nestId: null, echo: null },
      intents: [],
    }
  }
  if (t === 'DUMP') {
    return { session: { ...session, mode: 'DUMP', nestId: null, echo: null }, intents: [] }
  }
  if (t === 'NODE' && typeof arg === 'string') {
    const node = findNodeByPath(snapshot.tasks, arg)
    return {
      session: {
        ...session,
        mode: 'NEST',
        nestId: node ? (session.nestId === node.id ? null : node.id) : session.nestId,
        echo: node ? null : `? ${arg}`,
      },
      intents: [],
    }
  }
  return { session: { ...session, echo: `? HIT ${target}` }, intents: [] }
}

export function applyHit(hit: HitBox, session: Session, _snapshot: VaultSnapshot): Result {
  switch (hit.kind) {
    case 'INV':
      return { session: { ...session, inv: !session.inv, echo: null }, intents: [] }
    case 'MO':
      return { session: { ...session, calView: 'MO', mode: 'DAY', echo: null }, intents: [] }
    case 'YR':
      return { session: { ...session, calView: 'YR', mode: 'DAY', echo: null }, intents: [] }
    case 'NAV':
      return { session: shiftCal(session, Number(hit.payload ?? 0)), intents: [] }
    case 'MONTH':
      return {
        session: {
          ...session,
          viewMonth: Number(hit.payload),
          calView: 'MO',
          selectedDay: null,
          mode: 'DAY',
          echo: null,
        },
        intents: [],
      }
    case 'DAY':
      return {
        session: {
          ...session,
          mode: 'DAY',
          selectedDay: Number(hit.payload),
          nestId: null,
          echo: null,
        },
        intents: [],
      }
    case 'CAL':
      return { session: { ...session, mode: 'DAY', echo: null }, intents: [] }
    case 'NEST':
      return { session: { ...session, mode: 'NEST', echo: null }, intents: [] }
    case 'DUMP':
      return { session: { ...session, mode: 'DUMP', nestId: null, echo: null }, intents: [] }
    case 'NODE': {
      const id = String(hit.payload ?? '')
      return {
        session: {
          ...session,
          mode: 'NEST',
          nestId: session.nestId === id ? null : id,
          echo: null,
        },
        intents: [],
      }
    }
    case 'STRIKE_LOG':
      return {
        session,
        intents: [{ type: 'DELETE_SYS_LOG', id: String(hit.payload ?? '') }],
      }
    case 'STRIKE_NODE':
      return {
        session,
        intents: [{ type: 'TOGGLE_TASK', id: String(hit.payload ?? '') }],
      }
    case 'PRIORITY':
      return {
        session: { ...session, priority: String(hit.payload) as TaskPriority, echo: null },
        intents: [],
      }
    case 'ATTACH':
      return { session: { ...session, mode: 'DUMP' }, intents: [{ type: 'ATTACH' }] }
    case 'COMMIT':
      return { session, intents: [] }
    case 'DOCK':
      return { session, intents: [] }
    default:
      return { session, intents: [] }
  }
}

export function commitLine(
  line: string,
  session: Session,
  snapshot: VaultSnapshot,
  now: Now,
): Result {
  const trimmed = line.trim()
  if (!trimmed) return { session: { ...session, buffer: '', echo: null }, intents: [] }
  if (isCommandLine(trimmed)) {
    const stmt = parseCommand(trimmed)
    if (stmt.kind === 'DATA') return commitData(session, now, stmt.text)
    return applyStmt(stmt, session, snapshot, now)
  }
  return commitData(session, now, trimmed)
}

export function contextLabel(session: Session, snapshot: VaultSnapshot, now: Now): string {
  if (session.mode === 'DAY') {
    const viewingNow = session.viewYear === now.year && session.viewMonth === now.month
    if (session.selectedDay != null || viewingNow) {
      const day = session.selectedDay ?? now.day
      return tapeDate(session.viewYear, session.viewMonth, day)
    }
    return `${String(session.viewMonth + 1).padStart(2, '0')}.??.${String(session.viewYear).slice(-2)}`
  }
  if (session.mode === 'NEST') {
    if (!session.nestId) return 'root/'
    return findNodePath(snapshot.tasks, session.nestId) ?? 'root/'
  }
  return 'scratch'
}
