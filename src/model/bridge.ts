import { sanitizeDoc } from './doc'
import type { Agreed } from './sync'
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
 * envelope. What the caller does with a refusal is in ./sync.ts (decide) and
 * src/shell/bridgeSync.ts (do): merge, snapshot, "restore mine".
 *
 * The last doc both sides agreed on (and its rev) is kept under
 * `vault:bridge-base`, so a reload can still merge rather than guess.
 *
 * Auth (Phase 1 contract, G3): when the settings carry a `token`, every
 * request sends `Authorization: Bearer <token>`. `vault-agent serve` prints
 * a link that hands the app its token as `#bridge-token=<token>`.
 */

export const DEFAULT_BRIDGE_URL = 'http://localhost:7331'
export const BRIDGE_KEY = 'vault:bridge'
export const BRIDGE_BASE_KEY = 'vault:bridge-base'

/** The bridge answered 401 or 403: the token is missing or wrong. */
export class BridgeAuthError extends Error {}

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
  | { ok: false; conflict: false; error: string; auth?: true }

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

/**
 * Is the bridge there, and does it take our token? `GET /health` answers
 * without a token (vault-agent from Phase 1 says `authorized: false` then);
 * an older agent that says nothing about it counts as authorized. Never throws.
 */
export async function bridgeHealth(url: BridgeTarget): Promise<{ up: boolean; authorized: boolean }> {
  try {
    const r = await withTimeout((signal) => fetch(`${base(url)}/health`, { headers: auth(url), signal }), 1500)
    if (r.status === 401 || r.status === 403) return { up: true, authorized: false }
    if (!r.ok) return { up: true, authorized: true }
    let body: unknown = null
    try {
      body = await r.json()
    } catch {
      /* not JSON: something answered */
    }
    const said = body && typeof body === 'object' ? (body as { authorized?: unknown }).authorized : undefined
    return { up: true, authorized: said !== false }
  } catch {
    return { up: false, authorized: false }
  }
}

/** True when the bridge answers at all. Never throws. */
export async function ping(url: BridgeTarget): Promise<boolean> {
  return (await bridgeHealth(url)).up
}

export async function pullDoc(url: BridgeTarget): Promise<PullResult> {
  const r = await withTimeout((signal) => fetch(`${base(url)}/doc`, { headers: auth(url), signal }))
  if (r.status === 401 || r.status === 403) throw new BridgeAuthError(`bridge: GET /doc ${r.status}`)
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
    if (r.status === 401 || r.status === 403) return { ok: false, conflict: false, error: `bridge: PUT /doc ${r.status}`, auth: true }
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

/** Removes one inbox entry by its id. Never by position: two removals at once could take the wrong one. */
export async function removeInbox(url: BridgeTarget, id: string): Promise<boolean> {
  try {
    const r = await withTimeout((signal) => fetch(`${base(url)}/inbox/${encodeURIComponent(id)}`, { method: 'DELETE', headers: auth(url), signal }))
    return r.ok
  } catch {
    return false
  }
}

/** Legacy (before Phase 1): the newer `savedAt` wins. The bridge no longer decides by this; see ./sync.ts. */
export function newer(mine: { savedAt: number }, theirs: { savedAt: number }): 'mine' | 'theirs' | 'same' {
  if (mine.savedAt === theirs.savedAt) return 'same'
  return mine.savedAt > theirs.savedAt ? 'mine' : 'theirs'
}

/* ------------------------------------------------------- the agreed base */

/** The last doc this browser and the bridge at `url` both had, and its rev; null when there is none. */
export function readBridgeBase(url: string): Agreed | null {
  try {
    const raw = localStorage.getItem(BRIDGE_BASE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { url?: unknown; rev?: unknown; doc?: unknown; at?: unknown }
    if (parsed.url !== url || typeof parsed.rev !== 'number' || !Number.isInteger(parsed.rev)) return null
    const out: Agreed = { rev: parsed.rev, doc: sanitizeDoc(parsed.doc) }
    if (typeof parsed.at === 'number' && Number.isFinite(parsed.at)) out.at = parsed.at
    return out
  } catch {
    return null
  }
}

/** Keeps the agreed base, with when it was agreed (`at`, now if not given), so other tabs can tell whose is newer. */
export function writeBridgeBase(url: string, agreed: Agreed | null): void {
  try {
    if (!agreed) localStorage.removeItem(BRIDGE_BASE_KEY)
    else localStorage.setItem(BRIDGE_BASE_KEY, JSON.stringify({ url, rev: agreed.rev, at: agreed.at ?? Date.now(), doc: agreed.doc }))
  } catch {
    /* full or private: the base still lives in memory for this tab */
  }
}

/* ---------------------------------------------------- the token hand-off */

const TOKEN_PART = 'bridge-token='

/** Takes `bridge-token=<token>` out of a location hash; the rest of the hash is kept as it was. */
export function splitBridgeToken(hash: string): { token: string | null; hash: string } {
  const body = hash.startsWith('#') ? hash.slice(1) : hash
  if (!body) return { token: null, hash: '' }
  const parts = body.split('&')
  const at = parts.findIndex((p) => p.startsWith(TOKEN_PART))
  if (at < 0) return { token: null, hash }
  let token: string | null = null
  try {
    const value = decodeURIComponent(parts[at].slice(TOKEN_PART.length))
    if (/^[\x21-\x7e]{1,512}$/.test(value)) token = value
  } catch {
    /* malformed: strip it, keep nothing */
  }
  const rest = parts.filter((_, i) => i !== at).filter(Boolean)
  return { token, hash: rest.length ? `#${rest.join('&')}` : '' }
}

type Loc = { hash: string; pathname: string; search: string }
type Hist = { state: unknown; replaceState: (state: unknown, unused: string, url: string) => void }

/**
 * On load: a link from `vault-agent serve` carries `#bridge-token=<token>`.
 * The token goes into the bridge settings (the bridge stays off if it was
 * off: the person turns it on) and out of the address bar, so it is not left
 * in history or a shared screenshot. Returns the token taken, or null.
 */
export function intakeBridgeToken(loc: Loc, hist: Hist): string | null {
  if (!loc.hash.includes(TOKEN_PART)) return null
  const { token, hash } = splitBridgeToken(loc.hash)
  if (token) writeBridgeSettings({ ...readBridgeSettings(), token })
  try {
    hist.replaceState(hist.state, '', `${loc.pathname}${loc.search}${hash}`)
  } catch {
    /* a sandboxed frame: the token is stored either way */
  }
  return token
}
