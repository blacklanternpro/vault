import http from 'node:http'
import { isIP, type AddressInfo } from 'node:net'
import { eventsSince } from '../../src/model/doc.js'
import { AGENT_VERSION, DEFAULT_HOST, DEFAULT_MAX_BODY, DEFAULT_ORIGINS, DEFAULT_PORT, formatSize, normalizeOrigin } from './config.js'
import { envelopeOf, StoreError, unwrap, type FileStore } from './store.js'
import { bearerOf, tokenMatches } from './token.js'

/*
 * The bridge between the web app (whose board lives in the browser's
 * localStorage) and the file the agents work on. Plain Node http, loopback
 * only, JSON in and out:
 *
 *   GET    /doc               the board, as the export envelope (with `rev`, the write counter)
 *   PUT    /doc               replace the board. `base` (the rev your edit was based on) is
 *                             required: 428 without it, 409 + the current envelope when it
 *                             is not the current rev. 200 → { ok, savedAt, rev }
 *   GET    /events?since=ms   trail events after `since`, newest first
 *   GET    /inbox             reports from agents, oldest first, each with its `id`
 *   POST   /inbox             { text, taskId?, at? } → 201 { id, item }
 *   DELETE /inbox/:id         remove one by its id (a bare position is refused with 400)
 *   GET    /health            open: { app, version, authorized }; with the token also
 *                             { file, savedAt, rev, nodes, inbox }
 *
 * Every request is checked in this order, and refused before anything is read:
 *
 *   1. Host: must name this bridge (localhost, 127.0.0.1, [::1] or the bound
 *      address, at the bound port), else 421. A web page that rebinds its own
 *      name to 127.0.0.1 (DNS rebinding) sends its own name here.
 *   2. Origin: a request from a page must come from an allowed origin (by
 *      default only the Vite dev and preview servers; the live site only with
 *      --origin), else 403 naming the flag to add. Requests without an Origin
 *      (curl, scripts) pass this step.
 *   3. OPTIONS (the CORS preflight) is answered here, without the token.
 *   4. Token: `Authorization: Bearer <token>`, compared in constant time, else
 *      401. /health answers without it, but only { app, version, authorized: false }.
 *   5. Size: a body over the cap (5 MiB unless --max-body) is refused with 413,
 *      from its Content-Length when it has one, else as soon as it passes.
 */

export type BridgeOptions = {
  store: FileStore
  origins?: readonly string[]
  /** The bridge token, or a function that returns the current one (so a rotation takes effect without a restart). */
  token: string | (() => string)
  /** The largest request body read, in bytes. */
  maxBody?: number
  /** Request log; nothing is logged when left out. */
  log?: (line: string) => void
}

const METHODS = 'GET, PUT, POST, DELETE, OPTIONS'
const UNAUTHORIZED = 'missing or wrong bridge token. Run `vault-agent token` on this PC and open the link it prints (it hands the app the token), or send Authorization: Bearer <the token in the bridge-token file>.'

class HttpError extends Error {
  status: number
  body?: unknown
  headers?: Record<string, string>
  constructor(status: number, message: string, body?: unknown, headers?: Record<string, string>) {
    super(message)
    this.status = status
    this.body = body
    this.headers = headers
  }
}

function tooBig(max: number): HttpError {
  return new HttpError(413, `body over ${formatSize(max)}; start the bridge with --max-body <size> (e.g. 10mb) for a larger board`, undefined, { Connection: 'close' })
}

function readBody(req: http.IncomingMessage, max: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const declared = Number(req.headers['content-length'])
    if (Number.isFinite(declared) && declared > max) {
      req.resume() // discard what is on its way, so the client reads the 413 instead of a reset
      reject(tooBig(max))
      return
    }
    const chunks: Buffer[] = []
    let size = 0
    let over = false
    req.on('data', (chunk: Buffer) => {
      if (over) return
      size += chunk.length
      if (size > max) {
        over = true
        chunks.length = 0
        reject(tooBig(max))
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      if (!over) resolve(Buffer.concat(chunks).toString('utf8'))
    })
    req.on('error', reject)
  })
}

async function readJson(req: http.IncomingMessage, max: number): Promise<unknown> {
  const raw = await readBody(req, max)
  if (!raw.trim()) throw new HttpError(400, 'empty body; send JSON')
  try {
    return JSON.parse(raw)
  } catch {
    throw new HttpError(400, 'body is not valid JSON')
  }
}

