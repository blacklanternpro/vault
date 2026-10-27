import { sanitizeDoc } from './doc'
import { looksLikeSpeck, parseLegacy } from './legacy'
import { seedDoc } from './seed'
import type { Doc } from './types'

/*
 * Persistence. The board is one JSON document in localStorage, wrapped in a
 * versioned envelope. Around it:
 *   - rolling snapshots (at most one every ten minutes, last 30 kept),
 *   - first-run migration from the old SPECK text save, which is left untouched,
 *   - an unreadable save is set aside rather than overwritten, and the newest
 *     snapshot loads in its place,
 *   - export/import as a JSON file, which is the real backup: localStorage can
 *     be cleared by the browser along with everything in it.
 */

export const DOC_KEY = 'vault:doc'
export const BACKUP_KEY = 'vault:backups'
export const LEGACY_KEYS = ['speck-os-v2', 'speck-os-v1'] as const
const VERSION = 1
const BACKUP_EVERY_MS = 10 * 60 * 1000
const BACKUP_KEEP = 30

type Envelope = { app: 'vault'; version: number; savedAt: number; doc: Doc }
export type Backup = { at: number; doc: Doc }

export type LoadResult = {
  doc: Doc
  origin: 'saved' | 'migrated' | 'backup' | 'seed'
  /** Something the person should be told on load, or nothing. */
  notice?: string
  /**
   * The saved board could not be read and there was no room to set it aside,
   * so it is still sitting under its own key: the shell must not save over it
   * until the person says so.
   */
  holdSave?: boolean
}

function storage(): Storage | null {
  try {
    const s = window.localStorage
    s.getItem(DOC_KEY)
    return s
  } catch {
    return null
  }
}

