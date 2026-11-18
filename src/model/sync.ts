import { countChanges, merge, mergeFresh, sameDoc, type Conflict, type MergeResult } from './merge'
import type { Doc } from './types'

/*
 * What to do on one contact with the agent bridge. Pure: the shell does the
 * talking (src/shell/bridgeSync.ts); this decides.
 *
 * The browser keeps `agreed`: the last doc both sides had, and the server rev
 * it was at. Every contact (first, every poll, every reconnect, every local
 * change) compares both sides against it, by rev and by content:
 *
 *   server unchanged, mine unchanged → nothing;
 *   server unchanged, mine changed   → push mine, `base` = their rev;
 *   server changed,   mine unchanged → take theirs;
 *   both changed                      → three-way merge against `agreed`,
 *                                       push the merge with `base` = their rev.
 *
 * "Server changed" means a new rev AND different content: a rev that moved
 * with the same board (another tab pushed the same thing) is just remembered.
 * Never stamp-and-win: a push always names the rev it was built on, and a 409
 * comes back through here as "both changed".
 *
 * With no agreed doc (first contact, or the browser lost it):
 *   the same board on both sides → agree;
 *   an empty bridge              → push mine;
 *   a browser that never saved   → take theirs (the sample board is not work);
 *   otherwise                    → union merge (`mergeFresh`): nothing either
 *                                  side has is dropped; deletes may come back.
 */

export type Agreed = { rev: number; doc: Doc }
export type Theirs = { rev: number; doc: Doc }

export type SyncPlan =
  | { act: 'none'; agreed: Agreed }
  | { act: 'push'; doc: Doc; base: number }
  | { act: 'take'; doc: Doc; rev: number; changes?: number }
  | { act: 'merge'; doc: Doc; rev: number; result: MergeResult }

function blank(doc: Doc): boolean {
  return doc.nodes.length === 0 && doc.notes.length === 0
}

export function planSync(agreed: Agreed | null, mine: Doc, theirs: Theirs, opts: { mineUnsaved?: boolean } = {}): SyncPlan {
  if (!agreed) {
    if (sameDoc(mine, theirs.doc)) return { act: 'none', agreed: { rev: theirs.rev, doc: theirs.doc } }
    if (blank(theirs.doc)) return { act: 'push', doc: mine, base: theirs.rev }
    if (opts.mineUnsaved || blank(mine)) return { act: 'take', doc: theirs.doc, rev: theirs.rev }
    const result = mergeFresh(mine, theirs.doc)
    return { act: 'merge', doc: result.doc, rev: theirs.rev, result }
  }
  const mineChanged = !sameDoc(mine, agreed.doc)
  const theirsChanged = theirs.rev !== agreed.rev && !sameDoc(theirs.doc, agreed.doc)
  if (!mineChanged && !theirsChanged) return { act: 'none', agreed: theirs.rev === agreed.rev ? agreed : { rev: theirs.rev, doc: agreed.doc } }
  if (!theirsChanged) return { act: 'push', doc: mine, base: theirs.rev }
  if (!mineChanged) return { act: 'take', doc: theirs.doc, rev: theirs.rev, changes: countChanges(agreed.doc, theirs.doc) }
  const result = merge(agreed.doc, mine, theirs.doc)
  return { act: 'merge', doc: result.doc, rev: theirs.rev, result }
}

/** The toast for an outside copy taken in. Plain, lower-case, honest. */
export function adoptMessage(a: { kind: 'take'; changes?: number } | { kind: 'merge'; result: Pick<MergeResult, 'theirChanges' | 'conflicts'> }): string {
  const edits = (n: number) => `${n} agent edit${n === 1 ? '' : 's'}`
  if (a.kind === 'take') return a.changes ? `took ${edits(a.changes)}.` : "took the agent's board."
  const { theirChanges, conflicts } = a.result
  let text = theirChanges ? `merged ${edits(theirChanges)} with yours.` : "merged the agent's changes with yours."
  const clashes = conflicts.filter((c: Conflict) => c.kept === 'mine').length
  const back = conflicts.filter((c: Conflict) => c.kept === 'theirs' && c.field === 'deleted').length
  if (clashes) text += ` ${clashes} clash${clashes === 1 ? '' : 'es'}, kept yours.`
  if (back) text += ` ${back} thing${back === 1 ? '' : 's'} you deleted came back (the agent changed ${back === 1 ? 'it' : 'them'}).`
  return text
}
