import fs from 'node:fs'
import path from 'node:path'
import { sanitizeDoc } from '../../src/model/doc.js'
import type { Doc } from '../../src/model/types.js'

/*
 * The board on disk. One JSON file in the same envelope the web app exports
 * (`{ app: 'vault', version: 1, savedAt, doc }`), so an export can be dropped
 * in as-is and the file can be imported back into the browser.
 *
 *   - every write is atomic: temp file in the same directory, then rename;
 *   - the previous copy is kept as `vault.json.bak` before each write;
 *   - everything written has been through sanitizeDoc;
 *   - a read-modify-write holds a lock file, so the MCP process and the HTTP
 *     bridge cannot interleave their updates;
 *   - a file that cannot be read is never overwritten: it is parked under
 *     `vault.json.unreadable-<time>` first.
 *
 * Next to the board sits `inbox.json`: reports from agents, waiting for the
 * person to read them in the web app.
 */

export const ENVELOPE_VERSION = 1

export type Envelope = { app: 'vault'; version: number; savedAt: number; doc: Doc }
export type Snapshot = { doc: Doc; savedAt: number }
export type InboxItem = { at: number; taskId?: number; text: string }

export class StoreError extends Error {}

export function emptyDoc(): Doc {
  return sanitizeDoc({ nodes: [], notes: [], events: [] })
}

export function envelopeOf(doc: Doc, savedAt: number): Envelope {
  return { app: 'vault', version: ENVELOPE_VERSION, savedAt, doc }
}

/**
 * Reads an envelope or a bare doc out of parsed JSON. The doc comes back
 * sanitized; `savedAt` only when the envelope carried a usable one.
 */
export function unwrap(parsed: unknown): { doc: Doc; savedAt?: number } {
  if (!parsed || typeof parsed !== 'object') throw new StoreError('not a VAULT document')
  const obj = parsed as Record<string, unknown>
  if ('doc' in obj) {
    const doc = sanitizeDoc(obj.doc)
    const at = obj.savedAt
    return typeof at === 'number' && Number.isFinite(at) && at > 0 ? { doc, savedAt: Math.round(at) } : { doc }
  }
  return { doc: sanitizeDoc(parsed) }
}

export function parseEnvelope(raw: string): { doc: Doc; savedAt?: number } {
  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    throw new StoreError('not valid JSON')
  }
  return unwrap(parsed)
}

const LOCK_RETRY_MS = 15
const LOCK_WAIT_MS = 3000
const LOCK_STALE_MS = 10_000

function sleep(ms: number): void {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
}

export class FileStore {
  readonly file: string
  readonly dir: string
  readonly backupFile: string
  readonly inboxFile: string
  readonly lockFile: string

  constructor(file: string) {
    this.file = path.resolve(file)
    this.dir = path.dirname(this.file)
    this.backupFile = this.file + '.bak'
    this.inboxFile = path.join(this.dir, 'inbox.json')
    this.lockFile = this.file + '.lock'
  }

  exists(): boolean {
    return fs.existsSync(this.file)
  }

  /** The board as saved. A missing file reads as an empty board at time 0. */
  read(): Snapshot {
    let raw: string
    try {
      raw = fs.readFileSync(this.file, 'utf8')
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return { doc: emptyDoc(), savedAt: 0 }
      throw new StoreError(`cannot read ${this.file}: ${(err as Error).message}`)
    }
    try {
      const { doc, savedAt } = parseEnvelope(raw)
      return { doc, savedAt: savedAt ?? safeMtime(this.file) }
    } catch (err) {
      throw new StoreError(`${this.file} is not a readable VAULT file (${(err as Error).message}). Fix it or move it aside; nothing has been written over it.`)
    }
  }

  /** Writes the whole board. The doc is sanitized on the way through. */
  write(doc: Doc, savedAt = Date.now()): Snapshot {
    return this.locked(() => this.writeUnlocked(doc, savedAt))
  }

  /** Read, change, write — under the lock, so two processes cannot lose each other's changes. */
  update<T>(fn: (doc: Doc) => { doc: Doc; result: T }): { result: T; savedAt: number } {
    return this.locked(() => {
      const current = this.read()
      const { doc, result } = fn(current.doc)
      if (doc === current.doc) return { result, savedAt: current.savedAt }
      const written = this.writeUnlocked(doc, Date.now())
      return { result, savedAt: written.savedAt }
    })
  }

  /**
   * The bridge's PUT: replace the board with what the browser sent. An
   * envelope whose `savedAt` is older than the file's is refused, and the
   * caller answers 409 with the current board. A bare doc, or an envelope
   * without a usable `savedAt`, is taken as "now".
   */
  put(incoming: unknown): { ok: true; snapshot: Snapshot } | { ok: false; current: Snapshot } {
    const { doc, savedAt } = unwrap(incoming)
    return this.locked(() => {
      const current = this.read()
      if (savedAt != null && savedAt < current.savedAt) return { ok: false, current }
      return { ok: true, snapshot: this.writeUnlocked(doc, savedAt ?? Date.now()) }
    })
  }

