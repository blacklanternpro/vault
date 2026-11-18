import { BlobPreconditionFailedError, get, put } from '@vercel/blob'
import { sanitizeDoc } from '../src/model/doc.js'
import type { Doc } from '../src/model/types.js'

/*
 * The test board: one private JSON file. The envelope carries `rev`, a write
 * counter like vault-agent's; the store's own version check is the blob's
 * ETag (conditional write with `ifMatch`), which is what actually stops two
 * writers from overwriting each other. `rev` is for people and for the
 * board's own 409s later (Phase 3).
 */

export const BOARD_PATH = 'wire-spike/board.json'
export const MAX_BOARD_BYTES = 2 * 1024 * 1024

export type Envelope = { version: 1; rev: number; savedAt: number | null; doc: Doc }
export type Snapshot = Envelope & { etag: string | null }

export class ConflictError extends Error {}

export interface BoardStore {
  read(): Promise<Snapshot>
  /** Writes only if the stored copy still has `etag` (null: only if there is none yet). Throws ConflictError otherwise. */
  write(env: Envelope, etag: string | null): Promise<{ etag: string }>
}

const EMPTY: Doc = { nodes: [], notes: [], events: [] }

export function parseEnvelope(text: string): Envelope {
  const raw = JSON.parse(text) as { rev?: unknown; savedAt?: unknown; doc?: unknown }
  const rev = typeof raw.rev === 'number' && Number.isInteger(raw.rev) && raw.rev >= 0 ? raw.rev : 0
  const savedAt = typeof raw.savedAt === 'number' && Number.isFinite(raw.savedAt) ? raw.savedAt : null
  return { version: 1, rev, savedAt, doc: sanitizeDoc(raw.doc ?? EMPTY) }
}

export function serialize(env: Envelope): string {
  const text = JSON.stringify({ version: 1, rev: env.rev, savedAt: env.savedAt, doc: env.doc })
  if (Buffer.byteLength(text) > MAX_BOARD_BYTES) throw new Error('board would exceed the size cap')
  return text
}

/**
 * Read, apply, write; on a lost race re-read and re-apply (the change is a
 * function of the board, so applying it to the newer copy is correct).
 */
export async function updateBoard<T>(store: BoardStore, change: (doc: Doc) => { doc: Doc; result: T }, now: () => number = Date.now, attempts = 4): Promise<{ result: T; rev: number }> {
  let lastError: unknown
  for (let i = 0; i < attempts; i++) {
    const snap = await store.read()
    const { doc, result } = change(snap.doc)
    const env: Envelope = { version: 1, rev: snap.rev + 1, savedAt: now(), doc: sanitizeDoc(doc) }
    try {
      await store.write(env, snap.etag)
      return { result, rev: env.rev }
    } catch (err) {
      if (!(err instanceof ConflictError)) throw err
      lastError = err
    }
  }
  throw lastError instanceof Error ? lastError : new ConflictError('board kept changing; try again')
}

/**
 * Blob ETags are the content's MD5; a compressed response marks the same tag
 * weak (W/"md5"). ifMatch needs the strong form. If a weak tag ever meant
 * something else, the write is refused (a conflict), never let through.
 */
export function strongEtag(etag: string | null | undefined): string | null {
  if (!etag) return null
  return etag.startsWith('W/') ? etag.slice(2) : etag
}

/* ---------------------------------------------------------------- memory */

/** For tests: behaves like the blob store, ETags included. */
export class MemoryStore implements BoardStore {
  text: string | null = null
  etag: string | null = null
  private n = 0
  /** Runs once just before the next write lands, to simulate a racing writer. */
  beforeWrite: (() => void) | null = null

  async read(): Promise<Snapshot> {
    if (this.text == null) return { version: 1, rev: 0, savedAt: null, doc: sanitizeDoc(EMPTY), etag: null }
    return { ...parseEnvelope(this.text), etag: this.etag }
  }

  async write(env: Envelope, etag: string | null): Promise<{ etag: string }> {
    const hook = this.beforeWrite
    this.beforeWrite = null
    hook?.()
    if (etag !== this.etag) throw new ConflictError('stale write')
    this.text = serialize(env)
    this.etag = `"m${++this.n}"`
    return { etag: this.etag }
  }

  /** Direct write that bypasses the check, as another writer would. */
  force(env: Envelope) {
    this.text = serialize(env)
    this.etag = `"m${++this.n}"`
  }
}

/* ------------------------------------------------------------------ blob */

export class BlobStore implements BoardStore {
  constructor(
    readonly pathname = BOARD_PATH,
    private readonly token = process.env.BLOB_READ_WRITE_TOKEN,
  ) {
    if (!token) throw new Error('BLOB_READ_WRITE_TOKEN is not set')
  }

  async read(): Promise<Snapshot> {
    // Accept-Encoding: identity matters. A compressed read (br) answers with a weak
    // ETag, W/"…", and put({ ifMatch }) refuses a weak one with 412 every time.
    const got = await get(this.pathname, { access: 'private', useCache: false, token: this.token, headers: { 'Accept-Encoding': 'identity' } })
    if (!got) return { version: 1, rev: 0, savedAt: null, doc: sanitizeDoc(EMPTY), etag: null }
    if (got.statusCode !== 200) throw new Error(`unexpected blob status ${got.statusCode}`)
    const text = await new Response(got.stream).text()
    return { ...parseEnvelope(text), etag: strongEtag(got.blob.etag) }
  }

  async write(env: Envelope, etag: string | null): Promise<{ etag: string }> {
    const body = serialize(env)
    try {
      const res = await put(this.pathname, body, {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
        cacheControlMaxAge: 60,
        token: this.token,
        // First write: refuse if someone else created it meanwhile. Later writes: only over the copy we read.
        ...(etag ? { ifMatch: etag } : { allowOverwrite: false }),
      })
      return { etag: res.etag }
    } catch (err) {
      if (err instanceof BlobPreconditionFailedError) throw new ConflictError('the board changed since it was read')
      if (!etag && err instanceof Error && /already exists/i.test(err.message)) throw new ConflictError('the board was created meanwhile')
      throw err
    }
  }
}
