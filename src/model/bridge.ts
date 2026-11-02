import { sanitizeDoc } from './doc'
import type { Doc } from './types'

/*
 * The browser side of the local agent bridge. `vault-agent serve` keeps the
 * board in a file on disk and offers it over http://localhost:7331; agents
 * (MCP, CLI) write to that file. This module pulls that copy, pushes ours,
 * and reads the inbox of reports agents have left. The shell decides when.
 *
 * Conflict rule (mirrors the server): every doc carries `savedAt`; a push
 * older than what the server holds is refused with 409 and the server's doc,
 * which the caller then adopts.
 */

export const DEFAULT_BRIDGE_URL = 'http://localhost:7331'
export const BRIDGE_KEY = 'vault:bridge'

export type BridgeSettings = { enabled: boolean; url: string }

export type Envelope = { app: 'vault'; version: number; savedAt: number; doc: Doc }

export type InboxEntry = { at: number; taskId?: number; text: string }

export type PullResult = { doc: Doc; savedAt: number }

export type PushResult = { ok: true; savedAt: number } | { ok: false; conflict: true; doc: Doc; savedAt: number } | { ok: false; conflict: false; error: string }

export function readBridgeSettings(): BridgeSettings {
  try {
    const raw = localStorage.getItem(BRIDGE_KEY)
    if (!raw) return { enabled: false, url: DEFAULT_BRIDGE_URL }
    const parsed = JSON.parse(raw) as Partial<BridgeSettings>
    return { enabled: parsed.enabled === true, url: typeof parsed.url === 'string' && parsed.url.trim() ? parsed.url.trim() : DEFAULT_BRIDGE_URL }
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

function base(url: string): string {
  return url.replace(/\/+$/, '')
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
    return { doc: sanitizeDoc(env.doc), savedAt: typeof env.savedAt === 'number' ? env.savedAt : 0 }
  }
  return { doc: sanitizeDoc(raw), savedAt: 0 }
}

/** True when the bridge answers at all. Never throws. */
export async function ping(url: string): Promise<boolean> {
  try {
    const r = await withTimeout((signal) => fetch(`${base(url)}/doc`, { method: 'HEAD', signal }), 1500)
    if (r.ok || r.status === 405) return true
    const g = await withTimeout((signal) => fetch(`${base(url)}/doc`, { signal }), 1500)
    return g.ok
  } catch {
    return false
  }
}

export async function pullDoc(url: string): Promise<PullResult> {
  const r = await withTimeout((signal) => fetch(`${base(url)}/doc`, { signal }))
  if (!r.ok) throw new Error(`bridge: GET /doc ${r.status}`)
  return parseEnvelope(await r.json())
}

export async function pushDoc(url: string, doc: Doc, savedAt = Date.now()): Promise<PushResult> {
  const body: Envelope = { app: 'vault', version: 1, savedAt, doc }
  try {
    const r = await withTimeout((signal) =>
      fetch(`${base(url)}/doc`, { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body), signal }),
    )
    if (r.status === 409) {
      const theirs = parseEnvelope(await r.json())
      return { ok: false, conflict: true, doc: theirs.doc, savedAt: theirs.savedAt }
    }
    if (!r.ok) return { ok: false, conflict: false, error: `bridge: PUT /doc ${r.status}` }
    return { ok: true, savedAt }
  } catch (err) {
    return { ok: false, conflict: false, error: err instanceof Error ? err.message : 'bridge: unreachable' }
  }
}

export async function pullInbox(url: string): Promise<InboxEntry[]> {
  const r = await withTimeout((signal) => fetch(`${base(url)}/inbox`, { signal }))
  if (!r.ok) return []
  const body: unknown = await r.json()
  // vault-agent answers { inbox: [...] }; a bare list is accepted too.
  const list: unknown = body && typeof body === 'object' && !Array.isArray(body) ? (body as { inbox?: unknown }).inbox : body
  if (!Array.isArray(list)) return []
  return list
    .filter((e): e is InboxEntry => Boolean(e) && typeof e === 'object' && typeof (e as InboxEntry).text === 'string')
    .map((e) => ({ at: typeof e.at === 'number' ? e.at : Date.now(), text: e.text, ...(typeof e.taskId === 'number' ? { taskId: e.taskId } : {}) }))
}

export async function removeInbox(url: string, index: number): Promise<boolean> {
  try {
    const r = await withTimeout((signal) => fetch(`${base(url)}/inbox/${index}`, { method: 'DELETE', signal }))
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