/** Splits a Host header into name and port. `[::1]:7331` → ['::1', 7331]. */
function splitHost(host: string): [string, number | undefined] {
  const m = /^\[([^\]]+)\](?::(\d+))?$/.exec(host) ?? /^([^:]+)(?::(\d+))?$/.exec(host)
  if (!m) return ['', undefined]
  return [m[1].toLowerCase(), m[2] == null ? undefined : Number(m[2])]
}

const LOOPBACK_NAMES = new Set(['localhost', '127.0.0.1', '::1'])
const WILDCARD = new Set(['0.0.0.0', '::'])

/** True when the Host header names this server: a loopback name or the bound address, at the bound port. */
function hostAllowed(hostHeader: string | undefined, bound: AddressInfo | null): boolean {
  if (!hostHeader || !bound) return false
  const [name, port] = splitHost(hostHeader.trim())
  if (port !== bound.port) return false
  if (LOOPBACK_NAMES.has(name)) return true
  const addr = bound.address.toLowerCase()
  if (name === addr) return true
  // Bound to every interface (--host 0.0.0.0): any IP literal is a direct visit; only names can be rebound.
  return WILDCARD.has(addr) && isIP(name) !== 0
}

export function createBridge(opts: BridgeOptions): http.Server {
  const { store } = opts
  const allowed = new Set((opts.origins ?? DEFAULT_ORIGINS).map(normalizeOrigin))
  const currentToken = typeof opts.token === 'function' ? opts.token : () => opts.token as string
  const maxBody = opts.maxBody ?? DEFAULT_MAX_BODY
  const log = opts.log ?? (() => {})
  if (!currentToken()) throw new Error('the bridge needs a token')

  const handle = async (req: http.IncomingMessage, res: http.ServerResponse): Promise<{ status: number; body: unknown }> => {
    // 1. Host, before anything else (DNS rebinding).
    if (!hostAllowed(req.headers.host, server.address() as AddressInfo | null)) {
      throw new HttpError(421, `Host ${req.headers.host ?? '(none)'} is not this bridge; call it as http://127.0.0.1:${(server.address() as AddressInfo | null)?.port ?? ''} or http://localhost:<port>`)
    }

    const url = new URL(req.url ?? '/', 'http://localhost')
    const method = req.method ?? 'GET'
    const parts = url.pathname.replace(/\/+$/, '').split('/').filter(Boolean)

    // 2. Origin.
    const origin = req.headers.origin
    if (origin != null) {
      if (!allowed.has(normalizeOrigin(origin))) throw new HttpError(403, `origin ${origin} is not allowed; start the bridge with --origin ${origin.replace(/\/+$/, '')}`)
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Vary', 'Origin')
      res.setHeader('Access-Control-Allow-Methods', METHODS)
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      res.setHeader('Access-Control-Max-Age', '600')
      // Chrome asks before a public https page may reach localhost (Private Network Access).
      if (req.headers['access-control-request-private-network'] === 'true') res.setHeader('Access-Control-Allow-Private-Network', 'true')
    }
    // 3. The preflight carries no credentials by design.
    if (method === 'OPTIONS') return { status: 204, body: null }

    // 4. Token.
    const authorized = tokenMatches(currentToken(), bearerOf(req.headers.authorization))

    if (parts.length === 0 || (parts.length === 1 && parts[0] === 'health')) {
      if (method !== 'GET') throw new HttpError(405, 'method not allowed')
      if (!authorized) return { status: 200, body: { app: 'vault-agent', version: AGENT_VERSION, authorized: false } }
      const { savedAt, rev, doc } = store.read()
      return { status: 200, body: { app: 'vault-agent', version: AGENT_VERSION, authorized: true, file: store.file, savedAt, rev, nodes: doc.nodes.length, inbox: store.readInbox().length } }
    }

    if (!authorized) throw new HttpError(401, UNAUTHORIZED, undefined, { 'WWW-Authenticate': 'Bearer realm="vault-agent"' })

    if (parts.length === 1 && parts[0] === 'doc') {
      if (method === 'GET') {
        const { doc, savedAt, rev } = store.read()
        return { status: 200, body: envelopeOf(doc, savedAt, rev) }
      }
      if (method === 'PUT') {
        const incoming = await readJson(req, maxBody)
        let base: number | undefined
        try {
          base = unwrap(incoming).base
        } catch (err) {
          throw new HttpError(400, `not a VAULT document: ${(err as Error).message}`)
        }
        if (base === undefined) {
          throw new HttpError(428, 'send base: the rev your edit was based on, as { app, version, savedAt, base, doc }; GET /doc to read the current rev')
        }
        // Already validated above; anything store.put throws now is the file's trouble (500), not the sender's.
        const outcome = store.put(incoming)
        if (!outcome.ok) {
          throw new HttpError(409, 'the file has moved on since your base; take this one, merge, and try again', envelopeOf(outcome.current.doc, outcome.current.savedAt, outcome.current.rev))
        }
        return { status: 200, body: { ok: true, savedAt: outcome.snapshot.savedAt, rev: outcome.snapshot.rev } }
      }
      throw new HttpError(405, 'method not allowed')
    }

    if (parts.length === 1 && parts[0] === 'events') {
      if (method !== 'GET') throw new HttpError(405, 'method not allowed')
      const sinceRaw = url.searchParams.get('since')
      const since = sinceRaw == null || sinceRaw === '' ? 0 : Number(sinceRaw)
      if (!Number.isFinite(since) || since < 0) throw new HttpError(400, 'since must be a time in ms')
      const { doc, savedAt } = store.read()
      return { status: 200, body: { since, savedAt, events: eventsSince(doc, since) } }
    }

    if (parts[0] === 'inbox') {
      if (parts.length === 1 && method === 'GET') return { status: 200, body: { inbox: store.readInbox() } }
      if (parts.length === 1 && method === 'POST') {
        const body = await readJson(req, maxBody)
        if (!body || typeof body !== 'object') throw new HttpError(400, 'send { text, taskId? }')
        const b = body as Record<string, unknown>
        if (typeof b.text !== 'string' || !b.text.trim()) throw new HttpError(400, 'text is required')
        const taskId = b.taskId == null ? undefined : Number(b.taskId)
        if (taskId !== undefined && (!Number.isInteger(taskId) || taskId <= 0)) throw new HttpError(400, 'taskId must be a positive integer')
        const at = b.at == null ? undefined : Number(b.at)
        if (at !== undefined && !(Number.isFinite(at) && at > 0)) throw new HttpError(400, 'at must be a time in ms')
        const { item } = store.appendInbox({ text: b.text, taskId, at })
        return { status: 201, body: { id: item.id, item } }
      }
      if (parts.length === 2 && method === 'DELETE') {
        const key = decodeURIComponent(parts[1])
        // Positions went with audit 11: two removals at once could take the wrong item.
        if (/^\d+$/.test(key)) throw new HttpError(400, `inbox items are removed by id, not position; GET /inbox for the ids (got ${key})`)
        const removed = store.removeInboxById(key)
        if (!removed) throw new HttpError(404, `no inbox item ${key}`)
        return { status: 200, body: { removed, inbox: store.readInbox() } }
      }
      if (parts.length <= 2) throw new HttpError(405, 'method not allowed')
    }

    throw new HttpError(404, `no route ${method} ${url.pathname}`)
  }

  const server = http.createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    handle(req, res)
      .then(({ status, body }) => send(res, status, body))
      .catch((err: unknown) => {
        if (err instanceof HttpError) {
          for (const [k, v] of Object.entries(err.headers ?? {})) res.setHeader(k, v)
          send(res, err.status, err.body ?? { error: err.message })
        } else if (err instanceof StoreError) send(res, 500, { error: err.message })
        else send(res, 500, { error: (err as Error)?.message ?? 'internal error' })
      })
      .finally(() => {
        // A refused body that is still arriving: give the client a moment to read the answer, then hang up.
        if (!req.complete) {
          const hangUp = () => setTimeout(() => req.destroy(), 1000).unref()
          if (res.writableFinished) hangUp()
          else res.once('finish', hangUp)
        }
        log(`${req.method} ${req.url} ${res.statusCode}`)
      })
  })
  return server
}

function send(res: http.ServerResponse, status: number, body: unknown): void {
  if (status === 204 || body == null) {
    res.statusCode = status
    res.end()
    return
  }
  const text = JSON.stringify(body)
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Content-Length', Buffer.byteLength(text))
  res.end(text)
}

export type RunningBridge = { server: http.Server; host: string; port: number; url: string; close: () => Promise<void> }

export function startBridge(opts: BridgeOptions & { port?: number; host?: string }): Promise<RunningBridge> {
  const server = createBridge(opts)
  const host = opts.host ?? DEFAULT_HOST
  return new Promise((resolve, reject) => {
    server.once('error', reject)
    server.listen(opts.port ?? DEFAULT_PORT, host, () => {
      server.off('error', reject)
      const addr = server.address() as AddressInfo
      const shown = addr.address.includes(':') ? `[${addr.address}]` : addr.address
      resolve({
        server,
        host: addr.address,
        port: addr.port,
        url: `http://${shown}:${addr.port}`,
        close: () => new Promise<void>((done, fail) => server.close((err) => (err ? fail(err) : done()))),
      })
    })
  })
}
