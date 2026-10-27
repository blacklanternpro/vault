/**
 * The work graph. One tree, read three ways:
 *   depth 0  — a project (the folders of the directory, the filter in the top bar)
 *   depth 1  — a task (a card on the board, a plaque row in the directory)
 *   depth 2+ — a subtask (a tick line in the drawer, a [ ] line in the directory)
 * A subtask pulled onto the board is `loose`: it stays where it is in the tree
 * but gets a card of its own, cabled back to its parent.
 */

export const LANES = ['pending', 'rnd', 'active', 'done', 'dusted'] as const
export type Lane = (typeof LANES)[number]
/** Projects carry `none`; everything else sits in a lane. */
export type Status = Lane | 'none'

export const LANE_LABEL: Record<Lane, string> = {
  pending: 'PENDING',
  rnd: 'R&D',
  active: 'ACTIVE',
  done: 'DONE',
  dusted: 'DUSTED',
}

export type Node = {
  id: number
  title: string
  body?: string
  status: Status
  parent: number | null
  urgent?: boolean
  loose?: boolean
}

export type Note = {
  /** Stable identity, so a note keeps its own editor while the list changes. */
  id: string
  /** MM.DD.YY, the tape's own stamp. */
  date: string
  text: string
  /** A task this note is hitched to. */
  node?: number
}

/** Array order is sibling order: children render in the order they appear here. */
export type Doc = {
  nodes: Node[]
  notes: Note[]
}

export function isLane(value: unknown): value is Lane {
  return typeof value === 'string' && (LANES as readonly string[]).includes(value)
}

export function isStatus(value: unknown): value is Status {
  return value === 'none' || isLane(value)
}
