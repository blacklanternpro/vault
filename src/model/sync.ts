import { byId, sanitizeDoc } from './doc'
import { canonical, countChanges, merge, mergeFresh, sameDoc, type Conflict, type MergeResult } from './merge'
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
 * "Server changed" is decided by content, every contact: a rev can be reused
 * (vault.json restored from its .bak, the file deleted so the count starts
 * again, `serve` pointed at another --file), so the rev is only the `base` a
 * push names, never proof that nothing changed. A rev that moved with the
 * same board (another tab pushed the same thing) is just remembered.
 * Never stamp-and-win: a push always names the rev it was built on, and a 409
 * comes back through here as "both changed".
 *
 * With no agreed doc (first contact, or the browser lost it):
 *   the same board on both sides → agree;
 *   a browser that never saved   → take theirs (the sample board is not
 *                                  work), and never push the sample to an
 *                                  empty bridge: it stays empty until the
 *                                  person makes a board of their own;
 *   an empty bridge              → push mine;
 *   otherwise                    → union merge (`mergeFresh`): nothing either
 *                                  side has is dropped; deletes may come back.
 */

/** `at`: when this browser agreed on it (ms), so tabs sharing the stored base can tell whose is newer. */
export type Agreed = { rev: number; doc: Doc; at?: number }
export type Theirs = { rev: number; doc: Doc }

export type SyncPlan =
  | { act: 'none'; agreed: Agreed | null }
  | { act: 'push'; doc: Doc; base: number }
  | { act: 'take'; doc: Doc; rev: number; changes?: number }
  | { act: 'merge'; doc: Doc; rev: number; result: MergeResult }

function blank(doc: Doc): boolean {
  return doc.nodes.length === 0 && doc.notes.length === 0
}

export function planSync(agreed: Agreed | null, mine: Doc, theirs: Theirs, opts: { mineUnsaved?: boolean } = {}): SyncPlan {
  if (!agreed) {
    if (sameDoc(mine, theirs.doc)) return { act: 'none', agreed: { rev: theirs.rev, doc: theirs.doc } }
    if (opts.mineUnsaved) return blank(theirs.doc) ? { act: 'none', agreed: null } : { act: 'take', doc: theirs.doc, rev: theirs.rev }
    if (blank(theirs.doc)) return { act: 'push', doc: mine, base: theirs.rev }
    if (blank(mine)) return { act: 'take', doc: theirs.doc, rev: theirs.rev }
    const result = mergeFresh(mine, theirs.doc)
    return { act: 'merge', doc: result.doc, rev: theirs.rev, result }
  }
  const mineChanged = !sameDoc(mine, agreed.doc)
  const theirsChanged = !sameDoc(theirs.doc, agreed.doc)
  if (!mineChanged && !theirsChanged) return { act: 'none', agreed: theirs.rev === agreed.rev ? agreed : { ...agreed, rev: theirs.rev } }
  if (!theirsChanged) return { act: 'push', doc: mine, base: theirs.rev }
  if (!mineChanged) return { act: 'take', doc: theirs.doc, rev: theirs.rev, changes: countChanges(agreed.doc, theirs.doc) }
  const result = merge(agreed.doc, mine, theirs.doc)
  return { act: 'merge', doc: result.doc, rev: theirs.rev, result }
}

/**
 * A push went out but its answer never came back. Did it land? Yes when every
 * task and note it changed (from `agreed`) is in `theirs` exactly as pushed
 * (and every one it removed is gone), whatever else an agent wrote on top. If
 * any of them has changed again since, there is no telling: no, which costs
 * at most a duplicate; a wrong yes could drop work.
 */
export function pushLanded(agreed: Doc, pushed: Doc, theirs: Doc): boolean {
  let changed = 0
  const check = <K, T>(a: Map<K, T>, p: Map<K, T>, t: Map<K, T>): boolean => {
    for (const id of new Set([...a.keys(), ...p.keys()])) {
      const pv = p.get(id)
      if (canonical(a.get(id)) === canonical(pv)) continue
      changed++
      if (canonical(t.get(id)) !== canonical(pv)) return false
    }
    return true
  }
  const nodes = (d: Doc) => new Map(d.nodes.map((n) => [n.id, n]))
  const notes = (d: Doc) => new Map(d.notes.map((n) => [n.id, n]))
  // Compared as the file would hold them.
  const [a, p, t] = [sanitizeDoc(agreed), sanitizeDoc(pushed), sanitizeDoc(theirs)]
  return check(nodes(a), nodes(p), nodes(t)) && check(notes(a), notes(p), notes(t)) && changed > 0
}

export type AdoptNote =
  | { kind: 'take'; rev: number; snapshotted: boolean }
  | { kind: 'merge'; rev: number; doc: Doc; result: Pick<MergeResult, 'theirChanges' | 'conflicts'> }

/**
 * The notice for an outside copy taken in, in the voice of docs/VOICE.md §3.5
 * (G4): plain, lower-case, exact, no jokes about data. The way back
 * (`restore mine`) is the notice's action, not part of the text.
 */
export function adoptMessage(a: AdoptNote): string {
  if (a.kind === 'take') return `took vault-agent's copy (rev ${a.rev})${a.snapshotted ? '. yours is in snapshots' : ''}`
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
