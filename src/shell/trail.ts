import { byId, cardOf, logEvent, updateNode } from '../model/doc'
import { LANE_LABEL, type Doc, type Event, type EventKind, type Lane } from '../model/types'

/*
 * The trail is written at every mutation site in the Studio, after the change
 * and inside the same commit, so an undo takes the line back with the change.
 * Each line is logged against the card it happened on — a subtask's tick goes
 * on its card — and stamps that card `touched`, which is what "stale" reads.
 */

/** A card untouched this long is gathering dust. */
export const STALE_DAYS = 14
/** The weekly review calls a card stuck after this long. */
export const STUCK_DAYS = 7
/** Tonight's shelf holds this many. */
export const TONIGHT_MAX = 3

/** The card a change is written against: the node itself when it is one, else the card it sits in. */
export function cardIdOf(doc: Doc, id: number): number {
  return cardOf(doc, id)?.id ?? id
}

/** One line on the trail, with the card it belongs to stamped as touched now. */
export function stamp(doc: Doc, id: number, kind: EventKind, text: string, at = Date.now()): Doc {
  const target = cardIdOf(doc, id)
  const touched = byId(doc, target) ? updateNode(doc, target, { touched: at }) : doc
  return logEvent(touched, kind, text, byId(touched, target) ? target : undefined, at)
}

/** A line about the board rather than any one card (a delete, say). */
export function note(doc: Doc, kind: EventKind, text: string, at = Date.now()): Doc {
  return logEvent(doc, kind, text, undefined, at)
}

export function laneArrow(lane: Lane): string {
  return `→ ${LANE_LABEL[lane]}`
}

export function quoted(title: string): string {
  return `“${title.trim() || '_'}”`
}

/** The event as a sentence: the card's name and what happened to it, or just what happened when the card is gone. */
export function eventLine(doc: Doc, e: Event): string {
  const title = e.node != null ? byId(doc, e.node)?.title.trim() : undefined
  return title ? `${title} ${e.text}` : e.text
}
