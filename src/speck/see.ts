import type { TaskNode, VaultSnapshot } from '../lib/vault-types'
import type { Session } from './ir'
import { tapeDate } from './ir'
import { MONTHS } from './tokens'

function walkStems(nodes: TaskNode[], parentPath: string, lines: string[], indent: string): void {
  for (const node of nodes) {
    const flags = node.priority === 'URGENT' ? ' URGENT' : node.completed ? ' STRIKE' : ''
    const path = parentPath ? `${parentPath}${node.text}` : node.text
    if (node.children.length === 0 && parentPath) {
      lines.push(`${indent}STEM ${node.text}${flags}`)
    } else {
      lines.push(`${indent}STEM ${node.text}${flags}`)
      walkStems(node.children, path.endsWith('/') ? path : `${path}/`, lines, `${indent}  `)
    }
  }
}

function findNodePath(nodes: TaskNode[], id: string, prefix = ''): string | null {
  for (const node of nodes) {
    const here = prefix + node.text
    if (node.id === id) return here
    const child = findNodePath(node.children, id, here.endsWith('/') ? here : `${here}/`)
    if (child) return child
  }
  return null
}

/** Compile snapshot + session back into dock-typable SPECK source. */
export function see(snapshot: VaultSnapshot, session: Session, now: { year: number; month: number; day: number }): string {
  const lines: string[] = ['SEAL reindustrialize']
  const month = MONTHS[session.viewMonth]
  const yy = String(session.viewYear).slice(-2)
  lines.push(`CAL cram ${month} '${yy}`)

  const mm = String(session.viewMonth + 1).padStart(2, '0')
  const byDay = new Map<number, string[]>()
  for (const log of snapshot.sysLogs) {
    const parts = log.date.split('.')
    if (parts.length !== 3) continue
    if (parts[0] !== mm || parts[2] !== yy) continue
    const day = Number(parts[1])
    const list = byDay.get(day) ?? []
    list.push(log.text)
    byDay.set(day, list)
  }
  const marked = new Set(snapshot.markedDays)
  const days = new Set<number>([...byDay.keys(), ...marked])
  for (const day of [...days].sort((a, b) => a - b)) {
    const chips = byDay.get(day) ?? []
    lines.push(`  DAY ${day} STRIKE`)
    for (const chip of chips) {
      lines.push(`  CHIP "${chip.replace(/"/g, '')}"`)
    }
  }

  for (const root of snapshot.tasks) {
    const flag = root.priority === 'URGENT' ? ' URGENT' : ''
    lines.push(`NEST ${root.text}${flag}`)
    walkStems(root.children, root.text.endsWith('/') ? root.text : `${root.text}/`, lines, '  ')
  }
  if (snapshot.tasks.length === 0) lines.push('NEST empty/')

  if (snapshot.notes.length === 0) {
    lines.push('DUMP _')
  } else {
    for (const note of snapshot.notes) {
      const text = note.text.replace(/"/g, '')
      lines.push(`DUMP ${note.date} "${text}"`)
    }
  }

  let ctx = 'scratch'
  if (session.mode === 'DAY') {
    const day = session.selectedDay ?? now.day
    ctx = tapeDate(session.viewYear, session.viewMonth, day)
  } else if (session.mode === 'NEST') {
    ctx = session.nestId ? (findNodePath(snapshot.tasks, session.nestId) ?? 'root/') : 'root/'
  }
  lines.push(`DOCK ${session.mode} ${ctx}`)
  lines.push('GRAIN')
  lines.push('SCAN')
  if (session.inv) lines.push('INV')
  return lines.join('\n')
}

export function findNodeByPath(nodes: TaskNode[], path: string): TaskNode | null {
  const parts = path.split('/').filter(Boolean)
  let level = nodes
  let found: TaskNode | null = null
  for (const part of parts) {
    const needle = part.endsWith('/') ? part : part
    found = level.find((n) => n.text.replace(/\/$/, '') === needle.replace(/\/$/, '')) ?? null
    if (!found) return null
    level = found.children
  }
  return found
}

export { findNodePath }
