import http from 'node:http'
import type { AddressInfo } from 'node:net'
import { eventsSince } from '../../src/model/doc.js'
import { AGENT_VERSION, DEFAULT_HOST, DEFAULT_ORIGINS, DEFAULT_PORT } from './config.js'
import { envelopeOf, StoreError, type FileStore } from './store.js'

/*
 * The bridge between the web app (whose board lives in the browser's
 * localStorage) and the file the agents work on. Plain Node http, loopback
 * only, JSON in and out:
 *
 *   GET    /doc               the board, as the export envelope
 *   PUT    /doc               replace the board (envelope or bare doc); 409 when older than the file
 *   GET    /events?since=ms   trail events after `since`, newest first
 *   GET    /inbox             reports from agents, oldest first
 *   POST   /inbox             { text, taskId?, at? } → 201 with its index
 *   DELETE /inbox/:index      remove one
 *   GET    /health            who is serving what
 *
 * CORS: only the origins given (by default the Vite dev and preview servers)
 * may call from a page; a request that carries any other Origin is refused
 * with 403 before it touches the file. Requests without an Origin (curl,
 * scripts) are allowed.
 */

export type BridgeOptions = {
  store: FileStore
  origins?: readonly string[]
  /** Request log; nothing is logged when left out. */
  log?: (line: string) => void
}

const MAX_BODY = 32 * 1024 * 1024
const METHODS = 'GET, PUT, POST, DELETE, OPTIONS'

class HttpError extends Error {
  status: number
  body?: unknown
  constructor(status: number, message: string, body?: unknown) {
    super(message)
    this.status = status
    this.body = body
  }
}

function normalizeOrigin(o: string): string {
  return o.trim().replace(/\/+$/, '').toLowerCase()
}

function readBody(req: http.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    let size = 0
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY) {
        reject(new HttpError(413, `body over ${MAX_BODY} bytes`))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

async function readJson(req: http.IncomingMessage): Promise<unknown> {
  const raw = await readBody(req)
  if (!raw.trim()) throw new HttpError(400, 'empty body; send JSON')
  try {
    return JSON.parse(raw)
  } catch {
    throw new HttpError(400, 'body is not valid JSON')
  }
}

export function createBridge(opts: BridgeOptions): http.Server {
  const { store } = opts
  const allowed = new Set((opts.origins ?? DEFAULT_ORIGINS).map(normalizeOrigin))
  const log = opts.log ?? (() => {})

  const handle = async (req: http.IncomingMessage, res: http.ServerResponse): Promise<{ status: number; body: unknown }> => {
    const url = new URL(req.url ?? '/', 'http://localhost')
    const method = req.method ?? 'GET'
    const parts = url.pathname.replace(/\/+$/, '').split('/').filter(Boolean)

    const origin = req.headers.origin
    if (origin != null) {
      if (!allowed.has(normalizeOrigin(origin))) throw new HttpError(403, `origin ${origin} is not allowed; start the bridge with --origin ${origin}`)
      res.setHeader('Access-Control-Allow-Origin', origin)
      res.setHeader('Vary', 'Origin')
      res.setHeader('Access-Control-Allow-Methods', METHODS)
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
      res.setHeader('Access-Control-Max-Age', '600')
      // Chrome asks before a public https page may reach localhost (Private Network Access).
      if (req.headers['access-control-request-private-network'] === 'true') res.setHeader('Access-Control-Allow-Private-Network', 'true')
    }
    if (method === 'OPTIONS') return { status: 204, body: null }

    if (parts.length === 0 || (parts.length === 1 && parts[0] === 'health')) {
      if (method !== 'GET') throw new HttpError(405, 'method not allowed')
      const { savedAt, doc } = store.read()
      return { status: 200, body: { app: 'vault-agent', version: AGENT_VERSION, file: store.file, savedAt, nodes: doc.nodes.length, inbox: store.readInbox().length } }
    }

    if (parts.length === 1 && parts[0] === 'doc') {
      if (method === 'GET') {
        const { doc, savedAt } = store.read()
        return { status: 200, body: envelopeOf(doc, savedAt) }
      }
      if (method === 'PUT') {
        const incoming = await readJson(req)
        let outcome: ReturnType<FileStore['put']>
        try {
          outcome = store.put(incoming)
        } catch (err) {
          throw new HttpError(400, `not a VAULT document: ${(err as Error).message}`)
        }
        if (!outcome.ok) {
          throw new HttpError(409, 'the file has a newer save; take this one and try again', envelopeOf(outcome.current.doc, outcome.current.savedAt))
        }
        return { status: 200, body: { ok: true, savedAt: outcome.snapshot.savedAt } }
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
        const body = await readJson(req)
        if (!body || typeof body !== 'object') throw new HttpError(400, 'send { text, taskId? }')
        const b = body as Record<string, unknown>
        if (typeof b.text !== 'string' || !b.text.trim()) throw new HttpError(400, 'text is required')
        const taskId = b.taskId == null ? undefined : Number(b.taskId)
        if (taskId !== undefined && (!Number.isInteger(taskId) || taskId <= 0)) throw new HttpError(400, 'taskId must be a positive integer')
        const at = b.at == null ? undefined : Number(b.at)
        if (at !== undefined && !(Number.isFinite(at) && at > 0)) throw new HttpError(400, 'at must be a time in ms')
        const added = store.appendInbox({ text: b.text, taskId, at })
        return { status: 201, body: added }
      }
      if (parts.length === 2 && method === 'DELETE') {
        if (!/^\d+$/.test(parts[1])) throw new HttpError(400, 'index must be a whole number')
        const removed = store.removeInbox(Number(parts[1]))
        if (!removed) throw new HttpError(404, `no inbox item at ${parts[1]}`)
        return { status: 200, body: { removed, inbox: store.readInbox() } }
      }
      if (parts.length <= 2) throw new HttpError(405, 'method not allowed')
    }

    throw new HttpError(404, `no route ${method} ${url.pathname}`)
  }

  return http.createServer((req, res) => {
    res.setHeader('Cache-Control', 'no-store')
    handle(req, res)
      .then(({ status, body }) => send(res, status, body))
      .catch((err: unknown) => {
        if (err instanceof HttpError) send(res, err.status, err.body ?? { error: err.message })
        else if (err instanceof StoreError) send(res, 500, { error: err.message })
        else send(res, 500, { error: (err as Error)?.message ?? 'internal error' })
      })
      .finally(() => log(`${req.method} ${req.url} ${res.statusCode}`))
  })
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
