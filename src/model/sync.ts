import { byId } from './doc'
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

export type AdoptNote =
  | { kind: 'take'; rev: number }
  | { kind: 'merge'; rev: number; doc: Doc; result: Pick<MergeResult, 'theirChanges' | 'conflicts'> }

/**
 * The notice for an outside copy taken in, in the voice of docs/VOICE.md §3.5
 * (G4): plain, lower-case, exact, no jokes about data. The way back
 * (`restore mine`) is the notice's action, not part of the text.
 */
export function adoptMessage(a: AdoptNote): string {
  if (a.kind === 'take') return `took vault-agent's copy (rev ${a.rev}). yours is in snapshots`
  const { theirChanges, conflicts } = a.result
  // Clashes where yours was kept, one per task or note, in the order met.
  const clashed = new Map<string, string>()
  for (const c of conflicts) {
    if (c.kept !== 'mine') continue
    const key = `${c.on}:${c.id}`
    if (!clashed.has(key)) clashed.set(key, c.on === 'node' ? byId(a.doc, c.id)?.title.trim() || '_' : 'a note')
  }
  if (clashed.size) {
    const [first] = clashed.values()
    const more = clashed.size > 1 ? ` and ${clashed.size - 1} more` : ''
    return `you and vault-agent both changed ${first}${more}. kept yours; theirs is in snapshots`
  }
  const n = theirChanges
  let text = n ? `merged ${n} change${n === 1 ? '' : 's'} from vault-agent (rev ${a.rev})` : `merged changes from vault-agent (rev ${a.rev})`
  const back = conflicts.filter((c: Conflict) => c.kept === 'theirs' && c.field === 'deleted').length
  if (back) text += ` · ${back} you deleted came back`
  return text
}