  /* ------------------------------------------------------------------ inbox */

  readInbox(): InboxItem[] {
    let raw: string
    try {
      raw = fs.readFileSync(this.inboxFile, 'utf8')
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code === 'ENOENT') return []
      throw new StoreError(`cannot read ${this.inboxFile}: ${(err as Error).message}`)
    }
    try {
      const parsed: unknown = JSON.parse(raw)
      const list = Array.isArray(parsed) ? parsed : (parsed as { inbox?: unknown })?.inbox
      if (!Array.isArray(list)) return []
      const out: InboxItem[] = []
      for (const item of list) {
        if (!item || typeof item !== 'object') continue
        const it = item as Record<string, unknown>
        if (typeof it.text !== 'string') continue
        const entry: InboxItem = { at: typeof it.at === 'number' && Number.isFinite(it.at) ? Math.round(it.at) : 0, text: it.text }
        if (typeof it.taskId === 'number' && Number.isInteger(it.taskId) && it.taskId > 0) entry.taskId = it.taskId
        out.push(entry)
      }
      return out
    } catch {
      throw new StoreError(`${this.inboxFile} is not readable JSON; fix it or delete it.`)
    }
  }

  appendInbox(item: { text: string; taskId?: number; at?: number }): { index: number; item: InboxItem } {
    const text = item.text.trim()
    if (!text) throw new StoreError('an inbox item needs some text')
    const entry: InboxItem = { at: item.at && Number.isFinite(item.at) && item.at > 0 ? Math.round(item.at) : Date.now(), text }
    if (item.taskId != null && Number.isInteger(item.taskId) && item.taskId > 0) entry.taskId = item.taskId
    return this.locked(() => {
      const list = this.readInbox()
      list.push(entry)
      this.writeJson(this.inboxFile, { inbox: list })
      return { index: list.length - 1, item: entry }
    })
  }

  removeInbox(index: number): InboxItem | undefined {
    return this.locked(() => {
      const list = this.readInbox()
      if (!Number.isInteger(index) || index < 0 || index >= list.length) return undefined
      const [gone] = list.splice(index, 1)
      this.writeJson(this.inboxFile, { inbox: list })
      return gone
    })
  }

  /* --------------------------------------------------------------- plumbing */

  private writeUnlocked(doc: Doc, savedAt: number): Snapshot {
    const clean = sanitizeDoc(doc)
    const env = envelopeOf(clean, savedAt)
    this.backup()
    this.writeJson(this.file, env)
    return { doc: clean, savedAt }
  }

  /** The previous file becomes `.bak`; one that cannot be read is parked, never overwritten. */
  private backup(): void {
    if (!fs.existsSync(this.file)) return
    let readable = true
    try {
      parseEnvelope(fs.readFileSync(this.file, 'utf8'))
    } catch {
      readable = false
    }
    if (readable) fs.copyFileSync(this.file, this.backupFile)
    else fs.copyFileSync(this.file, `${this.file}.unreadable-${Date.now()}`)
  }

  private writeJson(file: string, value: unknown): void {
    fs.mkdirSync(path.dirname(file), { recursive: true })
    const tmp = `${file}.${process.pid}.${Date.now().toString(36)}.tmp`
    fs.writeFileSync(tmp, JSON.stringify(value, null, 2) + '\n')
    try {
      fs.renameSync(tmp, file)
    } catch (err) {
      try {
        fs.unlinkSync(tmp)
      } catch {
        /* the rename failed; the stray temp file is the lesser problem */
      }
      throw err
    }
  }

  private locked<T>(fn: () => T): T {
    fs.mkdirSync(this.dir, { recursive: true })
    const deadline = Date.now() + LOCK_WAIT_MS
    for (;;) {
      try {
        const fd = fs.openSync(this.lockFile, 'wx')
        fs.writeSync(fd, String(process.pid))
        fs.closeSync(fd)
        break
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'EEXIST') throw err
        if (safeMtime(this.lockFile) < Date.now() - LOCK_STALE_MS) {
          // Whoever held this is gone; take it over.
          try {
            fs.unlinkSync(this.lockFile)
          } catch {
            /* someone else just did */
          }
          continue
        }
        if (Date.now() > deadline) throw new StoreError(`${this.file} is locked by another vault-agent process (${this.lockFile}); try again`)
        sleep(LOCK_RETRY_MS)
      }
    }
    try {
      return fn()
    } finally {
      try {
        fs.unlinkSync(this.lockFile)
      } catch {
        /* already gone */
      }
    }
  }
}

function safeMtime(file: string): number {
  try {
    return Math.round(fs.statSync(file).mtimeMs)
  } catch {
    return 0
  }
}
