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

export type Link = { label: string; url: string }

export type Node = {
  id: number
  title: string
  body?: string
  status: Status
  parent: number | null
  urgent?: boolean
  loose?: boolean
  /** Due date, ISO YYYY-MM-DD. */
  due?: string
  /** The one next action, shown on the card face. */
  next?: string
  /** Where you got to when you last left this task. */
  leftOff?: string
  /** Repo, deploy, client thread, design file. */
  links?: Link[]
  /** On tonight's shelf (at most three at a time; the shell enforces it). */
  tonight?: boolean
  /** Last time this task was touched, ms since epoch. Feeds "stale" and "since last time". */
  touched?: number
  /** Accumulated session time in seconds (session clock). */
  spent?: number
}

export const EVENT_KINDS = ['created', 'moved', 'ticked', 'renamed', 'deleted', 'note', 'leftoff', 'report', 'tonight', 'due', 'restored'] as const
export type EventKind = (typeof EVENT_KINDS)[number]

/** One line of the trail: something that happened to a task, or to the board. */
export type Event = {
  at: number
  kind: EventKind
  /** The task it happened to, when there is one. */
  node?: number
  text: string
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
  /** The trail, oldest first, capped at MAX_EVENTS. */
  events: Event[]
  /** When this board was last closed or left, ms since epoch. "Since last time" reads from here. */
  lastSeen?: number
}

export const MAX_EVENTS = 2000

export function isEventKind(value: unknown): value is EventKind {
  return typeof value === 'string' && (EVENT_KINDS as readonly string[]).includes(value)
}

export function isLane(value: unknown): value is Lane {
  return typeof value === 'string' && (LANES as readonly string[]).includes(value)
}

export function isStatus(value: unknown): value is Status {
  return value === 'none' || isLane(value)
}
