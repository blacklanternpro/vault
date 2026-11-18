import { sanitizeDoc } from './doc'
import type { Doc } from './types'

/*
 * The browser side of the local agent bridge. `vault-agent serve` keeps the
 * board in a file on disk and offers it over http://localhost:7331; agents
 * (MCP, CLI) write to that file. This module pulls that copy, pushes ours,
 * and reads the inbox of reports agents have left. The shell decides when.
 *
 * Conflict rule (Phase 1 contract, mirrors the server): the server's board
 * carries `rev`, a write counter. A push names the rev it was based on
 * (`base`); anything but the current rev is refused with 409 and the server's
 * envelope. What the caller does with a refusal (merge, snapshot, "restore
 * mine") is G1's.
 *
 * Auth (Phase 1 contract, G3): when the settings carry a `token`, every
 * request sends `Authorization: Bearer <token>`. `vault-agent serve` prints
 * a link that hands the app its token as `#bridge-token=<token>`.
 */

export const DEFAULT_BRIDGE_URL = 'http://localhost:7331'
export const BRIDGE_KEY = 'vault:bridge'

export type BridgeSettings = { enabled: boolean; url: string; token?: string }

/** Where to reach the bridge: a bare URL, or a URL with the bridge's token. */
export type BridgeTarget = string | { url: string; token?: string }

export type Envelope = { app: 'vault'; version: number; savedAt: number; rev?: number; doc: Doc }

/** `id` is set by vault-agent; removal is by id. */
export type InboxEntry = { id?: string; at: number; taskId?: number; text: string }

export type PullResult = { doc: Doc; savedAt: number; rev: number }

export type PushResult =
  | { ok: true; savedAt: number; rev?: number }
  | { ok: false; conflict: true; doc: Doc; savedAt: number; rev: number }
  | { ok: false; conflict: false; error: string }

export function readBridgeSettings(): BridgeSettings {
  try {
    const raw = localStorage.getItem(BRIDGE_KEY)
    if (!raw) return { enabled: false, url: DEFAULT_BRIDGE_URL }
    const parsed = JSON.parse(raw) as Partial<BridgeSettings>
    const out: BridgeSettings = { enabled: parsed.enabled === true, url: typeof parsed.url === 'string' && parsed.url.trim() ? parsed.url.trim() : DEFAULT_BRIDGE_URL }
    if (typeof parsed.token === 'string' && parsed.token.trim()) out.token = parsed.token.trim()
    return out
  } catch {
    return { enabled: false, url: DEFAULT_BRIDGE_URL }
  }
}

export function writeBridgeSettings(settings: BridgeSettings): void {
  try {
    localStorage.setItem(BRIDGE_KEY, JSON.stringify(settings))
  } catch {
    /* private mode */
  }
}

function base(target: BridgeTarget): string {
  return (typeof target === 'string' ? target : target.url).replace(/\/+$/, '')
}

function auth(target: BridgeTarget, headers: Record<string, string> = {}): Record<string, string> {
  const token = typeof target === 'string' ? undefined : target.token
  return token ? { ...headers, authorization: `Bearer ${token}` } : headers
}

async function withTimeout<T>(run: (signal: AbortSignal) => Promise<T>, ms = 4000): Promise<T> {
  const ctl = new AbortController()
  const t = setTimeout(() => ctl.abort(), ms)
  try {
    return await run(ctl.signal)
  } finally {
    clearTimeout(t)
  }
}

function parseEnvelope(raw: unknown): PullResult {
  if (raw && typeof raw === 'object' && 'doc' in raw) {
    const env = raw as Partial<Envelope>
    const rev = typeof env.rev === 'number' && Number.isInteger(env.rev) && env.rev >= 0 ? env.rev : 0
    return { doc: sanitizeDoc(env.doc), savedAt: typeof env.savedAt === 'number' ? env.savedAt : 0, rev }
  }
  return { doc: sanitizeDoc(raw), savedAt: 0, rev: 0 }
}