function stamp(at: number): string {
  return new Date(at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
}

/** Reads a saved or exported document: an envelope, or a bare { nodes, notes }. Throws if it is neither. */
export function readDoc(raw: string): Doc {
  const parsed: unknown = JSON.parse(raw)
  if (parsed && typeof parsed === 'object' && 'doc' in parsed) return sanitizeDoc((parsed as Envelope).doc)
  return sanitizeDoc(parsed)
}

export function envelope(doc: Doc): string {
  const env: Envelope = { app: 'vault', version: VERSION, savedAt: Date.now(), doc }
  return JSON.stringify(env)
}

/* ----------------------------------------------------------------- backups */

export function listBackups(): Backup[] {
  const s = storage()
  if (!s) return []
  try {
    const raw = s.getItem(BACKUP_KEY)
    if (!raw) return []
    const list: unknown = JSON.parse(raw)
    if (!Array.isArray(list)) return []
    const out: Backup[] = []
    for (const item of list) {
      try {
        if (item && typeof item.at === 'number') out.push({ at: item.at, doc: sanitizeDoc(item.doc) })
      } catch {
        /* skip a damaged snapshot, keep the rest */
      }
    }
    return out.sort((a, b) => b.at - a.at)
  } catch {
    return []
  }
}

/** Newest snapshot time, kept under its own tiny key so the every-save check never parses the snapshots. */
const BACKUP_AT_KEY = 'vault:backups:at'

function latestSnapshotAt(s: Storage): number | null {
  const at = Number(s.getItem(BACKUP_AT_KEY))
  if (at > 0) return at
  try {
    const raw = s.getItem(BACKUP_KEY)
    const list: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(list) && typeof list[0]?.at === 'number' ? list[0].at : null
  } catch {
    return null
  }
}

function writeBackups(s: Storage, list: Backup[]): void {
  let keep = list.slice(0, BACKUP_KEEP)
  while (keep.length) {
    try {
      s.setItem(BACKUP_KEY, JSON.stringify(keep))
      s.setItem(BACKUP_AT_KEY, String(keep[0].at))
      return
    } catch {
      // Out of room: drop the oldest half of the snapshots and try again.
      keep = keep.slice(0, Math.floor(keep.length / 2))
    }
  }
  s.removeItem(BACKUP_KEY)
  s.removeItem(BACKUP_AT_KEY)
}

/**
 * Snapshots are the one thing of ours that can give way when storage is full.
 * Drops the oldest half (then half again) until `attempt` succeeds. False if
 * even with no snapshots left it does not.
 */
function makeRoom(s: Storage, attempt: () => void): boolean {
  let list = listBackups()
  for (;;) {
    try {
      attempt()
      return true
    } catch {
      if (!list.length) return false
      list = list.slice(0, Math.floor(list.length / 2))
      writeBackups(s, list)
    }
  }
}

/** Snapshots the doc, unless one was taken in the last ten minutes (or `force`). */
export function snapshot(doc: Doc, force = false): void {
  const s = storage()
  if (!s || doc.nodes.length + doc.notes.length === 0) return
  const at = latestSnapshotAt(s)
  if (!force && at != null && Date.now() - at < BACKUP_EVERY_MS) return
  const list = listBackups()
  const latest = list[0]
  if (latest && JSON.stringify(latest.doc) === JSON.stringify(doc)) return
  writeBackups(s, [{ at: Date.now(), doc }, ...list])
}

/* -------------------------------------------------------------- load / save */

export function load(): LoadResult {
  const s = storage()
  if (!s) {
    return {
      doc: seedDoc(),
      origin: 'seed',
      notice: "This browser won't let VAULT save. Changes last until the tab closes — use Export to keep them.",
    }
  }

  const raw = s.getItem(DOC_KEY)
  if (raw != null) {
    try {
      const doc = readDoc(raw)
      snapshot(doc)
      return { doc, origin: 'saved' }
    } catch {
      // Never overwrite what we could not read: park it (making room if we must), then fall back to the newest snapshot.
      const latest = listBackups()[0]
      const parked = makeRoom(s, () => s.setItem(`vault:unreadable:${Date.now()}`, raw))
      const kept = parked
        ? 'The unreadable copy has been kept aside.'
        : "Browser storage is too full to set the unreadable copy aside, so VAULT won't save over it until you say so. Export a copy of this board first."
      if (latest) {
        return {
          doc: latest.doc,
          origin: 'backup',
          notice: `Your saved board couldn't be read, so the snapshot from ${stamp(latest.at)} was loaded. ${kept}`,
          holdSave: !parked,
        }
      }
      return {
        doc: seedDoc(),
        origin: 'seed',
        notice: `Your saved board couldn't be read and there was no snapshot to fall back on. ${kept}`,
        holdSave: !parked,
      }
    }
  }

  for (const key of LEGACY_KEYS) {
    const legacy = s.getItem(key)
    if (!legacy || !looksLikeSpeck(legacy)) continue
    const doc = parseLegacy(legacy)
    if (doc.nodes.length === 0) continue
    snapshot(doc, true)
    return {
      doc,
      origin: 'migrated',
      notice: `Brought across ${doc.nodes.length} items and ${doc.notes.length} notes from the old save. The old save is left as it was.`,
    }
  }

  return { doc: seedDoc(), origin: 'seed' }
}

/** Writes the doc. Returns false when the browser refused, so the shell can say so. */
export function save(doc: Doc): boolean {
  const s = storage()
  if (!s) return false
  const body = envelope(doc)
  // The board always wins over old snapshots for space.
  if (!makeRoom(s, () => s.setItem(DOC_KEY, body))) return false
  try {
    snapshot(doc)
  } catch {
    /* a snapshot that does not fit is not worth failing a save over */
  }
  return true
}

/** Calls back when another tab saves, with the doc it saved. */
export function subscribe(onChange: (doc: Doc) => void): () => void {
  const handler = (e: StorageEvent) => {
    if (e.key !== DOC_KEY || e.newValue == null) return
    try {
      onChange(readDoc(e.newValue))
    } catch {
      /* the other tab wrote something we cannot read; keep what we have */
    }
  }
  window.addEventListener('storage', handler)
  return () => window.removeEventListener('storage', handler)
}

/* ---------------------------------------------------------- export / import */

export function exportFileName(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0')
  return `vault-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.json`
}

export function exportText(doc: Doc): string {
  const env: Envelope = { app: 'vault', version: VERSION, savedAt: Date.now(), doc }
  return JSON.stringify(env, null, 2)
}

/** Accepts a VAULT export, a bare doc, or an old SPECK text save. */
export function importText(text: string): Doc {
  const trimmed = text.trim()
  if (trimmed.startsWith('{')) return readDoc(trimmed)
  if (looksLikeSpeck(trimmed)) return parseLegacy(trimmed)
  throw new Error("That file isn't a VAULT export or an old SPECK save.")
}
