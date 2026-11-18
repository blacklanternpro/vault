import os from 'node:os'
import path from 'node:path'

export const AGENT_VERSION = '0.1.0'
export const DEFAULT_PORT = 7331
export const DEFAULT_HOST = '127.0.0.1'
/** The live site. Not allowed by default (audit 5): start the bridge with `--origin` and this to let it in. */
export const LIVE_SITE_ORIGIN = 'https://vault-lilac-six.vercel.app'
/** The Vite dev server and `vite preview`, by both names the browser may use for them. Nothing remote. */
export const DEFAULT_ORIGINS = ['http://localhost:5173', 'http://localhost:4173', 'http://127.0.0.1:5173', 'http://127.0.0.1:4173']
/**
 * The largest request body the bridge reads. A 1,000-item board with long
 * bodies on every item and a full 2,000-event trail serialises to about
 * 0.8 MB (1.1 MB pretty-printed), so 5 MiB leaves five to six times headroom.
 */
export const DEFAULT_MAX_BODY = 5 * 1024 * 1024

export function expandHome(p: string): string {
  if (p === '~') return os.homedir()
  if (p.startsWith('~/') || p.startsWith('~\\')) return path.join(os.homedir(), p.slice(2))
  return p
}

/** The board file: `--file`, else `VAULT_FILE`, else `~/.vault/vault.json`. Always absolute. */
export function resolveFile(explicit?: string, env: NodeJS.ProcessEnv = process.env): string {
  const raw = explicit?.trim() || env.VAULT_FILE?.trim() || path.join(os.homedir(), '.vault', 'vault.json')
  return path.resolve(expandHome(raw))
}

export function normalizeOrigin(o: string): string {
  return o.trim().replace(/\/+$/, '').toLowerCase()
}

/**
 * The page origins the bridge answers: the local dev and preview servers,
 * then `VAULT_ORIGINS` (comma-separated), then every `--origin`. Deduplicated,
 * first spelling kept.
 */
export function resolveOrigins(flags: readonly string[] = [], env: NodeJS.ProcessEnv = process.env): string[] {
  const fromEnv = (env.VAULT_ORIGINS ?? '').split(',')
  const seen = new Set<string>()
  const out: string[] = []
  for (const raw of [...DEFAULT_ORIGINS, ...fromEnv, ...flags]) {
    const shown = raw.trim().replace(/\/+$/, '')
    if (!shown) continue
    const key = normalizeOrigin(shown)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(shown)
  }
  return out
}

/** `5242880`, `512k`, `5mb`, `5 MiB` → bytes. Undefined for anything else. */
export function parseSize(raw: string): number | undefined {
  const m = /^\s*(\d+(?:\.\d+)?)\s*(b|k|kb|kib|m|mb|mib)?\s*$/i.exec(raw)
  if (!m) return undefined
  const n = Number(m[1])
  const unit = (m[2] ?? 'b').toLowerCase()
  const mult = unit.startsWith('k') ? 1024 : unit.startsWith('m') ? 1024 * 1024 : 1
  const bytes = Math.floor(n * mult)
  return Number.isSafeInteger(bytes) && bytes > 0 ? bytes : undefined
}

export function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024 && bytes % (1024 * 1024) === 0) return `${bytes / (1024 * 1024)} MiB`
  if (bytes >= 1024 && bytes % 1024 === 0) return `${bytes / 1024} KiB`
  return `${bytes} bytes`
}