/** True when the bridge answers at all. Never throws. */
export async function ping(url: BridgeTarget): Promise<boolean> {
  try {
    const r = await withTimeout((signal) => fetch(`${base(url)}/doc`, { method: 'HEAD', headers: auth(url), signal }), 1500)
    if (r.ok || r.status === 405) return true
    const g = await withTimeout((signal) => fetch(`${base(url)}/doc`, { headers: auth(url), signal }), 1500)
    return g.ok
  } catch {
    return false
  }
}

export async function pullDoc(url: BridgeTarget): Promise<PullResult> {
  const r = await withTimeout((signal) => fetch(`${base(url)}/doc`, { headers: auth(url), signal }))
  if (!r.ok) throw new Error(`bridge: GET /doc ${r.status}`)
  return parseEnvelope(await r.json())
}

/** `base` is the server rev this doc was edited from; leave it out only for a legacy push. */
export async function pushDoc(url: BridgeTarget, doc: Doc, savedAt = Date.now(), baseRev?: number): Promise<PushResult> {
  const body: Envelope & { base?: number } = { app: 'vault', version: 1, savedAt, doc }
  if (baseRev !== undefined) body.base = baseRev
  try {
    const r = await withTimeout((signal) =>
      fetch(`${base(url)}/doc`, { method: 'PUT', headers: auth(url, { 'content-type': 'application/json' }), body: JSON.stringify(body), signal }),
    )
    if (r.status === 409) {
      const theirs = parseEnvelope(await r.json())
      return { ok: false, conflict: true, doc: theirs.doc, savedAt: theirs.savedAt, rev: theirs.rev }
    }
    if (!r.ok) return { ok: false, conflict: false, error: `bridge: PUT /doc ${r.status}` }
    let rev: number | undefined
    try {
      const ack = (await r.json()) as { rev?: unknown }
      if (typeof ack?.rev === 'number') rev = ack.rev
    } catch {
      /* an empty or non-JSON 200 is still a success */
    }
    return rev === undefined ? { ok: true, savedAt } : { ok: true, savedAt, rev }
  } catch (err) {
    return { ok: false, conflict: false, error: err instanceof Error ? err.message : 'bridge: unreachable' }
  }
}

export async function pullInbox(url: BridgeTarget): Promise<InboxEntry[]> {
  const r = await withTimeout((signal) => fetch(`${base(url)}/inbox`, { headers: auth(url), signal }))
  if (!r.ok) return []
  const body: unknown = await r.json()
  // vault-agent answers { inbox: [...] }; a bare list is accepted too.
  const list: unknown = body && typeof body === 'object' && !Array.isArray(body) ? (body as { inbox?: unknown }).inbox : body
  if (!Array.isArray(list)) return []
  return list
    .filter((e): e is InboxEntry => Boolean(e) && typeof e === 'object' && typeof (e as InboxEntry).text === 'string')
    .map((e) => ({
      ...(typeof e.id === 'string' && e.id ? { id: e.id } : {}),
      at: typeof e.at === 'number' ? e.at : Date.now(),
      text: e.text,
      ...(typeof e.taskId === 'number' ? { taskId: e.taskId } : {}),
    }))
}

/** Removes one inbox entry by its id (a number is the legacy position, kept for old agents). */
export async function removeInbox(url: BridgeTarget, idOrIndex: string | number): Promise<boolean> {
  try {
    const r = await withTimeout((signal) => fetch(`${base(url)}/inbox/${encodeURIComponent(String(idOrIndex))}`, { method: 'DELETE', headers: auth(url), signal }))
    return r.ok
  } catch {
    return false
  }
}

/**
 * Three-way-free merge rule for a pull: the newer `savedAt` wins outright.
 * Agents and the browser never edit the same task at the same instant in
 * practice, and the trail keeps whatever one side did; a real merge would
 * need per-node clocks and is not worth it for one person.
 */
export function newer(mine: { savedAt: number }, theirs: { savedAt: number }): 'mine' | 'theirs' | 'same' {
  if (mine.savedAt === theirs.savedAt) return 'same'
  return mine.savedAt > theirs.savedAt ? 'mine' : 'theirs'
}
